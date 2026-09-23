import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
s += String.raw`

// ── 5-minute keep-list set on the 1-minute chart (v35) ───────────────────
// What the 5-minute chart shows (sweep, Supertrend flip with ADX, 50 EMA touch, RSI divergence)
// computed on 5-minute bars and marked on the 1-minute chart as "5min BUY sweep", "5min BUY EMA",
// "5min BUY ST", "5min BUY RSI div" (and SELL) when the 5-minute candle closes. 1-minute chart only.
grpK5    = "5-minute set on the 1-minute chart"
k5On     = input.bool(true, "Show 5-minute sweep / ST / EMA / RSI-div on the 1-minute chart", group = grpK5)
k5BuyC   = input.color(#69f0ae, "5min set BUY colour",  group = grpK5)
k5SellC  = input.color(#ff8a80, "5min set SELL colour", group = grpK5)

k5Sig() =>
    _atr = ta.atr(14)
    _slow = ta.sma(close, slowLen)
    _gL = not trendAll or na(_slow) or close > _slow
    _gS = not trendAll or na(_slow) or close < _slow
    // sweep
    _ph = ta.pivothigh(high, smcPiv, smcPiv), _pl = ta.pivotlow(low, smcPiv, smcPiv)
    var float _sH = na, var int _sHb = na, var float _sL = na, var int _sLb = na
    if not na(_ph)
        _sH := _ph, _sHb := bar_index - smcPiv
    if not na(_pl)
        _sL := _pl, _sLb := bar_index - smcPiv
    _swB = not na(_sL) and bar_index > _sLb + smcPiv and low < _sL and close > _sL and close > open
    _swS = not na(_sH) and bar_index > _sHb + smcPiv and high > _sH and close < _sH and close < open
    // Supertrend flip with ADX
    [_stL, _stD] = ta.supertrend(stMult, stLen)
    [_dp, _dm, _adx] = ta.dmi(adxLen, adxLen)
    _stB = _stD < 0 and _stD[1] >= 0 and (stAdxMin == 0 or _adx >= stAdxMin)
    _stS = _stD > 0 and _stD[1] <= 0 and (stAdxMin == 0 or _adx >= stAdxMin)
    // EMA touch
    _e = ta.ema(close, emLen)
    _emB0 = _e > _e[emSlope] and low  <= _e + _atr * emTol and close > _e and close > open and close[1] > _e[1]
    _emS0 = _e < _e[emSlope] and high >= _e - _atr * emTol and close < _e and close < open and close[1] < _e[1]
    _emB = _emB0 and not _emB0[1], _emS = _emS0 and not _emS0[1]
    // RSI divergence (confirmed at the pivot)
    _rsi = ta.rsi(close, rsiLen)
    _rPl = ta.pivotlow(low, rsiDivPv, rsiDivPv), _rPh = ta.pivothigh(high, rsiDivPv, rsiDivPv)
    var float _dLo = na, var float _dLoR = na, var float _dHi = na, var float _dHiR = na
    _dvB = false, _dvS = false
    if not na(_rPl)
        _r = _rsi[rsiDivPv]
        _dvB := not na(_dLo) and _rPl < _dLo and _r > _dLoR and _r < 50
        _dLo := _rPl, _dLoR := _r
    if not na(_rPh)
        _r = _rsi[rsiDivPv]
        _dvS := not na(_dHi) and _rPh > _dHi and _r < _dHiR and _r > 50
        _dHi := _rPh, _dHiR := _r
    _b = _gL and (_swB or _stB or _emB or _dvB)
    _s = _gS and (_swS or _stS or _emS or _dvS)
    _tb = _swB ? "sweep" : _stB ? "ST" : _emB ? "EMA" : "RSI div"
    _ts = _swS ? "sweep" : _stS ? "ST" : _emS ? "EMA" : "RSI div"
    _stopB = math.min(_swB ? low : _stB ? _stL : _emB ? low : low[rsiDivPv], close - _atr * minStopAtr)
    _stopS = math.max(_swS ? high : _stS ? _stL : _emS ? high : high[rsiDivPv], close + _atr * minStopAtr)
    [_b, _s, _tb, _ts, _stopB, _stopS, close]
[k5B, k5S, k5Tb, k5Ts, k5StopB, k5StopS, k5Px] = request.security(syminfo.tickerid, "5", k5Sig(), lookahead = barmerge.lookahead_off)
k5Fresh = k5On and is1m and barstate.isconfirmed and ta.change(time("5")) != 0
k5Buy   = k5Fresh and k5B and blkL and rsiL
k5Sell  = k5Fresh and k5S and blkS and rsiS
if k5Buy
    label.new(bar_index, low - atr14 * lblGap,  "5min BUY\n" + k5Tb,  style = label.style_label_up,   color = color.new(k5BuyC, 0),  textcolor = color.black, size = size.normal)
    if showTS
        newTrade(true, k5StopB, k5Px + (k5Px - k5StopB) * tgtR)
if k5Sell
    label.new(bar_index, high + atr14 * lblGap, "5min SELL\n" + k5Ts, style = label.style_label_down, color = color.new(k5SellC, 0), textcolor = color.black, size = size.normal)
    if showTS
        newTrade(false, k5StopS, k5Px - (k5StopS - k5Px) * tgtR)
alertcondition(k5Buy,  "5MIN SET BUY",  "SMA Signals: 5-minute set BUY {{ticker}} @ {{close}}")
alertcondition(k5Sell, "5MIN SET SELL", "SMA Signals: 5-minute set SELL {{ticker}} @ {{close}}")
`;
writeFileSync(p, s);
console.log('appended');
