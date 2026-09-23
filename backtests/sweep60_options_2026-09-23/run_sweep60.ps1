# Sweep 60m signals (from the underlying futures) traded intraday on the option charts at 5m / 15m / 60m.
# CE bought on Sweep BUY, PE bought on Sweep SELL; 20k, 1 ATR stop on the premium, 1.5R target, 15/day, square-off, Rs 20/order.
$base = 'D:/Projects/Tradingview/tradingview-mcp/.tmp'
$env:BT_STRAT_ID = 'USER;f9df4a5cb52b4d59b60c488a45e43061'
$env:BT_STRAT_TITLE = 'Futures Option BT'
$env:BT_VER = '7.0'
$env:BT_RESTORE = '{"pineId":"USER;18eae575e9904c6f8799afba0a27ea37","pineVersion":"5.0","title":"Sweep SELL","inputs":[]}'
$env:BT_REMOVE_NAME = 'Sweep 60m'
$env:BT_R = '20000'
$env:BT_ORIG_SYM = 'MCX:NATURALGAS1!'
$env:BT_ORIG_TF = '1'
$env:BT_LOAD_FROM = '1752000000'
$env:BT_EXTRA_INPUTS = '[{"id":"in_3","value":20000},{"id":"in_4","value":1.0},{"id":"in_5","value":1.5},{"id":"in_6","value":15},{"id":"in_7","value":true},{"id":"in_8","value":20260822},{"id":"in_9","value":20260922},{"id":"in_10","value":20},{"id":"in_11","value":false},{"id":"in_12","value":0},{"id":"in_14","value":""},{"id":"in_15","value":""},{"id":"in_16","value":""}]'
$map = @{
  'NSE:NIFTY260929C23400'      = @('NSE:NIFTY1!','CE');      'NSE:NIFTY260929P23400'      = @('NSE:NIFTY1!','PE')
  'NSE:BANKNIFTY260929C56500'  = @('NSE:BANKNIFTY1!','CE');  'NSE:BANKNIFTY260929P56500'  = @('NSE:BANKNIFTY1!','PE')
  'NSE:FINNIFTY260929C25600'   = @('NSE:FINNIFTY1!','CE');   'NSE:FINNIFTY260929P25600'   = @('NSE:FINNIFTY1!','PE')
  'NSE:MIDCPNIFTY260929C14550' = @('NSE:MIDCPNIFTY1!','CE'); 'NSE:MIDCPNIFTY260929P14550' = @('NSE:MIDCPNIFTY1!','PE')
  'NSE:RELIANCE260929C1250'    = @('NSE:RELIANCE1!','CE');   'NSE:RELIANCE260929P1250'    = @('NSE:RELIANCE1!','PE')
  'NSE:SBIN260929C990'         = @('NSE:SBIN1!','CE');       'NSE:SBIN260929P990'         = @('NSE:SBIN1!','PE')
}
$env:BT_SYMBOL_INPUTS = "{" + (($map.GetEnumerator() | ForEach-Object { "`"$($_.Key)`":[{`"id`":`"in_0`",`"value`":`"$($_.Value[0])`"},{`"id`":`"in_1`",`"value`":`"$($_.Value[1])`"}]" }) -join ",") + "}"
$env:BT_SYMBOLS = ($map.Keys | Sort-Object) -join ','
$env:BT_CONFIGS = '[{"label":"Sweep 60m","inputs":[{"id":"in_2","value":"Sweep"},{"id":"in_13","value":"60"}]}]'
foreach ($tf in @('5','15','60')) {
  $env:BT_TFS = $tf
  $env:BT_OUT = "$base/bt_sweep60_$tf.json"
  Write-Output "===== GROUP sweep60 $tf ====="
  node "$base/bt_sweep2.mjs" 2>&1
}
Write-Output "ALL DONE"
