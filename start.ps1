# MStress Start Script
# This script starts all three services: AI Services, Backend, and Frontend

Write-Host "MStress Application Startup" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
$mongoRunning = $false

# Try to connect to MongoDB on localhost:27017
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("127.0.0.1", 27017)
    if ($tcpClient.Connected) {
        $mongoRunning = $true
        Write-Host "[OK] MongoDB is running on localhost:27017" -ForegroundColor Green
    }
    $tcpClient.Close()
} catch {
    $mongoRunning = $false
}

if (-not $mongoRunning) {
    Write-Host "[WARNING] MongoDB is not running on localhost:27017. Please start MongoDB before continuing." -ForegroundColor Yellow
    Write-Host "  Windows: net start MongoDB" -ForegroundColor Gray
    Write-Host "  macOS: brew services start mongodb-community" -ForegroundColor Gray
    Write-Host "  Linux: sudo systemctl start mongodb" -ForegroundColor Gray
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "Starting MStress Services..." -ForegroundColor Cyan
Write-Host ""

# Function to start a service in a new terminal
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Command,
        [string]$WorkingDirectory
    )
    
    Write-Host "Starting $ServiceName..." -ForegroundColor Yellow
    
    # Create a new PowerShell process for the service
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "powershell.exe"
    $processInfo.Arguments = "-NoExit -Command `"cd '$WorkingDirectory'; $Command`""
    $processInfo.UseShellExecute = $true
    $processInfo.CreateNoWindow = $false
    
    $process = [System.Diagnostics.Process]::Start($processInfo)

    Write-Host "[OK] $ServiceName started (PID: $($process.Id))" -ForegroundColor Green

    return $process
}

# Get the current directory
$rootDir = Get-Location

# Start AI Services
$aiProcess = Start-Service -ServiceName "AI Services" `
    -Command "python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload" `
    -WorkingDirectory "$rootDir\ai-services"

Start-Sleep -Seconds 2

# Start Backend
$backendProcess = Start-Service -ServiceName "Backend" `
    -Command "npm start" `
    -WorkingDirectory "$rootDir\backend"

Start-Sleep -Seconds 2

# Start Frontend
$frontendProcess = Start-Service -ServiceName "Frontend" `
    -Command "npm run dev" `
    -WorkingDirectory "$rootDir\frontend"

Write-Host ""
Write-Host "All Services Started Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
Write-Host "  AI Services:  http://localhost:8000" -ForegroundColor White
Write-Host "  Backend:      http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend:     http://localhost:5174" -ForegroundColor White
Write-Host ""
Write-Host "Application URL: http://localhost:5174" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C in any terminal to stop a service" -ForegroundColor Yellow
Write-Host "To stop all services, close all terminal windows" -ForegroundColor Yellow
Write-Host ""

# Wait for user to stop the script
Write-Host "Services are running. Press Ctrl+C to stop." -ForegroundColor Cyan
while ($true) {
    Start-Sleep -Seconds 1
}

