// Family x timeframe tables for the stand-alone futures run (bt_fut_<tf>.json).
import { readFileSync, existsSync } from 'fs';
const base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad';
const tfs = ['1', '5', '15', '30', '60'].filter(t => existsSync(`${base}/bt1m_fut_${t}.json`));
const fams = ['SMA 50/200', 'SMA 9/21', 'Sweep', 'Wick', 'Supertrend', 'EMA touch', 'RSI div', 'Donchian', 'VWAP', 'FVG', 'Fib'];
const rows = [];
for (const tf of tfs) {
  const j = JSON.parse(readFileSync(`${base}/bt1m_fut_${tf}.json`, 'utf8'));
  const list = Array.isArray(j) ? j : (j.results || j.cells || Object.values(j));
  for (const r of list) if (r && r.total_trades !== undefined) rows.push({ ...r, tf, trades: r.total_trades, netRs: r.net_profit, winPct: 100*r.percent_profitable, wins_: r.winning_trades, gp: r.gross_profit, gl: r.gross_loss });
}
const key = (r) => r.mode || r.label;
const agg = (sel) => {
  const a = { net: 0, trades: 0, wins: 0, sumW: 0, sumL: 0, nW: 0, nL: 0, pos: 0, cells: 0 };
  for (const r of rows.filter(sel)) {
    const t = +r.trades || 0, w = +r.wins_ || 0;
    a.net += +r.netRs || 0; a.trades += t; a.wins += w; a.cells++; if ((+r.netRs || 0) > 0) a.pos++;
    a.sumW += r.gp||0; a.nW += w;
    a.sumL += r.gl||0; a.nL += t - w;
  }
  return a;
};
const fmt = (a) => `${Math.round(a.net)} / ${a.trades} / ${a.trades ? Math.round(100 * a.wins / a.trades) : 0}% / ${a.nW&&a.nL?((a.sumW/a.nW)/(a.sumL/a.nL)).toFixed(2):'-'} / ${a.pos}/${a.cells}`;
console.log('rows', rows.length, 'tfs', tfs.join(','), 'sample keys', Object.keys(rows[0] || {}).join(','));
console.log('\n## Net Rs by family x timeframe (net Rs / trades / win% / avgWin÷avgLoss / profitable cells)');
console.log('| Family | ' + tfs.map(t => t + 'm').join(' | ') + ' | All TFs |');
console.log('|---|' + tfs.map(() => '---').join('|') + '|---|');
for (const f of fams) {
  const cells = tfs.map(tf => fmt(agg(r => key(r) === f && r.tf === tf)));
  console.log(`| ${f} | ${cells.join(' | ')} | ${fmt(agg(r => key(r) === f))} |`);
}
console.log(`| **Total** | ${tfs.map(tf => fmt(agg(r => r.tf === tf))).join(' | ')} | ${fmt(agg(() => true))} |`);
console.log('\n## Net Rs by underlying x timeframe');
const syms = [...new Set(rows.map(r => r.symbol))];
console.log('| Underlying | ' + tfs.map(t => t + 'm').join(' | ') + ' | All |');
console.log('|---|' + tfs.map(() => '---').join('|') + '|---|');
for (const s of syms) console.log(`| ${s.replace('NSE:', '')} | ${tfs.map(tf => Math.round(agg(r => r.symbol === s && r.tf === tf).net)).join(' | ')} | ${Math.round(agg(r => r.symbol === s).net)} |`);
console.log('\n## Best 10 cells');
for (const r of [...rows].sort((a, b) => b.netRs - a.netRs).slice(0, 10)) console.log(`${r.symbol.replace('NSE:', '')} ${r.tf}m ${key(r)}: net ${Math.round(r.netRs)} trades ${r.trades} win% ${r.winPct}`);
