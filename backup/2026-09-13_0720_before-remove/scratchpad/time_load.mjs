import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const targets = (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const chart = targets.find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: chart.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
const studies = await ev(`TradingViewApi.activeChart().getAllStudies().map(s => ({id: s.id, name: s.name}))`);
const scr = studies.find(s => s.name === 'Screener');
const oi = studies.find(s => s.name === 'OI Profile');
const orig = await ev(`TradingViewApi.activeChart().symbol()`);
const origTf = await ev(`TradingViewApi.activeChart().resolution()`);

const READY = `(function(){try{var m=TradingViewApi.activeChart()._chartWidget.model().model();var ms=m.mainSeries();var b=ms.bars();var n=b.size();var si=ms.symbolInfo();var name=si?(si.full_name||si.name):null;var st=[];TradingViewApi.activeChart().getAllStudies().forEach(function(s){var ds=m.dataSourceForId(s.id);var vis=ds.properties&&ds.properties().visible?ds.properties().visible.value():true;if(!vis){st.push(2);return}var v=ds.status?ds.status():null;v=v&&v.value?v.value():v;st.push(v&&v.type)});return {bars:n, name:name, studies:st}}catch(e){return {bars:0,err:e.message}}})()`;

async function timeSwitch(sym, tf, label) {
  const want = sym.split(':').pop().replace('1!', '');
  await ev(`TradingViewApi.activeChart().setSymbol(${JSON.stringify(sym)}); true`);
  const t0 = Date.now();
  let barsAt = null, studiesAt = null, seenReset = false;
  for (let i = 0; i < 600; i++) {
    const r = await ev(READY);
    const nameOk = r.name && r.name.toUpperCase().includes(want.toUpperCase());
    if (!seenReset && (r.bars === 0 || !nameOk)) seenReset = true;
    if (nameOk && r.bars > 0 && barsAt === null && (seenReset || i > 3)) barsAt = Date.now() - t0;
    if (barsAt !== null && r.studies.every(t => t === 2 || t === 3) && studiesAt === null) { studiesAt = Date.now() - t0; break; }
    await sleep(100);
  }
  console.log(label, sym, tf, 'bars ready', barsAt, 'ms | indicators done', studiesAt, 'ms');
}

const seq = [['NSE:BANKNIFTY1!', '5'], ['MCX:CRUDEOILM1!', '5'], ['NSE:RELIANCE', '5']];
await ev(`TradingViewApi.activeChart().setResolution('5'); true`); await sleep(3000);
for (const [s, tf] of seq) await timeSwitch(s, tf, 'both visible ');
if (scr) { await ev(`TradingViewApi.activeChart().getStudyById('${scr.id}').setVisible(false); true`); await sleep(1500); }
for (const [s, tf] of seq) await timeSwitch(s, tf, 'screener OFF ');
if (oi) { await ev(`TradingViewApi.activeChart().getStudyById('${oi.id}').setVisible(false); true`); await sleep(1500); }
for (const [s, tf] of seq) await timeSwitch(s, tf, 'both OFF     ');
if (scr) await ev(`TradingViewApi.activeChart().getStudyById('${scr.id}').setVisible(true); true`);
if (oi) await ev(`TradingViewApi.activeChart().getStudyById('${oi.id}').setVisible(true); true`);
await ev(`TradingViewApi.activeChart().setSymbol(${JSON.stringify(orig)}); true`); await sleep(3000);
await ev(`TradingViewApi.activeChart().setResolution(${JSON.stringify(origTf)}); true`);
console.log('restored', orig, origTf);
await c.close();
