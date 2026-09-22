import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const t=(await (await fetch('http://localhost:9222/json/list')).json()).find(t=>/tradingview\.com\/chart/.test(t.url));
const c=await CDP({host:'localhost',port:9222,target:t.id}); await c.Runtime.enable();
const ev=async(e)=>{const r=await c.Runtime.evaluate({expression:e,returnByValue:true});return r.exceptionDetails?('ERR '+r.exceptionDetails.text):r.result?.value};
// click the "Script execution" dropdown and dump visible texts
console.log(await ev(`(function(){var b=Array.from(document.querySelectorAll('button,div[role=button]')).find(x=>/Script execution/.test(x.textContent));if(!b)return 'no btn';b.click();return 'clicked'})()`));
await sleep(1500);
console.log(await ev(`Array.from(document.querySelectorAll('div,span')).filter(e=>e.children.length===0&&e.offsetParent!==null&&e.textContent.trim().length>20&&e.textContent.trim().length<400).map(e=>e.textContent.trim()).filter((v,i,a)=>a.indexOf(v)===i).slice(-15)`));
console.log(await ev(`(function(){var s=TradingViewApi.activeChart().getAllStudies()[0];var st=TradingViewApi.activeChart().getStudyById(s.id);var si=TradingViewApi.activeChart()._chartWidget.model().model().mainSeries().symbolInfo();return {pv:si.pointvalue,type:si.type,minmov:si.minmov,ps:si.pricescale,qtyStep:si.qty_step||null}})()`));
await c.close();
