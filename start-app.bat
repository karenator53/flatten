@echo off
echo Starting Code Doc Generator...

REM Start the backend server
start cmd /k "npm run start"

REM Start the frontend development server
cd frontend
start cmd /k "npm run dev"

REM Wait for the servers to start
timeout /t 5

REM Open Edge browser
start msedge "http://localhost:5173"

echo App is running!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000 