# Target of the desktop shortcut "TradingView (with OI)" (run hidden via scripts/run_hidden.vbs).
# Starts TradingView with the debug port, or does nothing if it is already reachable.
$repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repo
& (Get-Command node).Source scripts/tv_launch.mjs --if-needed *> (Join-Path $repo 'logs\tv_launch.log')
