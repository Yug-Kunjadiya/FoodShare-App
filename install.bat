@echo off
echo 🍲 FoodShare App - Installation Script
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v16 or higher) first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 16 (
    echo ❌ Node.js version 16 or higher is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version detected:
node --version
echo.

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed
echo.

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed
echo.

REM Return to root directory
cd ..

echo 🎉 Installation completed successfully!
echo.
echo 📋 Next steps:
echo 1. Copy backend\env.example to backend\.env and configure your environment variables
echo 2. Copy frontend\env.example to frontend\.env and configure your environment variables
echo 3. Start the backend: cd backend ^&^& npm run dev
echo 4. Start the frontend: cd frontend ^&^& npm start
echo.
echo 🔑 Required environment variables:
echo    - MongoDB connection string
echo    - JWT secret
echo    - Cloudinary credentials
echo    - Google Maps API key
echo.
echo 📚 For more information, see the README.md file
echo.
pause 