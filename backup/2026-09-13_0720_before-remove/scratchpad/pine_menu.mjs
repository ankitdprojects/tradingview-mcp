import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const list = async () => (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const tab = (await list()).find(t => /tradingview\.com\/pine\//.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: tab.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
await ev(`document.querySelector('[class*=nameButton]').click()`);
await sleep(800);
console.log(JSON.stringify(await ev(`Array.from(document.querySelectorAll('[role=menuitem],[role=menu] *,[class*=menu] [class*=item]')).filter(e=>e.offsetParent!==null&&e.textContent.trim()).map(e=>({t:e.textContent.trim().slice(0,50),role:e.getAttribute('role'),cls:(e.className||'').toString().slice(0,40)})).filter((v,i,a)=>a.findIndex(x=>x.t===v.t)===i)`), null, 1));
// close menu
await c.Input.dispatchKeyEvent({ type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await c.Input.dispatchKeyEvent({ type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await c.close();
