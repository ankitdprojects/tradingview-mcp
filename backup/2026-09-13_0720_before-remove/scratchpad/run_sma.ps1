# SMA Signals BT sweep: options / futures intraday (square-off), stocks D+W (hold to target/stop).
# Configs: 9/21+50 trend | 50/200 | FIB only | 9/21 + FIB. Standing rules: 20k, 1k risk, 2R intraday, 4R swing.
$base = 'C:/Users/ankit/AppData/Local/Temp/claude/D--Projects-Tradingview-tradingview-mcp/a375a418-04da-48ff-a436-aa5311d85aee/scratchpad'
$env:BT_STRAT_ID = 'USER;c0f252c7eb62426e8a607a3498385c1f'
$env:BT_STRAT_TITLE = 'SMA Signals BT'
$env:BT_VER = '2.0'
$env:BT_RESTORE = '{"pineId":"USER;f686f1a3397144a4bc31ea731b015e2b","pineVersion":"4.0","title":"SMA Signals","inputs":[]}'
$env:BT_REMOVE_NAME = 'SMA Signals'
$env:BT_R = '1000'
$env:BT_ORIG_SYM = 'NSE:NIFTY260915C23300'
$env:BT_ORIG_TF = '1'
$env:BT_CONFIGS = '[{"label":"SMA 50/200","inputs":[{"id":"in_0","value":"SMA"},{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_3","value":false},{"id":"in_4","value":200}]},{"label":"SMA 9/21 +50","inputs":[{"id":"in_0","value":"SMA"},{"id":"in_1","value":9},{"id":"in_2","value":21},{"id":"in_3","value":true},{"id":"in_4","value":50}]},{"label":"FIB only","inputs":[{"id":"in_0","value":"FIB"},{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_3","value":true},{"id":"in_4","value":200}]},{"label":"SMA 50/200 + FIB","inputs":[{"id":"in_0","value":"Both"},{"id":"in_1","value":50},{"id":"in_2","value":200},{"id":"in_3","value":false},{"id":"in_4","value":200}]}]'

function Run($group, $symbols, $tfs, $extra) {
  $env:BT_SYMBOLS = $symbols
  $env:BT_TFS = $tfs
  $env:BT_EXTRA_INPUTS = $extra
  $env:BT_OUT = "$base/bt_sma_$group.json"
  Write-Output "===== GROUP $group ====="
  node "$base/bt_sweep2.mjs" 2>&1
}

# Options: monthly 29-Sep contracts (multi-week history), 1 lot capped to capital, 2R, square-off
Run 'options' 'NSE:NIFTY260929C23500,NSE:NIFTY260929P23400,NSE:BANKNIFTY260929P56300,NSE:RELIANCE260929C1280,NSE:SBIN260929C1000,NSE:TATASTEEL260929C190' '5,15,30,60' '[{"id":"in_6","value":1000},{"id":"in_7","value":2},{"id":"in_12","value":true},{"id":"in_15","value":false},{"id":"in_19","value":1},{"id":"in_13","value":20250817},{"id":"in_14","value":20260913}]'

# Futures: risk-sized, 2R intraday, square-off; D held overnight, 4R
Run 'futures' 'NSE:NIFTY1!,NSE:BANKNIFTY1!,MCX:CRUDEOILM1!' '15,30,60' '[{"id":"in_6","value":1000},{"id":"in_7","value":2},{"id":"in_12","value":true},{"id":"in_15","value":false},{"id":"in_13","value":20250817},{"id":"in_14","value":20260913}]'
Run 'futuresD' 'NSE:NIFTY1!,NSE:BANKNIFTY1!,MCX:CRUDEOILM1!' 'D' '[{"id":"in_6","value":1000},{"id":"in_7","value":4},{"id":"in_12","value":false},{"id":"in_15","value":false},{"id":"in_13","value":20230913},{"id":"in_14","value":20260913}]'

# Stocks: cash, daily + weekly, hold overnight to target/stop, 4R, last 12 months (weekly: 3 years)
Run 'stocksD' 'NSE:RELIANCE,NSE:SBIN,NSE:TATASTEEL,NSE:HDFCBANK,NSE:ICICIBANK,NSE:INFY,NSE:TCS' 'D' '[{"id":"in_6","value":1000},{"id":"in_7","value":4},{"id":"in_12","value":false},{"id":"in_15","value":true},{"id":"in_13","value":20230913},{"id":"in_14","value":20260913}]'
Run 'stocksW' 'NSE:RELIANCE,NSE:SBIN,NSE:TATASTEEL,NSE:HDFCBANK,NSE:ICICIBANK,NSE:INFY,NSE:TCS' 'W' '[{"id":"in_6","value":1000},{"id":"in_7","value":4},{"id":"in_12","value":false},{"id":"in_15","value":true},{"id":"in_13","value":20160913},{"id":"in_14","value":20260913}]'
Write-Output "ALL DONE"
