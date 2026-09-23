// Remove every study from the active chart and save the layout.
import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const targets = (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const chart = targets.find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: chart.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
const studies = () => ev(`TradingViewApi.activeChart().getAllStudies().map(s => ({id: s.id, name: s.name}))`);
const before = await studies();
console.log('before', before);
for (const s of before) { await ev(`TradingViewApi.activeChart().removeEntity('${s.id}'); true`); await sleep(800); }
await ev(`TradingViewApi.saveChartToServer ? TradingViewApi.saveChartToServer() : TradingViewApi._chartWidgetCollection.saveChartToServer(); true`).catch(e => console.log('save:', e.message));
await sleep(2000);
console.log('after', await studies());
await c.close();
