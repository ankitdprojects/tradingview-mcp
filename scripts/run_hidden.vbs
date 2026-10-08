' Run a command with NO console window at all (window style 0, no flash).
' Usage: wscript.exe run_hidden.vbs "<command line>"
' Used by the "TradingView OI Watch" task and the "TradingView (with OI)" shortcut: powershell's own
' -WindowStyle Hidden still creates the console first and hides it a moment later, which Task
' Scheduler sometimes leaves visible.
If WScript.Arguments.Count < 1 Then WScript.Quit 1
CreateObject("WScript.Shell").Run WScript.Arguments(0), 0, False
