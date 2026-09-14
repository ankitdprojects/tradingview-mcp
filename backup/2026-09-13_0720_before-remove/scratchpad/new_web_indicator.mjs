// Create a NEW saved script in the web Pine editor tab via the name menu -> Create new.
// Usage: node new_web_pine.mjs "<Script Name>" <file.pine>
import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
import { readFileSync } from 'fs';
const [name, file] = process.argv.slice(2);
const src = readFileSync(file, 'utf-8');
const list = async () => (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const FIND = `(function(){var c=document.querySelector('.monaco-editor.pine-editor-monaco');if(!c)return null;var el=c,fk;for(var i=0;i<20;i++){if(!el)break;fk=Object.keys(el).find(function(k){return k.startsWith('__reactFiber$')});if(fk)break;el=el.parentElement}if(!fk)return null;var cur=el[fk];for(var d=0;d<15;d++){if(!cur)break;if(cur.memoizedProps&&cur.memoizedProps.value&&cur.memoizedProps.value.monacoEnv){var env=cur.memoizedProps.value.monacoEnv;if(env.editor&&typeof env.editor.getEditors==='function'){var eds=env.editor.getEditors();if(eds.length>0)return {editor:eds[0],env:env}}}cur=cur.return}return null})()`;
const menuItem = (re) => `(function(){var leaves=Array.from(document.querySelectorAll('span,div')).filter(function(e){return e.children.length===0&&e.offsetParent!==null&&${re}.test(e.textContent.trim())});if(!leaves.length)return 'none';var el=leaves[0];for(var i=0;i<6&&el&&!/background-|item|button/i.test(el.className||'');i++)el=el.parentElement;(el||leaves[0]).click();return 'clicked '+leaves[0].textContent.trim().slice(0,30)})()`;

const tab = (await list()).find(t => /tradingview\.com\/pine\//.test(t.url));
if (!tab) { console.error('no pine tab open'); process.exit(1); }
const c = await CDP({ host: 'localhost', port: 9222, target: tab.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };

const titleBefore = await ev('document.title');
console.log('title before:', titleBefore);
let opened = false;
for (let attempt = 0; attempt < 3 && !opened; attempt++) {
  await ev(`document.querySelector('[class*=nameButton]').click()`);
  await sleep(1200);
  opened = await ev(`Array.from(document.querySelectorAll('span,div')).some(e=>e.children.length===0&&e.offsetParent!==null&&/^Create new/.test(e.textContent.trim()))`);
  console.log('menu open attempt', attempt, opened);
}
if (!opened) { console.error('could not open name menu'); await c.close(); process.exit(5); }
const rect = await ev(`(function(){var e=Array.from(document.querySelectorAll('span,div')).find(function(e){return e.children.length===0&&e.offsetParent!==null&&/^Create new/.test(e.textContent.trim())});var r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
console.log('create new rect:', rect);
await c.Input.dispatchMouseEvent({ type: 'mouseMoved', x: rect.x, y: rect.y });
await sleep(1200);
let subOpen = await ev(`Array.from(document.querySelectorAll('span,div')).some(e=>e.children.length===0&&e.offsetParent!==null&&/^(Strategy|Indicator)$/i.test(e.textContent.trim()))`);
if (!subOpen) { await c.Input.dispatchMouseEvent({ type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 }); await c.Input.dispatchMouseEvent({ type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 }); await sleep(1200); }
const sub = await ev(`Array.from(document.querySelectorAll('span,div')).filter(e=>e.children.length===0&&e.offsetParent!==null&&e.textContent.trim().length>0&&e.textContent.trim().length<40).map(e=>e.textContent.trim()).filter((v,i,a)=>a.indexOf(v)===i).slice(0,60)`);
console.log('visible leaf texts:', JSON.stringify(sub));
console.log('indicator:', await ev(menuItem('/^indicator$/i')));
let changed = false;
for (let i = 0; i < 20 && !changed; i++) { await sleep(1000); const t = await ev('document.title'); if (t !== titleBefore) { changed = true; console.log('title now:', t); } }
if (!changed) { console.error('editor did not switch to a new script; aborting before touching anything'); await c.close(); process.exit(3); }
const cur = await ev(`${FIND}.editor.getValue().slice(0,120)`);
console.log('new script starts with:', JSON.stringify(cur));
if (/Screener|Swing Pullback|OI Profile/.test(cur)) { console.error('unexpected existing script content; aborting'); await c.close(); process.exit(4); }

await ev(`(function(){var m=${FIND};m.editor.setValue(${JSON.stringify(src)});return true})()`);
await sleep(4000);
const markers = await ev(`(function(){var m=${FIND};var mk=m.env.editor.getModelMarkers({resource:m.editor.getModel().uri});return mk.filter(function(x){return x.severity>=8}).map(function(x){return x.startLineNumber+': '+x.message})})()`);
console.log('error markers:', markers);
if (markers.length) { await c.close(); process.exit(2); }

console.log('save click:', await ev(`(function(){var b=Array.from(document.querySelectorAll('button')).find(function(x){return /saveButton/.test(x.className)&&x.offsetParent!==null&&!/pending/.test(x.className)});if(!b)return 'no save button';b.click();return 'clicked'})()`));
await sleep(1500);
const inputs = await ev(`Array.from(document.querySelectorAll('input')).filter(i=>i.offsetParent!==null).map(i=>({ph:i.placeholder,v:i.value,t:i.type}))`);
console.log('visible inputs:', JSON.stringify(inputs));
const named = await ev(`(function(){var inp=Array.from(document.querySelectorAll('input')).find(function(i){return i.offsetParent!==null&&i.type!=='checkbox'});if(!inp)return 'no name input';var setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(inp,${JSON.stringify(name)});inp.dispatchEvent(new Event('input',{bubbles:true}));return 'named'})()`);
console.log('name:', named);
await sleep(500);
const btns = await ev(`Array.from(document.querySelectorAll('button')).filter(b=>b.offsetParent!==null&&/actionButton|submit/i.test(b.className+' '+b.type)).map(b=>b.textContent.trim())`);
console.log('action buttons:', JSON.stringify(btns));
console.log('save btn:', await ev(`(function(){var btn=Array.from(document.querySelectorAll('button')).find(function(b){return b.offsetParent!==null&&/^save$/i.test(b.textContent.trim())&&!/saveButton/.test(b.className)});if(!btn)return 'none';btn.click();return 'clicked'})()`));
for (let i = 0; i < 20; i++) { await sleep(1500); const t = await ev('document.title'); if (t.includes(name)) { console.log('title now:', t); break; } }
console.log('url:', await ev('location.href'));
await c.close();
