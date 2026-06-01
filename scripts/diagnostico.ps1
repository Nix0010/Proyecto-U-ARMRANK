# Script de diagnóstico para el Tournament Manager
# Ejecutar en PowerShell: .\diagnostico.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTICO DEL TOURNAMENT MANAGER" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Node.js no encontrado. Instala Node.js desde https://nodejs.org/" -ForegroundColor Red
}
Write-Host ""

# Verificar PostgreSQL
Write-Host "2. Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $pgResult = pg_isready -h localhost -p 5432 2>&1
    if ($pgResult -match "accepting connections") {
        Write-Host "   ✓ PostgreSQL está corriendo en puerto 5432" -ForegroundColor Green
    } else {
        Write-Host "   ✗ PostgreSQL no responde. Asegúrate de que el servicio esté iniciado." -ForegroundColor Red
        Write-Host "     Intenta: net start postgresql-x64-15 (o el nombre de tu servicio)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ No se pudo verificar PostgreSQL. Verifica que esté instalado." -ForegroundColor Red
}
Write-Host ""

# Verificar si el backend está corriendo
Write-Host "3. Verificando Backend (puerto 3001)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 5
    Write-Host "   ✓ Backend está corriendo" -ForegroundColor Green
    Write-Host "     Status: $($response.status)" -ForegroundColor Gray
    Write-Host "     Database: $($response.database)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Backend no responde en http://localhost:3001/api/health" -ForegroundColor Red
    Write-Host "     Error: $_" -ForegroundColor Gray
    Write-Host "     Asegúrate de ejecutar: npm run dev (en la carpeta backend)" -ForegroundColor Yellow
}
Write-Host ""

# Verificar variables de entorno del backend
Write-Host "4. Verificando configuración del Backend..." -ForegroundColor Yellow
$backendEnv = Get-Content -Path ".\backend\.env" -ErrorAction SilentlyContinue
if ($backendEnv) {
    Write-Host "   ✓ Archivo .env encontrado en backend" -ForegroundColor Green
    $dbUrl = $backendEnv | Select-String "DATABASE_URL"
    if ($dbUrl) {
        Write-Host "   ✓ DATABASE_URL configurada" -ForegroundColor Green
    }
} else {
    Write-Host "   ✗ No se encontró backend\.env" -ForegroundColor Red
}
Write-Host ""

# Verificar variables de entorno del frontend
Write-Host "5. Verificando configuración del Frontend..." -ForegroundColor Yellow
$frontendEnv = Get-Content -Path ".\app\.env.local" -ErrorAction SilentlyContinue
if ($frontendEnv) {
    Write-Host "   ✓ Archivo .env.local encontrado en app" -ForegroundColor Green
    $apiUrl = $frontendEnv | Select-String "VITE_API_URL"
    if ($apiUrl) {
        Write-Host "   ✓ VITE_API_URL configurada: $apiUrl" -ForegroundColor Green
    }
} else {
    Write-Host "   ✗ No se encontró app\.env.local" -ForegroundColor Red
}
Write-Host ""

# Instrucciones finales
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "INSTRUCCIONES PARA CORREGIR:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si hay errores de conexión:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. INICIAR POSTGRESQL:" -ForegroundColor White
Write-Host "   - Abre Services (services.msc)" -ForegroundColor Gray
Write-Host "   - Busca 'PostgreSQL' y asegúrate de que esté 'Running'" -ForegroundColor Gray
Write-Host "   - O ejecuta como administrador: net start postgresql-x64-15" -ForegroundColor Gray
Write-Host ""
Write-Host "2. CREAR BASE DE DATOS:" -ForegroundColor White
Write-Host "   psql -U postgres -c 'CREATE DATABASE tournament_db;'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. APLICAR MIGRACIONES:" -ForegroundColor White
Write-Host "   cd .\backend" -ForegroundColor Gray
Write-Host "   npm run db:migrate" -ForegroundColor Gray
Write-Host ""
Write-Host "4. INICIAR BACKEND (Terminal 1):" -ForegroundColor White
Write-Host "   cd .\backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. INICIAR FRONTEND (Terminal 2):" -ForegroundColor White
Write-Host "   cd .\app" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
