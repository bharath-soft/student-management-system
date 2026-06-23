@echo off
title RVS Student Management System
color 0A

echo =====================================================
echo   RVS Student Management System - Launcher
echo =====================================================
echo.

set NODE_PATH=c:\Users\bhara\Music\Student-Management-System\node-portable\node-v20.11.1-win-x64
set PATH=%NODE_PATH%;%PATH%

echo [1/2] Starting Backend Server (Port 5000)...
start "RVS Backend - Port 5000" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d c:\Users\bhara\Music\Student-Management-System\backend && node server.js"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 5173)...
start "RVS Frontend - Port 5173" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d c:\Users\bhara\Music\Student-Management-System\frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo =====================================================
echo   Both servers are now starting up!
echo   Open your browser and go to:
echo   http://localhost:5173
echo =====================================================
echo.

start "" "http://localhost:5173"

pause
