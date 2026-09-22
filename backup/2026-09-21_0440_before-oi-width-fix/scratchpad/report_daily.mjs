import { readFileSync, writeFileSync } from 'fs';
const base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad';
const load = (f, kind, grp) => JSON.parse(readFileSync(`${base}/${f}`)).map(r => ({ ...r, kind, grp }));
const rows = [
  ...load('bt_fam_options.json', 'Single', 'Options'), ...load('bt_fam_futures.json', 'Single', 'Futures'),
  ...load('bt_combo_options_all.json', 'Combined', 'Options'), ...load('bt_combo_futures.json', 'Combined', 'Futures'),
];
const wdays = (a, b) => { if (!a || !b) return 1; let d = 0; for (let t = new Date(a); t <= new Date(b); t.setDate(t.getDate() + 1)) { const w = t.getDay(); if (w !== 0 && w !== 6) d++; } return Math.max(d, 1); };
// aggregate per (kind, grp, config, tf): sum money & trades; days = max span seen across symbols
const agg = {};
for (const r of rows) {
  const k = [r.kind, r.grp, r.mode, r.tf].join('|');
  const v = agg[k] ??= { kind: r.kind, grp: r.grp, config: r.mode, tf: r.tf, gp: 0, gl: 0, w: 0, l: 0, n: 0, net: 0, days: 0, cells: 0, pos: 0 };
  v.gp += r.gross_profit || 0; v.gl += r.gross_loss || 0; v.w += r.winning_trades || 0; v.l += r.losing_trades || 0;
  v.n += r.total_trades || 0; v.net += r.net_profit || 0; v.cells++; if ((r.net_profit || 0) > 0) v.pos++;
  v.days = Math.max(v.days, wdays(r.first, r.last));
}
const out = Object.values(agg).sort((a, b) => a.kind.localeCompare(b.kind) || a.grp.localeCompare(b.grp) || b.net - a.net);
const hdr = ['Type', 'Market', 'Indicator / combination', 'TF', 'Days covered', 'Trades', 'Win trades', 'Loss trades', 'Win %', 'Loss %', 'Total win ₹', 'Total loss ₹', 'Net ₹', 'Win ₹ / day', 'Loss ₹ / day', 'Net ₹ / day', 'Win trades / day', 'Loss trades / day', 'Profitable cells'];
const line = (v) => [v.kind, v.grp, v.config, v.tf + 'm', v.days, v.n, v.w, v.l, v.n ? (100 * v.w / v.n).toFixed(1) : '', v.n ? (100 * v.l / v.n).toFixed(1) : '', Math.round(v.gp), Math.round(v.gl), Math.round(v.net), Math.round(v.gp / v.days), Math.round(v.gl / v.days), Math.round(v.net / v.days), (v.w / v.days).toFixed(2), (v.l / v.days).toFixed(2), `${v.pos}/${v.cells}`];
writeFileSync(`${base}/report_daily.csv`, [hdr.join(','), ...out.map(v => line(v).map(x => `"${x}"`).join(','))].join('\n'));
writeFileSync(`${base}/report_daily.json`, JSON.stringify(out.map(v => Object.fromEntries(hdr.map((h, i) => [h, line(v)[i]]))), null, 1));
console.log('rows', out.length);
// console preview: top 12 by net/day for each kind
for (const kind of ['Single', 'Combined']) { console.log('\n== ' + kind + ' (options) top by net/day =='); for (const v of out.filter(v => v.kind === kind && v.grp === 'Options').sort((a, b) => b.net / b.days - a.net / a.days).slice(0, 10)) console.log(line(v).join(' | ')); }
