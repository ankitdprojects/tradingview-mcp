import { readFileSync, existsSync } from 'fs';
const base='C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad';
const groups = process.argv.slice(2);
for (const g of groups) {
  const f=`${base}/bt_sma_${g}.json`; if(!existsSync(f)){console.log('missing',g);continue;}
  const rows=JSON.parse(readFileSync(f,'utf8'));
  console.log(`\n=== ${g} ===`);
  console.log('symbol'.padEnd(26),'tf'.padEnd(4),'config'.padEnd(18),'tr'.padStart(4),'win%'.padStart(6),'PF'.padStart(6),'net'.padStart(8),'DD'.padStart(7));
  for (const r of rows) console.log(r.symbol.padEnd(26),String(r.tf).padEnd(4),r.mode.padEnd(18),String(r.total_trades??'-').padStart(4),(r.percent_profitable!=null?(r.percent_profitable*100).toFixed(0):'-').padStart(6),(r.profit_factor!=null?r.profit_factor.toFixed(2):'-').padStart(6),String(Math.round(r.net_profit||0)).padStart(8),String(Math.round(r.max_drawdown||0)).padStart(7));
  const by={}; for(const r of rows){ const k=r.mode; by[k]??={tr:0,net:0,pos:0,n:0,wins:0}; by[k].tr+=r.total_trades||0; by[k].net+=r.net_profit||0; by[k].n++; if((r.net_profit||0)>0)by[k].pos++; by[k].wins+=(r.percent_profitable||0)*(r.total_trades||0); }
  console.log('-- totals by config --');
  for(const [k,v] of Object.entries(by)) console.log(k.padEnd(18),'trades',String(v.tr).padStart(4),'win%',(v.tr?100*v.wins/v.tr:0).toFixed(0).padStart(3),'net',String(Math.round(v.net)).padStart(8),'cells +',`${v.pos}/${v.n}`);
  const byTf={}; for(const r of rows){ const k=r.tf+' '+r.mode; byTf[k]??={net:0,tr:0}; byTf[k].net+=r.net_profit||0; byTf[k].tr+=r.total_trades||0; }
  console.log('-- by tf x config --'); for(const [k,v] of Object.entries(byTf)) console.log(k.padEnd(22),'trades',String(v.tr).padStart(4),'net',String(Math.round(v.net)).padStart(8));
}
