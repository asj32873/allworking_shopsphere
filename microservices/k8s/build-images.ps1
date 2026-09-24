$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

$services = @(
  'api-gateway',
  'auth',
  'user',
  'product',
  'cart',
  'order',
  'payment',
  'address',
  'vendor',
  'review',
  'rag',
  'support',
  'admin'
)

foreach ($svc in $services) {

  $tag = "asj32873/shopsphere-$svc:latest"

  Write-Host "`n=== Building $tag ===" -ForegroundColor Cyan

  docker build `
    -t $tag `
    -f "$root/services/$svc/Dockerfile" `
    $root

  Write-Host "=== Pushing $tag ===" -ForegroundColor Yellow

  docker push $tag
}

Write-Host "`nAll images built and pushed." -ForegroundColor Green