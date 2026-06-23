param(
  [string]$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Import-Env.ps1") -EnvPath (Join-Path $AppRoot ".env.production")

$baseUrl = if ($env:STRATOS_BASE_URL) { $env:STRATOS_BASE_URL.TrimEnd("/") } else { "http://127.0.0.1:$($env:PORT)" }
$localUrl = "http://127.0.0.1:$($env:PORT)/api/health?format=json&probe=readiness"

Write-Host "Local readiness: $localUrl"
try {
  Invoke-WebRequest -UseBasicParsing -Uri $localUrl -TimeoutSec 20 | Select-Object -ExpandProperty Content
} catch {
  Write-Host "Local health failed:"
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
  }
  throw
}

Write-Host "Public health: $baseUrl/api/health?format=json"
try {
  Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/health?format=json" -TimeoutSec 20 | Select-Object -ExpandProperty Content
} catch {
  Write-Host "Public health failed:"
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
  }
  throw
}

