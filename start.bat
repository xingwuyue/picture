@echo off
echo Starting Image Compressor...
echo.

REM Check and install dependencies silently
if not exist "node_modules" (
    echo Installing dependencies...
    npm install >nul 2>&1
    if %errorlevel% neq 0 (
        echo Failed to install dependencies. Please run: npm install
        pause
        exit /b 1
    )
)

echo Starting server...
start /min npm run dev

echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo Opening browser...
start http://localhost:3000

echo.
echo Image Compressor is running!
echo Your browser should open automatically.
echo.
echo Press any key to stop the server and exit...
pause >nul

echo Stopping server...
taskkill /F /IM node.exe >nul 2>&1
exit