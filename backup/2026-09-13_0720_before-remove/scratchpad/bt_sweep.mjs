// Backtest sweep: strategy in the Screener slot, loop symbols x timeframes x modes,
// read the Strategy Tester report each time, then restore the Screener.
import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';

const REPO = 'D:/Projects/Tradingview/tradingview-mcp';
const STRAT = { pineId: 'USER;7e62a80a99334d8ead50d5efa5230b96', pineVersion: process.env.BT_VER || '6.0', title: 'Pullback + Retest BT' };
const SCREENER = { pineId: 'USER;ad5ec9f07f2b4daeb989326e14cc13b8', pineVersion: process.env.BT_SCREENER_VER || '114.0', title: 'Screener' };
const SYMBOLS = (process.env.BT_SYMBOLS || 'NSE:NIFTY1!,NSE:BANKNIFTY1!,NSE:RELIANCE').split(',');
const TFS = (process.env.BT_TFS || '1,5,15,60,D').split(',');
const MODES = (process.env.BT_MODES || 'Pullback,Retest,Both').split(',');
const OUT = process.env.BT_OUT || 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad/bt_results.json';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const tv = (...args) => { try { return JSON.parse(execFileSync('node', [`${REPO}/src/cli/index.js`, ...args], { encoding: 'utf-8', timeout: 90000 })); } catch (e) { return { success: false, error: String(e.stdout || e.message).slice(0, 300) }; } };

const targets = (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const chart = targets.find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: chart.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
const studies = () => ev(`TradingViewApi.activeChart().getAllStudies().map(s => ({id: s.id, name: s.name}))`);
const insert = async (d) => {
  const before = (await studies()).map(s => s.id);
  await ev(`window.__ins = TradingViewApi._studyMarket._insertStudyService.insertStudy({descriptor:{type:'pine', pineId:'${d.pineId}', pineVersion:'${d.pineVersion}'}, insertionInfo:{stubTitle:'${d.title}'}, parentIds:[]}); true`);
  for (let i = 0; i < 20; i++) { await sleep(1000); const now = await studies(); const n = now.find(s => !before.includes(s.id)); if (n) return n.id; }
  throw new Error('insert failed for ' + d.title);
};

const origSymbol = process.env.BT_ORIG_SYM || await ev(`TradingViewApi.activeChart().symbol()`);
const origTf = process.env.BT_ORIG_TF || await ev(`TradingViewApi.activeChart().resolution()`);
console.log('original', origSymbol, origTf);

const scr = (await studies()).find(s => s.name === 'Screener');
if (scr) { await ev(`TradingViewApi.activeChart().removeEntity('${scr.id}'); true`); await sleep(1500); console.log('removed Screener', scr.id); }
for (const old of (await studies()).filter(s => /BT/.test(s.name))) { await ev(`TradingViewApi.activeChart().removeEntity('${old.id}'); true`); await sleep(1500); console.log('removed stale strategy', old.id); }
const stratId = await insert(STRAT);
console.log('strategy inserted', stratId);
if (process.env.BT_EXTRA_INPUTS) {
  const extra = JSON.parse(process.env.BT_EXTRA_INPUTS);   // e.g. [{"id":"in_3","value":1}]
  await ev(`TradingViewApi.activeChart().getStudyById('${stratId}').setInputValues(${JSON.stringify(extra)}); true`);
  await sleep(1500);
  console.log('extra inputs applied', JSON.stringify(extra));
}
console.log('panel:', JSON.stringify(tv('ui', 'panel', 'strategy-tester', 'open')).slice(0, 200));

const results = [];
// Wait until the report differs from the PREVIOUS configuration's report (the
// tester keeps showing stale numbers until it recomputes), then until it is
// stable across two reads. If it never changes within ~40 s, accept it as a
// genuine duplicate.
let prevSig = null;
const sig = (m) => `${m.total_trades}|${m.net_profit}|${m.gross_profit}|${m.gross_loss}`;
const readReport = async () => {
  let last = null, changed = prevSig === null;
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    await sleep(2000);
    const r = tv('data', 'strategy');
    const m = r.metrics || {};
    if (!(r.success && m.total_trades !== undefined)) continue;
    const s = sig(m);
    if (!changed) { if (s !== prevSig) changed = true; else if (Date.now() - t0 > 40000) changed = true; else continue; }
    if (last && sig(last) === s) { prevSig = s; return m; }
    last = m;
  }
  if (last) prevSig = sig(last);
  return last || { error: 'no report' };
};

for (const sym of SYMBOLS) {
  await ev(`TradingViewApi.activeChart().setSymbol(${JSON.stringify(sym)}); true`);
  await sleep(4000);
  // Skip symbols TradingView could not resolve (the chart keeps the previous symbol).
  const shown = await ev(`(function(){try{var si=TradingViewApi.activeChart()._chartWidget.model().model().mainSeries().symbolInfo();return si?(si.full_name||si.name):''}catch(e){return ''}})()`);
  const want = sym.split(':').pop().replace('1!', '').toUpperCase();
  if (!String(shown).toUpperCase().includes(want)) { console.log(sym, 'DID NOT RESOLVE (chart shows', shown + ') - skipped'); continue; }
  for (const tf of TFS) {
    await ev(`TradingViewApi.activeChart().setResolution(${JSON.stringify(tf)}); true`);
    await sleep(4000);
    let bars = null, first = null, lastT = null;
    try {
      const o = await ev(`(function(){var b=TradingViewApi.activeChart()._chartWidget.model().model().mainSeries().bars();var fi=b.firstIndex(),li=b.lastIndex();return {size:b.size(),first:b.valueAt(fi)[0],last:b.valueAt(li)[0]}})()`);
      bars = o.size; first = new Date(o.first * 1000).toISOString().slice(0, 10); lastT = new Date(o.last * 1000).toISOString().slice(0, 10);
    } catch {}
    // BT_CONFIGS: JSON [{label, inputs:[{id,value},...]}] overrides the plain mode loop.
    const CONFIGS = process.env.BT_CONFIGS ? JSON.parse(process.env.BT_CONFIGS) : MODES.map(m => ({ label: m, inputs: [{ id: 'in_0', value: m }] }));
    for (const cfg of CONFIGS) {
      const mode = cfg.label;
      await ev(`TradingViewApi.activeChart().getStudyById('${stratId}').setInputValues(${JSON.stringify(cfg.inputs)}); true`);
      const m = await readReport();
      const row = { symbol: sym, tf, mode, ...m, bars, first, last: lastT };
      results.push(row);
      const R = Number(process.env.BT_R || 20000);
      console.log(sym, tf, mode, 'trades', m.total_trades, 'netR', (m.net_profit / R).toFixed?.(1), 'grossR', ((m.net_profit + (m.commission_paid || 0)) / R).toFixed?.(1), 'win%', (m.percent_profitable * 100).toFixed?.(1), 'PF', m.profit_factor?.toFixed?.(2), 'maxDD_R', (m.max_drawdown / R).toFixed?.(1), 'netRs', Math.round(m.net_profit), 'net%', (m.net_profit_percent * 100).toFixed?.(1), 'DD%', (m.max_drawdown_percent * 100).toFixed?.(1), 'avgTrade', Math.round(m.avg_trade || 0));
      writeFileSync(OUT, JSON.stringify(results, null, 1));
    }
  }
}

// restore
await ev(`TradingViewApi.activeChart().removeEntity('${stratId}'); true`); await sleep(1500);
const scrId = await insert(SCREENER);
await ev(`TradingViewApi.activeChart().getStudyById('${scrId}').setInputValues([{id:'in_5',value:'Pullback + Retest'},{id:'in_43',value:false},{id:'in_32',value:false}]); true`);
await ev(`TradingViewApi.activeChart().setSymbol(${JSON.stringify(origSymbol)}); true`); await sleep(3000);
await ev(`TradingViewApi.activeChart().setResolution(${JSON.stringify(origTf)}); true`); await sleep(2000);
console.log('restored', await studies(), await ev(`TradingViewApi.activeChart().symbol()`), await ev(`TradingViewApi.activeChart().resolution()`));
await c.close();
