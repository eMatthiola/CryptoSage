@echo off
echo ================================================
echo CryptoSage AI - Starting Frontend
echo ================================================
echo.

cd frontend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    echo This may take a few minutes...
    npm install
    echo.
)

REM Start Next.js development server
echo.
echo ================================================
echo Starting Next.js development server...
echo ================================================
echo.
echo Frontend will be available at:
echo - http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
