import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const targets = (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const chart = targets.find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: chart.id });
await c.Runtime.enable();
const ev = async (expr, awaitPromise = false) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true, awaitPromise }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };

const studies = () => ev(`TradingViewApi.activeChart().getAllStudies().map(s => ({id: s.id, name: s.name}))`);
const before = await studies();
console.log('before:', before);
const old = before.find(s => s.name === 'Screener');
const keep = before.map(s => s.id);

if (old) { await ev(`TradingViewApi.activeChart().removeEntity('${old.id}'); true`); await sleep(1500); console.log('removed', old.id); }

await ev(`window.__ins = TradingViewApi._studyMarket._insertStudyService.insertStudy({descriptor:{type:'pine', pineId:'USER;ad5ec9f07f2b4daeb989326e14cc13b8', pineVersion:'116.0'}, insertionInfo:{stubTitle:'Screener'}, parentIds:[]}); window.__ins.then(function(){window.__insDone='ok'},function(e){window.__insDone='ERR '+(e&&e.message||e)}); true`);
await sleep(7000);
console.log('insert promise:', await ev(`window.__insDone`));
const after = await studies();
console.log('after insert:', after);
const newId = after.map(s => s.id).find(id => !keep.includes(id));
if (!newId) { console.error('no new study'); await c.close(); process.exit(1); }

const setRes = await ev(`(function(){var s=TradingViewApi.activeChart().getStudyById('${newId}');s.setInputValues([{id:'in_5',value:'Pullback + Retest'},{id:'in_43',value:false},{id:'in_32',value:false},{id:'in_61',value:1}]);return 'ok'})()`);
console.log('setInputValues:', setRes);
await sleep(2500);
const check = await ev(`TradingViewApi.activeChart().getStudyById('${newId}').getInputValues().filter(i=>['pineVersion','in_5','in_32','in_43'].includes(i.id))`);
console.log('new inputs:', JSON.stringify(check));
console.log('final:', await studies());
await c.close();
