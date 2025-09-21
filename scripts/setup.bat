@echo off
echo � MStress Platform Setup
echo =========================
echo Setting up development environment...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.9+
    pause
    exit /b 1
) else (
    echo ✅ Python found
)

REM Create environment files
echo � Creating environment files...
if not exist frontend\.env (
    if exist frontend\.env.example (
        copy frontend\.env.example frontend\.env
    ) else (
        echo VITE_API_URL=http://localhost:5000 > frontend\.env
    )
)

if not exist backend\.env (
    if exist backend\.env.example (
        copy backend\.env.example backend\.env
    ) else (
        echo PORT=5000 > backend\.env
    )
)

if not exist ai-services\.env (
    if exist ai-services\.env.example (
        copy ai-services\.env.example ai-services\.env
    ) else (
        echo PORT=8000 > ai-services\.env
    )
)

REM Install dependencies
echo � Installing dependencies...
call npm install
cd frontend && call npm install && cd ..
cd backend && call npm install && cd ..
cd ai-services && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && call deactivate && cd ..

echo � Setup complete!
echo Run 'npm run dev' to start all services
pause
