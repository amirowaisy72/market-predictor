@echo off
REM Market Predictor - start script (Windows)
REM Starts the dashboard and opens it in the browser.

REM engine will start here

start "Market Predictor Dashboard" cmd /k "cd /d %~dp0dashboard && npm run dev"

timeout /t 5 /nobreak >nul
start http://localhost:3000
