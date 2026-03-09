# Script para configurar la base de datos PostgreSQL
# Este script crea la base de datos automáticamente

Write-Host "🗄️ Configuración de Base de Datos PostgreSQL" -ForegroundColor Cyan
Write-Host ""

# Preguntar contraseña
$pgPassword = Read-Host "🔑 Ingresa la contraseña de PostgreSQL (usuario 'postgres')" -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword))

Write-Host ""
Write-Host "⏳ Creando base de datos 'tournament_db'..." -ForegroundColor Yellow

# Intentar crear la base de datos usando psql
try {
    $env:PGPASSWORD = $pgPasswordPlain
    
    # Verificar conexión
    $testConnection = & psql -U postgres -h localhost -p 5432 -c "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo conectar a PostgreSQL"
    }
    
    Write-Host "✅ Conexión exitosa" -ForegroundColor Green
    
    # Crear base de datos
    $createDb = & psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE tournament_db;" 2>&1
    
    if ($createDb -match "already exists") {
        Write-Host "ℹ️  La base de datos 'tournament_db' ya existe" -ForegroundColor Yellow
    } elseif ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de datos 'tournament_db' creada exitosamente" -ForegroundColor Green
    } else {
        throw "Error al crear la base de datos"
    }
    
    # Actualizar archivo .env
    Write-Host ""
    Write-Host "📝 Actualizando archivo .env..." -ForegroundColor Yellow
    
    $envPath = "$PSScriptRoot\backend\.env"
    $envContent = @"
# ============================================
# CONFIGURACIÓN PARA DESARROLLO LOCAL
# ============================================

# PostgreSQL
DATABASE_URL="postgresql://postgres:$pgPasswordPlain@localhost:5432/tournament_db"

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:5173"
"@
    
    Set-Content -Path $envPath -Value $envContent
    Write-Host "✅ Archivo .env actualizado" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🎉 Configuración completada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora puedes ejecutar:" -ForegroundColor Cyan
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm install" -ForegroundColor White
    Write-Host "  npm run db:generate" -ForegroundColor White
    Write-Host "  npm run db:migrate" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  - PostgreSQL no está instalado" -ForegroundColor White
    Write-Host "  - El servicio de PostgreSQL no está corriendo" -ForegroundColor White
    Write-Host "  - La contraseña es incorrecta" -ForegroundColor White
    Write-Host ""
    Write-Host "Solución:" -ForegroundColor Yellow
    Write-Host "  1. Verifica que PostgreSQL esté instalado" -ForegroundColor White
    Write-Host "  2. Abre Services (services.msc) y asegúrate de que postgresql esté 'Running'" -ForegroundColor White
    Write-Host "  3. Lee el archivo POSTGRESQL_INSTALACION.md" -ForegroundColor White
}

Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
