$env:PATH = "C:\Windows\System32\WindowsPowerShell\v1.0;C:\Windows\System32;" + $env:PATH
$b = "C:\Users\ankit\AppData\Local\Temp\claude\D--Projects-Tradingview-tradingview-mcp\a375a418-04da-48ff-a436-aa5311d85aee\scratchpad"
powershell -NoProfile -ExecutionPolicy Bypass -File "$b\run_fut_1m.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "$b\run_opt_1m.ps1"
Write-Output "BOTH DONE"
