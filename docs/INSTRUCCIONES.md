# Instrucciones para Ejecutar el Proyecto

## Requisitos Previos

1. **Node.js** instalado (v18 o superior)
2. **PostgreSQL** instalado y corriendo en el puerto 5432
3. **Base de datos creada** llamada `tournament_db`

## Configuración Inicial (Primera vez)

### 1. Configurar PostgreSQL

Asegúrate de que PostgreSQL esté corriendo y crea la base de datos:

```sql
CREATE DATABASE tournament_db;
```

Si tu usuario de PostgreSQL tiene contraseña diferente a "postgres", actualiza el archivo `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/tournament_db"
```

### 2. Instalar dependencias y aplicar migraciones

**Backend:**
```powershell
cd D:\USUARIO\Documents\PROYECTO U\backend
npm install
npm run db:migrate
```

**Frontend:**
```powershell
cd D:\USUARIO\Documents\PROYECTO U\app
npm install
```

## Ejecutar el Proyecto

Necesitas correr **AMBOS** servidores simultáneamente (en terminales diferentes):

### Terminal 1 - Backend (Puerto 3001)
```powershell
cd D:\USUARIO\Documents\PROYECTO U\backend
npm run dev
```

Deberías ver:
```
🛠️  Environment: development
🌐 Frontend URL: http://localhost:5173
🚀 Servidor corriendo en puerto 3001
📍 API disponible en: http://localhost:3001/api
```

### Terminal 2 - Frontend (Puerto 5173)
```powershell
cd D:\USUARIO\Documents\PROYECTO U\app
npm run dev
```

Deberías ver:
```
Local:   http://localhost:5173/
```

## Verificar que todo funciona

1. Abre http://localhost:5173 en tu navegador
2. Crea un torneo
3. Intenta agregar participantes

## Solución de Problemas

### "No se terminan de agregar participantes"

**Causa más común:** El backend no está corriendo o PostgreSQL no está conectado.

**Solución:**
1. Verifica que el backend está corriendo en http://localhost:3001/api/health
2. Verifica que PostgreSQL esté corriendo
3. Revisa la consola del backend para errores
4. Revisa la consola del navegador (F12 → Console) para errores de CORS o red

### Error de conexión a PostgreSQL

Verifica que:
1. El servicio PostgreSQL está corriendo (services.msc)
2. La base de datos `tournament_db` existe
3. Las credenciales en `backend/.env` son correctas

### Error CORS

El backend ya está configurado para permitir CORS desde http://localhost:5173. Si ves errores de CORS:
1. Verifica que ambos servidores estén usando los puertos correctos
2. Recarga ambos servidores

## Comandos Útiles

**Regenerar el cliente de Prisma (si hay errores de tipos):**
```powershell
cd D:\USUARIO\Documents\PROYECTO U\backend
npx prisma generate
```

**Resetear la base de datos (⚠️ Borra todos los datos):**
```powershell
cd D:\USUARIO\Documents\PROYECTO U\backend
npx prisma migrate reset
```

**Ver logs del backend en tiempo real:**
En la terminal donde corre el backend, verás todos los logs de requests y errores.
