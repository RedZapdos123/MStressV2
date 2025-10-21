# MStress AI Services - GPU Setup Script (CUDA 12.1)
# Creates/activates a Python venv named 'mstress' and installs GPU-enabled dependencies
# Usage:  powershell -ExecutionPolicy Bypass -File setup_gpu.ps1

param(
  [switch]$ForceRecreate
)

$ErrorActionPreference = 'Stop'

function Write-Section($msg) {
  Write-Host "`n==== $msg ====\n" -ForegroundColor Cyan
}

# Resolve paths
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptRoot
$VenvPath = Join-Path $ScriptRoot 'mstress'

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

# Optional: respect a local requirements file if present (will be overridden by GPU torch next)
if (Test-Path (Join-Path $ScriptRoot 'requirements.txt')) {
  Write-Section "Installing base dependencies from requirements.txt"
  pip install -r requirements.txt
}

Write-Section "Installing PyTorch (CUDA 12.1)"
# Official PyTorch command for CUDA 12.1 wheels
pip install -U torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

Write-Section "Installing additional core dependencies"
# These are common dependencies used by the AI services; duplicates will be skipped/updated
pip install -U transformers librosa opencv-python fastapi uvicorn[standard] pydantic python-multipart numpy scipy soundfile onnxruntime-gpu

Write-Section "Environment check (Torch/CUDA)"
python - << 'PY'
import torch
print('Torch version:', getattr(torch, '__version__', 'n/a'))
print('CUDA version:', getattr(torch.version, 'cuda', 'n/a'))
print('CUDA available:', torch.cuda.is_available())
print('CUDA device count:', torch.cuda.device_count())
if torch.cuda.is_available():
    print('CUDA current device:', torch.cuda.current_device())
    print('CUDA device name:', torch.cuda.get_device_name(torch.cuda.current_device()))
PY

Write-Host "`nGPU setup complete. Activate with:`n  .\\mstress\\Scripts\\Activate.ps1" -ForegroundColor Green

