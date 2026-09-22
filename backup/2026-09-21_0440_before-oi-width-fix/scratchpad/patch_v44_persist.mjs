import { readFileSync, writeFileSync } from 'fs';
const p = 'D:/Projects/Tradingview/tradingview-mcp/scripts/sma_signals.pine';
let s = readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log('MISSING', a.slice(0, 70)); return; } s = s.replace(a, b); n++; };

// liquidity: a swept level stays on the chart — the line stops extending at the sweep bar and the tag reads "swept"
rep(`        if high > line.get_y1(array.get(liqHl, i)) and bar_index > line.get_x1(array.get(liqHl, i)) + smcPiv
            line.delete(array.remove(liqHl, i)), label.delete(array.remove(liqHb, i))`,
`        if high > line.get_y1(array.get(liqHl, i)) and bar_index > line.get_x1(array.get(liqHl, i)) + smcPiv
            ln = array.remove(liqHl, i), lb = array.remove(liqHb, i)
            line.set_extend(ln, extend.none), line.set_x2(ln, bar_index), line.set_color(ln, color.new(smcBear, 65))
            label.set_text(lb, "swept ▲ " + str.tostring(line.get_y1(ln), format.mintick)), label.set_x(lb, bar_index), label.set_textcolor(lb, color.new(smcBear, 40))`);
rep(`        if low < line.get_y1(array.get(liqLl, i)) and bar_index > line.get_x1(array.get(liqLl, i)) + smcPiv
            line.delete(array.remove(liqLl, i)), label.delete(array.remove(liqLb, i))`,
`        if low < line.get_y1(array.get(liqLl, i)) and bar_index > line.get_x1(array.get(liqLl, i)) + smcPiv
            ln = array.remove(liqLl, i), lb = array.remove(liqLb, i)
            line.set_extend(ln, extend.none), line.set_x2(ln, bar_index), line.set_color(ln, color.new(smcBull, 65))
            label.set_text(lb, "swept ▼ " + str.tostring(line.get_y1(ln), format.mintick)), label.set_x(lb, bar_index), label.set_textcolor(lb, color.new(smcBull, 40))`);
rep(`// where resting stops sit. Drawn as dotted lines that extend right and disappear the bar they are swept.`,
    `// where resting stops sit. Drawn as dotted lines that extend right; once swept the line stays, stops at the sweep bar and is tagged "swept".`);
// order blocks: a filled block fades instead of disappearing
rep(`        if gone
            box.delete(array.remove(obs, i)), array.remove(obsBull, i)`,
`        if gone
            bx = array.remove(obs, i), array.remove(obsBull, i)
            box.set_extend(bx, extend.none), box.set_right(bx, bar_index), box.set_bgcolor(bx, color.new(bull ? smcBull : smcBear, 96)), box.set_border_color(bx, color.new(bull ? smcBull : smcBear, 85))`);
// more trade history kept on screen
rep(`maxLive    = input.int(2, "Max live trades shown", minval=1, maxval=20, group="Targets")`, `maxLive    = input.int(6, "Max trades kept on screen", minval=1, maxval=20, group="Targets")`);
writeFileSync(p, s);
console.log('replacements', n);
