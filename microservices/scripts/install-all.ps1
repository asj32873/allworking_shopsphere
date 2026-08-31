$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$projects = @(
  (Join-Path $root 'services\api-gateway'),
  (Join-Path $root 'services\auth'),
  (Join-Path $root 'services\product'),
  (Join-Path $root 'services\cart'),
  (Join-Path $root 'services\order'),
  (Join-Path $root 'services\payment'),
  (Join-Path $root 'services\user'),
  (Join-Path $root 'services\address'),
  (Join-Path $root 'services\review'),
  (Join-Path $root 'services\rag'),
  (Join-Path $root 'services\support'),
  (Join-Path $root 'services\vendor'),
  (Join-Path $root 'services\admin')
)
foreach ($project in $projects) {
  Write-Host "`n=== Installing $project ===" -ForegroundColor Cyan
  Push-Location $project
  try { npm install } finally { Pop-Location }
}
Write-Host "`nAll service dependencies installed." -ForegroundColor Green
