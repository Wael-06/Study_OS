$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

npm install --no-fund --no-audit

$startupDir = [Environment]::GetFolderPath('Startup')
$startupVbs = Join-Path $PSScriptRoot 'startup_windows.vbs'
@"
Set shell = CreateObject("WScript.Shell")
shell.Run "cmd /c cd /d ""$PSScriptRoot"" && npm run dev", 0, False
WScript.Sleep 2500
shell.Run "http://127.0.0.1:5000", 1, False
"@ | Set-Content -Path $startupVbs -Encoding ASCII

$shortcutPath = Join-Path $startupDir 'Study OS.lnk'
$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut($shortcutPath)
$shortcut.TargetPath = 'wscript.exe'
$shortcut.Arguments = ('"' + $startupVbs + '"')
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.WindowStyle = 7
$shortcut.Save()

Write-Host "Study OS startup registered for this Windows user."
Write-Host "Starting Study OS..."
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev' -WorkingDirectory $PSScriptRoot
Start-Sleep -Seconds 2
Start-Process 'http://127.0.0.1:5000'
