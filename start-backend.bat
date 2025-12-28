@echo off
echo ================================================
echo CryptoSage AI - Starting Backend API
echo ================================================
echo.

cd backend

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if dependencies are installed
if not exist "venv\Lib\site-packages\fastapi\" (
    echo Installing dependencies...
    echo This may take a few minutes...
    pip install -r requirements.txt
    echo.
)

REM Start FastAPI server
echo.
echo ================================================
echo Starting FastAPI server...
echo ================================================
echo.
echo API will be available at:
echo - http://localhost:8000
echo - API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
