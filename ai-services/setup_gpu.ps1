# MStress AI Services - GPU Setup Script (CUDA 12.1)
# Creates/activates a Python venv and installs GPU-enabled dependencies
# Usage:  powershell -ExecutionPolicy Bypass -File setup_gpu.ps1

param(
  [switch]$ForceRecreate
)

$ErrorActionPreference = 'Stop'

function Write-Section($msg) {
  Write-Host "`n==== $msg ====`n" -ForegroundColor Cyan
}

# Resolve paths
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptRoot
$VenvPath = Join-Path $ScriptRoot 'venv'

Write-Section "Python & pip versions"
python --version
python -m pip --version

# Create / (optionally) recreate venv
if ($ForceRecreate -and (Test-Path $VenvPath)) {
  Write-Host "Removing existing venv at $VenvPath" -ForegroundColor Yellow
  Remove-Item -Recurse -Force $VenvPath
}

if (-not (Test-Path $VenvPath)) {
  Write-Section "Creating virtual environment at $VenvPath"
  python -m venv $VenvPath
}

Write-Section "Activating virtual environment"
& "$VenvPath\Scripts\Activate.ps1"

Write-Section "Upgrading pip/setuptools/wheel"
python -m pip install --upgrade pip setuptools wheel

Write-Section "Installing PyTorch (CUDA 12.1)"
# Official PyTorch command for CUDA 12.1 wheels
pip install -U torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

Write-Section "Installing dependencies from requirements.txt"
pip install -r requirements.txt

Write-Section "Environment check (Torch/CUDA)"
$pythonScript = @"
import torch
print('Torch version:', getattr(torch, '__version__', 'n/a'))
print('CUDA version:', getattr(torch.version, 'cuda', 'n/a'))
print('CUDA available:', torch.cuda.is_available())
print('CUDA device count:', torch.cuda.device_count())
if torch.cuda.is_available():
    print('CUDA current device:', torch.cuda.current_device())
    print('CUDA device name:', torch.cuda.get_device_name(torch.cuda.current_device()))
"@

$pythonScript | python

Write-Host "`nGPU setup complete. Activate with:`n  .\\venv\\Scripts\\Activate.ps1" -ForegroundColor Green

