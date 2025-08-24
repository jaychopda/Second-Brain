@echo off
echo Starting Second Brain Services...
echo.

echo Starting Frontend...
start "Frontend" cmd /k "cd Frontend && npm run dev"

echo Starting Backend...
start "Backend" cmd /k "cd Backend && npm run dev"

echo Starting AI Service...
start "AI Service" cmd /k "cd ai_service && python manage.py runserver"

echo Starting WebSocket Server...
start "WebSocket Server" cmd /k "cd Chat && python WebSocketServer.py"

echo.
echo All services are starting in separate windows...
echo.
pause
