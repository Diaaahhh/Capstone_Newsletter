@echo off
echo Stopping server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Starting server...
cd backend
start cmd /k "node server.js"
echo Server restarted!