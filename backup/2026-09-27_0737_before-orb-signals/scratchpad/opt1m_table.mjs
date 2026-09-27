// Family x side x timeframe tables for the one-month option run (bt1m_opt_<tf>.json).
import { readFileSync, existsSync } from 'fs';
const base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad';
const tfs = ['1', '5', '15', '30', '60'].filter(t => existsSync(`${base}/bt1m_opt_${t}.json`));
const fams = ['SMA 50/200', 'SMA 9/21', 'Sweep', 'Wick', 'Supertrend', 'EMA touch', 'RSI div', 'Donchian', 'VWAP', 'FVG', 'Fib'];
const rows = [];
for (const tf of tfs) {
  for (const r of JSON.parse(readFileSync(`${base}/bt1m_opt_${tf}.json`, 'utf8'))) {
    if (r.total_trades === undefined) continue;
    rows.push({ ...r, tf, side: /\d{6}C/.test(r.symbol) ? 'CE' : 'PE', und: r.symbol.replace('NSE:', '').replace(/\d{6}[CP]\d+/, ''),
      trades: r.total_trades, netRs: r.net_profit, wins_: r.winning_trades, gp: r.gross_profit, gl: r.gross_loss });
  }
}
const agg = (sel) => {
  const a = { net: 0, trades: 0, wins: 0, sumW: 0, sumL: 0, nW: 0, nL: 0, pos: 0, cells: 0 };
  for (const r of rows.filter(sel)) {
    a.net += r.netRs || 0; a.trades += r.trades; a.wins += r.wins_; a.cells++; if (r.netRs > 0) a.pos++;
    a.sumW += r.gp || 0; a.nW += r.wins_; a.sumL += r.gl || 0; a.nL += r.trades - r.wins_;
  }
  return a;
};
const fmt = (a) => `${Math.round(a.net)} / ${a.trades} / ${a.trades ? Math.round(100 * a.wins / a.trades) : 0}% / ${a.nW && a.nL ? ((a.sumW / a.nW) / (a.sumL / a.nL)).toFixed(2) : '-'} / ${a.pos}/${a.cells}`;
const hdr = () => { console.log('| Family | ' + tfs.map(t => t + 'm').join(' | ') + ' | All TFs |'); console.log('|---|' + tfs.map(() => '---').join('|') + '|---|'); };
console.log('rows', rows.length, 'tfs', tfs.join(','));
for (const sd of ['CE', 'PE']) {
  console.log(`\n## ${sd} (net Rs / trades / win% / avgWin÷avgLoss / profitable contracts of 6)`); hdr();
  for (const f of fams) console.log(`| ${f} | ${tfs.map(tf => fmt(agg(r => r.mode === f && r.tf === tf && r.side === sd))).join(' | ')} | ${fmt(agg(r => r.mode === f && r.side === sd))} |`);
  console.log(`| **Total ${sd}** | ${tfs.map(tf => fmt(agg(r => r.tf === tf && r.side === sd))).join(' | ')} | ${fmt(agg(r => r.side === sd))} |`);
}
console.log('\n## CE + PE combined'); hdr();
for (const f of fams) console.log(`| ${f} | ${tfs.map(tf => fmt(agg(r => r.mode === f && r.tf === tf))).join(' | ')} | ${fmt(agg(r => r.mode === f))} |`);
console.log(`| **Total** | ${tfs.map(tf => fmt(agg(r => r.tf === tf))).join(' | ')} | ${fmt(agg(() => true))} |`);
console.log('\n## Net Rs by underlying x timeframe (CE+PE)');
console.log('| Underlying | ' + tfs.map(t => t + 'm').join(' | ') + ' | All |'); console.log('|---|' + tfs.map(() => '---').join('|') + '|---|');
for (const s of [...new Set(rows.map(r => r.und))]) console.log(`| ${s} | ${tfs.map(tf => Math.round(agg(r => r.und === s && r.tf === tf).net)).join(' | ')} | ${Math.round(agg(r => r.und === s).net)} |`);
console.log('\n## Best 12 cells');
for (const r of [...rows].sort((a, b) => b.netRs - a.netRs).slice(0, 12)) console.log(`${r.und} ${r.side} ${r.tf}m ${r.mode}: net ${Math.round(r.netRs)} trades ${r.trades} won ${r.wins_} win% ${Math.round(100 * r.wins_ / r.trades)}`);
console.log('\n## Data start per contract');
for (const s of [...new Set(rows.map(r => r.symbol))]) console.log(s, rows.find(r => r.symbol === s).first);
