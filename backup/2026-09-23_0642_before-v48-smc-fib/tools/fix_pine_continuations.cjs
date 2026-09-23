// Fix Pine continuation lines that sit at a multiple of 4 spaces.
// Pine treats 4-space indentation as a new block, so a continuation there
// is a syntax error. Only continuations OUTSIDE brackets are affected —
// inside ( ) or [ ] any indentation is legal.
const fs = require('fs');
const f = process.argv[2];
const lines = fs.readFileSync(f, 'utf8').split('\n');

// Replace string literals with a single placeholder token and drop comments,
// so brackets and operators inside them do not confuse the depth count.
//
// The placeholder must be a NON-operator character, not a space: blanking
// `: "— WAIT"` to `: ` makes a completed ternary look like a dangling `:`,
// which is exactly the false positive that broke stateBg.
function strip(l) {
  let out = '', inStr = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (c === '"') { if (!inStr) out += 'S'; inStr = !inStr; continue; }
    if (!inStr && c === '/' && l[i + 1] === '/') break;
    if (!inStr) out += c;
  }
  return out;
}

const danglingRe = /(\+|-|\*|\/|%|\?|:|,|\band\b|\bor\b|\bnot\b)\s*$/;
let depth = 0;
const fixed = [];

for (let i = 0; i < lines.length; i++) {
  const depthBefore = depth;
  const code = strip(lines[i]);
  for (const ch of code) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
  }
  if (i === 0) continue;
  const prev = strip(lines[i - 1]).trimEnd();
  if (depthBefore === 0 && danglingRe.test(prev)) {
    const m = lines[i].match(/^( +)/);
    if (m && m[1].length % 4 === 0) { lines[i] = '  ' + lines[i]; fixed.push(i + 1); }
  }
}

fs.writeFileSync(f, lines.join('\n'));
console.log('fixed ' + fixed.length + ' continuation line(s): ' + (fixed.join(', ') || 'none'));
