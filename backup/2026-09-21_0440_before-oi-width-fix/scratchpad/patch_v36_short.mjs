import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const lines = s.split('\n');
// label.new(<x>, <y>, <textExpr>, style = label.style_label_(up|down), ...rest)
const re = /^(\s*)label\.new\((bar_index[^,]*|bar_index - rsiDivPv),\s*([^,]+),\s*(.+?),\s*style\s*=\s*label\.style_label_(up|down),\s*(.*)\)\s*$/;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(re);
  if (!m) continue;
  const [, ind, x, y, textExpr, dir, rest] = m;
  // skip S/R level tags, Fib channel ratio tags, liquidity tags (label_left) — regex only matches label_up/down, fine.
  if (!/BUY|SELL/.test(textExpr)) continue;
  const word = dir === 'up' ? '"BUY"' : '"SELL"';
  let tail = rest;
  if (!/tooltip\s*=/.test(tail)) tail = tail + ', tooltip = ' + textExpr;
  else tail = tail.replace(/tooltip\s*=\s*/, 'tooltip = ' + textExpr + ' + "  " + ');
  lines[i] = `${ind}label.new(${x}, ${y}, ${word}, style = label.style_label_${dir}, ${tail})`;
  n++;
}
s = lines.join('\n');
writeFileSync(p, s);
console.log('labels shortened', n);
