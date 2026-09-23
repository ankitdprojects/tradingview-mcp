// Insert a saved Pine script on the active chart and save the layout.
// Usage: node insert_study.mjs "<pineId>" "<version>" "<title>"
import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const [pineId, version, title] = process.argv.slice(2);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const targets = (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const chart = targets.find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: chart.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
const studies = () => ev(`TradingViewApi.activeChart().getAllStudies().map(s => ({id: s.id, name: s.name}))`);
const keep = (await studies()).map(s => s.id);
await ev(`TradingViewApi._studyMarket._insertStudyService.insertStudy({descriptor:{type:'pine', pineId:'${pineId}', pineVersion:'${version}'}, insertionInfo:{stubTitle:'${title}'}, parentIds:[]}); true`);
let newId = null;
for (let i = 0; i < 20 && !newId; i++) { await sleep(1000); newId = (await studies()).map(s => s.id).find(id => !keep.includes(id)); }
if (!newId) { console.error('insert failed'); await c.close(); process.exit(1); }
await ev(`TradingViewApi.saveChartToServer ? TradingViewApi.saveChartToServer() : TradingViewApi._chartWidgetCollection.saveChartToServer(); true`).catch(e => console.log('save:', e.message));
await sleep(1500);
console.log('inserted', newId, await studies());
await c.close();
