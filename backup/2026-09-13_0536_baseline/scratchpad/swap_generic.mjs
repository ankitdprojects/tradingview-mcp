// Replace a chart study with a newer saved version, copying its in_* inputs.
// Usage: node swap_generic.mjs "<study name on chart>" "<pineId>" "<version>"
import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const [name, pineId, version] = process.argv.slice(2);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const targets = (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const chart = targets.find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: chart.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
const studies = () => ev(`TradingViewApi.activeChart().getAllStudies().map(s => ({id: s.id, name: s.name}))`);
const before = await studies();
const old = before.find(s => s.name === name);
if (!old) { console.error('no study named', name); process.exit(1); }
// Only plain in_* inputs, never the encrypted `text` IL or pine* metadata.
const inputs = await ev(`TradingViewApi.activeChart().getStudyById('${old.id}').getInputValues().filter(i => /^in_\\d+$/.test(i.id)).map(i => ({id: i.id, value: i.value}))`);
console.log('copying', inputs.length, 'inputs from', old.id);
await ev(`TradingViewApi.activeChart().removeEntity('${old.id}'); true`); await sleep(1500);
const keep = (await studies()).map(s => s.id);
await ev(`window.__ins = TradingViewApi._studyMarket._insertStudyService.insertStudy({descriptor:{type:'pine', pineId:'${pineId}', pineVersion:'${version}'}, insertionInfo:{stubTitle:'${name}'}, parentIds:[]}); true`);
let newId = null;
for (let i = 0; i < 20 && !newId; i++) { await sleep(1000); newId = (await studies()).map(s => s.id).find(id => !keep.includes(id)); }
if (!newId) { console.error('insert failed'); process.exit(1); }
await ev(`TradingViewApi.activeChart().getStudyById('${newId}').setInputValues(${JSON.stringify(inputs)}); true`);
await sleep(2500);
const chk = await ev(`TradingViewApi.activeChart().getStudyById('${newId}').getInputValues().filter(i => ['pineVersion','in_5','in_14','in_43','in_32'].includes(i.id)).map(i => i.id + '=' + String(i.value).slice(0, 40))`);
console.log('new', newId, chk);
console.log('final', await studies());
await c.close();
