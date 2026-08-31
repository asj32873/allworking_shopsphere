$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$services = @(
  @{Name='api-gateway'; Path='services\api-gateway'},
  @{Name='auth'; Path='services\auth'},
  @{Name='product'; Path='services\product'},
  @{Name='cart'; Path='services\cart'},
  @{Name='order'; Path='services\order'},
  @{Name='payment'; Path='services\payment'},
  @{Name='user'; Path='services\user'},
  @{Name='address'; Path='services\address'},
  @{Name='review'; Path='services\review'},
  @{Name='rag'; Path='services\rag'},
  @{Name='support'; Path='services\support'},
  @{Name='vendor'; Path='services\vendor'},
  @{Name='admin'; Path='services\admin'}
)
foreach ($service in $services) {
  $dir = Join-Path $root $service.Path
  Write-Host "Starting $($service.Name)..." -ForegroundColor Cyan
  Start-Process powershell -ArgumentList '-NoExit','-Command',"Set-Location -LiteralPath '$dir'; npm start" -WorkingDirectory $dir
  Start-Sleep -Milliseconds 300
}
Write-Host "`nAll service terminals started. Gateway: http://localhost:5001" -ForegroundColor Green
