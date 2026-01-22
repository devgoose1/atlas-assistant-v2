# Atlas Assistant - Desktop App Startup Script
# This script starts both the Python backend and the Tauri desktop app

Write-Host "Starting Atlas Assistant..." -ForegroundColor Cyan

# Check if Rust is installed
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Rust is not installed. Please install Rust from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python is not installed. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Navigate to backend and start Python server in background
Write-Host "Starting Python backend..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend\src"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; python main.py" -WindowStyle Normal

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Navigate to frontend and start Tauri app
Write-Host "Starting Tauri desktop app..." -ForegroundColor Green
$frontendPath = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendPath

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    cd frontend
    npm run tauri:dev    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# Start Tauri in dev mode
npm run tauri:dev
