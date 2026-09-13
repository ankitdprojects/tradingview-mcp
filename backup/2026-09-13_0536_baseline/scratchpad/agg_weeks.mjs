import { readdirSync, readFileSync } from 'fs';
const dir = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad';
const rows = [];
for (const f of readdirSync(dir).filter(f => /^bt_weeks_.*\.json$/.test(f))) for (const r of JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))) rows.push(r);
const short = (s) => s.replace('NSE:', '').replace('1!', ' fut');
const f0 = (n) => (n == null || isNaN(n)) ? '-' : Math.round(n).toString();
const pct = (m) => m.percent_profitable != null ? Math.round(m.percent_profitable * 100) : '-';
const WEEKS = ['W1 Aug17-21', 'W2 Aug24-28', 'W3 Aug31-Sep4', 'W4 Sep7-11'];
const byKey = {};
for (const r of rows) (byKey[`${r.symbol}|${r.tf}`] ??= {})[r.mode] = r;
console.log('contract tf | ' + WEEKS.map(w => w + ' (trades/net/win%)').join(' | '));
const tot = {};
for (const k of Object.keys(byKey)) {
  const [sym, tf] = k.split('|');
  const cells = WEEKS.map(w => { const m = byKey[k][w] || {}; if (m.net_profit != null) { const t = (tot[w] ??= { net: 0, trades: 0, pos: 0, cells: 0 }); t.net += m.net_profit; t.trades += m.total_trades || 0; if ((m.total_trades || 0) > 0) { t.cells++; if (m.net_profit > 0) t.pos++; } } return `${m.total_trades ?? '-'}/${f0(m.net_profit)}/${pct(m)}`; });
  console.log(`${short(sym)} ${tf} | ${cells.join(' | ')}`);
}
console.log('\nTOTALS week | net | trades | winning/cells');
for (const w of WEEKS) { const t = tot[w] || {}; console.log(`${w} | ${f0(t.net)} | ${t.trades ?? 0} | ${t.pos ?? 0}/${t.cells ?? 0}`); }
const bySym = {};
for (const r of rows) { const s = bySym[r.symbol] ??= { net: 0, pos: 0, n: 0 }; if (r.net_profit != null && r.total_trades > 0) { s.net += r.net_profit; s.n++; if (r.net_profit > 0) s.pos++; } }
console.log('\nTOTALS contract | net all weeks | winning cells');
for (const s of Object.keys(bySym)) console.log(`${short(s)} | ${f0(bySym[s].net)} | ${bySym[s].pos}/${bySym[s].n}`);
