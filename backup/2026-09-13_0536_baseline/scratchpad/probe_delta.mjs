const base = 'https://api.india.delta.exchange/v2';
const get = async (p) => (await (await fetch(base + p)).json());
let j = await get('/tickers?contract_types=call_options,put_options&underlying_asset_symbols=BTC');
const t = j.result || [];
console.log('BTC option tickers:', t.length);
if (t.length) {
  console.log('fields:', Object.keys(t[0]).join(','));
  console.log(JSON.stringify(t.slice(0, 2).map(o => ({ s: o.symbol, oi: o.oi, oiUsd: o.oi_value_usd, mark: o.mark_price, strike: o.strike_price, exp: o.settlement_time }))));
}
j = await get('/tickers?contract_types=call_options,put_options');
const und = {};
for (const o of (j.result || [])) { const u = o.underlying_asset_symbol || '?'; und[u] = (und[u] || 0) + 1; }
console.log('option underlyings:', JSON.stringify(und));
j = await get('/tickers/VVVUSD');
const v = j.result || {};
console.log('VVVUSD perp:', JSON.stringify({ oi: v.oi, oiUsd: v.oi_value_usd, funding: v.funding_rate, mark: v.mark_price, vol: v.volume, type: v.contract_type }));
