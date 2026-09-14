import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const lines = s.split('\n');
const re = /^(\s*)label\.new\(([^,]+),\s*([^,]+),\s*"(BUY|SELL)",\s*style\s*=\s*label\.style_label_(up|down),\s*(.*tooltip = )(.+)\)\s*$/;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(re);
  if (!m) continue;
  const [, ind, x, y, word, dir, head, tip] = m;
  // derive the timeframe-bearing text from the tooltip expression, dropping the family part after "\n"
  let text = null;
  let mm;
  if ((mm = tip.match(/^"(5min (?:BUY|SELL)|15min (?:BUY|SELL))(?:\\n[^"]*)?"/))) text = `"${mm[1]}"`;
  else if ((mm = tip.match(/^"((?:BUY|SELL) )" \+ tf \+ "m\\n"/))) text = `"${mm[1]}" + tf + "m"`;
  if (!text) continue;                       // local 1m signals stay plain BUY / SELL
  lines[i] = `${ind}label.new(${x}, ${y}, ${text}, style = label.style_label_${dir}, ${head}${tip})`;
  n++;
}
s = lines.join('\n');
writeFileSync(p, s);
console.log('timeframe restored on', n, 'labels');
