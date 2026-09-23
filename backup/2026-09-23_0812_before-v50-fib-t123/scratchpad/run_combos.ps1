# Stage 2: combinations of the stage-1 keepers (Sweep, EMA touch, Supertrend, SMA 50/200, Wick, + FIB for futures)
# as unions (either fires) and with filters (Supertrend agreement, ADX >= 20, VWAP side). 15/30/60 only.
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_STRAT_ID = 'USER;c0f252c7eb62426e8a607a3498385c1f'
$env:BT_STRAT_TITLE = 'SMA Signals BT'
$env:BT_VER = '9.0'
$env:BT_RESTORE = '{"pineId":"USER;f686f1a3397144a4bc31ea731b015e2b","pineVersion":"20.0","title":"SMA Signals","inputs":[]}'
$env:BT_REMOVE_NAME = 'SMA Signals'
$env:BT_R = '20000'
$env:BT_ORIG_SYM = 'NSE:NIFTY260915C23350'
$env:BT_ORIG_TF = '1'
$off = '{"id":"in_29","value":false},{"id":"in_30","value":false},{"id":"in_31","value":false},{"id":"in_32","value":false},{"id":"in_33","value":false},{"id":"in_34","value":false},{"id":"in_35","value":false},{"id":"in_36","value":false},{"id":"in_37","value":false},{"id":"in_38","value":false},{"id":"in_39","value":0},{"id":"in_40","value":false},{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_3","value":false},{"id":"in_4","value":200}'
function C($label, $on) { return "{`"label`":`"$label`",`"inputs`":[$off,$on]}" }
$env:BT_CONFIGS = "[" + (@(
  (C 'Sweep +ST filter'        '{"id":"in_31","value":true},{"id":"in_38","value":true}'),
  (C 'Sweep +ADX20'            '{"id":"in_31","value":true},{"id":"in_39","value":20}'),
  (C 'Sweep +VWAP side'        '{"id":"in_31","value":true},{"id":"in_40","value":true}'),
  (C 'Sweep + EMA touch'       '{"id":"in_31","value":true},{"id":"in_37","value":true}'),
  (C 'Sweep + Wick'            '{"id":"in_31","value":true},{"id":"in_34","value":true}'),
  (C 'Supertrend +ADX20'       '{"id":"in_36","value":true},{"id":"in_39","value":20}'),
  (C 'Supertrend + EMA touch'  '{"id":"in_36","value":true},{"id":"in_37","value":true}'),
  (C 'EMA touch +ST filter'    '{"id":"in_37","value":true},{"id":"in_38","value":true}'),
  (C 'SMA50/200 +ST +ADX20'    '{"id":"in_29","value":true},{"id":"in_38","value":true},{"id":"in_39","value":20}'),
  (C 'Wick +ST filter'         '{"id":"in_34","value":true},{"id":"in_38","value":true}'),
  (C 'FIB +ST filter'          '{"id":"in_30","value":true},{"id":"in_38","value":true}'),
  (C 'All keepers'             '{"id":"in_31","value":true},{"id":"in_37","value":true},{"id":"in_36","value":true},{"id":"in_29","value":true},{"id":"in_34","value":true}')
) -join ",") + "]"
$common = '{"id":"in_0","value":"Custom"},{"id":"in_20","value":20000},{"id":"in_26","value":true},{"id":"in_21","value":"Signal"},{"id":"in_19","value":0},{"id":"in_15","value":false},{"id":"in_7","value":1.5},{"id":"in_11","value":true},{"id":"in_12","value":true},{"id":"in_13","value":20260614},{"id":"in_14","value":20260914}'
function Run($group, $symbols, $tfs) {
  $env:BT_SYMBOLS = $symbols; $env:BT_TFS = $tfs; $env:BT_EXTRA_INPUTS = "[$common]"; $env:BT_OUT = "$base/bt_combo_$group.json"
  Write-Output "===== GROUP $group ====="
  node "$base/bt_sweep2.mjs" 2>&1
}
Run 'options' 'NSE:NIFTY260929C23500,NSE:NIFTY260929P23400,NSE:BANKNIFTY260929C56300,NSE:BANKNIFTY260929P56300,NSE:RELIANCE260929C1280,NSE:RELIANCE260929P1280,NSE:SBIN260929C1000,NSE:SBIN260929P1000' '15,30,60'
Run 'futures' 'NSE:NIFTY1!,NSE:BANKNIFTY1!,MCX:CRUDEOILM1!' '15,30,60'
Write-Output "ALL DONE"
