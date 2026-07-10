param(
  [string]$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$SkipDb,
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
Set-Location $AppRoot

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
  throw "Node.js is not in PATH. Install Node.js 20 LTS first."
}

if (-not (Test-Path (Join-Path $AppRoot ".env.production"))) {
  Write-Host ".env.production not found. Starting configuration..."
  & (Join-Path $PSScriptRoot "Configure-Env.ps1") -AppRoot $AppRoot
}

. (Join-Path $PSScriptRoot "Import-Env.ps1") -EnvPath (Join-Path $AppRoot ".env.production")

if (-not $env:STRATOS_LLM_API_KEY -and -not $env:OPENAI_API_KEY) {
  throw "Missing STRATOS_LLM_API_KEY. Bailian credentials are required for AI extraction and automatic PDF OCR."
}

$pdfJsEntry = Join-Path $AppRoot "node_modules\pdfjs-dist\legacy\build\pdf.mjs"
if (-not (Test-Path $pdfJsEntry)) {
  throw "Missing PDF.js runtime assets: $pdfJsEntry"
}

& node.exe -e "require('@napi-rs/canvas'); console.log('Canvas OCR runtime OK')"
if ($LASTEXITCODE -ne 0) {
  throw "Canvas OCR native runtime failed to load (exit code $LASTEXITCODE). Use the Windows x64 release package."
}

if (-not $SkipDb) {
  & (Join-Path $PSScriptRoot "Init-Database.ps1") -AppRoot $AppRoot -SkipSeed:$SkipSeed
}

& (Join-Path $PSScriptRoot "Stop-StratOS.ps1") -AppRoot $AppRoot
& (Join-Path $PSScriptRoot "Start-StratOS.ps1") -AppRoot $AppRoot

Start-Sleep -Seconds 5
& (Join-Path $PSScriptRoot "Check-Health.ps1") -AppRoot $AppRoot

Write-Host ""
Write-Host "Deploy completed. If Nginx is used, keep its config outside this app package and proxy to http://127.0.0.1:$($env:PORT)."
