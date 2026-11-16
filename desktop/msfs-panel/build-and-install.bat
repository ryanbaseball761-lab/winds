@echo off
setlocal
title Trade Winds in-sim panel
echo.
echo  Trade Winds: building the in-sim toolbar panel
echo  ----------------------------------------------
set "SDK=%MSFS2024_SDK%"
if "%SDK%"=="" set "SDK=%MSFS_SDK%"
if "%SDK%"=="" (
  echo  The free MSFS SDK isn't installed.
  echo  In MSFS: Options ^> General ^> Developers ^> Developer Mode ON, then the
  echo  menu bar Help ^> SDK Installer. Install it, restart your PC, run this again.
  pause & exit /b 1
)
"%SDK%\Tools\bin\fspackagetool.exe" "%~dp0trade-winds-panel\Build\trade-winds-panel.xml" -nomirroring
if errorlevel 1 ( echo  Build failed. & pause & exit /b 1 )
copy /Y "%~dp0trade-winds-panel\Build\Packages\trade-winds-panel\Build\trade-winds-panel.spb" "%~dp0trade-winds-panel\InGamePanels\" >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
pause
