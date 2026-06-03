# Script para ejecutar Backend y Frontend simultáneamente en Windows

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Dashboard de Narrativas - Tesis Bienestar            ║" -ForegroundColor Cyan
Write-Host "║   Iniciando Backend + Frontend                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Obtener ruta base
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = $scriptPath

Write-Host "`n📁 Ruta del proyecto: $rootPath`n" -ForegroundColor Yellow

# Verificar que existan las carpetas
if (-not (Test-Path "$rootPath\back")) {
    Write-Host "❌ ERROR: Carpeta 'back' no encontrada en $rootPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$rootPath\front")) {
    Write-Host "❌ ERROR: Carpeta 'front' no encontrada en $rootPath" -ForegroundColor Red
    exit 1
}

# Verificar Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ ERROR: Node.js no está instalado o no está en PATH" -ForegroundColor Red
    Write-Host "   Descárgalo desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green

# Terminal 1: Backend
Write-Host "`n🚀 Iniciando BACKEND..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath\back'; npm start" -WindowStyle Normal

# Esperar a que el backend se inicie
Write-Host "⏳ Esperando que el backend se inicie (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Terminal 2: Frontend
Write-Host "`n⚡ Iniciando FRONTEND..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath\front'; npm run dev" -WindowStyle Normal

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Servidores iniciándose...                             ║" -ForegroundColor Green
Write-Host "║  Backend:  http://localhost:5000                       ║" -ForegroundColor Green
Write-Host "║  Frontend: http://localhost:5173                       ║" -ForegroundColor Green
Write-Host "║  (Abre una pestaña del navegador en 10 segundos)      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green

# Esperar un poco más y abrir en el navegador
Start-Sleep -Seconds 10

Write-Host "`n🌐 Abriendo el dashboard en el navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "✅ ¡Todo listo! Presiona Ctrl+C en cualquier terminal para detener los servidores" -ForegroundColor Green
