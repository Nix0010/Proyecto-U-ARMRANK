@echo off
chcp 65001 >nul
echo ==========================================
echo INICIANDO TOURNAMENT MANAGER
echo ==========================================
echo.

echo [1/2] Iniciando Backend en puerto 3001...
echo.
start "BACKEND - Tournament API" cmd /k "cd /d %~dp0backend && echo Instalando dependencias... && npm install && echo. && echo Iniciando servidor... && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/2] Iniciando Frontend en puerto 5173...
echo.
start "FRONTEND - Tournament App" cmd /k "cd /d %~dp0app && echo Instalando dependencias... && npm install && echo. && echo Iniciando aplicacion... && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo SERVICIOS INICIADOS
echo ==========================================
echo.
echo Backend:  http://localhost:3001/api/health
echo Frontend: http://localhost:5173
echo.
echo Espera unos segundos a que carguen...
echo.
pause
