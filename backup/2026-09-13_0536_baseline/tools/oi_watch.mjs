#!/usr/bin/env node
// Keep the OI Profile indicator live: re-runs refresh_oi.mjs on an interval.
// Usage: node scripts/oi_watch.mjs [SYMBOL] [expiry] [step]   (same args as refresh_oi.mjs)
//        OI_INTERVAL=30 node scripts/oi_watch.mjs GOLDM       (seconds, default 60)
// MCX republishes the chain roughly once a minute, so refreshing faster than
// ~30s only re-downloads the same snapshot.
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const repo = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const intervalMs = (Number(process.env.OI_INTERVAL) || 60) * 1000;

const runOnce = () => new Promise((resolve) => {
  const p = spawn(process.execPath, [join(repo, 'scripts', 'refresh_oi.mjs'), ...args], { stdio: 'inherit', cwd: repo });
  p.on('exit', (code) => resolve(code));
  p.on('error', (e) => { console.error('spawn failed:', e.message); resolve(1); });
});

console.log(`oi_watch: refreshing every ${intervalMs / 1000}s (${args.join(' ') || 'NIFTY defaults'}) — Ctrl+C to stop`);
for (;;) {
  const t = new Date().toLocaleTimeString('en-IN', { hour12: false });
  console.log(`[${t}] refresh`);
  const code = await runOnce();  // a failed cycle (net blip, market closed) just waits for the next one
  if (code !== 0) console.error(`[${t}] refresh exited ${code}; retrying next cycle`);
  await new Promise((r) => setTimeout(r, intervalMs));
}
