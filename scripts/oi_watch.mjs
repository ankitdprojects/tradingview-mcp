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
const intervalMs = (Number(process.env.OI_INTERVAL) || 60) * 1000;
const pollMs = (Number(process.env.OI_POLL) || 5) * 1000;
const follow = args.length === 0;
const CDP_PORT = Number(process.env.TV_CDP_PORT || process.env.CDP_PORT) || 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toLocaleTimeString('en-IN', { hour12: false });

const runOnce = () => new Promise((resolve) => {
  const p = spawn(process.execPath, [join(repo, 'scripts', 'refresh_oi.mjs'), ...args], { stdio: 'inherit', cwd: repo });
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
    return /TradingView\.exe/i.test(execSync('tasklist /FI "IMAGENAME eq TradingView.exe" /NH', { timeout: 5000 }).toString());
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
  const r = spawnSync(process.execPath, [join(repo, 'scripts', 'tv_launch.mjs')], { cwd: repo, stdio: 'inherit', timeout: 120000 });
  if (r.status !== 0) console.error(`[${stamp()}] relaunch failed (exit ${r.status})`);
  for (let i = 0; i < 30; i++) { await sleep(2000); if (await portUp()) return true; }
  return false;
}

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
