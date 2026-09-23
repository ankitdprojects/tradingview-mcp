import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = s.replace(a, b); n++; };

// 1) 1-minute mode switch next to the display inputs
rep(`sigOK     = sigMinTf == 0 or timeframe.in_seconds() >= sigMinTf * 60`,
`sigOK     = sigMinTf == 0 or timeframe.in_seconds() >= sigMinTf * 60
oneMinOnly = input.bool(true, "On the 1-minute chart show only SMA 50/200 cross + wick rejection", group = "Display")
is1m      = timeframe.in_seconds() <= 60
othersOK  = not (oneMinOnly and is1m)      // sweep / Supertrend / EMA / RSI divergence / HTF labels`);

// 2) gate the other families (gateL / gateS feed sweep, Supertrend, EMA touch, RSI divergence)
rep(`gateL = sigOK and blkL and rsiL and (not trendAll or na(slow) or close > slow)
gateS = sigOK and blkS and rsiS and (not trendAll or na(slow) or close < slow)`,
`gateL = sigOK and othersOK and blkL and rsiL and (not trendAll or na(slow) or close > slow)
gateS = sigOK and othersOK and blkS and rsiS and (not trendAll or na(slow) or close < slow)`);

// 3) higher-timeframe labels off on 1m
rep(`    fresh = on and timeframe.in_seconds() < timeframe.in_seconds(tf) and ta.change(time(tf)) != 0`,
`    fresh = on and othersOK and timeframe.in_seconds() < timeframe.in_seconds(tf) and ta.change(time(tf)) != 0`);

// 4) wick rejection block back, in the current label style, shown on 1m (and optionally everywhere)
s += String.raw`

// ── Wick mean reversion (v28, back for the 1-minute chart) ───────────────
// Long wick at a stretched price = rejection. BUY: lower wick ≥ wkRatio × body and ≥ wkPct of the range,
// low at least wkAtr ATR below the 20 SMA. SELL is the mirror. Target = the mean, stop = the wick tip.
// Shown on the 1-minute chart by default; switch "Also on higher timeframes" to use it elsewhere.
grpWK    = "Wick rejection"
wkOn     = input.bool(true,  "Wick rejection BUY / SELL",          group = grpWK)
wkAllTf  = input.bool(false, "Also on higher timeframes",           group = grpWK)
wkLen    = input.int(20,     "Mean (SMA length)", minval = 5,       group = grpWK)
wkAtr    = input.float(1.0,  "Stretch from mean (ATR x)", step = 0.25, minval = 0, group = grpWK)
wkRatio  = input.float(2.0,  "Wick ≥ body x", step = 0.5, minval = 1, group = grpWK)
wkPct    = input.float(0.6,  "Wick ≥ range x", step = 0.05, minval = 0.3, maxval = 0.9, group = grpWK)
wkMean   = ta.sma(close, wkLen)
wkBody   = math.abs(close - open)
wkRange  = high - low
wkLower  = math.min(open, close) - low
wkUpper  = high - math.max(open, close)
wkTf     = wkOn and (is1m or wkAllTf) and sigOK and blkL and rsiL
wkTfS    = wkOn and (is1m or wkAllTf) and sigOK and blkS and rsiS
wkBuy  = wkTf  and wkRange > 0 and wkLower >= wkBody * wkRatio and wkLower >= wkRange * wkPct and low <= wkMean - atr14 * wkAtr and close < wkMean
wkSell = wkTfS and wkRange > 0 and wkUpper >= wkBody * wkRatio and wkUpper >= wkRange * wkPct and high >= wkMean + atr14 * wkAtr and close > wkMean
if showLbl and wkBuy
    label.new(bar_index, low - atr14 * lblGap,  "BUY\nwick",  style = label.style_label_up,   color = color.new(#00c853, 0), textcolor = color.black, size = size.small)
if showLbl and wkSell
    label.new(bar_index, high + atr14 * lblGap, "SELL\nwick", style = label.style_label_down, color = color.new(#ff1744, 0), textcolor = color.white, size = size.small)
if showTS and wkBuy
    newTrade(true,  math.min(low, close - atr14 * minStopAtr), wkMean)
if showTS and wkSell
    newTrade(false, math.max(high, close + atr14 * minStopAtr), wkMean)
alertcondition(wkBuy,  "WICK BUY",  "SMA Signals: wick rejection BUY {{ticker}} @ {{close}}")
alertcondition(wkSell, "WICK SELL", "SMA Signals: wick rejection SELL {{ticker}} @ {{close}}")
`;
writeFileSync(p, s);
console.log('replacements', n);
