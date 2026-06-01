# 🚀 Guía de Despliegue en Ubuntu Server + Nginx

Esta guía te ayudará a desplegar la aplicación de torneos en tu propio servidor Ubuntu con Nginx.

## 📋 Requisitos

- Ubuntu 20.04 LTS o superior
- Acceso SSH al servidor
- Dominio (opcional pero recomendado) o IP pública
- PostgreSQL 14+ instalado

## 🔧 Instalación Automática

### 1. Copiar archivos al servidor

```bash
# Desde tu máquina local, copia los archivos al servidor
scp -r backend frontend deploy usuario@tu-servidor:/tmp/tournament-app/
```

### 2. Conectarte al servidor y ejecutar el script

```bash
ssh usuario@tu-servidor
cd /tmp/tournament-app
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Este script instalará automáticamente:
- Node.js 20.x
- PM2 (gestor de procesos)
- Nginx
- PostgreSQL
- Configuración inicial

## ⚙️ Configuración Manual (Alternativa)

### Paso 1: Instalar dependencias

```bash
sudo apt update
sudo apt install -y nodejs npm nginx postgresql

# Instalar PM2
sudo npm install -g pm2
```

### Paso 2: Configurar PostgreSQL

```bash
# Crear base de datos
sudo -u postgres psql

CREATE USER tournament WITH PASSWORD 'tu_password_seguro';
CREATE DATABASE tournament_db OWNER tournament;
GRANT ALL PRIVILEGES ON DATABASE tournament_db TO tournament;
\q
```

### Paso 3: Configurar el Backend

```bash
# Crear directorio
sudo mkdir -p /var/www/tournament/backend
sudo chown -R $USER:$USER /var/www/tournament

# Copiar archivos del backend
cp -r backend/* /var/www/tournament/backend/
cd /var/www/tournament/backend

# Instalar dependencias
npm install

# Crear archivo de entorno
cat > .env << EOF
DATABASE_URL="postgresql://tournament:tu_password_seguro@localhost:5432/tournament_db"
NODE_ENV=production
PORT=3001
FRONTEND_URL="http://tu-dominio-o-ip"
EOF

# Compilar TypeScript
npm run build

# Ejecutar migraciones
npm run db:deploy

# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Paso 4: Configurar el Frontend

```bash
# En tu máquina local, compilar el frontend
cd app
npm install

# Crear archivo .env.local
echo "VITE_API_URL=http://tu-servidor/api" > .env.local

# Compilar
npm run build

# Copiar al servidor
scp -r dist usuario@tu-servidor:/tmp/dist

# En el servidor
sudo mv /tmp/dist /var/www/tournament/
sudo chown -R www-data:www-data /var/www/tournament/dist
```

### Paso 5: Configurar Nginx

```bash
# Copiar configuración
sudo cp deploy/nginx-tournament.conf /etc/nginx/sites-available/tournament

# Editar el archivo y cambiar:
# - tu-dominio.com por tu dominio o IP
# - Las rutas si son diferentes

sudo nano /etc/nginx/sites-available/tournament

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/tournament /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Probar y reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Configurar SSL (HTTPS) con Certbot

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Auto-renovación
sudo systemctl enable certbot.timer
```

## 🔄 Actualizar la Aplicación

Después de hacer cambios:

```bash
# En el servidor
cd /var/www/tournament
chmod +x deploy/update.sh
./deploy/update.sh
```

O manualmente:

```bash
cd /var/www/tournament/backend
git pull origin main  # si usas git
npm install
npm run build
npm run db:deploy
pm2 restart tournament-api
```

## 🐳 Alternativa: Usar Docker

Si prefieres usar Docker:

```bash
# En el servidor
cd /var/www/tournament

# Editar docker-compose.yml y cambiar las contraseñas
nano docker-compose.yml

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 🛠️ Comandos Útiles

### Backend (PM2)
```bash
pm2 status                    # Ver estado
pm2 logs tournament-api       # Ver logs
pm2 restart tournament-api    # Reiniciar
pm2 stop tournament-api       # Detener
```

### Base de datos
```bash
# Acceder a PostgreSQL
sudo -u postgres psql tournament_db

# Backup
pg_dump tournament_db > backup.sql

# Restore
psql tournament_db < backup.sql
```

### Nginx
```bash
sudo nginx -t                 # Probar configuración
sudo systemctl reload nginx   # Recargar
sudo systemctl status nginx   # Ver estado
```

## 🔍 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar conexión
sudo -u postgres psql -d tournament_db -c "SELECT 1;"
```

### Error: "Port 3001 already in use"
```bash
# Encontrar y matar proceso
sudo lsof -i :3001
sudo kill -9 <PID>
```

### Error: "Permission denied" en Nginx
```bash
sudo chown -R www-data:www-data /var/www/tournament/dist
sudo chmod -R 755 /var/www/tournament
```

## 📁 Estructura de archivos en el servidor

```
/var/www/tournament/
├── backend/              # Código del backend
│   ├── dist/            # Compilado
│   ├── node_modules/
│   ├── logs/            # Logs de PM2
│   ├── .env             # Variables de entorno
│   └── ecosystem.config.js
├── dist/                # Frontend compilado (carpeta dist)
│   ├── index.html
│   └── assets/
└── deploy/
    ├── nginx-tournament.conf
    ├── deploy.sh
    └── update.sh
```

## 🌐 URLs importantes

- **Frontend**: http://tu-dominio-o-ip
- **API**: http://tu-dominio-o-ip/api
- **Health Check**: http://tu-dominio-o-ip/api/health

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `pm2 logs` y `sudo tail -f /var/log/nginx/error.log`
2. Verifica que todos los servicios estén corriendo: `sudo systemctl status postgresql nginx`
3. Comprueba la conectividad: `curl http://localhost:3001/api/health`
