$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$services = @(
  'api-gateway','auth','user','product','cart','order',
  'payment','address','vendor','review','rag','support','admin'
)
foreach ($svc in $services) {
  $tag = "shopsphere/$svc-service:latest"
  if ($svc -eq 'api-gateway') { $tag = "shopsphere/api-gateway:latest" }
  Write-Host "`n=== Building $tag ===" -ForegroundColor Cyan
  docker build -t $tag -f "$root/services/$svc/Dockerfile" $root
}
Write-Host "`nAll images built." -ForegroundColor Green
