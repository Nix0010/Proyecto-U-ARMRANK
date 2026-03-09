# Script de configuración automática para Windows
# Ejecutar en PowerShell como Administrador

Write-Host "🚀 Configurando Tournament App para desarrollo local..." -ForegroundColor Green
Write-Host ""

# Colores
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"

# Función para verificar si un comando existe
function Test-Command($Command) {
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# 1. Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor $Yellow
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor $Green
} else {
    Write-Host "❌ Node.js no encontrado. Descarga de: https://nodejs.org/" -ForegroundColor $Red
    Write-Host "Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 2. Verificar PostgreSQL
Write-Host "🗄️ Verificando PostgreSQL..." -ForegroundColor $Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    Write-Host "✅ PostgreSQL encontrado" -ForegroundColor $Green
    if ($pgService.Status -ne "Running") {
        Write-Host "🔄 Iniciando servicio PostgreSQL..." -ForegroundColor $Yellow
        Start-Service $pgService
    }
} else {
    Write-Host "⚠️ No se detectó PostgreSQL como servicio. Asegúrate de tenerlo instalado." -ForegroundColor $Yellow
    Write-Host "Descarga de: https://www.postgresql.org/download/windows/" -ForegroundColor $Yellow
}

Write-Host ""
Write-Host "📁 Instalando dependencias del Backend..." -ForegroundColor $Yellow
Set-Location -Path "$PSScriptRoot\backend"

# 3. Instalar dependencias del backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias del backend" -ForegroundColor $Red
    exit 1
}

# 4. Generar cliente Prisma
Write-Host "🔧 Generando cliente Prisma..." -ForegroundColor $Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error generando cliente Prisma" -ForegroundColor $Red
    exit 1
}

# 5. Verificar archivo .env
if (-not (Test-Path .env)) {
    Write-Host "⚠️ Creando archivo .env desde template..." -ForegroundColor $Yellow
    Copy-Item .env.example .env
    Write-Host "📝 IMPORTANTE: Edita el archivo backend/.env y coloca tu contraseña de PostgreSQL" -ForegroundColor $Yellow
}

Write-Host ""
Write-Host "📁 Instalando dependencias del Frontend..." -ForegroundColor $Yellow
Set-Location -Path "$PSScriptRoot\app"

# 6. Instalar dependencias del frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias del frontend" -ForegroundColor $Red
    exit 1
}

# 7. Crear archivo .env.local si no existe
if (-not (Test-Path .env.local)) {
    Write-Host "⚠️ Creando archivo .env.local..." -ForegroundColor $Yellow
    Set-Content -Path .env.local -Value "VITE_API_URL=http://localhost:3001/api"
}

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Para iniciar la aplicación:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Primero, inicia el BACKEND (en una ventana de PowerShell):" -ForegroundColor $Yellow
Write-Host "   cd '$PSScriptRoot\backend'" -ForegroundColor White
Write-Host "   npm run db:migrate  # Solo la primera vez" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "2. Luego, inicia el FRONTEND (en otra ventana de PowerShell):" -ForegroundColor $Yellow
Write-Host "   cd '$PSScriptRoot\app'" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Abre tu navegador en: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Lee el archivo SETUP_LOCAL.md para más detalles" -ForegroundColor $Yellow
Write-Host ""

# Preguntar si quiere ejecutar migraciones ahora
$response = Read-Host "¿Quieres ejecutar las migraciones de la base de datos ahora? (s/n)"
if ($response -eq 's' -or $response -eq 'S') {
    Set-Location -Path "$PSScriptRoot\backend"
    npm run db:migrate
}

Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..." -ForegroundColor $Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
