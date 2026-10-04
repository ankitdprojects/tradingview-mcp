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

# Hidden PowerShell wrapper: restarts the watcher if it ever exits. The watcher writes its own
# rotated log (OI_LOG) — piping through Out-File locked the file and two wrappers then fought over
# it ("The process cannot access the file ... being used by another process", 2026-10-04).
$cmd = "`$ErrorActionPreference='Continue'; Set-Location '$repo'; `$env:OI_LOG='$log'; while (`$true) { & '$node' scripts/oi_watch.mjs; Start-Sleep 10 }"
$enc = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -EncodedCommand $enc"
# Two triggers: at logon, and every 5 minutes forever. The repeat one is a no-op while the
# watcher is alive (MultipleInstances IgnoreNew) and revives it after sleep / logoff / a kill
# (on 2026-09-25 the logon trigger alone left the task idle for two days).
$trigger = @(
  (New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME),
  (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5))
)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew

# Stop the running task instance, every old wrapper loop (they would otherwise restart their own
# watcher after we kill it) and every watcher process, so exactly one task-managed copy runs.
Stop-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -Filter "name='powershell.exe'" | Where-Object { $_.CommandLine -match 'EncodedCommand' } | ForEach-Object {
  $enc = ($_.CommandLine -split 'EncodedCommand\s+')[1].Trim('"').Split(' ')[0]
  $dec = try { [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($enc)) } catch { '' }
  if ($dec -match 'oi_watch' -and $_.ProcessId -ne $PID) { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'oi_watch\.mjs' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep 2
Unregister-ScheduledTask -TaskName $task -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $task -Action $action -Trigger $trigger -Settings $settings -Description 'Keeps the TradingView OI Profile indicator fed with live option-chain OI (follows the chart symbol).' | Out-Null
Start-ScheduledTask -TaskName $task
Start-Sleep 5
$running = Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'oi_watch\.mjs' }
if ($running) { "installed + running (pid $($running.ProcessId -join ',')); log: $log" } else { throw "task registered but watcher not running - see $log" }
