#!/usr/bin/env node
// Snapshot the whole trading setup so any later change can be undone:
//   - every Pine script in scripts/ (Screener, OI Profile, backtest strategy, Quad Stack)
//   - the feeder / backtest / editor tooling (scripts/*.mjs + scratchpad helpers)
//   - the live chart state from TradingView: symbol, timeframe, each study's Pine id,
//     version and full input values (so the exact deployed config can be restored)
//
// Usage: node scripts/backup_setup.mjs [label]
// Output: backup/<YYYY-MM-DD_HHmm>[_label]/  + backup/LATEST.txt
import fs from 'node:fs';
import path from 'node:path';
import { evaluate } from '../src/connection.js';

const root = path.resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '..');
const scratch = path.join(process.env.LOCALAPPDATA || '', 'Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad');

const stamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '');
const label = process.argv[2] ? `_${process.argv[2].replace(/[^\w-]+/g, '-')}` : '';
const dest = path.join(root, 'backup', stamp + label);
fs.mkdirSync(path.join(dest, 'pine'), { recursive: true });
fs.mkdirSync(path.join(dest, 'tools'), { recursive: true });
fs.mkdirSync(path.join(dest, 'scratchpad'), { recursive: true });

const copy = (from, toDir) => { fs.copyFileSync(from, path.join(toDir, path.basename(from))); return path.basename(from); };
const copied = { pine: [], tools: [], scratchpad: [] };
for (const f of fs.readdirSync(path.join(root, 'scripts'))) {
  const p = path.join(root, 'scripts', f);
  if (f.endsWith('.pine')) copied.pine.push(copy(p, path.join(dest, 'pine')));
  else if (/\.(mjs|js|cjs)$/.test(f)) copied.tools.push(copy(p, path.join(dest, 'tools')));
}
if (fs.existsSync(scratch)) {
  for (const f of fs.readdirSync(scratch)) {
    if (/\.(mjs|ps1)$/.test(f)) copied.scratchpad.push(copy(path.join(scratch, f), path.join(dest, 'scratchpad')));
  }
}

// Live chart state (best effort — skipped if TradingView isn't reachable on 9222)
let chart = null;
try {
  chart = await evaluate(`(function(){
    var c = TradingViewApi.activeChart();
    var out = { symbol: c.symbol(), resolution: c.resolution(), studies: [] };
    c.getAllStudies().forEach(function(s){
      var st = c.getStudyById(s.id);
      var all = [];
      try { all = st.getInputValues(); } catch(e) {}
      var meta = {};
      // pineId / pineVersion ride along as pseudo-inputs; the encrypted 'text' IL is dropped (huge, useless)
      var inputs = all.filter(function(i){ if (i.id === 'pineId' || i.id === 'pineVersion') { meta[i.id] = i.value; return false; } return /^in_\\d+$/.test(i.id); })
                     .map(function(i){ return { id: i.id, value: i.value }; });
      out.studies.push({ id: s.id, name: s.name, pineId: meta.pineId, pineVersion: meta.pineVersion, inputs: inputs });
    });
    return out;
  })()`, { timeout: 15000 });
} catch (e) {
  chart = { error: String(e.message || e) };
}
try { const { disconnect } = await import('../src/connection.js'); await disconnect(); } catch {}
fs.writeFileSync(path.join(dest, 'chart_state.json'), JSON.stringify(chart, null, 2));

const manifest = { created: new Date().toISOString(), label: label.slice(1) || null, copied, chart: chart && !chart.error ? { symbol: chart.symbol, resolution: chart.resolution, studies: chart.studies.map(s => ({ name: s.name, pineId: s.pineId, pineVersion: s.pineVersion })) } : chart };
fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(root, 'backup', 'LATEST.txt'), path.basename(dest) + '\n');
console.log(JSON.stringify(manifest, null, 2));
