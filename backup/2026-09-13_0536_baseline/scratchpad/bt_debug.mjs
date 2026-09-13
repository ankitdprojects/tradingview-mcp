import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
import { execFileSync } from 'child_process';
const REPO = 'D:/Projects/Tradingview/tradingview-mcp';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const tv = (...args) => { try { return execFileSync('node', [`${REPO}/src/cli/index.js`, ...args], { encoding: 'utf-8', timeout: 90000 }); } catch (e) { return String(e.stdout || e.message).slice(0, 500); } };
const targets = (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const chart = targets.find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: chart.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
const studies = () => ev(`TradingViewApi.activeChart().getAllStudies().map(s => ({id: s.id, name: s.name}))`);
const action = process.argv[2] || 'setup';
if (action === 'setup') {
  const scr = (await studies()).find(s => s.name === 'Screener');
  if (scr) { await ev(`TradingViewApi.activeChart().removeEntity('${scr.id}'); true`); await sleep(1500); }
  const before = (await studies()).map(s => s.id);
  await ev(`TradingViewApi.activeChart().setSymbol('NSE:NIFTY1!'); true`); await sleep(3000);
  await ev(`TradingViewApi.activeChart().setResolution('15'); true`); await sleep(3000);
  await ev(`window.__ins = TradingViewApi._studyMarket._insertStudyService.insertStudy({descriptor:{type:'pine', pineId:'USER;7e62a80a99334d8ead50d5efa5230b96', pineVersion:'${process.argv[3] || '1.0'}'}, insertionInfo:{stubTitle:'Pullback + Retest BT'}, parentIds:[]}); true`);
  await sleep(8000);
  console.log('studies', await studies());
}
const st = (await studies()).find(s => /BT/.test(s.name));
if (st) {
  const status = await ev(`(function(){try{var m=TradingViewApi.activeChart()._chartWidget.model().model();var ds=m.dataSourceForId('${st.id}');var s=ds.status?ds.status():null;var v=s&&s.value?s.value():s;return {status:JSON.stringify(v).slice(0,400), isFailed: ds.isFailed?ds.isFailed():null}}catch(e){return 'err '+e.message}})()`);
  console.log('status:', status);
}
console.log(tv('data', 'strategy'));
console.log(tv('data', 'trades').slice(0, 1500));
await c.close();
