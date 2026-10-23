#!/usr/bin/env node
// Launch TradingView Desktop with the debug port the MCP / OI feeder need.
//   node scripts/tv_launch.mjs            -> (re)launch, killing a port-less instance first
//   node scripts/tv_launch.mjs --if-needed -> do nothing when the port already answers
// Used by the desktop shortcut "TradingView (with OI)" and by oi_watch.mjs.
import { launch } from '../src/core/health.js';

const CDP_PORT = Number(process.env.TV_CDP_PORT || process.env.CDP_PORT) || 9222;
const ifNeeded = process.argv.includes('--if-needed');

async function portUp() {
  try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(2000) }); return r.ok; } catch { return false; }
}

if (ifNeeded && await portUp()) { console.log(`TradingView already reachable on ${CDP_PORT}`); process.exit(0); }
const r = await launch({ port: CDP_PORT, kill_existing: true });
console.log(JSON.stringify({ success: r.success, pid: r.pid, cdp_ready: r.cdp_ready !== false, binary: r.binary, warning: r.warning }));
process.exit(r.success ? 0 : 1);
