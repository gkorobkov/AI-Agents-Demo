@echo off
call "%~dp0ui-build.cmd" %*
if errorlevel 1 exit /b 1
call "%~dp0ui-deploy.cmd"