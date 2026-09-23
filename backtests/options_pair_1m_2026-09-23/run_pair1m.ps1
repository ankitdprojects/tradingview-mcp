# 1m options, PAIR mode (strategy v5): signals from each option's own chart.
# CE set = Supertrend + VWAP; PE set = VWAP + Supertrend + Donchian + FVG. 22 Aug - 22 Sep 2026, 20k, 1 ATR stop, 1.5R, 15/day, square-off.
$base = 'D:/Projects/Tradingview/tradingview-mcp/.tmp'
$env:BT_STRAT_ID = 'USER;f9df4a5cb52b4d59b60c488a45e43061'
$env:BT_STRAT_TITLE = 'Futures Option BT'
$env:BT_VER = '5.0'
$env:BT_RESTORE = '{"pineId":"USER;f686f1a3397144a4bc31ea731b015e2b","pineVersion":"47.0","title":"SMA Signals","inputs":[]}'
$env:BT_REMOVE_NAME = 'SMA Signals'
$env:BT_R = '20000'
$env:BT_ORIG_SYM = 'MCX:NATURALGAS1!'
$env:BT_ORIG_TF = '1'
$env:BT_LOAD_FROM = '1752000000'
$env:BT_EXTRA_INPUTS = '[{"id":"in_3","value":20000},{"id":"in_4","value":1.0},{"id":"in_5","value":1.5},{"id":"in_6","value":15},{"id":"in_7","value":true},{"id":"in_8","value":20260822},{"id":"in_9","value":20260922},{"id":"in_10","value":20},{"id":"in_11","value":false},{"id":"in_12","value":0}]'
$pairs = @(
  @('NSE:NIFTY260929C23400','NSE:NIFTY260929P23400'),
  @('NSE:BANKNIFTY260929C56500','NSE:BANKNIFTY260929P56500'),
  @('NSE:FINNIFTY260929C25600','NSE:FINNIFTY260929P25600'),
  @('NSE:MIDCPNIFTY260929C14550','NSE:MIDCPNIFTY260929P14550'),
  @('NSE:RELIANCE260929C1250','NSE:RELIANCE260929P1250'),
  @('NSE:SBIN260929C990','NSE:SBIN260929P990')
)
$si = @()
$syms = @()
foreach ($p in $pairs) {
  $ce = $p[0]; $pe = $p[1]
  $si += "`"$ce`":[{`"id`":`"in_0`",`"value`":`"$ce`"},{`"id`":`"in_1`",`"value`":`"CE`"},{`"id`":`"in_15`",`"value`":`"$pe`"}]"
  $si += "`"$pe`":[{`"id`":`"in_0`",`"value`":`"$pe`"},{`"id`":`"in_1`",`"value`":`"PE`"},{`"id`":`"in_15`",`"value`":`"$ce`"}]"
  $syms += $ce; $syms += $pe
}
$env:BT_SYMBOL_INPUTS = "{" + ($si -join ",") + "}"
$env:BT_SYMBOLS = $syms -join ','
$env:BT_TFS = '1'
$env:BT_CONFIGS = '[{"label":"PAIR ST+VWAP / VWAP+ST+DC+FVG","inputs":[{"id":"in_2","value":"Supertrend"},{"id":"in_13","value":"Supertrend,VWAP"},{"id":"in_14","value":"VWAP,Supertrend,Donchian,FVG"}]}]'
$env:BT_OUT = "$base/bt_pair1m.json"
Write-Output "===== GROUP pair1m ====="
node "$base/bt_sweep2.mjs" 2>&1
Write-Output "ALL DONE"
