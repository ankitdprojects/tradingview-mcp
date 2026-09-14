import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b, all) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = all ? s.split(a).join(b) : s.replace(a, b); n++; };

// 1) category detection + preset, placed with the display inputs (before anything that reads it)
rep(`sigOK     = (sigMinTf == 0 or timeframe.in_seconds() >= sigMinTf * 60) and barstate.isconfirmed`,
String.raw`// ── Category preset (v41) ────────────────────────────────────────────────
// Backtests split cleanly by instrument type, so the signal set follows the symbol:
//   Options        : the timeframe flow as tested (sweep, wick, SMA crosses, Supertrend+ADX, 15min/60min sets)
//   Commodities MCX: Supertrend + Donchian + SMA 9/21 cross on 5m-60m (sweep and wick lost on crude)
//   Index futures  : nothing below 60m; 60m wick + Supertrend only (every faster row lost)
catMode   = input.string("Auto", "Category preset", options = ["Auto", "Options", "Commodities", "Index futures", "All signals"], group = "Display")
autoCat   = syminfo.type == "option" ? "Options" : syminfo.prefix == "MCX" ? "Commodities" : syminfo.type == "futures" ? "Index futures" : "Options"
cat       = catMode == "Auto" ? autoCat : catMode
catOpt    = cat == "Options"
catCom    = cat == "Commodities"
catIdx    = cat == "Index futures"
sigOK     = (sigMinTf == 0 or timeframe.in_seconds() >= sigMinTf * 60) and barstate.isconfirmed and (not catIdx or timeframe.in_seconds() >= 3600)`);

// 2) SMA cross: commodities use the 9/21 pair on every timeframe from 5m up
rep(`smaTfOK   = smaSigOn and (not sma1mOnly or is1m)`,
    `smaTfOK   = smaSigOn and (catCom ? timeframe.in_seconds() >= 300 : (not sma1mOnly or is1m))`);
rep(`fast  = ta.sma(close, fastLen)
slow  = ta.sma(close, slowLen)`,
`fastL = catCom ? 9 : fastLen
slowL = catCom ? 21 : slowLen
fast  = ta.sma(close, fastL)
slow  = ta.sma(close, slowL)`);

// 3) sweep and wick off on commodities (lost on crude), wick off below 60m on index futures (sigOK already blocks)
rep(`sweepLo = sweepOn and gateL and f15SwL and not is60 and not na(sL)`, `sweepLo = sweepOn and not catCom and gateL and f15SwL and not is60 and not na(sL)`);
rep(`sweepHi = sweepOn and gateS and f15SwS and not is60 and not na(sH)`, `sweepHi = sweepOn and not catCom and gateS and f15SwS and not is60 and not na(sH)`);
rep(`wkTf     = wkOn and (is1m or is15 or is60 or wkAllTf) and sigOK and blkL and rsiL`, `wkTf     = wkOn and not catCom and (is1m or is15 or is60 or wkAllTf) and sigOK and blkL and rsiL`);
rep(`wkTfS    = wkOn and (is1m or is15 or is60 or wkAllTf) and sigOK and blkS and rsiS`, `wkTfS    = wkOn and not catCom and (is1m or is15 or is60 or wkAllTf) and sigOK and blkS and rsiS`);
// Supertrend: on commodities it is allowed on every timeframe (the 15m/60m-only gates stay for options)
rep(`stFlipUp = stOn and stSigOn and gateL and f15StL and stDir < 0`, `stFlipUp = stOn and stSigOn and gateL and (catCom or f15StL) and stDir < 0`);
rep(`stFlipDn = stOn and stSigOn and gateS and f15StS and stDir > 0`, `stFlipDn = stOn and stSigOn and gateS and (catCom or f15StS) and stDir > 0`);

// 4) higher-timeframe sets: sweep branches off on commodities; the 5-minute wick set off on commodities; nothing below 60m on index futures
rep(`    _swB = sweepOn and not na(_sL) and bar_index > _sLb + smcPiv and low < _sL and close > _sL and close > open`, `    _swB = sweepOn and not catCom and not na(_sL) and bar_index > _sLb + smcPiv and low < _sL and close > _sL and close > open`);
rep(`    _swS = sweepOn and not na(_sH) and bar_index > _sHb + smcPiv and high > _sH and close < _sH and close < open`, `    _swS = sweepOn and not catCom and not na(_sH) and bar_index > _sHb + smcPiv and high > _sH and close < _sH and close < open`);
rep(`    _swB = not na(_sL) and bar_index > _sLb + smcPiv and low < _sL and close > _sL and close > open`, `    _swB = not catCom and not na(_sL) and bar_index > _sLb + smcPiv and low < _sL and close > _sL and close > open`, true);
rep(`    _swS = not na(_sH) and bar_index > _sHb + smcPiv and high > _sH and close < _sH and close < open`, `    _swS = not catCom and not na(_sH) and bar_index > _sHb + smcPiv and high > _sH and close < _sH and close < open`, true);
rep(`m5Fresh = m5On and is1m and barstate.isconfirmed and ta.change(time("5")) != 0`, `m5Fresh = m5On and is1m and not catIdx and barstate.isconfirmed and ta.change(time("5")) != 0`);
rep(`w5Fresh = w5On and is1m and barstate.isconfirmed and ta.change(time("5")) != 0`, `w5Fresh = w5On and is1m and not catCom and not catIdx and barstate.isconfirmed and ta.change(time("5")) != 0`);
rep(`k5Fresh = k5On and is1m and barstate.isconfirmed and ta.change(time("5")) != 0`, `k5Fresh = k5On and is1m and not catIdx and barstate.isconfirmed and ta.change(time("5")) != 0`);
rep(`s15Fresh = s15On and lt15 and barstate.isconfirmed and ta.change(time("15")) != 0`, `s15Fresh = s15On and lt15 and not catIdx and barstate.isconfirmed and ta.change(time("15")) != 0`);

// 5) panel row with the active preset
rep(`2, 6, bgcolor = color.new(#000000, 70)`, `2, 7, bgcolor = color.new(#000000, 70)`);
rep(`    table.cell(axT, 0, 5, "RSI " + str.tostring(rsi, "#.#"), text_color = rsiCol, text_size = size.small)`,
`    table.cell(axT, 0, 6, "Preset", text_color = color.white, text_size = size.small)
    table.cell(axT, 1, 6, cat + (catMode == "Auto" ? " (auto)" : ""), text_color = #ffd600, text_size = size.small)
    table.cell(axT, 0, 5, "RSI " + str.tostring(rsi, "#.#"), text_color = rsiCol, text_size = size.small)`);

// 6) Donchian back, commodities only by default
s += String.raw`

// ── Donchian channel (v41, commodities preset) ───────────────────────────
// Second-best commodity indicator in the tests (+25k on crude, 4 of 5 timeframes). Breakout: first close
// above the prior N-bar high = BUY, below the prior N-bar low = SELL. Stop = channel mid, target 1.5R.
grpDC    = "Donchian (commodities)"
dcOn     = input.bool(true, "Donchian breakout BUY / SELL",         group = grpDC)
dcAllCat = input.bool(false, "Also on options / index futures",     group = grpDC)
dcLen    = input.int(20,    "Length", minval = 5,                   group = grpDC)
dcShow   = input.bool(true, "Draw the channel",                     group = grpDC)
dcCol    = input.color(#26c6da, "Channel colour",                   group = grpDC)
dcUpper  = ta.highest(high, dcLen)[1]
dcLower  = ta.lowest(low, dcLen)[1]
dcMid    = (dcUpper + dcLower) / 2
dcUse    = dcOn and (catCom or dcAllCat)
plot(dcUse and dcShow ? dcUpper : na, "DC Upper", color = color.new(dcCol, 20))
plot(dcUse and dcShow ? dcLower : na, "DC Lower", color = color.new(dcCol, 20))
dcBuy  = dcUse and sigOK and blkL and rsiL and timeframe.in_seconds() >= 300 and close > dcUpper and close[1] <= dcUpper[1] and close > open
dcSell = dcUse and sigOK and blkS and rsiS and timeframe.in_seconds() >= 300 and close < dcLower and close[1] >= dcLower[1] and close < open
if showLbl and dcBuy
    label.new(bar_index, low - atr14 * lblGap,  "BUY",  style = label.style_label_up,   color = color.new(#00c853, 0), textcolor = color.black, size = size.small, tooltip = "BUY Donchian")
if showLbl and dcSell
    label.new(bar_index, high + atr14 * lblGap, "SELL", style = label.style_label_down, color = color.new(#ff1744, 0), textcolor = color.white, size = size.small, tooltip = "SELL Donchian")
if showTS and dcBuy
    sp = math.min(dcMid, close - atr14 * minStopAtr)
    newTrade(true, sp, close + (close - sp) * tgtR)
if showTS and dcSell
    sp = math.max(dcMid, close + atr14 * minStopAtr)
    newTrade(false, sp, close - (sp - close) * tgtR)
alertcondition(dcBuy,  "DC BUY",  "SMA Signals: Donchian BUY {{ticker}} @ {{close}}")
alertcondition(dcSell, "DC SELL", "SMA Signals: Donchian SELL {{ticker}} @ {{close}}")
`;
writeFileSync(p, s);
console.log('replacements', n);
