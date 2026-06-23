param(
  [string]$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
$pidPath = Join-Path $AppRoot "stratos.pid"

if (-not (Test-Path $pidPath)) {
  Write-Host "No stratos.pid found."
  exit 0
}

$pidValue = Get-Content $pidPath -ErrorAction SilentlyContinue
if ($pidValue) {
  $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $pidValue -Force
    Write-Host "Stopped StratOS PID $pidValue"
  }
}

Remove-Item $pidPath -Force -ErrorAction SilentlyContinue

