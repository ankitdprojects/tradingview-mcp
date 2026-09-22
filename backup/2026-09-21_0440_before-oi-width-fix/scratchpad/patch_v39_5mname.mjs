import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const lines = s.split('\n');
for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  if (!/label\.new\(bar_index/.test(L)) continue;
  let out = L;
  // 5-minute 9/21 cross
  if (/tooltip = "5min BUY"\)/.test(L))  out = L.replace(/"5min BUY", style/, '"5min BUY\\nSMA", style');
  if (/tooltip = "5min SELL"\)/.test(L)) out = L.replace(/"5min SELL", style/, '"5min SELL\\nSMA", style');
  // 5-minute wick
  if (/tooltip = "5min BUY\\nwick"\)/.test(L))  out = L.replace(/"5min BUY", style/, '"5min BUY\\nwick", style');
  if (/tooltip = "5min SELL\\nwick"\)/.test(L)) out = L.replace(/"5min SELL", style/, '"5min SELL\\nwick", style');
  // 5-minute keep-list set (family in k5Tb / k5Ts)
  if (/tooltip = "5min BUY\\n" \+ k5Tb\)/.test(L))  out = L.replace(/"5min BUY", style/, '"5min BUY\\n" + k5Tb, style');
  if (/tooltip = "5min SELL\\n" \+ k5Ts\)/.test(L)) out = L.replace(/"5min SELL", style/, '"5min SELL\\n" + k5Ts, style');
  if (out !== L) { lines[i] = out; n++; }
}
writeFileSync(p, lines.join('\n'));
console.log('5-minute labels renamed', n);
