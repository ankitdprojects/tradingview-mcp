import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = s.replace(a, b); n++; };

// defaults off
rep(`emSigOn  = input.bool(true, "BUY / SELL on touch and go",     group = grpEM)`, `emSigOn  = input.bool(false, "BUY / SELL on touch and go",    group = grpEM)`);
rep(`rsiDivOn = input.bool(true, "RSI divergence BUY / SELL",            group = grpRSI)`, `rsiDivOn = input.bool(false, "RSI divergence BUY / SELL",           group = grpRSI)`);
// generic higher-timeframe function: EMA touch obeys the switch
rep(`    _emB = _emB0 and not _emB0[1], _emS = _emS0 and not _emS0[1]
    // first family that fires decides the tag and the stop`,
`    _emB = emSigOn and _emB0 and not _emB0[1], _emS = emSigOn and _emS0 and not _emS0[1]
    // first family that fires decides the tag and the stop`);
// 15-minute set: EMA touch obeys the switch
rep(`    _emB = _emB0 and not _emB0[1], _emS = _emS0 and not _emS0[1]
    // wick rejection`,
`    _emB = emSigOn and _emB0 and not _emB0[1], _emS = emSigOn and _emS0 and not _emS0[1]
    // wick rejection`);
// 5-minute keep-list set: EMA touch and RSI divergence obey the switches
rep(`    _emB = _emB0 and not _emB0[1], _emS = _emS0 and not _emS0[1]
    // RSI divergence (confirmed at the pivot)`,
`    _emB = emSigOn and _emB0 and not _emB0[1], _emS = emSigOn and _emS0 and not _emS0[1]
    // RSI divergence (confirmed at the pivot)`);
rep(`    _b = _gL and (_swB or _stB or _emB or _dvB)
    _s = _gS and (_swS or _stS or _emS or _dvS)`,
`    _b = _gL and (_swB or _stB or _emB or (rsiDivOn and _dvB))
    _s = _gS and (_swS or _stS or _emS or (rsiDivOn and _dvS))`);
writeFileSync(p, s);
console.log('replacements', n);
