# Usage: run_group.ps1 <groupName> <symbols csv> <leverage> <configKey: ST|STRSI>
param([string]$Group, [string]$Symbols, [string]$Leverage, [string]$Cfg)
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_VER = '13.0'
$env:BT_R = '1000'
$env:BT_SCREENER_VER = '111.0'
$env:BT_ORIG_SYM = 'MCX:CRUDEOIL1!'
$env:BT_ORIG_TF = '1'
$env:BT_SYMBOLS = $Symbols
$env:BT_TFS = '5,15,30,60,240'
$env:BT_EXTRA_INPUTS = "[{`"id`":`"in_3`",`"value`":$Leverage},{`"id`":`"in_24`",`"value`":5},{`"id`":`"in_14`",`"value`":true}]"
if ($Cfg -eq 'ST') {
  $env:BT_CONFIGS = '[{"label":"Both+ST","inputs":[{"id":"in_0","value":"Both"},{"id":"in_18","value":true},{"id":"in_21","value":false}]}]'
} else {
  $env:BT_CONFIGS = '[{"label":"Both+ST+RSI","inputs":[{"id":"in_0","value":"Both"},{"id":"in_18","value":true},{"id":"in_21","value":true}]}]'
}
$env:BT_OUT = "$base/bt5d_${Group}_${Cfg}.json"
node "$base/bt_sweep.mjs" 2>&1 | Tee-Object -FilePath "$base/bt5d_${Group}_${Cfg}.log"
