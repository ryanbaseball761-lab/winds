@echo off
title MSFS Bridge setup
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed. Download the LTS version from https://nodejs.org, install it, then run this file again.
  echo.
  pause
  exit /b 1
)
echo Installing the MSFS Bridge (this takes a minute)...
call npm install --omit=dev
if errorlevel 1 (
  echo.
  echo The install failed. Check your internet connection and try again.
  pause
  exit /b 1
)
echo.
echo Done. Now add the bridge to the Claude desktop app. The steps are in README.txt.
echo The path to use in the config is:
echo    %~dp0server.js
echo.
pause
