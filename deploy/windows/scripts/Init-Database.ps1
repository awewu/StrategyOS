param(
  [string]$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
Set-Location $AppRoot
. (Join-Path $PSScriptRoot "Import-Env.ps1") -EnvPath (Join-Path $AppRoot ".env.production")

function Run-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL is empty in .env.production"
}

Write-Host "Generating Prisma Client..."
Run-Checked "npx.cmd" @("prisma", "generate")

Write-Host "Synchronizing PostgreSQL schema with prisma db push..."
Run-Checked "npx.cmd" @("prisma", "db", "push")

if ($SkipSeed -or $env:STRATOS_SKIP_SEED -eq "1") {
  Write-Host "Skipping seed."
} else {
  Write-Host "Seeding database..."
  Run-Checked "npx.cmd" @("tsx", "prisma/seed.ts")
}

