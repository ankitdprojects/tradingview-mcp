import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals_strategy.pine';
let s = readFileSync(p, 'utf8');

s = s.replace(`sweepTr    = input.bool(false, "Sweep: only with trend SMA")                                          // in_28`,
`sweepTr    = input.bool(false, "Sweep: only with trend SMA")                                          // in_28
// Family switches (v9). mode "Custom" = use these; other modes keep the old behaviour.
fSMA       = input.bool(false, "Family: SMA cross")                                                   // in_29
fFIB       = input.bool(false, "Family: Fib golden-zone bounce")                                       // in_30
fSweep     = input.bool(false, "Family: liquidity sweep")                                              // in_31
fDC        = input.bool(false, "Family: Donchian breakout")                                            // in_32
fVWAP      = input.bool(false, "Family: VWAP mean reversion")                                          // in_33
fWick      = input.bool(false, "Family: wick rejection")                                               // in_34
fFVG       = input.bool(false, "Family: FVG retest")                                                   // in_35
fST        = input.bool(false, "Family: Supertrend flip")                                              // in_36
fEMA       = input.bool(false, "Family: 50 EMA touch")                                                 // in_37
filtST     = input.bool(false, "Filter: Supertrend must agree")                                        // in_38
filtADX    = input.float(0, "Filter: ADX at least (0 = off)", minval = 0)                              // in_39
filtVWAP   = input.bool(false, "Filter: long only above VWAP / short only below")                     // in_40
dcLen      = input.int(20, "Donchian length", minval = 5)                                              // in_41
stLen      = input.int(10, "Supertrend ATR length", minval = 1)                                        // in_42
stMult     = input.float(3.0, "Supertrend multiplier", step = 0.5)                                     // in_43
emLen      = input.int(50, "EMA length", minval = 2)                                                   // in_44`);

const a = s.indexOf('useSweep = mode == "Sweep"');
const b = s.indexOf('flat  = strategy.position_size == 0');
if (a < 0 || b < 0) throw new Error('anchors not found');
const block = String.raw`atr14 = ta.atr(14)
custom   = mode == "Custom"
useSweep = custom ? fSweep : mode == "Sweep"
useSma   = custom ? fSMA   : (mode == "SMA" or mode == "Both")
useFib   = custom ? fFIB   : (mode == "FIB" or mode == "Both")

// ── Extra families (same rules as the indicator v20) ─────────────────────
// Donchian breakout
dcUpper = ta.highest(high, dcLen)[1], dcLower = ta.lowest(low, dcLen)[1], dcMid = (dcUpper + dcLower) / 2
dcBuy  = close > dcUpper and close[1] <= dcUpper[1] and close > open and (not useTrend or na(trend) or close > trend)
dcSell = close < dcLower and close[1] >= dcLower[1] and close < open and (not useTrend or na(trend) or close < trend)
// VWAP mean reversion (session)
newSess = ta.change(time("D")) != 0
var float vPV = 0.0, var float vV = 0.0, var float vPV2 = 0.0
if newSess
    vPV := 0.0, vV := 0.0, vPV2 := 0.0
vw = nz(volume) > 0 ? volume : 1.0
vPV += hlc3 * vw, vV += vw, vPV2 += hlc3 * hlc3 * vw
vwap = vPV / vV
vwSd = math.sqrt(math.max(vPV2 / vV - vwap * vwap, 0))
vwU2 = vwap + 2 * vwSd, vwL2 = vwap - 2 * vwSd
var bool vwBelow = false, var bool vwAbove = false
var float vwExtLo = na, var float vwExtHi = na
if close < vwL2
    vwBelow := true, vwExtLo := na(vwExtLo) ? low : math.min(vwExtLo, low)
if close > vwU2
    vwAbove := true, vwExtHi := na(vwExtHi) ? high : math.max(vwExtHi, high)
vwBuy  = vwBelow and close > vwL2 and close > open and close < vwap
vwSell = vwAbove and close < vwU2 and close < open and close > vwap
vwStopL = nz(vwExtLo, low), vwStopS = nz(vwExtHi, high)
if vwBuy or close > vwap
    vwBelow := false, vwExtLo := na
if vwSell or close < vwap
    vwAbove := false, vwExtHi := na
// Wick rejection
wkMean = ta.sma(close, 20)
wkBody = math.abs(close - open), wkRange = high - low
wkLower = math.min(open, close) - low, wkUpper = high - math.max(open, close)
wkBuy  = wkRange > 0 and wkLower >= wkBody * 2 and wkLower >= wkRange * 0.6 and low <= wkMean - atr14 and close < wkMean
wkSell = wkRange > 0 and wkUpper >= wkBody * 2 and wkUpper >= wkRange * 0.6 and high >= wkMean + atr14 and close > wkMean
// FVG retest (keeps up to 8 open gaps)
var float[] gTop = array.new_float(), var float[] gBot = array.new_float(), var bool[] gUp = array.new_bool(), var int[] gBar = array.new_int()
if low > high[2] and (low - high[2]) >= atr14 * 0.2
    array.push(gTop, low), array.push(gBot, high[2]), array.push(gUp, true), array.push(gBar, bar_index)
if high < low[2] and (low[2] - high) >= atr14 * 0.2
    array.push(gTop, low[2]), array.push(gBot, high), array.push(gUp, false), array.push(gBar, bar_index)
bool fvgBuy = false, bool fvgSell = false
float fvgStopL = na, float fvgStopS = na
if array.size(gTop) > 0
    for i = array.size(gTop) - 1 to 0
        up = array.get(gUp, i), top = array.get(gTop, i), bot = array.get(gBot, i)
        if bar_index - array.get(gBar, i) > 2
            if up and low <= top and low > bot and close > top and close > open and (not useTrend or na(trend) or close > trend) and not fvgBuy
                fvgBuy := true, fvgStopL := bot
            if not up and high >= bot and high < top and close < bot and close < open and (not useTrend or na(trend) or close < trend) and not fvgSell
                fvgSell := true, fvgStopS := top
        if up ? close < bot : close > top
            array.remove(gTop, i), array.remove(gBot, i), array.remove(gUp, i), array.remove(gBar, i)
    while array.size(gTop) > 8
        array.shift(gTop), array.shift(gBot), array.shift(gUp), array.shift(gBar)
// Supertrend flip (+ ADX)
[stLine, stDir] = ta.supertrend(stMult, stLen)
[diP, diM, adx] = ta.dmi(14, 14)
stBuy  = stDir < 0 and stDir[1] >= 0
stSell = stDir > 0 and stDir[1] <= 0
// 50 EMA touch & go
ema50 = ta.ema(close, emLen)
emBuy0  = ema50 > ema50[5] and low  <= ema50 + atr14 * 0.1 and close > ema50 and close > open and close[1] > ema50[1]
emSell0 = ema50 < ema50[5] and high >= ema50 - atr14 * 0.1 and close < ema50 and close < open and close[1] < ema50[1]
emBuy  = emBuy0 and not emBuy0[1]
emSell = emSell0 and not emSell0[1]

// ── Pick the family that fires (priority order) and its stop / target ────
float rawL = na, float rawS = na, float tgtLx = na, float tgtSx = na
bool sigL = false, bool sigS = false
smaStopRawL = stopMode == "Swing" ? ta.lowest(low, swingLen)   : smaStopL
smaStopRawS = stopMode == "Swing" ? ta.highest(high, swingLen) : smaStopS
if useSweep and sweepLo
    sigL := true, rawL := low
if useFib and fibBuy and not sigL
    sigL := true, rawL := f786, tgtLx := (stopMode == "Signal" or fibTarget) and t1272 > close ? t1272 : na
if useSma and smaBuy and not sigL
    sigL := true, rawL := smaStopRawL
if custom and fDC and dcBuy and not sigL
    sigL := true, rawL := dcMid
if custom and fVWAP and vwBuy and not sigL
    sigL := true, rawL := vwStopL, tgtLx := vwap
if custom and fWick and wkBuy and not sigL
    sigL := true, rawL := low, tgtLx := wkMean
if custom and fFVG and fvgBuy and not sigL
    sigL := true, rawL := fvgStopL
if custom and fST and stBuy and not sigL
    sigL := true, rawL := stLine
if custom and fEMA and emBuy and not sigL
    sigL := true, rawL := low
if useSweep and sweepHi
    sigS := true, rawS := high
if useFib and fibSell and not sigS
    sigS := true, rawS := f786, tgtSx := (stopMode == "Signal" or fibTarget) and t1272 < close ? t1272 : na
if useSma and smaSell and not sigS
    sigS := true, rawS := smaStopRawS
if custom and fDC and dcSell and not sigS
    sigS := true, rawS := dcMid
if custom and fVWAP and vwSell and not sigS
    sigS := true, rawS := vwStopS, tgtSx := vwap
if custom and fWick and wkSell and not sigS
    sigS := true, rawS := high, tgtSx := wkMean
if custom and fFVG and fvgSell and not sigS
    sigS := true, rawS := fvgStopS
if custom and fST and stSell and not sigS
    sigS := true, rawS := stLine
if custom and fEMA and emSell and not sigS
    sigS := true, rawS := high
// Filters (combination tests): Supertrend agreement, ADX floor, VWAP side
if filtST
    sigL := sigL and stDir < 0
    sigS := sigS and stDir > 0
if filtADX > 0
    sigL := sigL and adx >= filtADX
    sigS := sigS and adx >= filtADX
if filtVWAP
    sigL := sigL and close > vwap
    sigS := sigS and close < vwap
plotshape(sigL, "L", shape.triangleup,   location.belowbar, color = color.new(#00c853, 0), size = size.tiny)
plotshape(sigS, "S", shape.triangledown, location.abovebar, color = color.new(#ff1744, 0), size = size.tiny)

// ── Stops / sizing ────────────────────────────────────────────────────────
stopL  = math.min(nz(rawL, low),  close - atr14 * minStopAtr)
stopS  = math.max(nz(rawS, high), close + atr14 * minStopAtr)
`;
s = s.slice(0, a) + block + s.slice(b);
s = s.replace(/\/\/ FIB trades target the 1\.272[^\n]*\nfibTgtL = [^\n]*\nfibTgtS = [^\n]*\n/, '');
s = s.replace('    tgt  = fibTgtL ? t1272 : close + dist * rr', '    tgt  = not na(tgtLx) and tgtLx > close ? tgtLx : close + dist * rr');
s = s.replace('    tgt  = fibTgtS ? t1272 : close - dist * rr', '    tgt  = not na(tgtSx) and tgtSx < close ? tgtSx : close - dist * rr');
s = s.replace('mode       = input.string("SMA", "Entries", options = ["SMA", "FIB", "Both", "Sweep"])', 'mode       = input.string("SMA", "Entries", options = ["SMA", "FIB", "Both", "Sweep", "Custom"])');
writeFileSync(p, s);
console.log('patched, lines', s.split('\n').length, 'tgtLx refs', (s.match(/tgtLx/g) || []).length, 'fibTgt left', (s.match(/fibTgt/g) || []).length);
