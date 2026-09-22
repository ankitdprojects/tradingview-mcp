import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
import { execFileSync } from 'child_process';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const t=(await (await fetch('http://localhost:9222/json/list')).json()).find(t=>/tradingview\.com\/chart/.test(t.url));
const c=await CDP({host:'localhost',port:9222,target:t.id}); await c.Runtime.enable();
const ev=async(e)=>{const r=await c.Runtime.evaluate({expression:e,returnByValue:true});return r.exceptionDetails?('ERR '+r.exceptionDetails.text):r.result?.value};
const id=(await ev(`TradingViewApi.activeChart().getAllStudies().find(s=>/BT/.test(s.name)).id`));
for (const inp of JSON.parse(process.argv[2])) {
  await ev(`TradingViewApi.activeChart().getStudyById('${id}').setInputValues(${JSON.stringify(inp.inputs)}); true`);
  await sleep(12000);
  let m={}; try{ m=JSON.parse(execFileSync('node',['D:/Projects/Tradingview/tradingview-mcp/src/cli/index.js','data','strategy'],{encoding:'utf-8'})).metrics||{} }catch(e){ m={err:String(e.stdout||e.message).slice(0,200)} }
  console.log(inp.label, 'trades', m.total_trades, 'net', m.net_profit, 'win', m.percent_profitable);
}
await c.close();
