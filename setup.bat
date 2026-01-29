@echo off
REM FOURBYTE Development Setup Script (Windows)
REM This script automates the setup process for local development

echo.
echo ================================
echo 🔷 FOURBYTE Setup Script
echo ================================
echo.

REM Check Node.js installation
echo 📦 Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:~1%

if %NODE_MAJOR% LSS 18 (
    echo ⚠️  Node.js version is %NODE_MAJOR%. Version 18+ is recommended.
) else (
    echo ✅ Node.js detected
)

echo.

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install server dependencies
    exit /b 1
)
echo ✅ Server dependencies installed
cd ..

echo.

REM Install client dependencies
echo 📦 Installing client dependencies...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install client dependencies
    exit /b 1
)
echo ✅ Client dependencies installed
cd ..

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To start development:
echo.
echo    Terminal 1 (Server):
echo    $ cd server
echo    $ npm start
echo.
echo    Terminal 2 (Client):
echo    $ cd client
echo    $ npx ng serve
echo.
echo    Then open http://localhost:4200
echo.
pause
