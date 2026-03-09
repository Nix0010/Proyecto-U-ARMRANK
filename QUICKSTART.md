# 🚀 Inicio Rápido - Tournament App

## Opción 1: Desarrollo Local (con SQLite opcional)

### Backend
```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# 3. Crear base de datos PostgreSQL (si no existe)
# o usar la configuración por defecto

# 4. Generar cliente Prisma y ejecutar migraciones
npm run db:generate
npm run db:migrate

# 5. Iniciar servidor de desarrollo
npm run dev
```

El backend estará disponible en: `http://localhost:3001`

### Frontend
```bash
cd app

# 1. Instalar dependencias
npm install

# 2. Configurar URL del API
echo "VITE_API_URL=http://localhost:3001/api" > .env.local

# 3. Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## Opción 2: Despliegue en Ubuntu Server + Nginx

### 1. Preparar archivos
```bash
# En tu máquina local - Compilar frontend
cd app
npm run build

# Comprimir para subir al servidor
tar -czvf tournament-app.tar.gz backend app/dist deploy/
```

### 2. Subir al servidor
```bash
scp tournament-app.tar.gz usuario@tu-servidor:/tmp/
ssh usuario@tu-servidor
```

### 3. En el servidor
```bash
cd /tmp
tar -xzvf tournament-app.tar.gz

# Ejecutar instalador
chmod +x deploy/deploy.sh
./deploy/deploy.sh

# Configurar backend
cd /var/www/tournament/backend
cp .env.example .env
nano .env  # Editar con tus datos

# Instalar y compilar
npm install
npm run build
npm run db:deploy

# Iniciar servicio
pm2 start ecosystem.config.js
pm2 save

# Configurar Nginx
sudo cp deploy/nginx-tournament.conf /etc/nginx/sites-available/tournament
sudo nano /etc/nginx/sites-available/tournament  # Editar dominio/IP
sudo ln -sf /etc/nginx/sites-available/tournament /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Mover frontend compilado
sudo mv /tmp/app/dist /var/www/tournament/
sudo chown -R www-data:www-data /var/www/tournament/dist
```

---

## Opción 3: Docker (Más simple)

```bash
# En el servidor
cd /var/www/tournament

# Editar contraseñas en docker-compose.yml
nano docker-compose.yml

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f
```

---

## ⚠️ Importante: Configuración de PostgreSQL

### Local (desarrollo)
```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# Crear base de datos
psql -U postgres -c "CREATE DATABASE tournament_db;"
```

### Producción (Ubuntu)
```bash
sudo -u postgres psql
CREATE USER tournament WITH PASSWORD 'tu_password_seguro';
CREATE DATABASE tournament_db OWNER tournament;
GRANT ALL PRIVILEGES ON DATABASE tournament_db TO tournament;
\q
```

---

## 🧪 Probar la instalación

```bash
# Health check del backend
curl http://localhost:3001/api/health

# Debería responder:
# {"status":"ok","timestamp":"2024-..."}
```

---

## 📚 Documentación adicional

- **Guía completa de Ubuntu**: Ver `DEPLOY_UBUNTU.md`
- **Estructura del backend**: Ver `backend/README.md` (si existe)
- **Variables de entorno**: Ver `backend/.env.example`
