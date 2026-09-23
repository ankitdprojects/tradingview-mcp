import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
s += String.raw`

// ── 5-minute wick rejection on the 1-minute chart (v32) ──────────────────
// The wick-rejection rule evaluated on 5-minute candles (same thresholds as the 1-minute block),
// marked on the 1-minute chart on the bar where the 5-minute candle closes. Not drawn on 5m or above.
// Target = the 5-minute 20 SMA, stop = the 5-minute wick tip (floored 0.5 ATR).
grpW5    = "5-minute wick rejection on 1-minute"
w5On     = input.bool(true, "Show 5-minute wick rejection on the 1-minute chart", group = grpW5)
w5BuyC   = input.color(#00bfa5, "5min wick BUY colour",  group = grpW5)
w5SellC  = input.color(#d50000, "5min wick SELL colour", group = grpW5)

w5Sig() =>
    _atr   = ta.atr(14)
    _mean  = ta.sma(close, wkLen)
    _body  = math.abs(close - open)
    _rng   = high - low
    _lower = math.min(open, close) - low
    _upper = high - math.max(open, close)
    _b = _rng > 0 and _lower >= _body * wkRatio and _lower >= _rng * wkPct and low  <= _mean - _atr * wkAtr and close < _mean
    _s = _rng > 0 and _upper >= _body * wkRatio and _upper >= _rng * wkPct and high >= _mean + _atr * wkAtr and close > _mean
    [_b, _s, _mean, low, high, close, _atr]
[w5B, w5S, w5Mean, w5Low, w5High, w5Px, w5Atr] = request.security(syminfo.tickerid, "5", w5Sig(), lookahead = barmerge.lookahead_off)
w5Fresh = w5On and is1m and ta.change(time("5")) != 0
w5Buy   = w5Fresh and w5B and blkL and rsiL
w5Sell  = w5Fresh and w5S and blkS and rsiS
if w5Buy
    label.new(bar_index, low - atr14 * lblGap,  "5min BUY\nwick",  style = label.style_label_up,   color = color.new(w5BuyC, 0),  textcolor = color.black, size = size.normal)
    if showTS
        newTrade(true,  math.min(w5Low,  w5Px - w5Atr * minStopAtr), w5Mean)
if w5Sell
    label.new(bar_index, high + atr14 * lblGap, "5min SELL\nwick", style = label.style_label_down, color = color.new(w5SellC, 0), textcolor = color.white, size = size.normal)
    if showTS
        newTrade(false, math.max(w5High, w5Px + w5Atr * minStopAtr), w5Mean)
alertcondition(w5Buy,  "5MIN WICK BUY",  "SMA Signals: 5-minute wick rejection BUY {{ticker}} @ {{close}}")
alertcondition(w5Sell, "5MIN WICK SELL", "SMA Signals: 5-minute wick rejection SELL {{ticker}} @ {{close}}")
`;
writeFileSync(p, s);
console.log('appended');
