param(
  [string]$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

function Read-Required([string]$Prompt, [string]$Default = "") {
  $suffix = if ($Default) { " [$Default]" } else { "" }
  do {
    $value = Read-Host "$Prompt$suffix"
    if (-not $value -and $Default) { $value = $Default }
  } while (-not $value)
  return $value
}

function Read-Optional([string]$Prompt, [string]$Default = "") {
  $suffix = if ($Default) { " [$Default]" } else { "" }
  $value = Read-Host "$Prompt$suffix"
  if (-not $value) { return $Default }
  return $value
}

function New-SessionSecret {
  $bytes = New-Object byte[] 48
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
  } finally {
    $rng.Dispose()
  }
}

$envPath = Join-Path $AppRoot ".env.production"
$examplePath = Join-Path $AppRoot "env.production.example"

if (Test-Path $envPath) {
  $overwrite = Read-Host ".env.production already exists. Overwrite? Type YES to overwrite"
  if ($overwrite -ne "YES") {
    Write-Host "Keeping existing .env.production"
    exit 0
  }
}

if (-not (Test-Path $examplePath)) {
  throw "Missing template: $examplePath"
}

$publicUrl = Read-Required "Public HTTPS URL, for example https://stratos.example.com"
$dbUrl = Read-Required "PostgreSQL DATABASE_URL"
$enableWorkos = Read-Optional "Enable WorkOS SSO now? Type YES to enable, or press Enter to skip" ""
if ($enableWorkos -eq "YES") {
  $workosClientId = Read-Required "WORKOS_CLIENT_ID"
  $workosApiKey = Read-Required "WORKOS_API_KEY"
  $workosOrgId = Read-Optional "WORKOS_ORGANIZATION_ID (optional)"
  $workosWebhookSecret = Read-Optional "WORKOS_WEBHOOK_SECRET (recommended)"
} else {
  $workosClientId = ""
  $workosApiKey = ""
  $workosOrgId = ""
  $workosWebhookSecret = ""
}

$enableTandem = Read-Optional "Enable Tandem SSO now? Type YES to enable, or press Enter to skip" ""
if ($enableTandem -eq "YES") {
  $tandemClientId = Read-Required "TANDEM_CLIENT_ID"
  $tandemClientSecret = Read-Required "TANDEM_CLIENT_SECRET"
  $tandemIssuer = Read-Optional "TANDEM_ISSUER" "https://ai.rhautt.com"
} else {
  $tandemClientId = ""
  $tandemClientSecret = ""
  $tandemIssuer = "https://ai.rhautt.com"
}

$ssoEnabled = ($enableWorkos -eq "YES") -or ($enableTandem -eq "YES")
if ($ssoEnabled) {
  $requireAuth = "1"
  $skipEnvValidate = "0"
} else {
  $requireAuth = "0"
  $skipEnvValidate = "1"
  Write-Host "No SSO enabled. STRATOS_REQUIRE_AUTH=0 will be written for initial deployment."
}
$openAiKey = Read-Optional "OPENAI_API_KEY (optional)"
$port = Read-Optional "Local app port behind Nginx" "3000"
$sessionSecret = New-SessionSecret
$redirectUri = if ($enableWorkos -eq "YES") { "$($publicUrl.TrimEnd('/'))/api/auth/callback" } else { "" }
$tandemRedirectUri = if ($enableTandem -eq "YES") { "$($publicUrl.TrimEnd('/'))/api/auth/tandem/callback" } else { "" }

$content = Get-Content $examplePath -Raw
$content = $content -replace "(?m)^PORT=.*$", "PORT=$port"
$content = $content -replace "(?m)^DATABASE_URL=.*$", "DATABASE_URL=$dbUrl"
$content = $content -replace "(?m)^STRATOS_PUBLIC_URL=.*$", "STRATOS_PUBLIC_URL=$publicUrl"
$content = $content -replace "(?m)^STRATOS_BASE_URL=.*$", "STRATOS_BASE_URL=$publicUrl"
$content = $content -replace "(?m)^STRATOS_REQUIRE_AUTH=.*$", "STRATOS_REQUIRE_AUTH=$requireAuth"
$content = $content -replace "(?m)^STRATOS_SESSION_SECRET=.*$", "STRATOS_SESSION_SECRET=$sessionSecret"
$content = $content -replace "(?m)^STRATOS_SKIP_ENV_VALIDATE=.*$", "STRATOS_SKIP_ENV_VALIDATE=$skipEnvValidate"
$content = $content -replace "(?m)^WORKOS_CLIENT_ID=.*$", "WORKOS_CLIENT_ID=$workosClientId"
$content = $content -replace "(?m)^WORKOS_API_KEY=.*$", "WORKOS_API_KEY=$workosApiKey"
$content = $content -replace "(?m)^WORKOS_REDIRECT_URI=.*$", "WORKOS_REDIRECT_URI=$redirectUri"
$content = $content -replace "(?m)^WORKOS_ORGANIZATION_ID=.*$", "WORKOS_ORGANIZATION_ID=$workosOrgId"
$content = $content -replace "(?m)^WORKOS_WEBHOOK_SECRET=.*$", "WORKOS_WEBHOOK_SECRET=$workosWebhookSecret"
$content = $content -replace "(?m)^TANDEM_CLIENT_ID=.*$", "TANDEM_CLIENT_ID=$tandemClientId"
$content = $content -replace "(?m)^TANDEM_CLIENT_SECRET=.*$", "TANDEM_CLIENT_SECRET=$tandemClientSecret"
$content = $content -replace "(?m)^TANDEM_REDIRECT_URI=.*$", "TANDEM_REDIRECT_URI=$tandemRedirectUri"
$content = $content -replace "(?m)^TANDEM_ISSUER=.*$", "TANDEM_ISSUER=$tandemIssuer"
$content = $content -replace "(?m)^OPENAI_API_KEY=.*$", "OPENAI_API_KEY=$openAiKey"

Set-Content -Path $envPath -Value $content -Encoding UTF8

Write-Host "Wrote $envPath"
if ($enableWorkos -eq "YES") {
  Write-Host "Set WorkOS Redirect URI to: $redirectUri"
  Write-Host "Set WorkOS Webhook URL to: $($publicUrl.TrimEnd('/'))/api/auth/workos/webhook"
}
if ($enableTandem -eq "YES") {
  Write-Host "Register this Tandem Redirect URI at https://ai.rhautt.com/admin/sso: $tandemRedirectUri"
}
if (-not $ssoEnabled) {
  Write-Host "No SSO enabled. You can enable WorkOS or Tandem later by editing .env.production and re-running Deploy.ps1."
}
Write-Host "Nginx is maintained outside this package. Proxy your public host to http://127.0.0.1:$port."
