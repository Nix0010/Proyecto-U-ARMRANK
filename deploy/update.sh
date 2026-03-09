#!/bin/bash

# Script de actualización para desplegar nuevos cambios
# Uso: ./update.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_DIR="/var/www/tournament"
BACKEND_DIR="$APP_DIR/backend"

echo "🔄 Actualizando Tournament App..."

# 1. Actualizar código (asumiendo que estás en un repositorio git)
# git pull origin main

# 2. Actualizar backend
echo -e "${GREEN}[INFO]${NC} Actualizando backend..."
cd $BACKEND_DIR
npm install
npm run build

# 3. Ejecutar migraciones de base de datos
echo -e "${GREEN}[INFO]${NC} Ejecutando migraciones..."
npm run db:deploy

# 4. Reiniciar PM2
echo -e "${GREEN}[INFO]${NC} Reiniciando servicio..."
pm2 restart tournament-api || pm2 start ecosystem.config.js

# 5. Guardar configuración de PM2
pm2 save

# 6. Actualizar frontend (asumiendo que lo compilas localmente y subes el dist)
echo -e "${GREEN}[INFO]${NC} Frontend actualizado (asegúrate de copiar la carpeta dist a $APP_DIR/dist)"

# 7. Recargar Nginx
echo -e "${GREEN}[INFO]${NC} Recargando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo -e "${GREEN}[INFO]${NC} ✅ Actualización completada!"
echo "   Backend: http://tu-servidor:3001/api/health"
echo "   Frontend: http://tu-servidor"
