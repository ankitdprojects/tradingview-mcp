# Futures-signal -> option-execution backtest (user rules 2026-09-22).
# Signals on the underlying's futures; CE chart buys on futures BUY, PE chart buys on futures SELL.
# 11 families one at a time, 12 ATM 29-Sep contracts (6 underlyings x CE/PE), TFs 1/5/15/30/60,
# 20k per trade, stop 1 ATR of premium, target 1.5R, max 15 trades/day, square-off, 15 Aug - 22 Sep 2026.
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_STRAT_ID = 'USER;f9df4a5cb52b4d59b60c488a45e43061'
$env:BT_STRAT_TITLE = 'Futures Option BT'
$env:BT_VER = '1.0'
$env:BT_RESTORE = '{"pineId":"USER;f686f1a3397144a4bc31ea731b015e2b","pineVersion":"46.0","title":"SMA Signals","inputs":[]}'
$env:BT_REMOVE_NAME = 'SMA Signals'
$env:BT_R = '20000'
$env:BT_ORIG_SYM = 'MCX:NATURALGAS1!'
$env:BT_ORIG_TF = '1'
$fams = @('SMA 50/200','SMA 9/21','Sweep','Wick','Supertrend','EMA touch','RSI div','Donchian','VWAP','FVG','Fib')
$env:BT_CONFIGS = "[" + (($fams | ForEach-Object { "{`"label`":`"$_`",`"inputs`":[{`"id`":`"in_2`",`"value`":`"$_`"}]}" }) -join ",") + "]"
$env:BT_EXTRA_INPUTS = '[{"id":"in_3","value":20000},{"id":"in_4","value":1.0},{"id":"in_5","value":1.5},{"id":"in_6","value":15},{"id":"in_7","value":true},{"id":"in_8","value":20260815},{"id":"in_9","value":20260922},{"id":"in_10","value":20},{"id":"in_11","value":false}]'
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
foreach ($tf in @('1','5','15','30','60')) {
  $env:BT_TFS = $tf
  $env:BT_OUT = "$base/bt_futopt_$tf.json"
  Write-Output "===== GROUP futopt $tf ====="
  node "$base/bt_sweep2.mjs" 2>&1
}
Write-Output "ALL DONE"
