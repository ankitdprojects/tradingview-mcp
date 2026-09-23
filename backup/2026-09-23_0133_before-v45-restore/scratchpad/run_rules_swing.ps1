# Swing test: daily + weekly, cash equity, 20k, 1,000 risk, delivery (no leverage),
# NO square-off, price stop on, last 12 months. OB/OS on vs off isolates the 2-ATR turn.
param([string]$Group, [string]$Symbols)
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_VER = '18.0'
$env:BT_R = '1000'
$env:BT_SCREENER_VER = '116.0'
$env:BT_ORIG_SYM = 'DELTAIN:VVVUSD.P'
$env:BT_ORIG_TF = '1'
$env:BT_SYMBOLS = $Symbols
$env:BT_TFS = 'D,W'
$env:BT_EXTRA_INPUTS = '[{"id":"in_2","value":1000},{"id":"in_3","value":1},{"id":"in_4","value":4},{"id":"in_24","value":0},{"id":"in_33","value":20250913},{"id":"in_34","value":20260913},{"id":"in_14","value":true},{"id":"in_15","value":false},{"id":"in_18","value":true},{"id":"in_0","value":"Both"},{"id":"in_25","value":false},{"id":"in_26","value":true},{"id":"in_27","value":true},{"id":"in_31","value":false}]'
$env:BT_CONFIGS = '[{"label":"OBOS on","inputs":[{"id":"in_28","value":true},{"id":"in_21","value":true}]},{"label":"OBOS off","inputs":[{"id":"in_28","value":false},{"id":"in_21","value":false}]}]'
$env:BT_OUT = "$base/bt_swing_${Group}.json"
node "$base/bt_sweep.mjs" 2>&1
