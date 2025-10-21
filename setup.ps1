# MStress Setup Script
# This script installs all dependencies for the MStress application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MStress Application Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js $nodeVersion is installed" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js is not installed. Please install Node.js v14 or higher." -ForegroundColor Red
    exit 1
}

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>$null
if ($pythonVersion) {
    Write-Host "✓ $pythonVersion is installed" -ForegroundColor Green
} else {
    Write-Host "✗ Python is not installed. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
$mongoTest = mongosh --eval "db.adminCommand('ping')" 2>$null
if ($mongoTest) {
    Write-Host "✓ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "⚠ MongoDB is not running. Please start MongoDB before running the application." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installing Backend Dependencies..." -ForegroundColor Cyan
cd backend
if (Test-Path "node_modules") {
    Write-Host "Backend dependencies already installed. Skipping..." -ForegroundColor Yellow
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
        exit 1
    }
}
cd ..

Write-Host ""
Write-Host "Installing Frontend Dependencies..." -ForegroundColor Cyan
cd frontend
if (Test-Path "node_modules") {
    Write-Host "Frontend dependencies already installed. Skipping..." -ForegroundColor Yellow
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
}
cd ..

Write-Host ""
Write-Host "Installing AI Services Dependencies..." -ForegroundColor Cyan
cd ai-services

# Check if virtual environment exists
if (Test-Path "venv") {
    Write-Host "Virtual environment already exists. Activating..." -ForegroundColor Yellow
    & ".\venv\Scripts\Activate.ps1"
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & ".\venv\Scripts\Activate.ps1"
}

# Install Python dependencies
Write-Host "Installing Python packages..." -ForegroundColor Yellow
pip install --upgrade pip
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AI Services dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install AI Services dependencies" -ForegroundColor Red
    exit 1
}

cd ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Ensure MongoDB is running" -ForegroundColor White
Write-Host "2. Run: .\start.ps1" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see Usage.md" -ForegroundColor Cyan

