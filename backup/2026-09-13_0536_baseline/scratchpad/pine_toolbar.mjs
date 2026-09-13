import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const list = async () => (await (await fetch('http://localhost:9222/json/list')).json()).filter(t => t.type === 'page');
const tab = (await list()).find(t => /tradingview\.com\/pine\//.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: tab.id });
await c.Runtime.enable();
const ev = async (expr) => { const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
console.log(JSON.stringify(await ev(`Array.from(document.querySelectorAll('button,[role=button]')).filter(b=>b.offsetParent!==null).map(b=>({t:(b.textContent||'').trim().slice(0,40),a:b.getAttribute('aria-label'),d:b.getAttribute('data-name'),cls:(b.className||'').toString().slice(0,50)}))`), null, 1));
await c.close();
