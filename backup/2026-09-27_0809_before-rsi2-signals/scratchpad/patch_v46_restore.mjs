// Bring the families removed on 14-15 Sep back into SMA Signals v45 as switchable groups, keeping everything else.
// Blocks are lifted from the v20 source (git 6616d18) and lightly adapted:
//   - signal conditions gated on sigOK (closed bar + timeframe flow), the major-level block and the RSI guard
//   - text labels use the current solid BUY/SELL style with the family name (chart's own timeframe)
//   - EMA touch and RSI divergence switches default back to ON
import { readFileSync, writeFileSync } from 'fs';
const cur = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
const old = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad/sma_v20.pine';
let s = readFileSync(cur, 'utf8');
const v20 = readFileSync(old, 'utf8').split('\n');
const section = (startRe, endRe) => {
  const a = v20.findIndex(l => startRe.test(l));
  const b = v20.findIndex((l, i) => i > a && endRe.test(l));
  if (a < 0 || b < 0) throw new Error('section not found ' + startRe);
  return v20.slice(a, b).join('\n');
};
let n = 0;
const rep = (a, b, all) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = all ? s.split(a).join(b) : s.replace(a, b); n++; };

// switches back on
rep(`emSigOn  = input.bool(false, "BUY / SELL on touch and go",    group = grpEM)`, `emSigOn  = input.bool(true, "BUY / SELL on touch and go",     group = grpEM)`);
rep(`rsiDivOn = input.bool(false, "RSI divergence BUY / SELL",           group = grpRSI)`, `rsiDivOn = input.bool(true, "RSI divergence BUY / SELL",            group = grpRSI)`);

// ── 1) Fibonacci retracement + golden-zone bounce (v3 block) ─────────────
let fib = section(/^\/\/ ── Auto Fibonacci retracement \(v3\)/, /^\/\/ ── Alerts/);
fib = fib.replace('fibOn    = input.bool(true, "Show Fibonacci",                 group="Fibonacci")', 'fibOn    = input.bool(true, "Show Fibonacci retracement",     group="Fibonacci")');
fib = fib.replace(/^pivLen   = input\.int\(10,   "Swing pivot length", minval=2,    group="Fibonacci"\)/m, 'fibPivLen = input.int(10,  "Swing pivot length", minval=2,    group="Fibonacci")').split('pivLen').join('fibPivLen');
// avoid clashing names with the SMC block
fib = fib.split(/\bph\b/).join('fbPh').split(/\bpl\b/).join('fbPl');
// gates + solid labels
fib = fib.replace('fibBuy  = fibSig and upLeg and touchedL[1] and close > f500 and close > open and (not fibTrend or close > trend)',
                  'fibBuy  = fibSig and sigOK and blkL and rsiL and upLeg and touchedL[1] and close > f500 and close > open and (not fibTrend or na(trend) or close > trend)');
fib = fib.replace('fibSell = fibSig and not upLeg and touchedS[1] and close < f500 and close < open and (not fibTrend or close < trend)',
                  'fibSell = fibSig and sigOK and blkS and rsiS and not upLeg and touchedS[1] and close < f500 and close < open and (not fibTrend or na(trend) or close < trend)');
fib = fib.replace(/^plotshape\(fibBuy,[^\n]*\n/m, '').replace(/^plotshape\(fibSell,[^\n]*\n/m, '');
fib = fib.replace(/label\.new\(bar_index, low,  "FIB BUY\\nT " \+ str\.tostring\(t1272, format\.mintick\),  style=label\.style_label_up,   color=color\.new\(#ffb300, 100\), textcolor=#ffb300, size=size\.small\)/,
                  'label.new(bar_index, low - atr14 * lblGap,  "BUY\\nFib",  style=label.style_label_up,   color=color.new(#00c853, 0), textcolor=color.black, size=size.small, tooltip="target " + str.tostring(t1272, format.mintick))');
fib = fib.replace(/label\.new\(bar_index, high, "FIB SELL\\nT " \+ str\.tostring\(t1272, format\.mintick\), style=label\.style_label_down, color=color\.new\(#ffb300, 100\), textcolor=#ffb300, size=size\.small\)/,
                  'label.new(bar_index, high + atr14 * lblGap, "SELL\\nFib", style=label.style_label_down, color=color.new(#ff1744, 0), textcolor=color.white, size=size.small, tooltip="target " + str.tostring(t1272, format.mintick))');
fib += `
if showTS and fibBuy
    newTrade(true,  math.min(f786, close - atr14 * minStopAtr), t1272)
if showTS and fibSell
    newTrade(false, math.max(f786, close + atr14 * minStopAtr), t1272)
alertcondition(fibBuy,  "FIB BUY",  "SMA Signals: FIB BUY {{ticker}} @ {{close}}")
alertcondition(fibSell, "FIB SELL", "SMA Signals: FIB SELL {{ticker}} @ {{close}}")
`;

// ── 2) Donchian (v10 block) ───────────────────────────────────────────────
let dc = section(/^\/\/ ── Donchian channel \(v10/, /^\/\/ ── Higher-timeframe Fib signals \(v10\)/);
dc = dc.replace('dcBuy  = dcOn and dcSigOn and close > dcUpper and close[1] <= dcUpper[1] and close > open and dcTrendL', 'dcBuy  = dcOn and dcSigOn and sigOK and blkL and rsiL and close > dcUpper and close[1] <= dcUpper[1] and close > open and dcTrendL');
dc = dc.replace('dcSell = dcOn and dcSigOn and close < dcLower and close[1] >= dcLower[1] and close < open and dcTrendS', 'dcSell = dcOn and dcSigOn and sigOK and blkS and rsiS and close < dcLower and close[1] >= dcLower[1] and close < open and dcTrendS');
dc = dc.replace(/^if dcBuy\n    label\.new\(bar_index, low, "", style = label\.style_triangleup[^\n]*\n/m, '').replace(/^if dcSell\n    label\.new\(bar_index, high, "", style = label\.style_triangledown[^\n]*\n/m, '');
dc = dc.replace(/label\.new\(bar_index, low,  "BUY",  style = label\.style_label_up,   color = color\.new\(dcCol, 100\), textcolor = dcCol, size = size\.small\)/, 'label.new(bar_index, low - atr14 * lblGap,  "BUY\\nDonchian",  style = label.style_label_up,   color = color.new(#00c853, 0), textcolor = color.black, size = size.small)');
dc = dc.replace(/label\.new\(bar_index, high, "SELL", style = label\.style_label_down, color = color\.new\(dcCol, 100\), textcolor = dcCol, size = size\.small\)/, 'label.new(bar_index, high + atr14 * lblGap, "SELL\\nDonchian", style = label.style_label_down, color = color.new(#ff1744, 0), textcolor = color.white, size = size.small)');

// ── 3) VWAP mean reversion (v13 block) ────────────────────────────────────
let vw = section(/^\/\/ ── VWAP mean reversion \(v13\)/, /^\/\/ ── Wick mean reversion \(v14\)/);
vw = vw.replace('vwBuy  = vwOn and vwSigOn and vwBelow and close > vwL2 and close > open and close < vwap and vwTrL', 'vwBuy  = vwOn and vwSigOn and sigOK and blkL and rsiL and vwBelow and close > vwL2 and close > open and close < vwap and vwTrL');
vw = vw.replace('vwSell = vwOn and vwSigOn and vwAbove and close < vwU2 and close < open and close > vwap and vwTrS', 'vwSell = vwOn and vwSigOn and sigOK and blkS and rsiS and vwAbove and close < vwU2 and close < open and close > vwap and vwTrS');
vw = vw.replace(/^if vwBuy\n    label\.new\(bar_index, low,  "", style = label\.style_triangleup[^\n]*\n/m, '').replace(/^if vwSell\n    label\.new\(bar_index, high, "", style = label\.style_triangledown[^\n]*\n/m, '');
vw = vw.replace(/label\.new\(bar_index, low,  "BUY\\nvwap",  style = label\.style_label_up,   color = color\.new\(vwCol, 100\), textcolor = vwCol, size = size\.small\)/, 'label.new(bar_index, low - atr14 * lblGap,  "BUY\\nVWAP",  style = label.style_label_up,   color = color.new(#00c853, 0), textcolor = color.black, size = size.small)');
vw = vw.replace(/label\.new\(bar_index, high, "SELL\\nvwap", style = label\.style_label_down, color = color\.new\(vwCol, 100\), textcolor = vwCol, size = size\.small\)/, 'label.new(bar_index, high + atr14 * lblGap, "SELL\\nVWAP", style = label.style_label_down, color = color.new(#ff1744, 0), textcolor = color.white, size = size.small)');

// ── 4) ICT Fair Value Gaps (v17 block) ────────────────────────────────────
let fv = section(/^\/\/ ── ICT Fair Value Gaps \(v17\)/, /^\/\/ ── Support \/ Resistance \+ Supertrend/);
fv = fv.replace('fvgTrL = not fvgTrendG or na(trend) or close > trend', 'fvgTrL = sigOK and blkL and rsiL and (not fvgTrendG or na(trend) or close > trend)');
fv = fv.replace('fvgTrS = not fvgTrendG or na(trend) or close < trend', 'fvgTrS = sigOK and blkS and rsiS and (not fvgTrendG or na(trend) or close < trend)');
fv = fv.replace(/^if fvgBuy\n    label\.new\(bar_index, low,  "", style = label\.style_triangleup[^\n]*\n/m, '').replace(/^if fvgSell\n    label\.new\(bar_index, high, "", style = label\.style_triangledown[^\n]*\n/m, '');
fv = fv.replace(/label\.new\(bar_index, low,  "BUY\\nFVG",  style = label\.style_label_up,   color = color\.new\(fvgBullC, 100\), textcolor = fvgBullC, size = size\.small\)/, 'label.new(bar_index, low - atr14 * lblGap,  "BUY\\nFVG",  style = label.style_label_up,   color = color.new(#00c853, 0), textcolor = color.black, size = size.small)');
fv = fv.replace(/label\.new\(bar_index, high, "SELL\\nFVG", style = label\.style_label_down, color = color\.new\(fvgBearC, 100\), textcolor = fvgBearC, size = size\.small\)/, 'label.new(bar_index, high + atr14 * lblGap, "SELL\\nFVG", style = label.style_label_down, color = color.new(#ff1744, 0), textcolor = color.white, size = size.small)');

s += '\n\n// ═══ Families restored 2026-09-22 (Fibonacci retracement, Donchian, VWAP, FVG) ═══\n\n' + fib + '\n\n' + dc + '\n\n' + vw + '\n\n' + fv + '\n';
s = s.replace('max_boxes_count=100', 'max_boxes_count=120');
writeFileSync(cur, s);
console.log('switch replacements', n, '| appended blocks: fib', fib.length, 'dc', dc.length, 'vwap', vw.length, 'fvg', fv.length);
