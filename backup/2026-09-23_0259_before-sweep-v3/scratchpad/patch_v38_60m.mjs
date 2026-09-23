import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = s.replace(a, b); n++; };

// 1) flags
rep(`is15      = timeframe.in_seconds() == 900
lt15      = timeframe.in_seconds() < 900`,
`is15      = timeframe.in_seconds() == 900
lt15      = timeframe.in_seconds() < 900
//   60m : ONLY wick rejection + Supertrend flip (ADX ≥ 20); that set is labelled "60min BUY/SELL" on every smaller chart
is60      = timeframe.in_seconds() == 3600
lt60      = timeframe.in_seconds() < 3600`);

// 2) on the 60-minute chart suppress sweep, EMA touch, RSI divergence and the generic HTF labels; allow wick
rep(`sweepLo = sweepOn and gateL and f15SwL and not na(sL)`, `sweepLo = sweepOn and gateL and f15SwL and not is60 and not na(sL)`);
rep(`sweepHi = sweepOn and gateS and f15SwS and not na(sH)`, `sweepHi = sweepOn and gateS and f15SwS and not is60 and not na(sH)`);
rep(`emBuy  = emOn and emSigOn and gateL and f15EmL and emUp`, `emBuy  = emOn and emSigOn and gateL and f15EmL and not is60 and emUp`);
rep(`emSell = emOn and emSigOn and gateS and f15EmS and emDn`, `emSell = emOn and emSigOn and gateS and f15EmS and not is60 and emDn`);
rep(`    divBuy := rsiDivOn and not is15 and not na(dLo1)`, `    divBuy := rsiDivOn and not is15 and not is60 and not na(dLo1)`);
rep(`    divSell := rsiDivOn and not is15 and not na(dHi1)`, `    divSell := rsiDivOn and not is15 and not is60 and not na(dHi1)`);
rep(`    fresh = on and othersOK and not is15 and barstate.isconfirmed`, `    fresh = on and othersOK and not is15 and not is60 and barstate.isconfirmed`);
rep(`wkTf     = wkOn and (is1m or is15 or wkAllTf) and sigOK and blkL and rsiL`, `wkTf     = wkOn and (is1m or is15 or is60 or wkAllTf) and sigOK and blkL and rsiL`);
rep(`wkTfS    = wkOn and (is1m or is15 or wkAllTf) and sigOK and blkS and rsiS`, `wkTfS    = wkOn and (is1m or is15 or is60 or wkAllTf) and sigOK and blkS and rsiS`);
// generic HTF labels: 60 now has its own set, so the generic slots become 30m and 4h
rep(`htB      = input.timeframe("60", "Timeframe 2", group = grpHT)
htC      = input.timeframe("240", "Timeframe 3", group = grpHT)`,
`htB      = input.timeframe("240", "Timeframe 2", group = grpHT)
htC      = input.timeframe("D", "Timeframe 3", group = grpHT)`);

// 3) 60-minute set on smaller charts
s += String.raw`

// ── 60-minute set on smaller charts (v38) ────────────────────────────────
// The 60-minute chart's signal set (wick rejection + Supertrend flip with ADX ≥ 20) computed on
// 60-minute bars and marked on every smaller chart as "60min BUY" / "60min SELL" when the hour closes.
grpS60   = "60-minute set on smaller charts"
s60On    = input.bool(true, "Show the 60-minute set on smaller charts", group = grpS60)
s60BuyC  = input.color(#ffffff, "60min BUY colour",  group = grpS60)
s60SellC = input.color(#e0e0e0, "60min SELL colour", group = grpS60)

s60Sig() =>
    _atr = ta.atr(14)
    [_stL, _stD] = ta.supertrend(stMult, stLen)
    [_dp, _dm, _adx] = ta.dmi(adxLen, adxLen)
    _stB = _stD < 0 and _stD[1] >= 0 and (stAdxMin == 0 or _adx >= stAdxMin)
    _stS = _stD > 0 and _stD[1] <= 0 and (stAdxMin == 0 or _adx >= stAdxMin)
    _mean = ta.sma(close, wkLen)
    _body = math.abs(close - open), _rng = high - low
    _lo = math.min(open, close) - low, _up = high - math.max(open, close)
    _wkB = _rng > 0 and _lo >= _body * wkRatio and _lo >= _rng * wkPct and low  <= _mean - _atr * wkAtr and close < _mean
    _wkS = _rng > 0 and _up >= _body * wkRatio and _up >= _rng * wkPct and high >= _mean + _atr * wkAtr and close > _mean
    _b = _stB or _wkB
    _s = _stS or _wkS
    _tb = _stB ? "ST" : "wick"
    _ts = _stS ? "ST" : "wick"
    _stopB = math.min(_stB ? _stL : low,  close - _atr * minStopAtr)
    _stopS = math.max(_stS ? _stL : high, close + _atr * minStopAtr)
    _tgtB = _stB ? close + (close - _stopB) * tgtR : _mean
    _tgtS = _stS ? close - (_stopS - close) * tgtR : _mean
    [_b, _s, _tb, _ts, _stopB, _stopS, _tgtB, _tgtS]
[s60B, s60S, s60Tb, s60Ts, s60StopB, s60StopS, s60TgtB, s60TgtS] = request.security(syminfo.tickerid, "60", s60Sig(), lookahead = barmerge.lookahead_off)
s60Fresh = s60On and lt60 and barstate.isconfirmed and ta.change(time("60")) != 0
s60Buy   = s60Fresh and s60B and blkL and rsiL
s60Sell  = s60Fresh and s60S and blkS and rsiS
if s60Buy
    label.new(bar_index, low - atr14 * lblGap,  "60min BUY",  style = label.style_label_up,   color = color.new(s60BuyC, 0),  textcolor = color.black, size = size.normal, tooltip = "60min BUY " + s60Tb)
    if showTS
        newTrade(true, s60StopB, s60TgtB)
if s60Sell
    label.new(bar_index, high + atr14 * lblGap, "60min SELL", style = label.style_label_down, color = color.new(s60SellC, 0), textcolor = color.black, size = size.normal, tooltip = "60min SELL " + s60Ts)
    if showTS
        newTrade(false, s60StopS, s60TgtS)
alertcondition(s60Buy,  "60MIN BUY",  "SMA Signals: 60-minute set BUY {{ticker}} @ {{close}}")
alertcondition(s60Sell, "60MIN SELL", "SMA Signals: 60-minute set SELL {{ticker}} @ {{close}}")
`;
writeFileSync(p, s);
console.log('replacements', n);
