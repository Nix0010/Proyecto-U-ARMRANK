#!/bin/bash

# Iron Grip Tournament System - Script de Instalación para Ubuntu
# Este script instala y configura automáticamente el sistema en Ubuntu Server

set -e

echo "=================================="
echo "  Iron Grip Tournament System"
echo "  Instalador para Ubuntu Server"
echo "=================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si es root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor ejecuta este script como root (sudo)${NC}"
    exit 1
fi

# Variables
DB_NAME="pulse_tournament"
DB_USER="pulse_user"
DB_PASS=$(openssl rand -base64 12)
WEB_DIR="/var/www/html"

# Detectar versión de Ubuntu
UBUNTU_VERSION=$(lsb_release -rs)
echo -e "${GREEN}Detectado Ubuntu $UBUNTU_VERSION${NC}"
echo ""

# Función para preguntar
ask() {
    read -p "$1 [Y/n]: " response
    case "$response" in
        [nN][oO]|[nN]) return 1 ;;
        *) return 0 ;;
    esac
}

echo "Este script instalará:"
echo "  - Apache2"
echo "  - MySQL/MariaDB"
echo "  - PHP 7.4+ con extensiones necesarias"
echo "  - Iron Grip Tournament System"
echo ""

if ! ask "¿Continuar con la instalación?"; then
    echo "Instalación cancelada."
    exit 0
fi

echo ""
echo -e "${YELLOW}Actualizando el sistema...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${YELLOW}Instalando Apache2...${NC}"
apt install -y apache2
systemctl enable apache2
systemctl start apache2

echo ""
echo -e "${YELLOW}Instalando MySQL...${NC}"
apt install -y mysql-server
systemctl enable mysql
systemctl start mysql

echo ""
echo -e "${YELLOW}Instalando PHP y extensiones...${NC}"
apt install -y php php-mysql php-pdo php-mbstring php-json php-curl libapache2-mod-php

# Habilitar módulos de Apache
echo ""
echo -e "${YELLOW}Configurando Apache...${NC}"
a2enmod rewrite
a2enmod headers
a2enmod expires
a2enmod deflate

# Configurar PHP
PHP_INI=$(php -r "echo php_ini_loaded_file();")
sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 10M/' "$PHP_INI"
sed -i 's/post_max_size = 8M/post_max_size = 10M/' "$PHP_INI"
sed -i 's/max_execution_time = 30/max_execution_time = 300/' "$PHP_INI"

echo ""
echo -e "${YELLOW}Configurando base de datos...${NC}"

# Configurar MySQL
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Importar esquema
if [ -f "database.sql" ]; then
    mysql "$DB_NAME" < database.sql
    echo -e "${GREEN}Base de datos importada correctamente${NC}"
else
    echo -e "${RED}No se encontró database.sql${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Instalando archivos del sistema...${NC}"

# Limpiar directorio web
rm -rf "$WEB_DIR"/*

# Copiar archivos
cp -r . "$WEB_DIR/"

# Configurar permisos
chown -R www-data:www-data "$WEB_DIR"
chmod -R 755 "$WEB_DIR"

# Actualizar config.php
CONFIG_FILE="$WEB_DIR/config.php"
sed -i "s/define('DB_NAME', 'pulse_tournament');/define('DB_NAME', '$DB_NAME');/" "$CONFIG_FILE"
sed -i "s/define('DB_USER', 'root');/define('DB_USER', '$DB_USER');/" "$CONFIG_FILE"
sed -i "s/define('DB_PASS', '');/define('DB_PASS', '$DB_PASS');/" "$CONFIG_FILE"

# Configurar Apache para el sitio
cat > /etc/apache2/sites-available/000-default.conf << 'EOF'
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html
    
    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF

# Reiniciar Apache
systemctl restart apache2

echo ""
echo "=================================="
echo -e "${GREEN}  ¡Instalación Completada!${NC}"
echo "=================================="
echo ""
echo "Información de acceso:"
echo "  URL: http://$(hostname -I | awk '{print $1}')/"
echo "  Base de datos: $DB_NAME"
echo "  Usuario DB: $DB_USER"
echo "  Contraseña DB: $DB_PASS"
echo ""
echo "Usuario admin por defecto:"
echo "  Usuario: admin"
echo "  Contraseña: admin123"
echo ""
echo -e "${YELLOW}IMPORTANTE: Cambia la contraseña del admin después de iniciar sesión${NC}"
echo ""
echo "Archivos instalados en: $WEB_DIR"
echo ""

# Guardar credenciales
CREDENTIALS_FILE="/root/irongrip_credentials.txt"
cat > "$CREDENTIALS_FILE" << EOF
Iron Grip Tournament System - Credenciales
==========================================

Fecha de instalación: $(date)
URL: http://$(hostname -I | awk '{print $1}')/

BASE DE DATOS:
  Nombre: $DB_NAME
  Usuario: $DB_USER
  Contraseña: $DB_PASS

ADMIN POR DEFECTO:
  Usuario: admin
  Contraseña: admin123

IMPORTANTE: Cambia la contraseña del admin después del primer inicio de sesión.
EOF

chmod 600 "$CREDENTIALS_FILE"
echo "Credenciales guardadas en: $CREDENTIALS_FILE"
echo ""
