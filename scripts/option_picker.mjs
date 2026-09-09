#!/usr/bin/env node
// Option picker: rank calls and puts by expected gain for a target move.
//
//   node scripts/option_picker.mjs [ROOT] [--move 1] [--hours 4] [--capital 20000]
//                                  [--expiry 15-Sep-2026|17SEP2026] [--top 5] [--json out.json]
//
// ROOT: NIFTY, BANKNIFTY, FINNIFTY, a stock (RELIANCE), or an MCX root (CRUDEOILM,
//       GOLDM, NATGASMINI...). Omitted -> inferred from the active TradingView chart.
// --move   expected favourable move in % of spot (default 1). The same move against
//          you gives the "adverse" column. Use the underlying's ATR as a guide.
// --hours  hours you expect to hold (theta burn). Default 4.
//
// For every strike it prices the option with Black-Scholes using the chain's IV
// (NSE) or an ATM-straddle implied vol (MCX), applies the move and the time decay,
// and reports gain%, loss% on the adverse move, gain/loss ratio, premium cost per
// lot, lots affordable, breakeven move, liquidity and the OI picture. Ranked by
// gain% x liquidity, filtered to what the capital can actually buy.
//
// Public exchange data only (NSE / MCX), no broker login.

import { evaluate } from '../src/connection.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
let ROOT = (args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true) || '').toUpperCase();
const MOVE_PCT = Number(opt('--move', 1));
const HOURS    = Number(opt('--hours', 4));
const CAPITAL  = Number(opt('--capital', 20000));
const EXPIRY   = opt('--expiry', null);
const TOP      = Number(opt('--top', 5));
const JSON_OUT = opt('--json', null);

if (!ROOT) {
  try {
    const sym = await evaluate(`(window.TradingViewApi ? TradingViewApi.activeChart() : tvWidget.activeChart()).symbol()`);
    const tail = String(sym).split(':').pop().toUpperCase();
    const m = tail.match(/^([A-Z]+?)(?:\d{6}[CP]\d+|1!|M?1!)?$/);
    ROOT = m ? m[1] : tail.replace(/1!$/, '');
    if (ROOT === 'GOLD') ROOT = 'GOLDM';
    console.log(`chart ${sym} -> ${ROOT}`);
  } catch { console.error('Pass a ROOT symbol (chart not reachable).'); process.exit(1); }
}

const MCX = { CRUDEOIL: 100, CRUDEOILM: 10, GOLD: 100, GOLDM: 10, GOLDPETAL: 1, GOLDGUINEA: 1, SILVER: 30, SILVERM: 5, SILVERMIC: 1, NATURALGAS: 1250, NATGASMINI: 250, COPPER: 2500, ZINC: 5000, ZINCMINI: 1000, ALUMINIUM: 5000, LEAD: 5000 };
const IS_MCX = ROOT in MCX;
const IS_INDEX = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'NIFTYNXT50'].includes(ROOT);
const HDRS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'en-US,en;q=0.9' };

const gcd = (a, b) => b ? gcd(b, a % b) : a;

async function fetchNse() {
  const H = { ...HDRS, Referer: 'https://www.nseindia.com/option-chain' };
  const warm = await fetch('https://www.nseindia.com/option-chain', { headers: { ...H, Accept: 'text/html' } });
  const ck = (warm.headers.getSetCookie ? warm.headers.getSetCookie() : []).map(c => c.split(';')[0]).join('; ');
  let expiry = EXPIRY;
  if (!expiry) {
    const info = await (await fetch(`https://www.nseindia.com/api/option-chain-contract-info?symbol=${ROOT}`, { headers: { ...H, Cookie: ck } })).json();
    expiry = info.expiryDates[0];
  }
  const type = IS_INDEX ? 'Indices' : 'Equity';
  const d = await (await fetch(`https://www.nseindia.com/api/option-chain-v3?type=${type}&symbol=${ROOT}&expiry=${expiry}`, { headers: { ...H, Cookie: ck } })).json();
  const spot = d.records.underlyingValue;
  const rows = [];
  let lot = 0;
  for (const r of d.records.data) {
    for (const side of ['CE', 'PE']) {
      const o = r[side]; if (!o) continue;
      for (const q of [o.buyQuantity1, o.sellQuantity1]) if (q > 0) lot = lot ? gcd(lot, q) : q;
      rows.push({ side, strike: r.strikePrice, ltp: o.lastPrice, bid: o.buyPrice1, ask: o.sellPrice1, oi: o.openInterest, oiChg: o.changeinOpenInterest, vol: o.totalTradedVolume, iv: o.impliedVolatility > 0 ? o.impliedVolatility / 100 : null });
    }
  }
  // expiry -> Date at 15:30 IST
  const dt = new Date(`${expiry} 15:30:00 GMT+0530`);
  return { expiry, spot, rows, lot: lot || (IS_INDEX ? 65 : 0), expiryTs: dt.getTime(), src: 'NSE' };
}

async function fetchMcx() {
  const H = { ...HDRS, Referer: 'https://www.mcxindia.com/market-data/option-chain', 'X-Requested-With': 'XMLHttpRequest' };
  let expiry = EXPIRY;
  if (!expiry) {
    const page = await (await fetch('https://www.mcxindia.com/market-data/option-chain', { headers: { ...HDRS, Accept: 'text/html' } })).text();
    const blob = page.slice(page.indexOf('[{"Symbol"'));
    const list = JSON.parse(blob.slice(0, blob.indexOf(']') + 1));
    const exps = list.filter(x => x.SymbolValue === ROOT && x.InstrumentName === 'OPTFUT').map(x => x.ExpiryDate);
    if (!exps.length) { console.error(`No MCX option expiries for ${ROOT}`); process.exit(1); }
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '').toUpperCase();
    expiry = exps.find(e => e !== today) || exps[0];
  }
  const d = await (await fetch(`https://www.mcxindia.com/GetOptionChain?InstrumentType=OPTFUT&Symbol=${ROOT}&Expiry=${expiry}`, { headers: H })).json();
  const data = d.Data || [];
  const spot = data[0]?.UnderlyingValue;
  const rows = [];
  for (const r of data) {
    if (!Number.isFinite(r.CE_StrikePrice)) continue;
    rows.push({ side: 'CE', strike: r.CE_StrikePrice, ltp: r.CE_LTP, bid: r.CE_BidPrice, ask: r.CE_AskPrice, oi: r.CE_OpenInterest, oiChg: r.CE_ChangeInOI, vol: r.CE_Volume, iv: null });
    rows.push({ side: 'PE', strike: r.CE_StrikePrice, ltp: r.PE_LTP, bid: r.PE_BidPrice, ask: r.PE_AskPrice, oi: r.PE_OpenInterest, oiChg: r.PE_ChangeInOI, vol: r.PE_Volume, iv: null });
  }
  const m = expiry.match(/^(\d{2})([A-Z]{3})(\d{4})$/);
  const dt = new Date(`${m[1]} ${m[2]} ${m[3]} 23:30:00 GMT+0530`);
  return { expiry, spot, rows, lot: MCX[ROOT], expiryTs: dt.getTime(), src: 'MCX' };
}

// ── Black-Scholes (r = 6.5%, no dividend) ─────────────────────────────────
const ncdf = (x) => { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x >= 0 ? 1 - p : p; };
const bs = (S, K, T, sig, isCall, r = 0.065) => {
  if (T <= 0) return Math.max(0, isCall ? S - K : K - S);
  const d1 = (Math.log(S / K) + (r + sig * sig / 2) * T) / (sig * Math.sqrt(T)); const d2 = d1 - sig * Math.sqrt(T);
  return isCall ? S * ncdf(d1) - K * Math.exp(-r * T) * ncdf(d2) : K * Math.exp(-r * T) * ncdf(-d2) - S * ncdf(-d1);
};
const impliedVol = (price, S, K, T, isCall) => { let lo = 0.01, hi = 5; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (bs(S, K, T, mid, isCall) > price) hi = mid; else lo = mid; } return (lo + hi) / 2; };

const chain = IS_MCX ? await fetchMcx() : await fetchNse();
const { expiry, spot, rows, lot, expiryTs, src } = chain;
if (!spot || !rows.length) { console.error('Empty chain'); process.exit(1); }
const now = Date.now();
const T0 = Math.max((expiryTs - now) / 31557600000, 1 / (365 * 24));      // years to expiry
const T1 = Math.max(T0 - HOURS / (365 * 24), 1 / (365 * 48));             // after the hold
const move = spot * MOVE_PCT / 100;

// Fallback vol from the ATM straddle when the chain gives no IV (MCX).
const atm = rows.reduce((b, r) => Math.abs(r.strike - spot) < Math.abs(b.strike - spot) ? r : b, rows[0]).strike;
const atmCE = rows.find(r => r.side === 'CE' && r.strike === atm), atmPE = rows.find(r => r.side === 'PE' && r.strike === atm);
let sigFallback = 0.2;
if (atmCE?.ltp > 0 && atmPE?.ltp > 0) sigFallback = (impliedVol(atmCE.ltp, spot, atm, T0, true) + impliedVol(atmPE.ltp, spot, atm, T0, false)) / 2;

// Chain-wide picture
const totCE = rows.filter(r => r.side === 'CE').reduce((s, r) => s + (r.oi || 0), 0);
const totPE = rows.filter(r => r.side === 'PE').reduce((s, r) => s + (r.oi || 0), 0);
const chgCE = rows.filter(r => r.side === 'CE').reduce((s, r) => s + (r.oiChg || 0), 0);
const chgPE = rows.filter(r => r.side === 'PE').reduce((s, r) => s + (r.oiChg || 0), 0);
const pcr = totCE ? totPE / totCE : null;
const wallCE = rows.filter(r => r.side === 'CE' && r.strike > spot).sort((a, b) => b.oi - a.oi)[0];
const wallPE = rows.filter(r => r.side === 'PE' && r.strike < spot).sort((a, b) => b.oi - a.oi)[0];
const bias = (pcr > 1.2 ? 1 : pcr < 0.7 ? -1 : 0) + (chgPE > chgCE * 1.5 ? 1 : chgCE > chgPE * 1.5 ? -1 : 0);
const biasTxt = bias >= 2 ? 'bullish (puts being written)' : bias <= -2 ? 'bearish (calls being written)' : bias === 1 ? 'mildly bullish' : bias === -1 ? 'mildly bearish' : 'neutral / range';

// ── Score every strike ────────────────────────────────────────────────────
const minOI = IS_INDEX ? 1000 : IS_MCX ? 500 : 200;
const scored = [];
for (const r of rows) {
  if (!(r.ltp > 0) || !(r.oi >= minOI) || !(r.vol > 0)) continue;
  const isCall = r.side === 'CE';
  // A last trade at or below intrinsic value is a stale print (deep ITM, no
  // recent trade); pricing it would show free money. Skip it.
  const intrinsic = Math.max(0, isCall ? spot - r.strike : r.strike - spot);
  if (r.ltp <= intrinsic * 1.001) continue;
  // Vol implied by the option's OWN traded price, so "flat" repricing equals the
  // LTP and theta comes out negative as it should. The chain's reported IV can
  // be stale relative to the last trade. Fall back to chain IV / ATM vol when
  // the solver hits its bounds (deep OTM, no time value).
  let sig = impliedVol(r.ltp, spot, r.strike, T0, isCall);
  if (!(sig > 0.02 && sig < 4.5)) sig = r.iv || sigFallback;
  const favS = isCall ? spot + move : spot - move;
  const advS = isCall ? spot - move : spot + move;
  const pFav = bs(favS, r.strike, T1, sig, isCall);
  const pAdv = bs(advS, r.strike, T1, sig, isCall);
  const pFlat = bs(spot, r.strike, T1, sig, isCall);
  const gain = (pFav - r.ltp) / r.ltp * 100;
  const loss = (pAdv - r.ltp) / r.ltp * 100;
  const theta = (pFlat - r.ltp) / r.ltp * 100;
  const cost = r.ltp * lot;
  const lots = Math.floor(CAPITAL / cost);
  const spread = r.ask > 0 && r.bid > 0 ? (r.ask - r.bid) / r.ltp * 100 : null;
  // breakeven move needed just to recover theta + spread over the hold
  let be = 0; for (let m = 0; m <= MOVE_PCT * 3; m += MOVE_PCT / 40) { const s = isCall ? spot * (1 + m / 100) : spot * (1 - m / 100); if (bs(s, r.strike, T1, sig, isCall) >= r.ltp * (1 + (spread || 1) / 100)) { be = m; break; } }
  const liq = Math.min(1, r.oi / (minOI * 10)) * (spread == null ? 0.8 : spread <= 2 ? 1 : spread <= 5 ? 0.8 : 0.5);
  // Expected % if the move is a coin flip: half the gain, half the adverse loss.
  // Ranking on this (not raw gain) stops far-OTM lottery strikes from topping
  // the list on gain% alone while carrying a gain/loss ratio under 1.
  const ev = (gain + loss) / 2;
  if (theta > 0.5) continue;   // quote priced below fair value = stale, not an edge
  scored.push({ side: r.side, strike: r.strike, ltp: r.ltp, cost, lots, oi: r.oi, oiChg: r.oiChg, vol: r.vol, iv: +(sig * 100).toFixed(1), spread, gain, loss, theta, ratio: loss < 0 ? gain / -loss : null, breakeven: be, ev, liq, score: ev * liq, affordable: lots >= 1 });
}

const rank = (side) => scored.filter(s => s.side === side && s.affordable && s.gain > 0).sort((a, b) => b.score - a.score).slice(0, TOP);
const best = { CE: rank('CE'), PE: rank('PE') };

const f0 = (n) => n == null ? '-' : Math.round(n).toLocaleString('en-IN');
const f1 = (n) => n == null ? '-' : (Math.round(n * 10) / 10).toFixed(1);
const hrs = ((expiryTs - now) / 3600000);
console.log(`\n${src} ${ROOT} ${expiry}   spot ${spot}   lot ${lot}   ${hrs < 48 ? hrs.toFixed(0) + ' h' : (hrs / 24).toFixed(1) + ' days'} to expiry   ATM vol ${(sigFallback * 100).toFixed(0)}%`);
console.log(`Scenario: ${MOVE_PCT}% move (${f0(move)} pts) held ${HOURS} h, capital ${f0(CAPITAL)}.`);
console.log(`Chain: PCR ${pcr?.toFixed(2)}  call wall ${wallCE?.strike} (${f0(wallCE?.oi)})  put wall ${wallPE?.strike} (${f0(wallPE?.oi)})  OI change today CE ${f0(chgCE)} / PE ${f0(chgPE)}  -> ${biasTxt}`);
for (const side of ['CE', 'PE']) {
  console.log(`\n${side === 'CE' ? 'CALLS (if the move is UP)' : 'PUTS (if the move is DOWN)'}`);
  console.log('strike   ltp    cost/lot lots  gain%   adverse%  EV%    ratio  theta%  BE-move%  IV%   OI       OIchg    spread%');
  for (const s of best[side]) console.log(`${String(s.strike).padEnd(8)} ${String(s.ltp).padEnd(6)} ${f0(s.cost).padEnd(8)} ${String(s.lots).padEnd(5)} ${('+' + f1(s.gain)).padEnd(7)} ${f1(s.loss).padEnd(9)} ${f1(s.ev).padEnd(6)} ${(s.ratio ? s.ratio.toFixed(2) : '-').padEnd(6)} ${f1(s.theta).padEnd(7)} ${f1(s.breakeven).padEnd(9)} ${String(s.iv).padEnd(5)} ${f0(s.oi).padEnd(8)} ${f0(s.oiChg).padEnd(8)} ${s.spread == null ? '-' : f1(s.spread)}`);
  if (!best[side].length) console.log('  nothing affordable and liquid for this capital');
}
const pick = (side) => best[side][0];
console.log('\nSummary');
for (const side of ['CE', 'PE']) { const p = pick(side); if (p) console.log(`  best ${side}: ${p.strike} at ${p.ltp} (${f0(p.cost)}/lot, ${p.lots} lot${p.lots > 1 ? 's' : ''}) -> +${f1(p.gain)}% on a ${MOVE_PCT}% move, ${f1(p.loss)}% if it goes the other way (EV ${f1(p.ev)}% at 50/50), needs ${f1(p.breakeven)}% just to break even.`); }
console.log(`  Chain bias: ${biasTxt}. Direction must come from the chart (retest / fake / OB-OS on 15-30m); this tool only tells you WHICH strike pays best once you have a direction.`);
if (JSON_OUT) { const { writeFileSync } = await import('fs'); writeFileSync(JSON_OUT, JSON.stringify({ root: ROOT, expiry, spot, lot, move: MOVE_PCT, hours: HOURS, capital: CAPITAL, pcr, wallCE, wallPE, chgCE, chgPE, bias: biasTxt, best, all: scored }, null, 1)); console.log(`  wrote ${JSON_OUT}`); }
process.exit(0);
