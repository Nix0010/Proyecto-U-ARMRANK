# start-dev.ps1
# Script para iniciar Frontend y Backend en Windows (ASCII-only)

# Configurar variables de entorno y rutas
$projectRoot = Get-Location
$frontendPath = Join-Path $projectRoot "app"
$backendPath = Join-Path $projectRoot "backend"

Write-Host "Iniciando entorno de desarrollo ARMRANK..." -ForegroundColor Cyan
Write-Host "----------------------------------------"

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js no esta instalado o no esta en el PATH" -ForegroundColor Red
    exit 1
}

# Verificar/Instalar dependencias del root (si es necesario)
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias globales..." -ForegroundColor Yellow
    npm install
}

# Verificar dependencias del backend
Set-Location $backendPath
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias del Backend..." -ForegroundColor Yellow
    npm install
}

# Verificar variables de entorno del backend
if (-not (Test-Path ".env")) {
    Write-Host "[WAIT] Archivo .env no encontrado en backend. Creando desde .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item .env.example .env
        Write-Host "Por favor configura las variables en backend/.env y vuelve a ejecutar" -ForegroundColor Red
        exit 1
    }
}

# Generar cliente Prisma si es necesario
Write-Host "Verificando esquema Prisma..." -ForegroundColor Yellow
npx prisma generate

# Verificar dependencias del frontend
Set-Location $frontendPath
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias del Frontend..." -ForegroundColor Yellow
    npm install
}

# Volver a la raiz
Set-Location $projectRoot

# Funcion para liberar puertos en Windows
function Kill-Port {
    param([int]$port)
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($process) {
        Write-Host "Liberando puerto $port..." -ForegroundColor Yellow
        Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Limpiar puertos comunes
Kill-Port 3001
Kill-Port 5173

# Iniciar Backend
Write-Host "[START] Iniciando Backend en puerto 3001..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev 2>&1
} -ArgumentList $backendPath

# Esperar un poco para que el backend inicie
Start-Sleep -Seconds 3

# Verificar si el backend respondio
if (Test-Port 3001) {
    Write-Host "[OK] Backend iniciado correctamente en puerto 3001" -ForegroundColor Green
} else {
    Write-Host "[WAIT] Esperando que el backend inicie..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

# Iniciar Frontend
Write-Host "[START] Iniciando Frontend..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev 2>&1
} -ArgumentList $frontendPath

# Esperar un poco
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[OK] Servicios iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "[WWW] Abre tu navegador en: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "[LOG] Logs en tiempo real:" -ForegroundColor Yellow
Write-Host "   (Presiona Ctrl+C para detener)" -ForegroundColor Gray
Write-Host ""

# Mostrar logs combinados
try {
    while ($true) {
        # Backend logs
        $backendLogs = Receive-Job $backendJob
        if ($backendLogs) {
            Write-Host "<BACKEND> " -ForegroundColor Blue -NoNewline
            $backendLogs | ForEach-Object { Write-Host $_ }
        }
        
        # Frontend logs
        $frontendLogs = Receive-Job $frontendJob
        if ($frontendLogs) {
            Write-Host "<FRONTEND> " -ForegroundColor Magenta -NoNewline
            $frontendLogs | ForEach-Object { Write-Host $_ }
        }
        
        Start-Sleep -Milliseconds 100
    }
} finally {
    # Limpiar al salir
    Write-Host ""
    Write-Host "[STOP] Deteniendo servicios..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "[OK] Servicios detenidos" -ForegroundColor Green
}
