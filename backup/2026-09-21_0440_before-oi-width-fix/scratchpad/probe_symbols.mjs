import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const syms = process.argv.slice(2);
const targets = (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const chart = targets.find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: chart.id });
await c.Runtime.enable();
const ev = async (e) => { const r = await c.Runtime.evaluate({ expression: e, returnByValue: true }); return r.result?.value; };
const orig = await ev(`TradingViewApi.activeChart().symbol()`);
for (const s of syms) {
  await ev(`TradingViewApi.activeChart().setSymbol(${JSON.stringify(s)}); true`);
  await sleep(9000);
  const info = await ev(`(function(){try{var m=TradingViewApi.activeChart()._chartWidget.model().model();var si=m.mainSeries().symbolInfo();var b=m.mainSeries().bars();var n=b.size();var first=n?new Date(b.valueAt(b.firstIndex())[0]*1000).toISOString().slice(0,10):null;return {name:si.full_name,type:si.type,pv:si.pointvalue,minmov:si.minmov,pricescale:si.pricescale,bars:n,first:first}}catch(e){return {err:e.message}}})()`);
  console.log(s, '->', JSON.stringify(info));
}
await ev(`TradingViewApi.activeChart().setSymbol(${JSON.stringify(orig)}); true`);
await c.close();
