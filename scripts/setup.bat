@echo off
echo íº€ MStress Platform Setup
echo =========================
echo Setting up development environment...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo âŒ Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
) else (
    echo âœ… Node.js found
)

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo âŒ Python not found. Please install Python 3.9+
    pause
    exit /b 1
) else (
    echo âœ… Python found
)

REM Create environment files
echo í³ Creating environment files...
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
echo í³¦ Installing dependencies...
call npm install
cd frontend && call npm install && cd ..
cd backend && call npm install && cd ..
cd ai-services && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && call deactivate && cd ..

echo í¾‰ Setup complete!
echo Run 'npm run dev' to start all services
pause
