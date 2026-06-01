#!/bin/bash
# ============================================
# ARMRANK - Server Setup Script
# Run on Ubuntu server as root
# ============================================

set -e

echo "🚀 ARMRANK - Configurando servidor..."

# Update system
apt update && apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker instalado"
else
    echo "✅ Docker ya está instalado"
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    echo "📦 Instalando Docker Compose plugin..."
    apt install -y docker-compose-plugin
    echo "✅ Docker Compose instalado"
else
    echo "✅ Docker Compose ya está instalado"
fi

# Install Git
if ! command -v git &> /dev/null; then
    apt install -y git
    echo "✅ Git instalado"
fi

# Install Certbot
if ! command -v certbot &> /dev/null; then
    apt install -y certbot
    echo "✅ Certbot instalado"
fi

# Create app directory
mkdir -p /var/www/armrank
echo "📁 Directorio /var/www/armrank creado"

# Open firewall ports
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo "🔥 Firewall configurado (22, 80, 443)"
fi

echo ""
echo "✅ Servidor configurado correctamente!"
echo "📝 Siguiente paso: clonar el repositorio en /var/www/armrank"
