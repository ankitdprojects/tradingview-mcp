import CDP from 'file:///D:/Projects/Tradingview/tradingview-mcp/node_modules/chrome-remote-interface/index.js';
const t = (await (await fetch('http://localhost:9222/json/list')).json()).find(t => /tradingview\.com\/chart/.test(t.url));
const c = await CDP({ host: 'localhost', port: 9222, target: t.id }); await c.Runtime.enable();
const r = await c.Runtime.evaluate({ expression: `TradingViewApi.saveChartToServer ? TradingViewApi.saveChartToServer() : TradingViewApi._chartWidgetCollection.saveChartToServer(); 'saved'`, returnByValue: true });
console.log(r.result?.value || r.exceptionDetails?.text); await new Promise(r=>setTimeout(r,1500)); await c.close();
