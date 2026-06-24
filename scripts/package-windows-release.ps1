param(
  [string]$OutputDir = "release",
  [string]$PackageName = "stratos-windows-release"
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ReleaseRoot = Join-Path $Root $OutputDir
$Stamp = [DateTime]::UtcNow.ToString("yyyyMMddHHmmss")
$Staging = Join-Path ([System.IO.Path]::GetTempPath()) "$PackageName-staging-$Stamp"
$ArchivePath = Join-Path $ReleaseRoot "$PackageName-$Stamp.zip"

function Reset-PathAttributes([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
    try { $_.Attributes = "Normal" } catch { }
  }
  try { (Get-Item -Path $Path -Force).Attributes = "Normal" } catch { }
}

function Copy-Required([string]$Source, [string]$Destination) {
  if (-not (Test-Path $Source)) {
    throw "Missing required path: $Source"
  }
  if ((Test-Path $Destination) -and (-not $Source.EndsWith("\*"))) {
    Reset-PathAttributes $Destination
    Remove-Item -Path $Destination -Recurse -Force -ErrorAction SilentlyContinue
  }
  Copy-Item -Path $Source -Destination $Destination -Recurse -Force
}

function Remove-IfExists([string]$Path) {
  if (Test-Path $Path) {
    Reset-PathAttributes $Path
    Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
  }
}

if (-not (Test-Path (Join-Path $Root ".next\standalone\server.js"))) {
  throw "Missing .next\standalone\server.js. Run npm.cmd run build first."
}

Remove-IfExists $Staging
New-Item -ItemType Directory -Force -Path $Staging, $ReleaseRoot | Out-Null

Copy-Required (Join-Path $Root ".next\standalone\*") $Staging

$nextDir = Join-Path $Staging ".next"
New-Item -ItemType Directory -Force -Path $nextDir | Out-Null
Copy-Required (Join-Path $Root ".next\static") (Join-Path $nextDir "static")

Copy-Required (Join-Path $Root "public") (Join-Path $Staging "public")
Remove-IfExists (Join-Path $Staging "public\uploads")
New-Item -ItemType Directory -Force -Path `
  (Join-Path $Staging "logs"), `
  (Join-Path $Staging "public\uploads\plans"), `
  (Join-Path $Staging "public\uploads\reports") | Out-Null

Copy-Required (Join-Path $Root "prisma") (Join-Path $Staging "prisma")
Copy-Required (Join-Path $Root "lib") (Join-Path $Staging "lib")
Copy-Required (Join-Path $Root "config") (Join-Path $Staging "config")
Copy-Required (Join-Path $Root "package.json") (Join-Path $Staging "package.json")
Copy-Required (Join-Path $Root "package-lock.json") (Join-Path $Staging "package-lock.json")
Copy-Required (Join-Path $Root "tsconfig.json") (Join-Path $Staging "tsconfig.json")

New-Item -ItemType Directory -Force -Path `
  (Join-Path $Staging "scripts"), `
  (Join-Path $Staging "db") | Out-Null

Copy-Required (Join-Path $Root "deploy\windows\scripts\Configure-Env.ps1") (Join-Path $Staging "scripts\Configure-Env.ps1")
Copy-Required (Join-Path $Root "deploy\windows\scripts\Import-Env.ps1") (Join-Path $Staging "scripts\Import-Env.ps1")
Copy-Required (Join-Path $Root "deploy\windows\scripts\Init-Database.ps1") (Join-Path $Staging "scripts\Init-Database.ps1")
Copy-Required (Join-Path $Root "deploy\windows\scripts\Start-StratOS.ps1") (Join-Path $Staging "scripts\Start-StratOS.ps1")
Copy-Required (Join-Path $Root "deploy\windows\scripts\Stop-StratOS.ps1") (Join-Path $Staging "scripts\Stop-StratOS.ps1")
Copy-Required (Join-Path $Root "deploy\windows\scripts\Check-Health.ps1") (Join-Path $Staging "scripts\Check-Health.ps1")
Copy-Required (Join-Path $Root "deploy\windows\scripts\Deploy.ps1") (Join-Path $Staging "scripts\Deploy.ps1")
Copy-Required (Join-Path $Root "deploy\windows\env.production.example") (Join-Path $Staging "env.production.example")
Copy-Required (Join-Path $Root "deploy\windows\db\create-database-template.sql") (Join-Path $Staging "db\create-database-template.sql")

$nodeModules = Join-Path $Staging "node_modules"
New-Item -ItemType Directory -Force -Path $nodeModules | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $nodeModules ".bin") | Out-Null
Copy-Required (Join-Path $Root "node_modules\.bin\prisma") (Join-Path $nodeModules ".bin\prisma")
Copy-Required (Join-Path $Root "node_modules\.bin\prisma.cmd") (Join-Path $nodeModules ".bin\prisma.cmd")
Copy-Required (Join-Path $Root "node_modules\.bin\prisma.ps1") (Join-Path $nodeModules ".bin\prisma.ps1")
Copy-Required (Join-Path $Root "node_modules\.bin\tsx") (Join-Path $nodeModules ".bin\tsx")
Copy-Required (Join-Path $Root "node_modules\.bin\tsx.cmd") (Join-Path $nodeModules ".bin\tsx.cmd")
Copy-Required (Join-Path $Root "node_modules\.bin\tsx.ps1") (Join-Path $nodeModules ".bin\tsx.ps1")
Copy-Required (Join-Path $Root "node_modules\.prisma") (Join-Path $nodeModules ".prisma")
Copy-Required (Join-Path $Root "node_modules\@prisma") (Join-Path $nodeModules "@prisma")
Copy-Required (Join-Path $Root "node_modules\prisma") (Join-Path $nodeModules "prisma")
Copy-Required (Join-Path $Root "node_modules\tsx") (Join-Path $nodeModules "tsx")
Copy-Required (Join-Path $Root "node_modules\esbuild") (Join-Path $nodeModules "esbuild")
Copy-Required (Join-Path $Root "node_modules\@esbuild") (Join-Path $nodeModules "@esbuild")
Copy-Required (Join-Path $Root "node_modules\get-tsconfig") (Join-Path $nodeModules "get-tsconfig")
Copy-Required (Join-Path $Root "node_modules\resolve-pkg-maps") (Join-Path $nodeModules "resolve-pkg-maps")

$removePaths = @(
  ".env",
  ".env.local",
  ".env.production",
  ".git",
  ".github",
  ".cursor",
  ".next\cache",
  "app",
  "components",
  "AGENTS.md",
  "CLAUDE.md",
  "deploy",
  "docs",
  "e2e",
  "nginx",
  "release",
  "docker-compose.prod.yml",
  "docker-compose.yml",
  "Dockerfile",
  "eslint.config.mjs",
  "harness-report.json",
  "next.config.ts",
  "playwright.config.ts",
  "postcss.config.mjs",
  "instrumentation.ts",
  "proxy.ts",
  "README.md",
  "stratos-dev-current.out.log",
  "stratos-dev-current.err.log",
  "stratos-dev.out.log",
  "stratos-dev.err.log",
  "tsconfig.tsbuildinfo",
  "public\public",
  "prisma\prisma",
  "scripts\scripts"
)

foreach ($rel in $removePaths) {
  Remove-IfExists (Join-Path $Staging $rel)
}

if (Test-Path $ArchivePath) {
  Reset-PathAttributes $ArchivePath
  Remove-Item -Path $ArchivePath -Force -ErrorAction SilentlyContinue
}

Compress-Archive -Path (Join-Path $Staging "*") -DestinationPath $ArchivePath -Force

$sizeMb = [Math]::Round((Get-Item $ArchivePath).Length / 1MB, 2)
Write-Host "Wrote $ArchivePath ($sizeMb MB)"
