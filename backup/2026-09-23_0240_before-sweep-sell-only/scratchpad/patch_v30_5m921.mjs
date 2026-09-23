import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = s.replace(a, b); n++; };

// 1) SMA 50/200 cross signals get an on/off switch, default OFF (lines stay)
rep(`sma1mOnly = input.bool(true, "SMA 50/200 cross signals only on the 1-minute chart", group = "Display")
smaTfOK   = not sma1mOnly or is1m`,
`smaSigOn  = input.bool(false, "SMA 50/200 cross BUY / SELL signals", group = "Display")
sma1mOnly = input.bool(true, "SMA 50/200 cross signals only on the 1-minute chart", group = "Display")
smaTfOK   = smaSigOn and (not sma1mOnly or is1m)`);
// 2) wick off by default
rep(`wkOn     = input.bool(true,  "Wick rejection BUY / SELL",          group = grpWK)`,
    `wkOn     = input.bool(false, "Wick rejection BUY / SELL",          group = grpWK)`);

// 3) 5-minute SMA 9/21 cross, shown on the 1-minute chart only
s += String.raw`

// ── 5-minute SMA 9/21 cross on the 1-minute chart (v30) ─────────────────
// The 9/21 cross computed on 5-minute bars (the one timeframe where it tested positive), marked on
// the 1-minute chart on the bar where the 5-minute candle closes, as "5min BUY" / "5min SELL".
// Not drawn on 5 minutes or above. Stop = the 5-minute 21 SMA (floored 0.5 ATR), target 1.5R.
grpM5    = "5-minute SMA 9/21 on 1-minute"
m5On     = input.bool(true, "Show 5-minute 9/21 cross on the 1-minute chart", group = grpM5)
m5Fast   = input.int(9,  "Fast SMA (5m)", minval = 1,  group = grpM5)
m5Slow   = input.int(21, "Slow SMA (5m)", minval = 2,  group = grpM5)
m5Conf   = input.bool(true, "Close must be on the right side of both SMAs", group = grpM5)
m5BuyC   = input.color(#00e676, "5min BUY colour",  group = grpM5)
m5SellC  = input.color(#ff5252, "5min SELL colour", group = grpM5)

m5Sig() =>
    _f = ta.sma(close, m5Fast), _s = ta.sma(close, m5Slow)
    _b = ta.crossover(_f, _s)  and (not m5Conf or (close > _f and close > _s))
    _x = ta.crossunder(_f, _s) and (not m5Conf or (close < _f and close < _s))
    [_b, _x, _s, close]
[m5B, m5S, m5SlowV, m5Px] = request.security(syminfo.tickerid, "5", m5Sig(), lookahead = barmerge.lookahead_off)
m5Fresh = m5On and is1m and ta.change(time("5")) != 0
m5Buy   = m5Fresh and m5B and blkL and rsiL
m5Sell  = m5Fresh and m5S and blkS and rsiS
if m5Buy
    label.new(bar_index, low - atr14 * lblGap,  "5min BUY",  style = label.style_label_up,   color = color.new(m5BuyC, 0),  textcolor = color.black, size = size.normal)
    if showTS
        sp = math.min(m5SlowV, m5Px - atr14 * minStopAtr)
        newTrade(true, sp, m5Px + (m5Px - sp) * tgtR)
if m5Sell
    label.new(bar_index, high + atr14 * lblGap, "5min SELL", style = label.style_label_down, color = color.new(m5SellC, 0), textcolor = color.white, size = size.normal)
    if showTS
        sp = math.max(m5SlowV, m5Px + atr14 * minStopAtr)
        newTrade(false, sp, m5Px - (sp - m5Px) * tgtR)
alertcondition(m5Buy,  "5MIN BUY",  "SMA Signals: 5-minute 9/21 BUY {{ticker}} @ {{close}}")
alertcondition(m5Sell, "5MIN SELL", "SMA Signals: 5-minute 9/21 SELL {{ticker}} @ {{close}}")
`;
writeFileSync(p, s);
console.log('replacements', n);
