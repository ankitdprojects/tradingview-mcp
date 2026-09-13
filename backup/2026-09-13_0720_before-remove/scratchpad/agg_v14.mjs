import { readdirSync, readFileSync } from 'fs';
const dir = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad';
const rows = [];
for (const f of readdirSync(dir).filter(f => /^bt_v14_.*\.json$/.test(f))) {
  for (const r of JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))) rows.push({ file: f, ...r });
}
const short = (s) => s.replace('NSE:', '').replace('MCX:', '').replace('BINANCE:', '').replace('1!', '');
const fmt = (n) => (n == null || isNaN(n)) ? '-' : Math.round(n).toString();
const byKey = {};
for (const r of rows) { const k = `${r.symbol}|${r.tf}`; (byKey[k] ??= {})[r.mode] = r; }
console.log('symbol tf | OLD trades net win% PF | NEW trades net win% PF');
const totals = { OLD: {}, NEW: {} };
for (const k of Object.keys(byKey)) {
  const o = byKey[k].OLD || {}, n = byKey[k].NEW || {};
  const [sym, tf] = k.split('|');
  const w = (m) => m.percent_profitable != null ? Math.round(m.percent_profitable * 100) : '-';
  const pf = (m) => m.profit_factor != null && isFinite(m.profit_factor) ? m.profit_factor.toFixed(2) : '-';
  console.log(`${short(sym)} ${tf} | ${o.total_trades ?? '-'} ${fmt(o.net_profit)} ${w(o)} ${pf(o)} | ${n.total_trades ?? '-'} ${fmt(n.net_profit)} ${w(n)} ${pf(n)}`);
  for (const [lab, m] of [['OLD', o], ['NEW', n]]) {
    if (m.net_profit == null) continue;
    const t = totals[lab]; t[tf] ??= { net: 0, trades: 0, cells: 0, pos: 0 };
    t[tf].net += m.net_profit; t[tf].trades += m.total_trades || 0; if ((m.total_trades || 0) > 0) { t[tf].cells++; if (m.net_profit > 0) t[tf].pos++; }
    t.all ??= { net: 0, trades: 0, cells: 0, pos: 0 }; t.all.net += m.net_profit; t.all.trades += m.total_trades || 0; if ((m.total_trades || 0) > 0) { t.all.cells++; if (m.net_profit > 0) t.all.pos++; }
  }
}
console.log('\nTOTALS by timeframe: tf | OLD net trades positive/cells | NEW net trades positive/cells');
for (const tf of ['1', '3', '5', '15', '30', '45', '60', '120', '240', 'all']) {
  const o = totals.OLD[tf] || {}, n = totals.NEW[tf] || {};
  console.log(`${tf} | ${fmt(o.net)} ${o.trades ?? 0} ${o.pos ?? 0}/${o.cells ?? 0} | ${fmt(n.net)} ${n.trades ?? 0} ${n.pos ?? 0}/${n.cells ?? 0}`);
}
// per symbol totals
console.log('\nTOTALS by symbol: symbol | OLD net | NEW net');
const bySym = {};
for (const r of rows) { const s = bySym[r.symbol] ??= { OLD: 0, NEW: 0 }; if (r.net_profit != null) s[r.mode] += r.net_profit; }
for (const s of Object.keys(bySym)) console.log(`${short(s)} | ${fmt(bySym[s].OLD)} | ${fmt(bySym[s].NEW)}`);
