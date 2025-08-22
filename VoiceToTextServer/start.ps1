Write-Host "Starting Voice-to-Text Servers..." -ForegroundColor Green
Write-Host ""

# Start Python STT Server
Write-Host "Starting Python STT Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; python server.py" -WindowStyle Normal

# Wait for Python server to start
Write-Host "Waiting 3 seconds for Python server to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Start Node.js Relay Server
Write-Host "Starting Node.js Relay Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting in separate windows." -ForegroundColor Green
Write-Host ""
Write-Host "Python STT Server: ws://localhost:2700" -ForegroundColor Cyan
Write-Host "Node.js Relay: ws://localhost:5001" -ForegroundColor Cyan
Write-Host "HTTP Status: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
