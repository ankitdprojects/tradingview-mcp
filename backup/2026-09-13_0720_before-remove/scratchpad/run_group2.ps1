# OLD vs NEW rules, 5 days, all free timeframes.
# Usage: run_group2.ps1 <groupName> <symbols csv> <leverage> <sessionMinutes>
param([string]$Group, [string]$Symbols, [string]$Leverage, [string]$SessMins)
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_VER = '14.0'
$env:BT_R = '1000'
$env:BT_SCREENER_VER = '111.0'
$env:BT_ORIG_SYM = 'MCX:CRUDEOIL1!'
$env:BT_ORIG_TF = '1'
$env:BT_SYMBOLS = $Symbols
$env:BT_TFS = '1,3,5,15,30,45,60,120,240'
$env:BT_EXTRA_INPUTS = "[{`"id`":`"in_3`",`"value`":$Leverage},{`"id`":`"in_24`",`"value`":5},{`"id`":`"in_14`",`"value`":true},{`"id`":`"in_32`",`"value`":$SessMins}]"
$old = '{"label":"OLD","inputs":[{"id":"in_0","value":"Both"},{"id":"in_18","value":true},{"id":"in_21","value":false},{"id":"in_25","value":"EMA"},{"id":"in_26","value":"Pivots"},{"id":"in_27","value":"R multiple"},{"id":"in_28","value":"Supertrend (chart TF)"},{"id":"in_29","value":0},{"id":"in_30","value":0},{"id":"in_31","value":0},{"id":"in_10","value":1.0}]}'
$new = '{"label":"NEW","inputs":[{"id":"in_0","value":"BothFk"},{"id":"in_18","value":true},{"id":"in_21","value":true},{"id":"in_25","value":"VWAP"},{"id":"in_26","value":"Both"},{"id":"in_27","value":"Next level"},{"id":"in_28","value":"Supertrend 60m"},{"id":"in_29","value":23},{"id":"in_30","value":15},{"id":"in_31","value":60},{"id":"in_10","value":1.3}]}'
$env:BT_CONFIGS = "[$old,$new]"
$env:BT_OUT = "$base/bt_v14_${Group}.json"
node "$base/bt_sweep.mjs" 2>&1
