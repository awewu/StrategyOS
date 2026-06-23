param(
  [string]$EnvPath = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")).Path ".env.production")
)

if (-not (Test-Path $EnvPath)) {
  throw "Missing $EnvPath. Run .\scripts\Configure-Env.ps1 first."
}

Get-Content $EnvPath | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $idx = $line.IndexOf("=")
  if ($idx -lt 1) { return }
  $key = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1).Trim()
  if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  [Environment]::SetEnvironmentVariable($key, $value, "Process")
}

