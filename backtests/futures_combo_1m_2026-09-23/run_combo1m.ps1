# 1m futures, side-specific family sets (strategy v4): long set vs short set, 22 Aug - 22 Sep 2026.
$base = 'D:/Projects/Tradingview/tradingview-mcp/.tmp'
$env:BT_STRAT_ID = 'USER;f9df4a5cb52b4d59b60c488a45e43061'
$env:BT_STRAT_TITLE = 'Futures Option BT'
$env:BT_VER = '4.0'
$env:BT_RESTORE = '{"pineId":"USER;f686f1a3397144a4bc31ea731b015e2b","pineVersion":"47.0","title":"SMA Signals","inputs":[]}'
$env:BT_REMOVE_NAME = 'SMA Signals'
$env:BT_R = '20000'
$env:BT_ORIG_SYM = 'MCX:NATURALGAS1!'
$env:BT_ORIG_TF = '1'
$env:BT_LOAD_FROM = '1752000000'
$env:BT_EXTRA_INPUTS = '[{"id":"in_12","value":1},{"id":"in_3","value":20000},{"id":"in_4","value":1.0},{"id":"in_5","value":1.5},{"id":"in_6","value":15},{"id":"in_7","value":true},{"id":"in_8","value":20260822},{"id":"in_9","value":20260922},{"id":"in_10","value":20},{"id":"in_11","value":false}]'
$syms = @('NSE:NIFTY1!','NSE:BANKNIFTY1!','NSE:FINNIFTY1!','NSE:MIDCPNIFTY1!','NSE:RELIANCE1!','NSE:SBIN1!')
$env:BT_SYMBOL_INPUTS = "{" + (($syms | ForEach-Object { "`"$_`":[{`"id`":`"in_0`",`"value`":`"$_`"},{`"id`":`"in_1`",`"value`":`"FUT`"}]" }) -join ",") + "}"
$env:BT_SYMBOLS = $syms -join ','
$env:BT_TFS = '1'
$cfg = @(
  @{ label = 'COMBO both';        L = 'Supertrend,VWAP';               S = 'VWAP,FVG,Donchian,Supertrend' },
  @{ label = 'COMBO long only';   L = 'Supertrend,VWAP';               S = 'none' },
  @{ label = 'COMBO short only';  L = 'none';                          S = 'VWAP,FVG,Donchian,Supertrend' },
  @{ label = 'Supertrend long';   L = 'Supertrend';                    S = 'none' },
  @{ label = 'VWAP long';         L = 'VWAP';                          S = 'none' },
  @{ label = 'Supertrend short';  L = 'none';                          S = 'Supertrend' },
  @{ label = 'VWAP short';        L = 'none';                          S = 'VWAP' },
  @{ label = 'FVG short';         L = 'none';                          S = 'FVG' },
  @{ label = 'Donchian short';    L = 'none';                          S = 'Donchian' }
)
$env:BT_CONFIGS = "[" + (($cfg | ForEach-Object { "{`"label`":`"$($_.label)`",`"inputs`":[{`"id`":`"in_2`",`"value`":`"Supertrend`"},{`"id`":`"in_13`",`"value`":`"$($_.L)`"},{`"id`":`"in_14`",`"value`":`"$($_.S)`"}]}" }) -join ",") + "]"
$env:BT_OUT = "$base/bt_combo1m.json"
Write-Output "===== GROUP combo1m ====="
node "$base/bt_sweep2.mjs" 2>&1
Write-Output "ALL DONE"
