# User rule set, one WEEK at a time, 30m + 60m, square-off on, price stop on.
# Usage: run_rules_weeks.ps1 <group> <symbols csv> <risk> <leverage>
param([string]$Group, [string]$Symbols, [string]$Risk, [string]$Leverage, [string]$Tfs = '30,60')
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_VER = '18.0'
$env:BT_R = $Risk
$env:BT_SCREENER_VER = '114.0'
$env:BT_ORIG_SYM = 'MCX:CRUDEOILM1!'
$env:BT_ORIG_TF = '1'
$env:BT_SYMBOLS = $Symbols
$env:BT_TFS = $Tfs
$env:BT_EXTRA_INPUTS = "[{`"id`":`"in_2`",`"value`":$Risk},{`"id`":`"in_3`",`"value`":$Leverage},{`"id`":`"in_24`",`"value`":0},{`"id`":`"in_14`",`"value`":true},{`"id`":`"in_15`",`"value`":false},{`"id`":`"in_18`",`"value`":true},{`"id`":`"in_21`",`"value`":false},{`"id`":`"in_0`",`"value`":`"Both`"},{`"id`":`"in_25`",`"value`":false},{`"id`":`"in_26`",`"value`":true},{`"id`":`"in_27`",`"value`":true},{`"id`":`"in_28`",`"value`":true},{`"id`":`"in_31`",`"value`":true},{`"id`":`"in_32`",`"value`":0}]"
$env:BT_CONFIGS = '[{"label":"W1 Aug17-21","inputs":[{"id":"in_33","value":20260817},{"id":"in_34","value":20260821}]},{"label":"W2 Aug24-28","inputs":[{"id":"in_33","value":20260824},{"id":"in_34","value":20260828}]},{"label":"W3 Aug31-Sep4","inputs":[{"id":"in_33","value":20260831},{"id":"in_34","value":20260904}]},{"label":"W4 Sep7-11","inputs":[{"id":"in_33","value":20260907},{"id":"in_34","value":20260911}]}]'
$env:BT_OUT = "$base/bt_weeks_${Group}.json"
node "$base/bt_sweep.mjs" 2>&1
