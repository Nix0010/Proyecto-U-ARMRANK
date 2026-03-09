#!/bin/bash

# Script de despliegue para Ubuntu Server
# Uso: ./deploy.sh

set -e  # Detenerse si hay errores

echo "🚀 Iniciando despliegue de Tournament App..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/tournament"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
DB_USER="tournament"
DB_NAME="tournament_db"

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si se ejecuta como root
if [[ $EUID -eq 0 ]]; then
   print_error "No ejecutes este script como root. Usa un usuario con sudo."
   exit 1
fi

# 1. Instalar dependencias del sistema
print_status "Instalando dependencias del sistema..."
sudo apt update
sudo apt install -y curl git nginx postgresql postgresql-contrib redis-server

# 2. Instalar Node.js 20.x
print_status "Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 3. Instalar PM2 globalmente
print_status "Instalando PM2..."
sudo npm install -g pm2

# 4. Crear directorio de la aplicación
print_status "Creando directorios..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# 5. Configurar PostgreSQL
print_status "Configurando PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Crear usuario y base de datos (si no existen)
sudo -u postgres psql << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD 'tu_password_seguro_aqui';
    END IF;
END
\$\$;

CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

print_warning "⚠️  IMPORTANTE: Cambia la contraseña de la base de datos en el archivo .env del backend"

# 6. Configurar Nginx
print_status "Configurando Nginx..."
sudo cp deploy/nginx-tournament.conf /etc/nginx/sites-available/tournament
sudo ln -sf /etc/nginx/sites-available/tournament /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

print_status "✅ Configuración inicial completada!"
print_status "📁 Directorio de la app: $APP_DIR"
print_status "📝 Siguientes pasos:"
echo "   1. Copia los archivos del backend a: $APP_DIR/backend"
echo "   2. Copia los archivos del frontend compilado a: $APP_DIR/dist"
echo "   3. Configura las variables de entorno en $APP_DIR/backend/.env"
echo "   4. Ejecuta: cd $APP_DIR/backend && npm install"
echo "   5. Ejecuta: npm run db:migrate"
echo "   6. Ejecuta: pm2 start ecosystem.config.js"
echo "   7. Ejecuta: sudo certbot --nginx (para SSL)"
