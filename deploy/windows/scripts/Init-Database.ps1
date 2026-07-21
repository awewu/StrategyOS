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

function Invoke-CompatibilityMigration {
  param(
    [string]$Name,
    [string]$RelativePath
  )

  $migrationPath = Join-Path $AppRoot $RelativePath
  if (-not (Test-Path $migrationPath)) {
    Write-Host "Skipping compatibility migration $Name (not found)."
    return
  }

  Write-Host "Applying compatibility migration: $Name"
  Run-Checked "npx.cmd" @(
    "prisma",
    "db",
    "execute",
    "--file",
    $migrationPath,
    "--schema",
    (Join-Path $AppRoot "prisma\schema.prisma")
  )
}

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL is empty in .env.production"
}

Write-Host "Generating Prisma Client..."
Run-Checked "npx.cmd" @("prisma", "generate")

Write-Host "Applying idempotent compatibility migrations before prisma db push..."
Invoke-CompatibilityMigration "rename brand codes" "prisma\migrations\20260720000000_rename_brand_codes\migration.sql"
Invoke-CompatibilityMigration "SWOT positioning fields" "prisma\migrations\20260720010000_swot_positioning_fields\migration.sql"
Invoke-CompatibilityMigration "KPI stable link fields" "prisma\migrations\20260720020000_kpi_stable_link\migration.sql"

Write-Host "Synchronizing PostgreSQL schema with prisma db push..."
Run-Checked "npx.cmd" @("prisma", "db", "push")

if ($SkipSeed -or $env:STRATOS_SKIP_SEED -eq "1") {
  Write-Host "Skipping seed."
} else {
  Write-Host "Seeding database..."
  Run-Checked "npx.cmd" @("tsx", "prisma/seed.ts")
}

