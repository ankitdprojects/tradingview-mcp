import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = s.replace(a, b); n++; };

// 1) timeframe flags + early Supertrend/ADX/VWAP so the 15-minute filters can be applied to families defined earlier
rep(`othersOK  = not (oneMinOnly and is1m)      // sweep / Supertrend / EMA / RSI divergence / HTF labels`,
String.raw`othersOK  = not (oneMinOnly and is1m)      // sweep / Supertrend / EMA / RSI divergence / HTF labels
// ── Timeframe flow (v34) ─────────────────────────────────────────────────
//   1m  : SMA 50/200 cross, 1m wick, "5min" 9/21 cross + wick, "15min" set below
//   5m  : keep-list families + "15min" set labels
//   15m : ONLY the 15-minute set = EMA touch (Supertrend agreeing), Supertrend flip (ADX ≥ 20),
//         sweep (VWAP side only), sweep + wick, sweep + EMA touch — i.e. sweep, wick, EMA, Supertrend with those filters
//   30m+: keep-list families, none of the 15-minute filters, no 15m labels
is15      = timeframe.in_seconds() == 900
lt15      = timeframe.in_seconds() < 900
// early Supertrend / ADX / session VWAP (same settings as the blocks further down) for the 15-minute filters
[f15StLine, f15StDir] = ta.supertrend(3.0, 10)
[f15DiP, f15DiM, f15Adx] = ta.dmi(14, 14)
f15NewSess = ta.change(time("D")) != 0
var float f15PV = 0.0, var float f15V = 0.0
if f15NewSess
    f15PV := 0.0, f15V := 0.0
f15Vol = nz(volume) > 0 ? volume : 1.0
f15PV += hlc3 * f15Vol, f15V += f15Vol
f15Vwap = f15PV / f15V
// filters that apply ONLY on the 15-minute chart
f15SwL = not is15 or close > f15Vwap         // sweep BUY only above VWAP
f15SwS = not is15 or close < f15Vwap
f15EmL = not is15 or f15StDir < 0            // EMA touch BUY only while Supertrend is up
f15EmS = not is15 or f15StDir > 0
f15StL = not is15 or f15Adx >= 20            // Supertrend flip only with ADX ≥ 20 (default already 20)
f15StS = f15StL`);

// 2) apply the filters
rep(`sweepLo = sweepOn and gateL and not na(sL)`, `sweepLo = sweepOn and gateL and f15SwL and not na(sL)`);
rep(`sweepHi = sweepOn and gateS and not na(sH)`, `sweepHi = sweepOn and gateS and f15SwS and not na(sH)`);
rep(`stFlipUp = stOn and stSigOn and gateL and stDir < 0`, `stFlipUp = stOn and stSigOn and gateL and f15StL and stDir < 0`);
rep(`stFlipDn = stOn and stSigOn and gateS and stDir > 0`, `stFlipDn = stOn and stSigOn and gateS and f15StS and stDir > 0`);
rep(`emBuy  = emOn and emSigOn and gateL and emUp`, `emBuy  = emOn and emSigOn and gateL and f15EmL and emUp`);
rep(`emSell = emOn and emSigOn and gateS and emDn`, `emSell = emOn and emSigOn and gateS and f15EmS and emDn`);
// wick is part of the 15-minute set
rep(`wkTf     = wkOn and (is1m or wkAllTf) and sigOK and blkL and rsiL`, `wkTf     = wkOn and (is1m or is15 or wkAllTf) and sigOK and blkL and rsiL`);
rep(`wkTfS    = wkOn and (is1m or wkAllTf) and sigOK and blkS and rsiS`, `wkTfS    = wkOn and (is1m or is15 or wkAllTf) and sigOK and blkS and rsiS`);
// RSI divergence and the generic higher-timeframe labels are not part of the 15-minute chart
rep(`    divBuy := rsiDivOn and not na(dLo1) and rPl < dLo1 and rsiAt > dLoR1 and rsiAt < 50 and gateL`, `    divBuy := rsiDivOn and not is15 and not na(dLo1) and rPl < dLo1 and rsiAt > dLoR1 and rsiAt < 50 and gateL`);
rep(`    divSell := rsiDivOn and not na(dHi1) and rPh > dHi1 and rsiAt < dHiR1 and rsiAt > 50 and gateS`, `    divSell := rsiDivOn and not is15 and not na(dHi1) and rPh > dHi1 and rsiAt < dHiR1 and rsiAt > 50 and gateS`);
rep(`    fresh = on and othersOK and barstate.isconfirmed and timeframe.in_seconds() < timeframe.in_seconds(tf) and ta.change(time(tf)) != 0`,
    `    fresh = on and othersOK and not is15 and barstate.isconfirmed and timeframe.in_seconds() < timeframe.in_seconds(tf) and ta.change(time(tf)) != 0`);
// generic HTF labels now cover 30m and 60m (the 15-minute set has its own labels below)
rep(`htA      = input.timeframe("15", "Timeframe 1", group = grpHT)
htB      = input.timeframe("30", "Timeframe 2", group = grpHT)
htC      = input.timeframe("60", "Timeframe 3", group = grpHT)`,
`htA      = input.timeframe("30", "Timeframe 1", group = grpHT)
htB      = input.timeframe("60", "Timeframe 2", group = grpHT)
htC      = input.timeframe("240", "Timeframe 3", group = grpHT)`);

// 3) "15min" labels on 1m and 5m charts: the 15-minute set with its filters, computed on 15-minute bars
s += String.raw`

// ── 15-minute set on lower charts (v34) ──────────────────────────────────
// The 15-minute chart's signal set (EMA touch with Supertrend agreeing, Supertrend flip with ADX ≥ 20,
// sweep on the VWAP side, wick rejection) computed on 15-minute bars and marked on 1m / 5m charts as
// "15min BUY EMA" etc. when the 15-minute candle closes. Not drawn on 15m or above.
grpS15   = "15-minute set on lower charts"
s15On    = input.bool(true, "Show the 15-minute set on 1m / 5m charts", group = grpS15)
s15BuyC  = input.color(#ffb300, "15min BUY colour",  group = grpS15)
s15SellC = input.color(#ff6d00, "15min SELL colour", group = grpS15)

s15Sig() =>
    _atr = ta.atr(14)
    [_stL, _stD] = ta.supertrend(3.0, 10)
    [_dp, _dm, _adx] = ta.dmi(14, 14)
    _ns = ta.change(time("D")) != 0
    var float _pv = 0.0, var float _v = 0.0
    if _ns
        _pv := 0.0, _v := 0.0
    _vol = nz(volume) > 0 ? volume : 1.0
    _pv += hlc3 * _vol, _v += _vol
    _vwap = _pv / _v
    // sweep (VWAP side)
    _ph = ta.pivothigh(high, smcPiv, smcPiv), _pl = ta.pivotlow(low, smcPiv, smcPiv)
    var float _sH = na, var int _sHb = na, var float _sL = na, var int _sLb = na
    if not na(_ph)
        _sH := _ph, _sHb := bar_index - smcPiv
    if not na(_pl)
        _sL := _pl, _sLb := bar_index - smcPiv
    _swB = not na(_sL) and bar_index > _sLb + smcPiv and low < _sL and close > _sL and close > open and close > _vwap
    _swS = not na(_sH) and bar_index > _sHb + smcPiv and high > _sH and close < _sH and close < open and close < _vwap
    // Supertrend flip with ADX
    _stB = _stD < 0 and _stD[1] >= 0 and _adx >= 20
    _stS = _stD > 0 and _stD[1] <= 0 and _adx >= 20
    // EMA touch with Supertrend agreeing
    _e = ta.ema(close, emLen)
    _emB0 = _e > _e[emSlope] and low  <= _e + _atr * emTol and close > _e and close > open and close[1] > _e[1] and _stD < 0
    _emS0 = _e < _e[emSlope] and high >= _e - _atr * emTol and close < _e and close < open and close[1] < _e[1] and _stD > 0
    _emB = _emB0 and not _emB0[1], _emS = _emS0 and not _emS0[1]
    // wick rejection
    _mean = ta.sma(close, wkLen)
    _body = math.abs(close - open), _rng = high - low
    _lo = math.min(open, close) - low, _up = high - math.max(open, close)
    _wkB = _rng > 0 and _lo >= _body * wkRatio and _lo >= _rng * wkPct and low  <= _mean - _atr * wkAtr and close < _mean
    _wkS = _rng > 0 and _up >= _body * wkRatio and _up >= _rng * wkPct and high >= _mean + _atr * wkAtr and close > _mean
    _b = _swB or _stB or _emB or _wkB
    _s = _swS or _stS or _emS or _wkS
    _tb = _swB ? "sweep" : _stB ? "ST" : _emB ? "EMA" : "wick"
    _ts = _swS ? "sweep" : _stS ? "ST" : _emS ? "EMA" : "wick"
    _stopB = math.min(_swB ? low : _stB ? _stL : _emB ? low : low, close - _atr * minStopAtr)
    _stopS = math.max(_swS ? high : _stS ? _stL : _emS ? high : high, close + _atr * minStopAtr)
    _tgtB = _wkB and not (_swB or _stB or _emB) ? _mean : close + (close - _stopB) * tgtR
    _tgtS = _wkS and not (_swS or _stS or _emS) ? _mean : close - (_stopS - close) * tgtR
    [_b, _s, _tb, _ts, _stopB, _stopS, _tgtB, _tgtS]
[s15B, s15S, s15Tb, s15Ts, s15StopB, s15StopS, s15TgtB, s15TgtS] = request.security(syminfo.tickerid, "15", s15Sig(), lookahead = barmerge.lookahead_off)
s15Fresh = s15On and lt15 and barstate.isconfirmed and ta.change(time("15")) != 0
s15Buy   = s15Fresh and s15B and blkL and rsiL
s15Sell  = s15Fresh and s15S and blkS and rsiS
if s15Buy
    label.new(bar_index, low - atr14 * lblGap,  "15min BUY\n" + s15Tb,  style = label.style_label_up,   color = color.new(s15BuyC, 0),  textcolor = color.black, size = size.normal)
    if showTS
        newTrade(true, s15StopB, s15TgtB)
if s15Sell
    label.new(bar_index, high + atr14 * lblGap, "15min SELL\n" + s15Ts, style = label.style_label_down, color = color.new(s15SellC, 0), textcolor = color.black, size = size.normal)
    if showTS
        newTrade(false, s15StopS, s15TgtS)
alertcondition(s15Buy,  "15MIN BUY",  "SMA Signals: 15-minute set BUY {{ticker}} @ {{close}}")
alertcondition(s15Sell, "15MIN SELL", "SMA Signals: 15-minute set SELL {{ticker}} @ {{close}}")
`;
writeFileSync(p, s);
console.log('replacements', n);
