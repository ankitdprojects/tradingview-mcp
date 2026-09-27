import { readFileSync, existsSync } from 'fs';
const base='C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad';
const tfs=process.argv.slice(2);const rows=[];for(const tf of tfs){const f=`${base}/bt_futopt_${tf}.json`;if(existsSync(f))rows.push(...JSON.parse(readFileSync(f)))}
const side=s=>/C\d+$/.test(s)?'CE (buy side)':'PE (sell side)';
const fmt=n=>String(Math.round(n)).padStart(8);
const agg=(kf)=>{const o={};for(const r of rows){const k=kf(r);const v=o[k]??={n:0,w:0,net:0,gp:0,gl:0,pos:0,cells:0};v.n+=r.total_trades||0;v.w+=r.winning_trades||0;v.net+=r.net_profit||0;v.gp+=r.gross_profit||0;v.gl+=r.gross_loss||0;v.cells++;if(r.net_profit>0)v.pos++}return o};
const show=(t,o)=>{console.log("\n== "+t+" ==");for(const [k,v] of Object.entries(o).sort((a,b)=>b[1].net-a[1].net))console.log(k.padEnd(34),"net",fmt(v.net),"trades",String(v.n).padStart(4),"win%",(v.n?100*v.w/v.n:0).toFixed(0).padStart(3),"avgW/avgL",v.w&&(v.n-v.w)?(v.gp/v.w/(v.gl/(v.n-v.w))).toFixed(2):"-","cells+",v.pos+"/"+v.cells)};
show("family x side (TFs "+tfs.join(",")+")",agg(r=>r.mode.padEnd(11)+" "+side(r.symbol)));
show("family",agg(r=>r.mode));
show("underlying",agg(r=>r.symbol.replace("NSE:","").replace(/2609\d\d[CP]\d+$/,"")));
console.log("\nTOTAL",Math.round(rows.reduce((s,r)=>s+(r.net_profit||0),0)),"cells",rows.length);
