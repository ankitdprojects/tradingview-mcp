import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = s.replace(a, b); n++; };

// 1) RSI inputs + guard, computed before the signals so the gates can use it
rep(`blkL = not blkOn or not nearRes
blkS = not blkOn or not nearSup`,
String.raw`blkL = not blkOn or not nearRes
blkS = not blkOn or not nearSup

// ── RSI (v27) ────────────────────────────────────────────────────────────
// Guard: no BUY while RSI is overbought, no SELL while oversold. Reading shown in the panel.
// Divergence signals further down: price makes a lower low but RSI a higher low = BUY, mirror = SELL.
grpRSI   = "RSI"
rsiLen   = input.int(14,  "RSI length", minval = 2,                 group = grpRSI)
rsiGuard = input.bool(true, "Guard: no BUY above / no SELL below",  group = grpRSI)
rsiHi    = input.int(70,  "Overbought", minval = 50, maxval = 100,  group = grpRSI)
rsiLo    = input.int(30,  "Oversold",   minval = 0,  maxval = 50,   group = grpRSI)
rsiDivOn = input.bool(true, "RSI divergence BUY / SELL",            group = grpRSI)
rsiDivPv = input.int(5,   "Divergence pivot length", minval = 2,    group = grpRSI)
rsi      = ta.rsi(close, rsiLen)
rsiL     = not rsiGuard or rsi < rsiHi
rsiS     = not rsiGuard or rsi > rsiLo`);
rep(`gateL = sigOK and blkL and (not trendAll or na(slow) or close > slow)
gateS = sigOK and blkS and (not trendAll or na(slow) or close < slow)
buy  = upCross   and trendOK_L and confOK_L and sigOK and blkL
sell = downCross and trendOK_S and confOK_S and sigOK and blkS`,
`gateL = sigOK and blkL and rsiL and (not trendAll or na(slow) or close > slow)
gateS = sigOK and blkS and rsiS and (not trendAll or na(slow) or close < slow)
buy  = upCross   and trendOK_L and confOK_L and sigOK and blkL and rsiL
sell = downCross and trendOK_S and confOK_S and sigOK and blkS and rsiS`);

// 2) panel row
rep(`var table axT = table.new(axPos == "Top right" ? position.top_right : axPos == "Top left" ? position.top_left : axPos == "Bottom right" ? position.bottom_right : position.bottom_left, 2, 5, bgcolor = color.new(#000000, 70), border_width = 1, border_color = color.new(#787b86, 60))`,
`var table axT = table.new(axPos == "Top right" ? position.top_right : axPos == "Top left" ? position.top_left : axPos == "Bottom right" ? position.bottom_right : position.bottom_left, 2, 6, bgcolor = color.new(#000000, 70), border_width = 1, border_color = color.new(#787b86, 60))`);
rep(`    table.cell(axT, 1, 4, str.tostring(atr14 * minStopAtr * tgtR, format.mintick) + " min", text_color = #9598a1, text_size = size.small)`,
String.raw`    table.cell(axT, 1, 4, str.tostring(atr14 * minStopAtr * tgtR, format.mintick) + " min", text_color = #9598a1, text_size = size.small)
    rsiCol = rsi >= rsiHi ? #ff1744 : rsi <= rsiLo ? #00c853 : color.white
    table.cell(axT, 0, 5, "RSI " + str.tostring(rsi, "#.#"), text_color = rsiCol, text_size = size.small)
    table.cell(axT, 1, 5, rsi >= rsiHi ? "overbought" : rsi <= rsiLo ? "oversold" : "neutral", text_color = rsiCol, text_size = size.small)`);

// 3) divergence signals appended at the end of the file
s += String.raw`

// ── RSI divergence (v27) ─────────────────────────────────────────────────
// Bullish: price sets a lower pivot low while RSI sets a higher pivot low (selling is losing force).
// Bearish: price higher pivot high, RSI lower pivot high. Confirmed at the pivot, marked there.
// Stop = the pivot extreme, target 1.5R. Same trend / level / RSI guards as every other signal.
rPl = ta.pivotlow(low,  rsiDivPv, rsiDivPv)
rPh = ta.pivothigh(high, rsiDivPv, rsiDivPv)
var float dLo1 = na, var float dLoR1 = na, var float dHi1 = na, var float dHiR1 = na
divBuy  = false
divSell = false
if not na(rPl)
    rsiAt = rsi[rsiDivPv]
    divBuy := rsiDivOn and not na(dLo1) and rPl < dLo1 and rsiAt > dLoR1 and rsiAt < 50 and gateL
    dLo1 := rPl, dLoR1 := rsiAt
if not na(rPh)
    rsiAt = rsi[rsiDivPv]
    divSell := rsiDivOn and not na(dHi1) and rPh > dHi1 and rsiAt < dHiR1 and rsiAt > 50 and gateS
    dHi1 := rPh, dHiR1 := rsiAt
if showLbl and divBuy
    label.new(bar_index - rsiDivPv, low[rsiDivPv] - atr14 * lblGap,  "BUY\nRSI div",  style = label.style_label_up,   color = color.new(#00c853, 0), textcolor = color.black, size = size.small)
if showLbl and divSell
    label.new(bar_index - rsiDivPv, high[rsiDivPv] + atr14 * lblGap, "SELL\nRSI div", style = label.style_label_down, color = color.new(#ff1744, 0), textcolor = color.white, size = size.small)
if showTS and divBuy
    sp = math.min(low[rsiDivPv], close - atr14 * minStopAtr)
    newTrade(true, sp, close + (close - sp) * tgtR)
if showTS and divSell
    sp = math.max(high[rsiDivPv], close + atr14 * minStopAtr)
    newTrade(false, sp, close - (sp - close) * tgtR)
alertcondition(divBuy,  "RSI DIV BUY",  "SMA Signals: RSI bullish divergence {{ticker}} @ {{close}}")
alertcondition(divSell, "RSI DIV SELL", "SMA Signals: RSI bearish divergence {{ticker}} @ {{close}}")
`;
writeFileSync(p, s);
console.log('replacements', n);
