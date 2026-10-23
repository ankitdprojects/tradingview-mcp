#!/usr/bin/env node
// Create a NEW saved Pine script in the TradingView account (no editor UI needed) and
// optionally put it on the active chart.
//   node scripts/pine_create.mjs "<Script Name>" <file.pine> [--add]
// Uses the same endpoint the Pine editor's "Save" uses, called from the logged-in chart page
// so the session cookies apply. Refuses to run if a saved script with that name already exists
// (update those through the web editor push instead).
import { evaluateAsync, evaluate } from '../src/connection.js';
import { readFileSync } from 'fs';

const [name, file, ...rest] = process.argv.slice(2);
if (!name || !file) { console.error('usage: pine_create.mjs "<name>" <file.pine> [--add]'); process.exit(1); }
const src = readFileSync(file, 'utf-8');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const existing = await evaluateAsync(`fetch('https://pine-facade.tradingview.com/pine-facade/list/?filter=saved',{credentials:'include'}).then(r=>r.json()).then(l=>l.map(s=>({id:s.scriptIdPart,name:s.scriptName,version:s.version})))`);
const clash = (existing || []).find(s => s.name.toLowerCase() === name.toLowerCase());
let pineId, version;
if (clash) {
  if (!rest.includes('--add')) { console.error(`a saved script named "${name}" already exists (${clash.id} v${clash.version}) — not overwriting`); process.exit(2); }
  console.log(`"${name}" already saved (${clash.id} v${clash.version}) — only adding it to the chart`);
  pineId = clash.id; version = String(clash.version);
} else {
  // The response carries the whole compiled script (large), so pick the few fields in-page.
  const res = await evaluateAsync(`(function(){var fd=new FormData();fd.append('source',${JSON.stringify(src)});return fetch('https://pine-facade.tradingview.com/pine-facade/save/new/?name='+encodeURIComponent(${JSON.stringify(name)})+'&allow_overwrite=false',{method:'POST',credentials:'include',body:fd}).then(function(r){return r.text().then(function(t){var j=null;try{j=JSON.parse(t)}catch(e){}var m=j&&j.result&&j.result.metaInfo;return {status:r.status,success:!!(j&&j.success),id:m&&m.scriptIdPart,version:m&&m.pine&&m.pine.version,err:j&&j.success?null:t.slice(0,600)}})})})()`);
  console.log('save status', res.status);
  if (res.status !== 200 || !res.success || !res.id) { console.error('save failed:', res.err); process.exit(3); }
  pineId = res.id; version = String(res.version || '1.0');
  console.log('created', pineId, 'v' + version);
}

if (rest.includes('--add')) {
  const CH = `TradingViewApi.activeChart()`;
  const before = await evaluate(`${CH}.getAllStudies().map(function(s){return s.id})`);
  await evaluate(`TradingViewApi._studyMarket._insertStudyService.insertStudy({descriptor:{type:'pine', pineId:${JSON.stringify(pineId)}, pineVersion:${JSON.stringify(version)}}, insertionInfo:{stubTitle:${JSON.stringify(name)}}, parentIds:[]}); true`);
  let added = null;
  for (let i = 0; i < 25 && !added; i++) { await sleep(1000); added = (await evaluate(`${CH}.getAllStudies().map(function(s){return {id:s.id,name:s.name}})`)).find(s => !before.includes(s.id)); }
  if (!added) { console.error('script saved but could not be added to the chart'); process.exit(4); }
  await evaluate(`TradingViewApi.saveChartToServer(); true`);
  console.log('on chart as', added.id, added.name);
}
process.exit(0);
