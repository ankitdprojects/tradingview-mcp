# User rule set on options: A = as stated (fake is the only stop), B = same + price stop.
param([string]$Group, [string]$Symbols)
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_VER = '16.0'
$env:BT_R = '1000'
$env:BT_SCREENER_VER = '114.0'
$env:BT_ORIG_SYM = 'MCX:CRUDEOILM1!'
$env:BT_ORIG_TF = '1'
$env:BT_SYMBOLS = $Symbols
$env:BT_TFS = '1,5,15,30,60'
$env:BT_EXTRA_INPUTS = '[{"id":"in_3","value":1},{"id":"in_24","value":5},{"id":"in_14","value":true},{"id":"in_15","value":false},{"id":"in_18","value":true},{"id":"in_21","value":false},{"id":"in_0","value":"Both"},{"id":"in_25","value":false},{"id":"in_27","value":true},{"id":"in_28","value":true}]'
$env:BT_CONFIGS = '[{"label":"Rules","inputs":[{"id":"in_26","value":false}]},{"label":"Rules+stop","inputs":[{"id":"in_26","value":true}]}]'
$env:BT_OUT = "$base/bt_rules_${Group}.json"
node "$base/bt_sweep.mjs" 2>&1
