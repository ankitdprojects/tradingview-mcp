#!/usr/bin/env node
// Refresh the "OI Profile" indicator on the active chart with live OI from
// public exchange APIs (no broker login needed).
//   NSE indices (NIFTY, BANKNIFTY, ...)            -> nseindia.com option-chain-v3
//   MCX commodities (GOLD, CRUDEOIL, SILVER, ...)  -> mcxindia.com GetOptionChain
// Usage: node scripts/refresh_oi.mjs [SYMBOL] [expiry] [strike step]
//   expiry format: NSE "01-Sep-2026", MCX "17SEP2026"; omit for nearest.
// Defaults: NIFTY, nearest expiry, step auto-inferred (MCX) or 50 (NSE).
import { evaluate } from '../src/connection.js';
import { setInputs } from '../src/core/indicators.js';

let SYMBOL = (process.argv[2] || '').toUpperCase();
const EXPIRY_ARG = process.argv[3] || null;
const STEP = Number(process.argv[4]) || 50;
const N_EACH = 4;

// No symbol argument -> follow whatever chart is open, so a background watcher
// can never push one symbol's strikes onto another symbol's chart.
if (!SYMBOL) {
  const chartSym = await evaluate(`(window.TradingViewApi ? TradingViewApi.activeChart() : tvWidget.activeChart()).symbol()`);
  const tail = String(chartSym).split(':').pop().toUpperCase();
  // Exact contract roots first (CRUDEOILM chart -> CRUDEOILM options, not the
  // big CRUDEOIL chain), stripping a continuous "1!" or an option suffix.
  const bare = tail.replace(/\d{6}[CP]\d+(\.\d+)?$/, '').replace(/1!$/, '');
  const EXACT = ['CRUDEOILM', 'CRUDEOIL', 'NATGASMINI', 'NATURALGAS', 'GOLDM', 'SILVERM', 'SILVERMIC', 'SILVER', 'COPPER', 'ZINC', 'ZINCMINI', 'NIFTY', 'BANKNIFTY', 'FINNIFTY'];
  const ROOT_MAP = [
    ['BANKNIFTY', 'BANKNIFTY'], ['NIFTY', 'NIFTY'],
    ['GOLD', 'GOLDM'],                      // GOLDM carries gold's option liquidity, big GOLD is near-dead
    ['CRUDEOIL', 'CRUDEOIL'], ['SILVER', 'SILVER'],
    ['NATURALGAS', 'NATURALGAS'], ['NATGAS', 'NATURALGAS'],
    ['COPPER', 'COPPER'], ['ZINC', 'ZINC'],
  ];
  const hit = ROOT_MAP.find(([prefix]) => tail.startsWith(prefix));
  const exch = String(chartSym).split(':')[0].toUpperCase();
  const coin = exch === 'DELTAIN' ? tail.replace(/USD(T)?\.P$/, '') : null;   // DELTAIN:BTCUSD.P -> BTC
  if (EXACT.includes(bare)) SYMBOL = bare;
  else if (hit) SYMBOL = hit[1];
  else if (exch === 'NSE' && /^[A-Z&-]+$/.test(bare)) SYMBOL = bare;   // any NSE stock: try its equity option chain
  else if (coin && ['BTC', 'ETH', 'XAUT'].includes(coin)) SYMBOL = 'DELTA:' + coin;   // Delta lists options only for these
  else {
    // No option chain exists for this symbol (most crypto perps, BSE, unknown roots):
    // clear the profile so the previous symbol's strikes do not linger on this chart.
    const CH = `(window.TradingViewApi ? TradingViewApi.activeChart() : tvWidget.activeChart())`;
    const studies = await evaluate(`${CH}.getAllStudies().map(function(s){return {id:s.id,name:s.name}})`);
    const st = (studies || []).find(s => /oi profile/i.test(s.name));
    if (st) {
      const cur = await evaluate(`${CH}.getStudyById('${st.id}').getInputValues().find(function(i){return i.id==='in_5'}).value`);
      let note = 'no option chain';
      if (coin) {
        // Perp-only coin: no strikes, but show the contract's aggregate OI + funding in the header.
        try {
          const t = (await (await fetch(`https://api.india.delta.exchange/v2/tickers/${tail.replace('.P', '')}`)).json()).result || {};
          if (t.oi) note = `perp OI ${Number(t.oi).toLocaleString('en-IN')} ($${Math.round(Number(t.oi_value_usd) / 1000)}K) fund ${(Number(t.funding_rate) * 100).toFixed(3)}%`;
        } catch { /* keep generic note */ }
      }
      if (String(cur || '').length > 0 || note !== 'no option chain') {
        await setInputs({ entity_id: st.id, inputs: { in_0: coin || bare, in_1: note, in_5: '' } });
        console.log(`chart ${chartSym}: ${note} — strike profile cleared`);
      } else console.log(`chart ${chartSym}: ${note} (already clear)`);
    }
    process.exit(0);
  }
  console.log(`chart ${chartSym} -> ${SYMBOL}`);
}

const MCX_SYMBOLS = ['GOLD', 'GOLDM', 'SILVER', 'SILVERM', 'CRUDEOIL', 'CRUDEOILM', 'NATURALGAS', 'NATGASMINI', 'COPPER', 'ZINC'];
const IS_MCX = MCX_SYMBOLS.includes(SYMBOL);
const NSE_INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'NIFTYNXT50'];
const NSE_TYPE = NSE_INDICES.includes(SYMBOL) ? 'Indices' : 'Equity';

const CHART = `(window.TradingViewApi ? TradingViewApi.activeChart() : tvWidget.activeChart())`;
const HDRS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/option-chain',
};

// Each source returns { expiry, spot, step, rows: [{strike, ce, pe}] } sorted by strike.
async function fetchNse() {
  // cookie warmup, then chain fetch (v3 API as of 2026)
  const warm = await fetch('https://www.nseindia.com/option-chain', { headers: { ...HDRS, Accept: 'text/html' } });
  const cookies = (warm.headers.getSetCookie ? warm.headers.getSetCookie() : []).map(c => c.split(';')[0]).join('; ');
  let expiry = EXPIRY_ARG;
  if (!expiry) {
    const info = await fetch(`https://www.nseindia.com/api/option-chain-contract-info?symbol=${SYMBOL}`, { headers: { ...HDRS, Cookie: cookies } });
    expiry = (await info.json()).expiryDates[0];
  }
  const res = await fetch(`https://www.nseindia.com/api/option-chain-v3?type=${NSE_TYPE}&symbol=${SYMBOL}&expiry=${expiry}`, { headers: { ...HDRS, Cookie: cookies } });
  if (!res.ok) { console.error('NSE chain fetch failed:', res.status); process.exit(1); }
  const data = await res.json();
  const rows = data.records.data
    .map(d => ({ strike: d.strikePrice, ce: d.CE?.openInterest ?? 0, pe: d.PE?.openInterest ?? 0, ceChg: d.CE?.changeinOpenInterest ?? 0, peChg: d.PE?.changeinOpenInterest ?? 0 }))
    .sort((a, b) => a.strike - b.strike);
  return { expiry, spot: data.records.underlyingValue, step: STEP, rows };
}

async function fetchMcx() {
  const H = { ...HDRS, Referer: 'https://www.mcxindia.com/market-data/option-chain', 'X-Requested-With': 'XMLHttpRequest' };
  let expiry = EXPIRY_ARG;
  if (!expiry) {
    // expiry list is embedded as a JSON blob in the option-chain page
    const page = await (await fetch('https://www.mcxindia.com/market-data/option-chain', { headers: { ...HDRS, Accept: 'text/html' } })).text();
    const blob = page.slice(page.indexOf('[{"Symbol"'));
    const list = JSON.parse(blob.slice(0, blob.indexOf(']') + 1));
    const expiries = list.filter(d => d.SymbolValue === SYMBOL && d.InstrumentName === 'OPTFUT').map(d => d.ExpiryDate);
    if (!expiries.length) { console.error(`No MCX OPTFUT expiries for ${SYMBOL}`); process.exit(1); }
    // skip a contract expiring today (OI migrates to the next month)
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '').toUpperCase();
    expiry = expiries.find(e => e !== today) || expiries[0];
  }
  const res = await fetch(`https://www.mcxindia.com/GetOptionChain?InstrumentType=OPTFUT&Symbol=${SYMBOL}&Expiry=${expiry}`, { headers: H });
  if (!res.ok) { console.error('MCX chain fetch failed:', res.status); process.exit(1); }
  const data = await res.json();
  const rows = (data.Data || [])
    .map(d => ({ strike: d.CE_StrikePrice, ce: d.CE_OpenInterest ?? 0, pe: d.PE_OpenInterest ?? 0, ceChg: d.CE_ChangeInOI ?? 0, peChg: d.PE_ChangeInOI ?? 0 }))
    .filter(d => Number.isFinite(d.strike))
    .sort((a, b) => a.strike - b.strike);
  const spot = data.Data?.[0]?.UnderlyingValue;
  // infer strike step from the most common gap between consecutive strikes
  const gaps = {};
  for (let i = 1; i < rows.length; i++) {
    const g = +(rows[i].strike - rows[i - 1].strike).toFixed(2);
    gaps[g] = (gaps[g] || 0) + 1;
  }
  const step = Number(Object.entries(gaps).sort((a, b) => b[1] - a[1])[0]?.[0]) || STEP;
  return { expiry, spot, step, rows };
}

// Delta Exchange India: options on BTC / ETH / XAUT. OI is in contracts (BTC
// contract = 0.001 BTC); nearest expiry with any OI is used.
const IS_DELTA = SYMBOL.startsWith('DELTA:');
async function fetchDelta() {
  const coin = SYMBOL.slice(6);
  const j = await (await fetch(`https://api.india.delta.exchange/v2/tickers?contract_types=call_options,put_options&underlying_asset_symbols=${coin}`)).json();
  const all = j.result || [];
  if (!all.length) { console.error(`Delta: no options for ${coin}`); process.exit(1); }
  const spot = Number(all[0].spot_price);
  // group by expiry (symbol suffix DDMMYY), pick nearest with total OI > 0
  const byExp = {};
  for (const o of all) { const e = o.symbol.split('-').pop(); (byExp[e] ??= []).push(o); }
  const expList = Object.keys(byExp).sort((a, b) => (a.slice(4) + a.slice(2, 4) + a.slice(0, 2)).localeCompare(b.slice(4) + b.slice(2, 4) + b.slice(0, 2)));
  let expiry = EXPIRY_ARG || expList.find(e => byExp[e].some(o => Number(o.oi_contracts || o.oi) > 0)) || expList[0];
  const rowsMap = {};
  for (const o of byExp[expiry] || []) {
    const k = Number(o.strike_price); const r = (rowsMap[k] ??= { strike: k, ce: 0, pe: 0, ceChg: 0, peChg: 0 });
    const oi = Number(o.oi_contracts || o.oi || 0);
    // Delta reports OI change only in USD over 6h; it does not convert cleanly to
    // contracts, so the change columns are left at 0 for crypto.
    if (o.contract_type === 'call_options') r.ce = oi; else r.pe = oi;
  }
  const rows = Object.values(rowsMap).sort((a, b) => a.strike - b.strike);
  const gaps = {};
  for (let i = 1; i < rows.length; i++) { const g = rows[i].strike - rows[i - 1].strike; gaps[g] = (gaps[g] || 0) + 1; }
  const step = Number(Object.entries(gaps).sort((a, b) => b[1] - a[1])[0]?.[0]) || STEP;
  return { expiry, spot, step, rows };
}

const { expiry, spot, step, rows } = IS_MCX ? await fetchMcx() : IS_DELTA ? await fetchDelta() : await fetchNse();

// Pick the strikes that actually carry OI instead of a blind ATM±N grid —
// on MCX the walls sit at far round strikes (gold: 150000/160000/175000...)
// that a near-ATM grid misses entirely. Rank by total OI within ±6% of spot
// (the tradeable walls; gold carries lottery OI 15%+ away that would drag the
// profile off-screen), keep the top 2N+1, and always include the strike
// nearest to spot.
const band = rows.filter(d => d.strike >= spot * 0.94 && d.strike <= spot * 1.06 && (d.ce + d.pe) > 0);
if (!band.length) { console.error('No OI in band around spot — check expiry'); process.exit(1); }
const picked = [...band].sort((a, b) => (b.ce + b.pe) - (a.ce + a.pe)).slice(0, 2 * N_EACH + 1);
const nearest = band.reduce((m, d) => (Math.abs(d.strike - spot) < Math.abs(m.strike - spot) ? d : m), band[0]);
if (!picked.includes(nearest)) picked.push(nearest);
picked.sort((a, b) => a.strike - b.strike);

// Bar height in the indicator scales with the step input, so hand it the
// median gap of the strikes actually drawn, not the chain's raw tick.
const pGaps = picked.slice(1).map((d, i) => d.strike - picked[i].strike).sort((a, b) => a - b);
const drawStep = pGaps[Math.floor(pGaps.length / 2)] || step;

// 5 fields since OI Profile v19: strike:callOI:putOI:callChg:putChg (v18 and older read the first 3).
const parts = picked.map(d => `${d.strike}:${d.ce}:${d.pe}:${Math.round(d.ceChg || 0)}:${Math.round(d.peChg || 0)}`);
parts.push(`spot:${spot}`);  // lets the panel mark the strike nearest the underlying

// PCR and Max Pain over the FULL chain (not just the drawn strikes).
// Max pain = strike where option writers' total payout is smallest.
const totCE = rows.reduce((s, d) => s + d.ce, 0);
const totPE = rows.reduce((s, d) => s + d.pe, 0);
if (totCE > 0) parts.push(`pcr:${(totPE / totCE).toFixed(2)}`);
let mp = null, mpBest = Infinity;
for (const k of rows) {
  let pain = 0;
  for (const s of rows) pain += s.ce * Math.max(0, k.strike - s.strike) + s.pe * Math.max(0, s.strike - k.strike);
  if (pain < mpBest) { mpBest = pain; mp = k.strike; }
}
if (mp !== null) parts.push(`mp:${mp}`);

const oiStr = parts.join(',');
console.log(`${IS_MCX ? 'MCX' : IS_DELTA ? 'DELTA' : 'NSE'} ${SYMBOL} ${expiry} spot=${spot} chainStep=${step} drawStep=${drawStep}`);
console.log('OI:', oiStr);

const studies = await evaluate(`${CHART}.getAllStudies().map(function(s){return {id:s.id,name:s.name}})`);
const st = (studies || []).find(s => /oi profile/i.test(s.name));
if (!st) { console.error('No "OI Profile" study on the active chart.'); process.exit(1); }

// in_0 root, in_1 expiry, in_2 strike step, in_5 oiData override (OI Profile v3+).
// Root/expiry/step are cosmetic in string mode but keep the legend and bar height right.
const r = await setInputs({ entity_id: st.id, inputs: { in_0: SYMBOL, in_1: String(expiry), in_2: drawStep, in_5: oiStr } });
console.log('Updated study', st.id, '->', JSON.stringify(r.updated_inputs).slice(0, 80) + '...');
process.exit(0);
