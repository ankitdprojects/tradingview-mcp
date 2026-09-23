# Backtest of the CHART'S CURRENT FLOW (SMA Signals v40), one config per timeframe:
#   1m  : SMA 50/200 cross + wick            5m : (a) SMA 9/21 + wick   (b) sweep + Supertrend, ADX>=20
#   15m : sweep (VWAP side) + Supertrend + wick, ADX>=20     30m: sweep + Supertrend, ADX>=20     60m: wick + Supertrend, ADX>=20
# Rules: buy-only, 20k per trade, signal stop, 1.5R, SELL while long = stop, square-off, 15 Aug - 15 Sep 2026.
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_STRAT_ID = 'USER;c0f252c7eb62426e8a607a3498385c1f'
$env:BT_STRAT_TITLE = 'SMA Signals BT'
$env:BT_VER = '9.0'
$env:BT_RESTORE = '{"pineId":"USER;f686f1a3397144a4bc31ea731b015e2b","pineVersion":"40.0","title":"SMA Signals","inputs":[]}'
$env:BT_REMOVE_NAME = 'SMA Signals'
$env:BT_R = '20000'
$env:BT_ORIG_SYM = 'MCX:CRUDEOILM1!'
$env:BT_ORIG_TF = '1'
$off = '{"id":"in_29","value":false},{"id":"in_30","value":false},{"id":"in_31","value":false},{"id":"in_32","value":false},{"id":"in_33","value":false},{"id":"in_34","value":false},{"id":"in_35","value":false},{"id":"in_36","value":false},{"id":"in_37","value":false},{"id":"in_38","value":false},{"id":"in_39","value":0},{"id":"in_40","value":false},{"id":"in_3","value":false}'
$s50 = '{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_4","value":200}'
$s921 = '{"id":"in_1","value":9},{"id":"in_2","value":21},{"id":"in_4","value":50}'
function C($label, $on) { return "[{`"label`":`"$label`",`"inputs`":[$off,$on]}]" }
$cfg1  = C '1m SMA50/200+wick'        "$s50,{`"id`":`"in_29`",`"value`":true},{`"id`":`"in_34`",`"value`":true}"
$cfg5  = "[{`"label`":`"5m SMA9/21+wick`",`"inputs`":[$off,$s921,{`"id`":`"in_29`",`"value`":true},{`"id`":`"in_34`",`"value`":true}]},{`"label`":`"5m sweep+ST ADX20`",`"inputs`":[$off,$s50,{`"id`":`"in_31`",`"value`":true},{`"id`":`"in_36`",`"value`":true},{`"id`":`"in_39`",`"value`":20}]}]"
$cfg15 = C '15m sweepVWAP+ST+wick ADX20' "$s50,{`"id`":`"in_31`",`"value`":true},{`"id`":`"in_36`",`"value`":true},{`"id`":`"in_34`",`"value`":true},{`"id`":`"in_40`",`"value`":true},{`"id`":`"in_39`",`"value`":20}"
$cfg30 = C '30m sweep+ST ADX20'       "$s50,{`"id`":`"in_31`",`"value`":true},{`"id`":`"in_36`",`"value`":true},{`"id`":`"in_39`",`"value`":20}"
$cfg60 = C '60m wick+ST ADX20'        "$s50,{`"id`":`"in_34`",`"value`":true},{`"id`":`"in_36`",`"value`":true},{`"id`":`"in_39`",`"value`":20}"
$common = '{"id":"in_0","value":"Custom"},{"id":"in_20","value":20000},{"id":"in_26","value":true},{"id":"in_21","value":"Signal"},{"id":"in_19","value":0},{"id":"in_15","value":false},{"id":"in_7","value":1.5},{"id":"in_11","value":true},{"id":"in_12","value":true},{"id":"in_13","value":20260815},{"id":"in_14","value":20260915}'
$opts = 'BSE:BSX260924C75200,BSE:BSX260924P75200,BSE:BKX260924C64300,BSE:BKX260924P64300,NSE:FINNIFTY260929C25700,NSE:FINNIFTY260929P25700,NSE:MIDCPNIFTY260929C14650,NSE:MIDCPNIFTY260929P14650,NSE:NIFTY260929C23500,NSE:NIFTY260929P23500,NSE:BANKNIFTY260929C56900,NSE:BANKNIFTY260929P56900,NSE:RELIANCE260929C1280,NSE:RELIANCE260929P1280,NSE:SBIN260929C1000,NSE:SBIN260929P1000'
$futs = 'BSE:BSX1!,BSE:BKX1!,NSE:FINNIFTY1!,NSE:MIDCPNIFTY1!,NSE:NIFTY1!,NSE:BANKNIFTY1!,MCX:CRUDEOILM1!,MCX:GOLDM1!,MCX:NATURALGAS1!'
function Run($group, $symbols, $tf, $cfg) {
  $env:BT_SYMBOLS = $symbols; $env:BT_TFS = $tf; $env:BT_CONFIGS = $cfg; $env:BT_EXTRA_INPUTS = "[$common]"; $env:BT_OUT = "$base/bt_flow_${group}_$tf.json"
  Write-Output "===== GROUP $group $tf ====="
  node "$base/bt_sweep2.mjs" 2>&1
}
foreach ($g in @(@('options', $opts), @('futures', $futs))) {
  Run $g[0] $g[1] '1'  $cfg1
  Run $g[0] $g[1] '5'  $cfg5
  Run $g[0] $g[1] '15' $cfg15
  Run $g[0] $g[1] '30' $cfg30
  Run $g[0] $g[1] '60' $cfg60
}
Write-Output "ALL DONE"
