@echo off
echo Starting Voice-to-Text Servers...
echo.

echo Starting Python STT Server...
start "Python STT Server" cmd /k "cd /d "%~dp0" && python server.py"

echo Waiting 3 seconds for Python server to start...
timeout /t 3 /nobreak >nul

echo Starting Node.js Relay Server...
start "Node.js Relay Server" cmd /k "cd /d "%~dp0" && npm start"

echo.
echo Both servers are starting in separate windows.
echo.
echo Python STT Server: ws://localhost:2700
echo Node.js Relay: ws://localhost:5001
echo HTTP Status: http://localhost:5000
echo.
echo Press any key to exit this launcher...
pause >nul
