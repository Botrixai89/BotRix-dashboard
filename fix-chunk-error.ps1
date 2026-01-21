Write-Host "🔧 Fixing ChunkLoadError..." -ForegroundColor Green

# Stop any running Next.js processes
Write-Host "Stopping any running Next.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force

# Clear Next.js cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cache cleared!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No .next directory found" -ForegroundColor Blue
}

# Clear node_modules and reinstall (optional, uncomment if needed)
# Write-Host "Clearing node_modules..." -ForegroundColor Yellow
# if (Test-Path "node_modules") {
#     Remove-Item -Recurse -Force "node_modules"
#     Write-Host "✅ node_modules cleared!" -ForegroundColor Green
# }

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Start development server
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev
