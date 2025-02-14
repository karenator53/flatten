@echo off
echo Stopping Code Doc Generator...

REM Kill any running Node.js processes
taskkill /F /IM node.exe

echo All servers stopped! 