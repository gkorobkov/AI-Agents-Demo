@echo off
set "PORT=%~1"
if "%PORT%"=="" set "PORT=8080"

start "AI Agent UI" npx serve "%~dp0ui" --listen %PORT% --no-clipboard --cors
echo UI: http://localhost:%PORT%/
