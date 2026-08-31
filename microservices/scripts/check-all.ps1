$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Write-Host 'Checking JavaScript syntax and shared-import leaks...' -ForegroundColor Cyan
$files = Get-ChildItem $root -Recurse -File -Filter '*.js' | Where-Object { $_.FullName -notmatch '\\node_modules\\' }
$failed = $false
foreach ($file in $files) {
  node --check $file.FullName
  if ($LASTEXITCODE -ne 0) { $failed = $true }
}
$leaks = Select-String -Path ($files.FullName) -Pattern 'shared[\\/]' -SimpleMatch -ErrorAction SilentlyContinue
if ($leaks) {
  $failed = $true
  Write-Host 'Found forbidden shared implementation imports:' -ForegroundColor Red
  $leaks | ForEach-Object { Write-Host $_ }
}
if ($failed) { throw 'Validation failed.' }
Write-Host 'Static validation passed.' -ForegroundColor Green
