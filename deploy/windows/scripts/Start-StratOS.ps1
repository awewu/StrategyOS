param(
  [string]$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
Set-Location $AppRoot
. (Join-Path $PSScriptRoot "Import-Env.ps1") -EnvPath (Join-Path $AppRoot ".env.production")

$logs = Join-Path $AppRoot "logs"
$uploadsPlans = Join-Path $AppRoot "public\uploads\plans"
$uploadsReports = Join-Path $AppRoot "public\uploads\reports"
New-Item -ItemType Directory -Force -Path $logs, $uploadsPlans, $uploadsReports | Out-Null

$pidPath = Join-Path $AppRoot "stratos.pid"
if (Test-Path $pidPath) {
  $oldPid = Get-Content $pidPath -ErrorAction SilentlyContinue
  if ($oldPid -and (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) {
    Write-Host "StratOS already running with PID $oldPid"
    exit 0
  }
}

$outLog = Join-Path $logs "stratos.out.log"
$errLog = Join-Path $logs "stratos.err.log"
$server = Join-Path $AppRoot "server.js"
if (-not (Test-Path $server)) {
  throw "Missing server.js. This must be a built standalone release package."
}

$process = Start-Process -FilePath "node.exe" `
  -ArgumentList "server.js" `
  -WorkingDirectory $AppRoot `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $pidPath -Value $process.Id -Encoding ASCII
Write-Host "Started StratOS PID $($process.Id) on http://127.0.0.1:$($env:PORT)"

