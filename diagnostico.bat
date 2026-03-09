@echo off
chcp 65001 >nul
echo ==========================================
echo DIAGNOSTICO DEL TOURNAMENT MANAGER
echo ==========================================
echo.

echo 1. Verificando Backend en puerto 3001...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] Backend está respondiendo
    curl -s http://localhost:3001/api/health
) else (
    echo    [ERROR] Backend NO responde
    echo    Asegúrate de ejecutar: cd backend ^&^& npm run dev
)
echo.

echo 2. Verificando Frontend en puerto 5173...
curl -s -o nul -w "%%{http_code}" http://localhost:5173 >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] Frontend está disponible
) else (
    echo    [ADVERTENCIA] Frontend puede no estar corriendo
)
echo.

echo ==========================================
echo SOLUCION RAPIDA
echo ==========================================
echo.
echo Paso 1: Verifica que PostgreSQL esté corriendo
echo        services.msc -^> Busca PostgreSQL
echo.
echo Paso 2: En una terminal, inicia el backend
echo        cd backend
echo        npm run dev
echo.
echo Paso 3: En OTRA terminal, inicia el frontend
echo        cd app
echo        npm run dev
echo.
echo Paso 4: Abre http://localhost:5173 en tu navegador
echo.
pause
