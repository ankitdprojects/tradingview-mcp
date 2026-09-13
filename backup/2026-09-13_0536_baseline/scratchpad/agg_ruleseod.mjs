import { readdirSync, readFileSync } from 'fs';
const dir = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad';
const rows = [];
for (const f of readdirSync(dir).filter(f => /^bt_ruleseod_.*.json$/.test(f))) for (const r of JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))) rows.push(r);
const short = (s) => s.replace('NSE:', '');
const f0 = (n) => (n == null || isNaN(n)) ? '-' : Math.round(n).toString();
const pct = (m) => m.percent_profitable != null ? Math.round(m.percent_profitable * 100) : '-';
const pf = (m) => m.profit_factor != null && isFinite(m.profit_factor) ? m.profit_factor.toFixed(2) : '-';
const dd = (m) => m.max_drawdown_percent != null ? Math.round(m.max_drawdown_percent * 100) : '-';
const byKey = {};
for (const r of rows) (byKey[`${r.symbol}|${r.tf}`] ??= {})[r.mode] = r;
console.log('contract tf | RULES trades net win% PF DD% | +STOP trades net win% PF DD%');
const tot = {};
for (const k of Object.keys(byKey)) {
  const a = byKey[k].Rules || {}, b = byKey[k]['Rules+stop'] || {};
  const [sym, tf] = k.split('|');
  console.log(`${short(sym)} ${tf} | ${a.total_trades ?? '-'} ${f0(a.net_profit)} ${pct(a)} ${pf(a)} ${dd(a)} | ${b.total_trades ?? '-'} ${f0(b.net_profit)} ${pct(b)} ${pf(b)} ${dd(b)}`);
  for (const [lab, m] of [['Rules', a], ['Rules+stop', b]]) {
    if (m.net_profit == null) continue;
    for (const key of [tf, 'all']) { const t = (tot[lab] ??= {})[key] ??= { net: 0, trades: 0, cells: 0, pos: 0 }; t.net += m.net_profit; t.trades += m.total_trades || 0; if (m.total_trades > 0) { t.cells++; if (m.net_profit > 0) t.pos++; } }
  }
}
console.log('\nTOTALS tf | RULES net trades winning/cells | +STOP net trades winning/cells');
for (const tf of ['1', '5', '15', '30', '60', 'all']) { const a = tot.Rules?.[tf] || {}, b = tot['Rules+stop']?.[tf] || {}; console.log(`${tf} | ${f0(a.net)} ${a.trades ?? 0} ${a.pos ?? 0}/${a.cells ?? 0} | ${f0(b.net)} ${b.trades ?? 0} ${b.pos ?? 0}/${b.cells ?? 0}`); }
const bySym = {};
for (const r of rows) { const s = bySym[r.symbol] ??= { Rules: 0, 'Rules+stop': 0 }; if (r.net_profit != null) s[r.mode] += r.net_profit; }
console.log('\nTOTALS by contract | RULES | +STOP');
for (const s of Object.keys(bySym)) console.log(`${short(s)} | ${f0(bySym[s].Rules)} | ${f0(bySym[s]['Rules+stop'])}`);
