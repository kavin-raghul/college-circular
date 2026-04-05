@echo off
echo Starting Digital Circular Management System...

:: Start the Node.js Backend Server
echo Starting Backend Server on Port 5000...
start cmd /k "cd /d %~dp0backend && npm run dev || node server.js"

:: Start the React.js Frontend Server
echo Starting Frontend Server on Port 3000...
start cmd /k "cd /d %~dp0frontend && npm start"

echo Both servers are launching. Please check the new terminal windows!
pause
