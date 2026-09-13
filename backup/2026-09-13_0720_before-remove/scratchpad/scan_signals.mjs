// Scan symbols x timeframes for recent Screener signals by reading the study's plot buffer.
// Usage: SCAN_SYMBOLS=a,b SCAN_TFS=5,15 SCAN_BARS=40 node scan_signals.mjs
import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const SYMBOLS = (process.env.SCAN_SYMBOLS || 'MCX:GOLDM1!').split(',');
const TFS = (process.env.SCAN_TFS || '5,15,30,60').split(',');
const N = Number(process.env.SCAN_BARS || 40);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// plot index -> signal name (row index = plot index + 1, row[0] = time)
const SIG = process.env.SCAN_SIG ? JSON.parse(process.env.SCAN_SIG) : { 13: 'BUY', 16: 'SELL', 19: 'BRK UP', 21: 'BRK DOWN', 25: 'BORTST', 28: 'BDRTST', 23: 'VCP', 40: 'FAKE BORTST', 41: 'FAKE BDRTST', 44: 'FAKE PULLBACK', 45: 'FAKE PULLDOWN', 46: 'OB', 47: 'OS' };
const RSI_PLOT = 7;
const ARMED = 31; // bg colorer: non-NaN while armed

const targets = (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const chart = targets.find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: chart.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
const studies = () => ev(`TradingViewApi.activeChart().getAllStudies().map(s => ({id: s.id, name: s.name}))`);
const scr = (await studies()).find(s => s.name === 'Screener');
if (!scr) { console.error('no Screener on chart'); process.exit(1); }
const origSym = await ev(`TradingViewApi.activeChart().symbol()`);
const origTf = await ev(`TradingViewApi.activeChart().resolution()`);
console.log('original', origSym, origTf);

const READ = `(function(){var m=TradingViewApi.activeChart()._chartWidget.model().model();var ds=m.dataSourceForId('${scr.id}');var d=ds.data();var n=d.size();if(!n)return {bars:0};var li=d.lastIndex();var out={bars:n,last:null,hits:[]};var idx=${JSON.stringify(Object.keys(SIG).map(Number))};var lastRow=d.valueAt(li);out.lastTime=lastRow[0];out.rsi=lastRow[${RSI_PLOT}+1];out.armed=!isNaN(lastRow[${ARMED}+1])&&lastRow[${ARMED}+1]!==null;for(var k=0;k<${N};k++){var i=li-k;if(i<d.firstIndex())break;var row=d.valueAt(i);if(!row)continue;for(var j=0;j<idx.length;j++){var v=row[idx[j]+1];if(v!==null&&v!==undefined&&!isNaN(v))out.hits.push({p:idx[j],ago:k,t:row[0],v:v})}}return out})()`;

const results = [];
for (const sym of SYMBOLS) {
  await ev(`TradingViewApi.activeChart().setSymbol(${JSON.stringify(sym)}); true`);
  await sleep(4000);
  const got = await ev(`TradingViewApi.activeChart().symbol()`);
  if (!got.toUpperCase().includes(sym.split(':').pop().toUpperCase().replace('1!', ''))) { console.log(sym, 'did not resolve (chart shows', got + ')'); continue; }
  for (const tf of TFS) {
    await ev(`TradingViewApi.activeChart().setResolution(${JSON.stringify(tf)}); true`);
    await sleep(4000);
    let r = null;
    for (let i = 0; i < 5; i++) { r = await ev(READ).catch(() => null); if (r && r.bars > 50) break; await sleep(2000); }
    if (!r || !r.bars) { console.log(sym, tf, 'no data'); continue; }
    const hits = r.hits.map(h => ({ sig: SIG[h.p], ago: h.ago, time: new Date(h.t * 1000).toISOString().replace('T', ' ').slice(0, 16), price: h.v })).sort((a, b) => a.ago - b.ago);
    results.push({ sym, tf, bars: r.bars, armed: r.armed, lastTime: new Date(r.lastTime * 1000).toISOString().slice(0, 16), hits });
    console.log(sym, tf, 'RSI', r.rsi != null ? r.rsi.toFixed(1) : 'na', 'armed:', r.armed, 'signals in last', N, 'bars:', hits.length ? hits.map(h => `${h.sig}@${h.price} (${h.ago} bars ago, ${h.time} UTC)`).join(' | ') : 'none');
  }
}
await ev(`TradingViewApi.activeChart().setSymbol(${JSON.stringify(origSym)}); true`); await sleep(3000);
await ev(`TradingViewApi.activeChart().setResolution(${JSON.stringify(origTf)}); true`); await sleep(1500);
console.log('restored', await ev(`TradingViewApi.activeChart().symbol()`), await ev(`TradingViewApi.activeChart().resolution()`));
await c.close();
