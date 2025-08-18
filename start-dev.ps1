# PowerShell script to start Telugu Bhasha Gyan development environment

Write-Host "Starting Telugu Bhasha Gyan Development Environment" -ForegroundColor Green

Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ./server; npm run dev"

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "Development environment started!" -ForegroundColor Green
Write-Host "Backend: https://service-3-backend-production.up.railway.app" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Yellow