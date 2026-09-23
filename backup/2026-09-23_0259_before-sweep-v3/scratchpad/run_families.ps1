# Stage 1: every signal family alone. Options (current monthly, ~6 wk of history) + index/crude futures (3 months).
# Rules: 20k per trade, buy-only, SELL while long = stop, signal-specific stop, 1.5R target, square-off at close.
# TFs 1,5,15,30,60. Window 2026-06-14 .. 2026-09-14.
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_STRAT_ID = 'USER;c0f252c7eb62426e8a607a3498385c1f'
$env:BT_STRAT_TITLE = 'SMA Signals BT'
$env:BT_VER = '9.0'
$env:BT_RESTORE = '{"pineId":"USER;f686f1a3397144a4bc31ea731b015e2b","pineVersion":"20.0","title":"SMA Signals","inputs":[]}'
$env:BT_REMOVE_NAME = 'SMA Signals'
$env:BT_R = '20000'
$env:BT_ORIG_SYM = 'NSE:NIFTY260915C23350'
$env:BT_ORIG_TF = '1'
$off = '{"id":"in_29","value":false},{"id":"in_30","value":false},{"id":"in_31","value":false},{"id":"in_32","value":false},{"id":"in_33","value":false},{"id":"in_34","value":false},{"id":"in_35","value":false},{"id":"in_36","value":false},{"id":"in_37","value":false},{"id":"in_38","value":false},{"id":"in_39","value":0},{"id":"in_40","value":false}'
$sma5020 = '{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_3","value":false},{"id":"in_4","value":200}'
$sma921  = '{"id":"in_1","value":9},{"id":"in_2","value":21},{"id":"in_3","value":true},{"id":"in_4","value":50}'
$env:BT_CONFIGS = "[" +
  "{`"label`":`"SMA 50/200`",`"inputs`":[$off,$sma5020,{`"id`":`"in_29`",`"value`":true}]}," +
  "{`"label`":`"SMA 9/21`",`"inputs`":[$off,$sma921,{`"id`":`"in_29`",`"value`":true}]}," +
  "{`"label`":`"FIB`",`"inputs`":[$off,$sma5020,{`"id`":`"in_30`",`"value`":true}]}," +
  "{`"label`":`"Sweep`",`"inputs`":[$off,$sma5020,{`"id`":`"in_31`",`"value`":true}]}," +
  "{`"label`":`"Donchian`",`"inputs`":[$off,$sma5020,{`"id`":`"in_32`",`"value`":true}]}," +
  "{`"label`":`"VWAP`",`"inputs`":[$off,$sma5020,{`"id`":`"in_33`",`"value`":true}]}," +
  "{`"label`":`"Wick`",`"inputs`":[$off,$sma5020,{`"id`":`"in_34`",`"value`":true}]}," +
  "{`"label`":`"FVG`",`"inputs`":[$off,$sma5020,{`"id`":`"in_35`",`"value`":true}]}," +
  "{`"label`":`"Supertrend`",`"inputs`":[$off,$sma5020,{`"id`":`"in_36`",`"value`":true}]}," +
  "{`"label`":`"EMA touch`",`"inputs`":[$off,$sma5020,{`"id`":`"in_37`",`"value`":true}]}" +
  "]"
$common = '{"id":"in_0","value":"Custom"},{"id":"in_20","value":20000},{"id":"in_26","value":true},{"id":"in_21","value":"Signal"},{"id":"in_19","value":0},{"id":"in_15","value":false},{"id":"in_7","value":1.5},{"id":"in_11","value":true},{"id":"in_12","value":true},{"id":"in_13","value":20260614},{"id":"in_14","value":20260914}'
function Run($group, $symbols, $tfs) {
  $env:BT_SYMBOLS = $symbols; $env:BT_TFS = $tfs; $env:BT_EXTRA_INPUTS = "[$common]"; $env:BT_OUT = "$base/bt_fam_$group.json"
  Write-Output "===== GROUP $group ====="
  node "$base/bt_sweep2.mjs" 2>&1
}
Run 'options' 'NSE:NIFTY260929C23500,NSE:NIFTY260929P23400,NSE:BANKNIFTY260929C56300,NSE:BANKNIFTY260929P56300,NSE:RELIANCE260929C1280,NSE:RELIANCE260929P1280,NSE:SBIN260929C1000,NSE:SBIN260929P1000' '1,5,15,30,60'
Run 'futures' 'NSE:NIFTY1!,NSE:BANKNIFTY1!,MCX:CRUDEOILM1!' '1,5,15,30,60'
Write-Output "ALL DONE"
