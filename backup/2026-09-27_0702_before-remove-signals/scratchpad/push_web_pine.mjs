// Push a local .pine file into the standalone web Pine editor tab and click Save.
// Usage: node push_web_pine.mjs <pineIdPart e.g. USER;abc> <file.pine>
import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
import { readFileSync } from 'fs';

const [pineId, file] = process.argv.slice(2);
const src = readFileSync(file, 'utf-8');
const list = async () => (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const FIND = `(function(){var c=document.querySelector('.monaco-editor.pine-editor-monaco');if(!c)return null;var el=c,fk;for(var i=0;i<20;i++){if(!el)break;fk=Object.keys(el).find(function(k){return k.startsWith('__reactFiber$')});if(fk)break;el=el.parentElement}if(!fk)return null;var cur=el[fk];for(var d=0;d<15;d++){if(!cur)break;if(cur.memoizedProps&&cur.memoizedProps.value&&cur.memoizedProps.value.monacoEnv){var env=cur.memoizedProps.value.monacoEnv;if(env.editor&&typeof env.editor.getEditors==='function'){var eds=env.editor.getEditors();if(eds.length>0)return {editor:eds[0],env:env}}}cur=cur.return}return null})()`;

let pineTab = (await list()).find(t => /tradingview\.com\/pine\//.test(t.url));
if (!pineTab) {
  const chart = (await list()).find(t => /tradingview\.com\/chart/.test(t.url));
  if (!chart) { console.error('no chart tab'); process.exit(1); }
  const cc = await CDP({ host: 'localhost', port: 9222, target: chart.id });
  await cc.Runtime.enable();
  const url = `https://www.tradingview.com/pine/?id=${encodeURIComponent(pineId)}`;
  await cc.Runtime.evaluate({ expression: `window.open(${JSON.stringify(url)}, '_blank')` });
  await cc.close();
  for (let i = 0; i < 30 && !pineTab; i++) { await sleep(1000); pineTab = (await list()).find(t => /tradingview\.com\/pine\//.test(t.url)); }
  if (!pineTab) { console.error('pine tab did not open'); process.exit(1); }
  console.log('opened pine tab', pineTab.url);
} else console.log('reusing pine tab', pineTab.url);

const c = await CDP({ host: 'localhost', port: 9222, target: pineTab.id });
await c.Runtime.enable(); await c.Page.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
// Safety: the tab must be showing THIS script, otherwise we'd overwrite whatever is open.
const wantUrl = `https://www.tradingview.com/pine/?id=${encodeURIComponent(pineId)}`;
if (!decodeURIComponent(pineTab.url).includes(pineId)) {
  console.log('tab shows a different script; navigating to', wantUrl);
  await c.Page.navigate({ url: wantUrl });
  await sleep(5000);
}
const shownTitle = await (async () => { for (let i = 0; i < 30; i++) { const t = await ev('document.title').catch(() => ''); if (t && !/Untitled|^TradingView$/.test(t) && !/Pine Script. Editor$/.test(t) === false) return t; await sleep(1000); } return ''; })();
console.log('tab title:', shownTitle);
const nowUrl = await ev('location.href');
if (!decodeURIComponent(nowUrl).includes(pineId)) { console.error('ABORT: tab url is', nowUrl, 'not the requested script'); await c.close(); process.exit(9); }

let ready = false;
for (let i = 0; i < 60 && !ready; i++) { ready = await ev(`${FIND} !== null`); if (!ready) await sleep(1000); }
if (!ready) { console.error('monaco not ready'); process.exit(1); }

const before = await ev(`${FIND}.editor.getModel().getLineCount()`);
const title = await ev(`document.title`);
console.log('editor ready, lines before:', before, 'title:', title);

await ev(`(function(){var m=${FIND};m.editor.setValue(${JSON.stringify(src)});return true})()`);
await sleep(1500);
const after = await ev(`${FIND}.editor.getModel().getLineCount()`);
console.log('lines after setValue:', after);

// compile markers
await sleep(3000);
const markers = await ev(`(function(){var m=${FIND};var mk=m.env.editor.getModelMarkers({resource:m.editor.getModel().uri});return mk.filter(function(x){return x.severity>=8}).map(function(x){return x.startLineNumber+': '+x.message})})()`);
console.log('error markers:', markers);
if (markers.length) { console.error('NOT saving, errors present'); await c.close(); process.exit(2); }

const clicked = await ev(`(function(){var b=Array.from(document.querySelectorAll('button')).find(function(x){return /saveButton/.test(x.className)&&x.offsetParent!==null&&!/pending/.test(x.className)});if(!b)return 'no save button';b.click();return 'clicked '+b.className.slice(0,40)})()`);
console.log('save:', clicked);
await c.close();
