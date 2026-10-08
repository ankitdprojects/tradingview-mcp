#!/usr/bin/env node
// Keep the OI Profile indicator live: re-runs refresh_oi.mjs on an interval AND immediately
// whenever the active chart's symbol changes (polled every OI_POLL seconds), so switching
// SENSEX -> NIFTY -> CRUDEOIL option swaps the strike profile within a few seconds.
// Usage: node scripts/oi_watch.mjs [SYMBOL] [expiry] [step]   (same args as refresh_oi.mjs;
//        with a SYMBOL the watcher is pinned and symbol-following is off)
//        OI_INTERVAL=30 OI_POLL=5 node scripts/oi_watch.mjs      (seconds; defaults 60 / 5)
// MCX republishes the chain roughly once a minute, so refreshing faster than
// ~30s only re-downloads the same snapshot.
// Installed as the logon task "TradingView OI Watch" (scripts/install_oi_watch.ps1).
import { spawn, spawnSync, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const repo = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);

// Single instance: a second watcher (an old task wrapper that survived a reinstall, or a manual
// run) would fight over the chart and the log. Exit if another oi_watch.mjs is already running.
try {
  if (process.platform === 'win32') {
    // (wmic is gone on recent Windows 11 builds, so ask CIM through PowerShell)
    const ps = `Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'oi_watch\\.mjs' -and $_.ProcessId -ne ${process.pid} } | Select-Object -ExpandProperty ProcessId`;
    const out = execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, { timeout: 15000, windowsHide: true }).toString().trim();
    if (out) { console.log(`oi_watch: another instance is already running (pid ${out.split(/\s+/).join(', ')}) — exiting`); process.exit(0); }
  }
} catch { /* could not check: run anyway */ }

// Own log file (append, shared, rotated at 5 MB) when OI_LOG is set — the task wrapper used to pipe
// stdout through Out-File, which locks the file and breaks when two wrappers run.
if (process.env.OI_LOG) {
  const { appendFileSync, statSync, renameSync } = await import('fs');
  const logPath = process.env.OI_LOG;
  const write = (s) => {
    try { if (statSync(logPath).size > 5 * 1024 * 1024) renameSync(logPath, logPath.replace(/\.log$/, '') + '.1.log'); } catch { /* no file yet */ }
    try { appendFileSync(logPath, s); } catch { /* disk / lock blip: drop the line */ }
  };
  const fmt = (a) => a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ') + '\n';
  console.log = (...a) => write(fmt(a));
  console.error = (...a) => write(fmt(a));
}
const intervalMs = (Number(process.env.OI_INTERVAL) || 60) * 1000;
const pollMs = (Number(process.env.OI_POLL) || 5) * 1000;
const follow = args.length === 0;
const CDP_PORT = Number(process.env.TV_CDP_PORT || process.env.CDP_PORT) || 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toLocaleTimeString('en-IN', { hour12: false });

const runOnce = () => new Promise((resolve) => {
  // child output goes through our logger (so it lands in the rotated log file, not a locked pipe)
  const p = spawn(process.execPath, [join(repo, 'scripts', 'refresh_oi.mjs'), ...args], { stdio: ['ignore', 'pipe', 'pipe'], cwd: repo, windowsHide: true });
  p.stdout.on('data', (d) => console.log(String(d).replace(/\r?\n$/, '')));
  p.stderr.on('data', (d) => console.error(String(d).replace(/\r?\n$/, '')));
  p.on('exit', (code) => resolve(code));
  p.on('error', (e) => { console.error('spawn failed:', e.message); resolve(1); });
});

// Cheap symbol probe over a throw-away CDP socket (no shared connection to go stale when
// TradingView restarts). Returns null when TradingView / the debug port is not up.
let WebSocket;
async function chartSymbol() {
  try {
    const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const t = targets.find((x) => x.type === 'page' && /tradingview\.com\/chart/.test(x.url || '')) || targets.find((x) => x.type === 'page' && /tradingview/.test(x.url || ''));
    if (!t?.webSocketDebuggerUrl) return null;
    WebSocket ??= (await import('ws')).default;
    return await new Promise((resolve) => {
      const ws = new WebSocket(t.webSocketDebuggerUrl);
      const done = (v) => { try { ws.close(); } catch { /* */ } resolve(v); };
      const timer = setTimeout(() => done(null), 4000);
      ws.on('open', () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: '(window.TradingViewApi ? TradingViewApi.activeChart() : tvWidget.activeChart()).symbol()', returnByValue: true } })));
      ws.on('message', (m) => { clearTimeout(timer); try { done(JSON.parse(m).result?.result?.value ?? null); } catch { done(null); } });
      ws.on('error', () => { clearTimeout(timer); done(null); });
    });
  } catch { return null; }
}

// TradingView opened from its normal shortcut (or restarted overnight) has no debug port, so the
// feeder cannot reach the chart. If TradingView is running WITHOUT the port, relaunch it with the
// port (charts are cloud-saved); at most once per OI_RELAUNCH_MIN minutes. If TradingView is not
// running at all the user closed it — do nothing and wait quietly.
const relaunchMs = (Number(process.env.OI_RELAUNCH_MIN) || 10) * 60000;
let lastRelaunch = 0;
let downNoted = false;
async function portUp() {
  try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(2000) }); return r.ok; } catch { return false; }
}
function tvRunning() {
  try {
    if (process.platform !== 'win32') return execSync('pgrep -f TradingView', { timeout: 5000 }).toString().trim().length > 0;
    return /TradingView\.exe/i.test(execSync('tasklist /FI "IMAGENAME eq TradingView.exe" /NH', { timeout: 5000, windowsHide: true }).toString());
  } catch { return false; }
}
async function ensureChart() {
  if (await portUp()) { downNoted = false; return true; }
  if (!tvRunning()) {
    if (!downNoted) { console.log(`[${stamp()}] TradingView is not running — waiting (open it with the "TradingView (with OI)" shortcut)`); downNoted = true; }
    return false;
  }
  if (Date.now() - lastRelaunch < relaunchMs) return false;
  lastRelaunch = Date.now();
  console.log(`[${stamp()}] TradingView is running without the debug port — relaunching it with the port`);
  const r = spawnSync(process.execPath, [join(repo, 'scripts', 'tv_launch.mjs')], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, windowsHide: true });
  if (r.stdout && r.stdout.length) console.log(String(r.stdout).trim());
  if (r.stderr && r.stderr.length) console.error(String(r.stderr).trim());
  if (r.status !== 0) console.error(`[${stamp()}] relaunch failed (exit ${r.status})`);
  for (let i = 0; i < 30; i++) { await sleep(2000); if (await portUp()) return true; }
  return false;
}

// Log why the process ends (the wrapper restarts it after 10 s, so silent exits were invisible).
process.on('uncaughtException', (e) => { console.error(`[${stamp()}] oi_watch crashed: ${e && e.stack || e}`); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error(`[${stamp()}] oi_watch unhandled rejection: ${e && e.stack || e}`); });
process.on('exit', (code) => { try { console.log(`[${stamp()}] oi_watch exiting with code ${code}`); } catch { /* */ } });
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) { try { process.on(sig, () => { console.log(`[${stamp()}] oi_watch got ${sig}`); process.exit(0); }); } catch { /* not on this platform */ } }

console.log(`oi_watch: refreshing every ${intervalMs / 1000}s (${follow ? 'following the chart symbol, poll ' + pollMs / 1000 + 's' : args.join(' ')}) — Ctrl+C to stop`);
let lastSym = null;
let lastRun = 0;
for (;;) {
  let reason = null;
  if (!(await ensureChart())) { await sleep(Math.max(pollMs, 15000)); continue; }
  if (follow) {
    const sym = await chartSymbol();
    if (sym && sym !== lastSym) { reason = lastSym ? `symbol ${lastSym} -> ${sym}` : `chart ${sym}`; lastSym = sym; }
  }
  if (!reason && Date.now() - lastRun >= intervalMs) reason = 'interval';
  if (reason) {
    console.log(`[${stamp()}] refresh (${reason})`);
    lastRun = Date.now();
    const code = await runOnce();  // a failed cycle (net blip, market closed, TV down) just waits for the next one
    if (code !== 0) console.error(`[${stamp()}] refresh exited ${code}; retrying next cycle`);
  }
  await sleep(follow ? pollMs : intervalMs);
}
