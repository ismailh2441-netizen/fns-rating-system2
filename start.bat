@echo off
cd /d "%~dp0"
echo Installing dependencies (first run only)...
call npx vite --open
pause
