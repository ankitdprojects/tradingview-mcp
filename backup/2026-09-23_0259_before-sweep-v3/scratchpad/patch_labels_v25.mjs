import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (re, to) => { const before = s; s = s.replace(re, to); if (s !== before) n++; else console.log('MISSING', String(re).slice(0, 80)); };

// 1) repair the SMA-cross labels that got a real newline inside the string
rep(/"BUY\nSMA"/, '"BUY\\nSMA"');
rep(/"SELL\nSMA"/, '"SELL\\nSMA"');

// 2) remove the bare triangle labels for sweep / supertrend / EMA (text labels replace them)
rep(/^if sweepLo\n    label\.new\(bar_index, low, "", style = label\.style_triangleup[^\n]*\n/m, '');
rep(/^if sweepHi\n    label\.new\(bar_index, high, "", style = label\.style_triangledown[^\n]*\n/m, '');
rep(/^if stFlipUp\n    label\.new\(bar_index, low, "", style = label\.style_triangleup[^\n]*\n/m, '');
rep(/^if stFlipDn\n    label\.new\(bar_index, high, "", style = label\.style_triangledown[^\n]*\n/m, '');
rep(/^if emBuy\n    label\.new\(bar_index, low, "", style = label\.style_triangleup[^\n]*\n/m, '');
rep(/^if emSell\n    label\.new\(bar_index, high, "", style = label\.style_triangledown[^\n]*\n/m, '');

// 3) solid, offset BUY / SELL labels for sweep, ST, EMA (file holds literal backslash-n)
const solidUp   = (tag) => `    label.new(bar_index, low - atr14 * lblGap,  "BUY\\n${tag}",  style = label.style_label_up,   color = color.new(#00c853, 0), textcolor = color.black, size = size.small)`;
const solidDown = (tag) => `    label.new(bar_index, high + atr14 * lblGap, "SELL\\n${tag}", style = label.style_label_down, color = color.new(#ff1744, 0), textcolor = color.white, size = size.small)`;
for (const tag of ['sweep', 'ST', 'EMA']) {
  rep(new RegExp(`^    label\\.new\\(bar_index, low,  "BUY\\\\n${tag}",[^\\n]*$`, 'm'), solidUp(tag));
  rep(new RegExp(`^    label\\.new\\(bar_index, high, "SELL\\\\n${tag}",[^\\n]*$`, 'm'), solidDown(tag));
}
writeFileSync(p, s);
console.log('replacements', n);
