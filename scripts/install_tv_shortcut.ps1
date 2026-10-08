# Create the desktop shortcut "TradingView (with OI)" that starts TradingView with the debug port
# the MCP and the OI feeder need. Use it instead of the Store icon.
# Run once:  powershell -ExecutionPolicy Bypass -File scripts/install_tv_shortcut.ps1
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$node = (Get-Command node).Source
$desktop = [Environment]::GetFolderPath('Desktop')
$lnk = Join-Path $desktop 'TradingView (with OI).lnk'
$icon = (Get-AppxPackage -Name 'TradingView.Desktop' -ErrorAction SilentlyContinue).InstallLocation
$iconPath = if ($icon -and (Test-Path (Join-Path $icon 'TradingView.exe'))) { Join-Path $icon 'TradingView.exe' } else { $node }

$sh = New-Object -ComObject WScript.Shell
$s = $sh.CreateShortcut($lnk)
# wscript + run_hidden.vbs: no console window at all (plain powershell -WindowStyle Hidden still flashes one)
$inner = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File $(Join-Path $repo 'scripts\tv_launch_shortcut.ps1')"
$s.TargetPath = 'wscript.exe'
$s.Arguments = "`"$(Join-Path $repo 'scripts\run_hidden.vbs')`" `"$inner`""
$s.WorkingDirectory = $repo
$s.IconLocation = "$iconPath,0"
$s.Description = 'TradingView Desktop with the debug port (OI Profile feed + Claude MCP)'
$s.Save()
"created $lnk"
