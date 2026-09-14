# SMA Signals BT v4, last 30 days, revised rules: 20k per trade, signal-specific stop/target, re-entry after stop,
# intraday square-off, daily 15-bar time stop. Options + futures intraday; stocks daily only.
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_STRAT_ID = 'USER;c0f252c7eb62426e8a607a3498385c1f'
$env:BT_STRAT_TITLE = 'SMA Signals BT'
$env:BT_VER = '5.0'
$env:BT_RESTORE = '{"pineId":"USER;f686f1a3397144a4bc31ea731b015e2b","pineVersion":"5.0","title":"SMA Signals","inputs":[]}'
$env:BT_REMOVE_NAME = 'SMA Signals'
$env:BT_R = '20000'
$env:BT_ORIG_SYM = 'NSE:NIFTY260915C23300'
$env:BT_ORIG_TF = '1'
$env:BT_CONFIGS = '[{"label":"SMA 50/200","inputs":[{"id":"in_0","value":"SMA"},{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_3","value":false},{"id":"in_4","value":200},{"id":"in_23","value":false}]},{"label":"SMA 9/21","inputs":[{"id":"in_0","value":"SMA"},{"id":"in_1","value":9},{"id":"in_2","value":21},{"id":"in_3","value":true},{"id":"in_4","value":50},{"id":"in_23","value":false}]},{"label":"SMA 9/21 + 50/200","inputs":[{"id":"in_0","value":"SMA"},{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_3","value":false},{"id":"in_4","value":200},{"id":"in_23","value":true},{"id":"in_24","value":9},{"id":"in_25","value":21}]},{"label":"FIB only","inputs":[{"id":"in_0","value":"FIB"},{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_3","value":true},{"id":"in_4","value":200},{"id":"in_23","value":false}]},{"label":"SMA 50/200 + FIB","inputs":[{"id":"in_0","value":"Both"},{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_3","value":false},{"id":"in_4","value":200},{"id":"in_23","value":false}]}]'
$common = '{"id":"in_20","value":20000},{"id":"in_21","value":"Signal"},{"id":"in_19","value":0},{"id":"in_15","value":false},{"id":"in_22","value":15},{"id":"in_13","value":20260815},{"id":"in_14","value":20260914}'
function Run($group, $symbols, $tfs, $extra) {
  $env:BT_SYMBOLS = $symbols; $env:BT_TFS = $tfs; $env:BT_EXTRA_INPUTS = $extra; $env:BT_OUT = "$base/bt_sma30_$group.json"
  Write-Output "===== GROUP $group ====="
  node "$base/bt_sweep2.mjs" 2>&1
}
Run 'options' 'NSE:NIFTY260929C23500,NSE:NIFTY260929P23400,NSE:BANKNIFTY260929P56300,NSE:RELIANCE260929C1280,NSE:SBIN260929C1000,NSE:TATASTEEL260929C190' '5,15,30,60' "[$common,{`"id`":`"in_7`",`"value`":2},{`"id`":`"in_12`",`"value`":true}]"
Run 'futures' 'NSE:NIFTY1!,NSE:BANKNIFTY1!,MCX:CRUDEOILM1!' '15,30,60' "[$common,{`"id`":`"in_7`",`"value`":2},{`"id`":`"in_12`",`"value`":true}]"
Run 'stocksD' 'NSE:RELIANCE,NSE:SBIN,NSE:TATASTEEL,NSE:HDFCBANK,NSE:ICICIBANK,NSE:INFY,NSE:TCS' 'D' "[$common,{`"id`":`"in_7`",`"value`":4},{`"id`":`"in_12`",`"value`":false}]"
Write-Output "ALL DONE"
