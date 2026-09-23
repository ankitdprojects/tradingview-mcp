import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
const lines = s.split('\n');
let local = 0, htf = 0;
for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  if (!/label\.new\(bar_index/.test(L)) continue;
  let out = L;
  // 1) chart's own timeframe: text "BUY"/"SELL" whose tooltip holds the family → put the family back in the text
  let m = L.match(/, "(BUY|SELL)", style = label\.style_label_(up|down), (.*tooltip = ("(?:BUY|SELL)\\n[^"]+"))\)\s*$/);
  if (m) { out = L.replace(`, "${m[1]}", style = label.style_label_${m[2]}, `, `, ${m[4]}, style = label.style_label_${m[2]}, `); local++; }
  // 2) other timeframes shown on a lower chart: word + timeframe only, family stays in the tooltip
  else if (/"5min (BUY|SELL)\\n/.test(L) && /, style = label\.style_label_/.test(L)) {
    out = L.replace(/"5min (BUY|SELL)\\n[^"]*"( \+ k5T[bs])?, style/, (all, w) => `"5min ${w}", style`);
    if (out !== L) htf++;
  }
  lines[i] = out;
}
writeFileSync(p, lines.join('\n'));
console.log('local labels with name', local, '| 5-minute labels stripped', htf);
