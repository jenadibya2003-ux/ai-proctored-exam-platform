@echo off
title ExamPro AI Platform Launcher
cd /d "%~dp0"

echo ====================================================
echo    Starting ExamPro AI - AI-Proctored Exam Platform
echo ====================================================
echo.

:: 1. Start FastAPI Backend if not already active
netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Starting FastAPI Backend on Port 8000...
    start /b "" "%~dp0backend\venv\Scripts\python.exe" -m uvicorn app.main:app --app-dir "%~dp0backend" --host 0.0.0.0 --port 8000
    timeout /t 2 /nobreak >nul
) else (
    echo [OK] Backend is already running on Port 8000.
)

:: 2. Start Next.js Frontend if not already active
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Starting Frontend Server on Port 3000...
    start /b "" cmd /c "cd /d %~dp0frontend && npm run start -- -H 0.0.0.0 -p 3000"
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Frontend is already running on Port 3000.
)

echo.
echo ====================================================
echo    Opening ExamPro AI in your default web browser...
echo ====================================================
start http://localhost:3000/login

exit
