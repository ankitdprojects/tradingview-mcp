#!/usr/bin/env node
// Pull the LATEST saved version of every Pine script (indicators + strategies)
// from the TradingView account into scripts/, so the repo always holds the
// current code after anything is saved or updated on TradingView.
//
// Usage: node scripts/pine_sync.mjs            pull everything, overwrite local
//        node scripts/pine_sync.mjs --check    report differences only, write nothing
//
// Needs TradingView Desktop running with CDP (node src/cli/index.js launch).
// Versions pulled are recorded in scripts/pine_versions.json.
import fs from 'node:fs';
import path from 'node:path';
import { evaluateAsync, disconnect } from '../src/connection.js';

const root = path.resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '..');
const dir = path.join(root, 'scripts');
const check = process.argv.includes('--check');

// Saved script name -> local file. Anything not listed gets a slug of its name.
const FILES = {
  'OI Profile': 'oi_profile.pine',
  'SMA Signals': 'sma_signals.pine',
  'SMA Signals BT': 'sma_signals_strategy.pine',
  'Pullback Retest BT': 'pullback_retest_strategy.pine',
  'Quad Stack': 'quad_stack.pine',
  'Swing Pullback Console': 'swing_pullback_console.pine',
  'Screener': 'screener_tv.pine',   // scripts/screener.pine is a separate local variant, never saved on TV
};
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '.pine';

const scripts = await evaluateAsync(`
  fetch('https://pine-facade.tradingview.com/pine-facade/list/?filter=saved', { credentials: 'include' })
    .then(function(r) { return r.json(); })
    .then(function(list) {
      if (!Array.isArray(list)) return { error: 'unexpected list response' };
      return Promise.all(list.map(function(s) {
        return fetch('https://pine-facade.tradingview.com/pine-facade/get/' + s.scriptIdPart + '/' + (s.version || 1), { credentials: 'include' })
          .then(function(r) { return r.json(); })
          .then(function(d) { return { name: s.scriptName, title: s.scriptTitle, id: s.scriptIdPart, version: String(s.version || 1), modified: s.modified, source: d.source || '' }; });
      }));
    })`);
await disconnect();
if (!Array.isArray(scripts)) { console.error('pull failed:', JSON.stringify(scripts)); process.exit(1); }

const versions = {};
const rows = [];
for (const s of scripts.sort((a, b) => a.name.localeCompare(b.name))) {
  const file = FILES[s.name] || slug(s.name);
  const p = path.join(dir, file);
  const local = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  const norm = (t) => (t || '').replace(/\r\n/g, '\n').trimEnd();
  let state = local === null ? 'NEW' : norm(local) === norm(s.source) ? 'same' : 'changed';
  if (!s.source) state = 'EMPTY (skipped)';
  else if (!check && state !== 'same') fs.writeFileSync(p, s.source.replace(/\r\n/g, '\n'));
  versions[s.name] = { file, id: s.id, version: s.version, modified: s.modified };
  rows.push(`${state.padEnd(16)} v${s.version.padEnd(6)} ${file.padEnd(34)} ${s.name}`);
}
console.log(rows.join('\n'));
if (!check) {
  fs.writeFileSync(path.join(dir, 'pine_versions.json'), JSON.stringify(versions, null, 2) + '\n');
  console.log('\nwrote scripts/pine_versions.json');
} else console.log('\n(check only, nothing written)');
