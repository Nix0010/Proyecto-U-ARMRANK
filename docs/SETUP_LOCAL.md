# 🖥️ Configuración para Desarrollo Local (Windows)

## 📋 Requisitos Previos

1. **Node.js 20.x** - Descarga de: https://nodejs.org/
2. **PostgreSQL 15+** - Descarga de: https://www.postgresql.org/download/windows/
3. **Git** (opcional pero recomendado)

## 🗄️ Paso 1: Instalar y Configurar PostgreSQL

### 1.1 Descargar e instalar PostgreSQL
1. Ve a: https://www.postgresql.org/download/windows/
2. Descarga el instalador
3. Durante la instalación:
   - **Puerto**: 5432 (por defecto)
   - **Password**: Anota la contraseña que pongas (la necesitarás)
   - **Dejar seleccionado**: pgAdmin 4 y Command Line Tools

### 1.2 Crear la base de datos
Abre **SQL Shell (psql)** desde el menú inicio de Windows:

```sql
-- Crear la base de datos (si no existe)
CREATE DATABASE tournament_db;

-- Verificar que se creó
\l

-- Salir
\q
```

O usa pgAdmin 4 (interfaz gráfica):
1. Abre pgAdmin 4
2. Conéctate al servidor (localhost)
3. Click derecho en "Databases" → "Create" → "Database"
4. Nombre: `tournament_db`
5. Click en "Save"

### 1.3 Actualizar configuración del backend
Edita el archivo `backend/.env`:
```env
# Si tu contraseña de postgres es diferente, cámbiala aquí
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/tournament_db"
```

## 🚀 Paso 2: Instalar y Ejecutar el Backend

Abre **PowerShell** o **CMD** como administrador:

```powershell
# 1. Ir al directorio del backend
cd "D:\USUARIO\Documents\PROYECTO U\backend"

# 2. Instalar dependencias
npm install

# 3. Generar el cliente de Prisma
npm run db:generate

# 4. Ejecutar migraciones (crea las tablas)
npm run db:migrate

# 5. Iniciar el servidor
npm run dev
```

Si todo sale bien, verás:
```
🚀 Servidor corriendo en puerto 3001
📍 API disponible en: http://localhost:3001/api
```

**Deja esta ventana abierta** (el servidor debe seguir corriendo)

## 💻 Paso 3: Instalar y Ejecutar el Frontend

Abre una **nueva ventana** de PowerShell/CMD (no cierres la del backend):

```powershell
# 1. Ir al directorio del frontend
cd "D:\USUARIO\Documents\PROYECTO U\app"

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Si todo sale bien, verás:
```
VITE v4.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

## 🌐 Paso 4: Abrir en el Navegador

1. Abre tu navegador (Chrome, Firefox, Edge)
2. Ve a: **http://localhost:5173**
3. ¡La aplicación debería cargar!

## ✅ Verificar que todo funciona

### Test 1: Backend API
Abre en navegador: http://localhost:3001/api/health

Debería responder:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Test 2: Crear un torneo
1. En la app, haz clic en "Nuevo Torneo"
2. Completa el nombre y datos
3. Guarda
4. Debería aparecer en la lista

## 🛠️ Solución de Problemas

### Error: "Cannot find module '@prisma/client'"
```powershell
cd backend
npm install
npm run db:generate
```

### Error: "Database does not exist"
```sql
-- En SQL Shell (psql)
CREATE DATABASE tournament_db;
```

### Error: "password authentication failed"
1. Verifica que la contraseña en `backend/.env` sea correcta
2. Prueba conectarte con pgAdmin para verificar

### Error: "Port 3001 is already in use"
```powershell
# Buscar qué programa usa el puerto
netstat -ano | findstr :3001

# O simplemente cambia el puerto en backend/.env
PORT=3002
```

### Error: "Port 5173 is already in use"
El frontend usará automáticamente el siguiente puerto disponible (5174, 5175, etc.)

### Error de CORS (permisos)
Si ves errores de CORS en la consola del navegador:
1. Verifica que el backend esté corriendo
2. Verifica que `FRONTEND_URL="http://localhost:5173"` en backend/.env
3. Reinicia ambos servidores

## 🔄 Comandos Útiles

### Reiniciar todo
1. Cierra ambas ventanas de PowerShell (backend y frontend)
2. Abre nuevas ventanas
3. Sigue los pasos 2 y 3 nuevamente

### Limpiar e reinstalar
Si algo no funciona, prueba:

```powershell
# Frontend
cd "D:\USUARIO\Documents\PROYECTO U\app"
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Backend
cd "D:\USUARIO\Documents\PROYECTO U\backend"
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run db:generate
```

### Ver logs del backend
Si hay errores, revisa la consola donde ejecutaste `npm run dev`

### Ver base de datos
Usa pgAdmin 4 para ver los datos:
1. Abre pgAdmin
2. Navega a: Servers → PostgreSQL 15 → Databases → tournament_db → Schemas → Tables
3. Click derecho en una tabla → "View/Edit Data"

## 📝 Resumen de URLs

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend App | http://localhost:5173 | Aplicación web |
| Backend API | http://localhost:3001/api | API REST |
| Health Check | http://localhost:3001/api/health | Verificar backend |
| PostgreSQL | localhost:5432 | Base de datos |
| pgAdmin 4 | http://localhost:5050 | Admin DB (si lo instalaste) |

## 🎯 Siguientes Pasos

Una vez funcionando en local:
1. Crea torneos de prueba
2. Agrega participantes
3. Genera brackets
4. Marca resultados
5. Cuando todo funcione, puedes desplegar al servidor Ubuntu
