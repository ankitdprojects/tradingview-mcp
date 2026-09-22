import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = s.replace(a, b); n++; };

// 1) Major-level block: no BUY right under a major resistance, no SELL right on a major support.
rep(`// ── Signals ───────────────────────────────────────────────────────────────`,
String.raw`// ── Major support / resistance block (v26) ───────────────────────────────
// Major levels = confirmed pivot highs / lows on a long pivot (default 30 bars). A BUY is
// suppressed when a major resistance sits within srBlockAtr ATR above the close (no room to run);
// a SELL is suppressed when a major support sits within that distance below. Levels are
// consumed once price closes through them.
grpBlk    = "Major level block"
blkOn     = input.bool(true, "No BUY under major resistance / no SELL on major support", group = grpBlk)
blkPiv    = input.int(30,   "Major pivot length", minval = 5,               group = grpBlk)
blkAtr    = input.float(0.75, "Block distance (ATR x)", step = 0.25, minval = 0, group = grpBlk)
blkKeep   = input.int(5,    "Major levels remembered (each side)", minval = 1, maxval = 20, group = grpBlk)
blkPh = ta.pivothigh(high, blkPiv, blkPiv)
blkPl = ta.pivotlow(low,  blkPiv, blkPiv)
var float[] majR = array.new_float(), var float[] majS = array.new_float()
if not na(blkPh)
    array.push(majR, blkPh)
    if array.size(majR) > blkKeep
        array.shift(majR)
if not na(blkPl)
    array.push(majS, blkPl)
    if array.size(majS) > blkKeep
        array.shift(majS)
blkAtrV = ta.atr(14)
bool nearRes = false, bool nearSup = false
if array.size(majR) > 0
    for i = array.size(majR) - 1 to 0
        r = array.get(majR, i)
        if close > r                        // broken: drop it
            array.remove(majR, i)
        else if r - close <= blkAtrV * blkAtr
            nearRes := true
if array.size(majS) > 0
    for i = array.size(majS) - 1 to 0
        sp = array.get(majS, i)
        if close < sp
            array.remove(majS, i)
        else if close - sp <= blkAtrV * blkAtr
            nearSup := true
blkL = not blkOn or not nearRes
blkS = not blkOn or not nearSup

// ── Signals ───────────────────────────────────────────────────────────────`);
rep(`gateL = sigOK and (not trendAll or na(slow) or close > slow)
gateS = sigOK and (not trendAll or na(slow) or close < slow)
buy  = upCross   and trendOK_L and confOK_L and sigOK
sell = downCross and trendOK_S and confOK_S and sigOK`,
`gateL = sigOK and blkL and (not trendAll or na(slow) or close > slow)
gateS = sigOK and blkS and (not trendAll or na(slow) or close < slow)
buy  = upCross   and trendOK_L and confOK_L and sigOK and blkL
sell = downCross and trendOK_S and confOK_S and sigOK and blkS`);

// 2) Liquidity levels: unswept swing highs (buy-side liquidity) and lows (sell-side) drawn until swept.
rep(`// Liquidity sweeps: wick through the last swing, close back inside (the swing must be older than this bar)`,
String.raw`// Liquidity levels (v26): every confirmed swing high / low that has NOT been traded through yet is
// where resting stops sit. Drawn as dotted lines that extend right and disappear the bar they are swept.
liqOn    = input.bool(true, "Show resting liquidity (unswept swing highs / lows)", group = grpSMC)
liqKeep  = input.int(3,     "Liquidity levels kept (each side)", minval = 1, maxval = 10, group = grpSMC)
var line[]  liqHl = array.new_line(), var line[]  liqLl = array.new_line()
var label[] liqHb = array.new_label(), var label[] liqLb = array.new_label()
if liqOn and not na(sPh)
    array.push(liqHl, line.new(bar_index - smcPiv, sPh, bar_index + 1, sPh, color = color.new(smcBear, 20), style = line.style_dotted, width = 2, extend = extend.right))
    array.push(liqHb, label.new(bar_index + 1, sPh, "liquidity ▲ " + str.tostring(sPh, format.mintick), style = label.style_label_left, color = color.new(smcBear, 100), textcolor = smcBear, size = size.tiny))
    while array.size(liqHl) > liqKeep
        line.delete(array.shift(liqHl)), label.delete(array.shift(liqHb))
if liqOn and not na(sPl)
    array.push(liqLl, line.new(bar_index - smcPiv, sPl, bar_index + 1, sPl, color = color.new(smcBull, 20), style = line.style_dotted, width = 2, extend = extend.right))
    array.push(liqLb, label.new(bar_index + 1, sPl, "liquidity ▼ " + str.tostring(sPl, format.mintick), style = label.style_label_left, color = color.new(smcBull, 100), textcolor = smcBull, size = size.tiny))
    while array.size(liqLl) > liqKeep
        line.delete(array.shift(liqLl)), label.delete(array.shift(liqLb))
// swept = price traded through the level (that is the sweep the signal below looks for)
if array.size(liqHl) > 0
    for i = array.size(liqHl) - 1 to 0
        if high > line.get_y1(array.get(liqHl, i)) and bar_index > line.get_x1(array.get(liqHl, i)) + smcPiv
            line.delete(array.remove(liqHl, i)), label.delete(array.remove(liqHb, i))
        else
            label.set_x(array.get(liqHb, i), bar_index + 1)
if array.size(liqLl) > 0
    for i = array.size(liqLl) - 1 to 0
        if low < line.get_y1(array.get(liqLl, i)) and bar_index > line.get_x1(array.get(liqLl, i)) + smcPiv
            line.delete(array.remove(liqLl, i)), label.delete(array.remove(liqLb, i))
        else
            label.set_x(array.get(liqLb, i), bar_index + 1)

// Liquidity sweeps: wick through the last swing, close back inside (the swing must be older than this bar)`);
writeFileSync(p, s);
console.log('replacements', n);
