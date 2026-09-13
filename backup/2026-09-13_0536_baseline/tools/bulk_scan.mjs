#!/usr/bin/env node
/**
 * bulk_scan.mjs — scan a large symbol list against the Screener indicator.
 *
 *   node scripts/bulk_scan.mjs symbols.txt [--out results.csv] [--tf 30]
 *                                          [--delay 1200] [--filter TRIGGER]
 *
 * symbols.txt: one symbol per line, e.g. NSE:RELIANCE. Blank lines and
 * lines starting with # are ignored.
 *
 * WHY THIS IS SLOW: there is one chart. Each symbol must be loaded, allowed
 * to settle, and read. ~2s each, so 1500 symbols is roughly an hour. That is
 * a property of driving a GUI, not of this script. For a fast first pass use
 * Chartink (server-side, instant) and run this over the shortlist.
 *
 * Results are appended to the CSV as they are produced, so an interrupted run
 * keeps everything it had already scanned, and --resume skips those symbols.
 */
import fs from 'node:fs';
import path from 'node:path';
import { setSymbol, setTimeframe, getState } from '../src/core/chart.js';
import { getPineTables } from '../src/core/data.js';

const args = process.argv.slice(2);
const symbolsFile = args.find(a => !a.startsWith('--'));
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const has = name => args.includes(`--${name}`);

if (!symbolsFile) {
  console.error('usage: node scripts/bulk_scan.mjs <symbols.txt> [--out results.csv] [--tf 30] [--delay 1200] [--filter TRIGGER|ARMED|ALL] [--resume]');
  process.exit(1);
}

const outFile = opt('out', 'scan_results.csv');
const timeframe = opt('tf', '30');
const delayMs = Number(opt('delay', '1200'));
const filter = (opt('filter', 'ALL') || 'ALL').toUpperCase();

const sleep = ms => new Promise(r => setTimeout(r, ms));

const symbols = fs.readFileSync(symbolsFile, 'utf8')
  .split('\n').map(s => s.trim())
  .filter(s => s && !s.startsWith('#'));

// --resume: skip symbols already present in the output file
let done = new Set();
if (has('resume') && fs.existsSync(outFile)) {
  for (const line of fs.readFileSync(outFile, 'utf8').split('\n').slice(1)) {
    const sym = line.split(',')[0];
    if (sym) done.add(sym);
  }
  console.error(`resume: skipping ${done.size} already-scanned symbols`);
}

const COLS = ['symbol', 'state', 'above50', 'consolidation', 'breakout_above',
  'volume', 'room', 'adx', 'relvol', 'turnover_cr', 'pe', 'rsi',
  'stop', 'risk_per_share', 'shares', 'position', 'vcp', 'note'];

if (!fs.existsSync(outFile)) fs.writeFileSync(outFile, COLS.join(',') + '\n');

/** Pull "label | value" rows into a map. */
function rowsToMap(rows) {
  const m = {};
  for (const r of rows) {
    const i = r.indexOf('|');
    if (i < 0) continue;
    m[r.slice(0, i).trim()] = r.slice(i + 1).trim();
  }
  m.__state = (rows[0] || '').split('|')[1]?.trim() || '';
  return m;
}

const csv = v => {
  const s = String(v ?? '').replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

let scanned = 0, hits = 0, failed = 0;
let prevFingerprint = null;

console.error(`scanning ${symbols.length - done.size} symbols on ${timeframe}m -> ${outFile}`);

try {
  await setTimeframe({ timeframe });
} catch (e) {
  console.error('could not set timeframe:', e.message);
}

for (const sym of symbols) {
  if (done.has(sym)) continue;
  let note = '';
  try {
    await setSymbol({ symbol: sym });
    await sleep(delayMs);

    // Confirm the chart actually switched. Without this a failed load silently
    // reports the PREVIOUS symbol's numbers under this symbol's name.
    let state = await getState();
    if (state?.symbol && !state.symbol.endsWith(sym.split(':').pop())) {
      await sleep(delayMs);
      state = await getState();
    }

    const res = await getPineTables({ study_filter: 'Screener' });
    const rows = res?.studies?.[0]?.tables?.[0]?.rows;
    if (!rows || !rows.length) { failed++; console.error(`  ${sym}: no table`); continue; }

    const m = rowsToMap(rows);

    // Stale-data guard: identical readings for two different symbols means
    // the switch did not take.
    const fingerprint = [m['Stop / risk-sh'], m['ATR / %'], m['RSI 14']].join('|');
    if (fingerprint === prevFingerprint) note = 'STALE?';
    prevFingerprint = fingerprint;

    const row = {
      symbol: sym,
      state: m.__state,
      above50: m['Above 50 EMA'] ?? '',
      consolidation: m['Consolidation'] ?? '',
      breakout_above: m['Breakout'] ?? '',
      volume: m['Volume'] ?? '',
      room: m['Room to supply'] ?? '',
      adx: m['ADX'] ?? '',
      relvol: m['Rel volume'] ?? '',
      turnover_cr: m['Turnover Cr'] ?? '',
      pe: m['P/E (TTM)'] ?? '',
      rsi: m['RSI 14'] ?? '',
      stop: (m['Stop / trail'] || m['Stop / risk-sh'] || '').split('/')[0].trim(),
      risk_per_share: (m['Stop / risk-sh'] || '').split('/')[1]?.trim() ?? '',
      shares: (m['Shares / value'] || m['Lots / risk'] || '').split('/')[0].trim(),
      position: (m['Shares / value'] || m['Lots / risk'] || '').split('/')[1]?.trim() ?? '',
      vcp: m['VCP'] ?? '',
      note,
    };

    const st = row.state.toUpperCase();
    const keep = filter === 'ALL'
      || (filter === 'TRIGGER' && /BREAK|BUY|SELL|RETEST/.test(st))
      || (filter === 'ARMED' && /ARMED|CONSOLIDAT|READY|AT LEVEL|BREAK|BUY/.test(st));

    if (keep) {
      fs.appendFileSync(outFile, COLS.map(c => csv(row[c])).join(',') + '\n');
      hits++;
    }
    scanned++;
    if (scanned % 25 === 0) console.error(`  ${scanned}/${symbols.length}  kept ${hits}  failed ${failed}`);
  } catch (e) {
    failed++;
    console.error(`  ${sym}: ${e.message}`);
  }
}

console.error(`\ndone. scanned ${scanned}, kept ${hits}, failed ${failed}`);
console.error(`results: ${path.resolve(outFile)}`);
