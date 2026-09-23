# Install (or reinstall) the "TradingView OI Watch" logon task so scripts/oi_watch.mjs is always
# running in the background: it follows the active chart symbol and keeps the OI Profile fed.
# Run once:  powershell -ExecutionPolicy Bypass -File scripts/install_oi_watch.ps1
# Remove:    schtasks /delete /tn "TradingView OI Watch" /f
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$node = (Get-Command node).Source
$log = Join-Path $repo 'logs\oi_watch.log'
New-Item -ItemType Directory -Force (Split-Path $log) | Out-Null
$task = 'TradingView OI Watch'

# Hidden PowerShell wrapper: restarts the watcher if it ever exits, appends output to the log.
$cmd = "`$ErrorActionPreference='Continue'; Set-Location '$repo'; while (`$true) { & '$node' scripts/oi_watch.mjs 2>&1 | Out-File -Append -Encoding utf8 '$log'; Start-Sleep 10 }"
$enc = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -EncodedCommand $enc"
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew

# Stop any stray manual watchers so only the task-managed one runs.
Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'oi_watch\.mjs' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Unregister-ScheduledTask -TaskName $task -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $task -Action $action -Trigger $trigger -Settings $settings -Description 'Keeps the TradingView OI Profile indicator fed with live option-chain OI (follows the chart symbol).' | Out-Null
Start-ScheduledTask -TaskName $task
Start-Sleep 5
$running = Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'oi_watch\.mjs' }
if ($running) { "installed + running (pid $($running.ProcessId -join ',')); log: $log" } else { throw "task registered but watcher not running - see $log" }
