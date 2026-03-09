# Cómo Ejecutar el Tournament Manager

## ⚠️ IMPORTANTE - Lee esto primero

Este proyecto necesita **TRES** cosas corriendo al mismo tiempo:

1. ✅ PostgreSQL (base de datos)
2. ✅ Backend (API en puerto 3001)
3. ✅ Frontend (app en puerto 5173)

Si alguna no está corriendo, la app NO funcionará.

---

## Método Rápido (Windows)

### Paso 1: Verifica PostgreSQL
1. Presiona `Windows + R`
2. Escribe `services.msc` y presiona Enter
3. Busca algo como "PostgreSQL" o "postgresql-x64-15"
4. Asegúrate de que diga "Running" (si no, haz clic derecho → Start)

### Paso 2: Ejecuta el script
1. Abre la carpeta del proyecto en el explorador
2. Haz doble clic en **`iniciar-todo.bat`**
3. Se abrirán DOS ventanas de terminal (una para backend, otra para frontend)
4. Espera a ver mensajes de "Servidor corriendo" en ambas

### Paso 3: Abre el navegador
Ve a: http://localhost:5173

---

## Método Manual (Si el script falla)

### Terminal 1 - Backend
```powershell
cd "D:\USUARIO\Documents\PROYECTO U\backend"
npm install
npm run dev
```

Deberías ver:
```
🛠️  Environment: development
🌐 Frontend URL: http://localhost:5173
🚀 Servidor corriendo en puerto 3001
📍 API disponible en: http://localhost:3001/api
```

### Terminal 2 - Frontend
```powershell
cd "D:\USUARIO\Documents\PROYECTO U\app"
npm install
npm run dev
```

Deberías ver:
```
Local:   http://localhost:5173/
```

---

## Primera vez? Configuración inicial

Si es la primera vez que ejecutas el proyecto, necesitas crear la base de datos:

### 1. Crear base de datos en PostgreSQL
```powershell
# En PowerShell, ejecuta:
psql -U postgres -c "CREATE DATABASE tournament_db;"
```

O usa pgAdmin:
1. Abre pgAdmin
2. Conéctate a PostgreSQL
3. Click derecho en Databases → Create → Database
4. Nombre: `tournament_db`

### 2. Configurar credenciales
Edita `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/tournament_db"
```

Si tu contraseña de PostgreSQL es "postgres", déjalo como está.

### 3. Aplicar migraciones
```powershell
cd "D:\USUARIO\Documents\PROYECTO U\backend"
npm run db:migrate
```

---

## Verificación

Abre esta URL en tu navegador:
```
http://localhost:3001/api/health
```

✅ **Si ves esto, todo está bien:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

❌ **Si ves error o no carga:**
El backend no está corriendo. Revisa la Terminal 1.

---

## Solución de Problemas

### "No se terminan de agregar participantes"

**Causa:** El frontend no puede hablar con el backend.

**Solución:**
1. Abre la consola del navegador (F12 → Console)
2. Busca mensajes de error
3. Asegúrate de que:
   - PostgreSQL esté corriendo
   - El backend esté corriendo (Terminal 1)
   - El frontend esté corriendo (Terminal 2)

### "Error: database disconnected"

**Causa:** PostgreSQL no está corriendo o la base de datos no existe.

**Solución:**
```powershell
# Iniciar PostgreSQL (como administrador)
net start postgresql-x64-15

# Crear base de datos
psql -U postgres -c "CREATE DATABASE tournament_db;"
```

### "Error: La conexión tardó demasiado"

**Causa:** El backend no está corriendo.

**Solución:**
Verifica que la Terminal 1 esté abierta y no tenga errores.

---

## Cambios Realizados (Logs de Debug)

Ahora el sistema muestra:

1. **Indicador visual** en la interfaz:
   - 🟢 "Conectado" cuando hay conexión
   - 🔴 Mensaje de error cuando no hay conexión

2. **Logs en consola** (F12 → Console):
   - `[addParticipant] Iniciando...`
   - `[addParticipant] URL: ...`
   - `[addParticipant] Response status: ...`

3. **Timeout de 10 segundos** en lugar de colgarse indefinidamente

---

## Contacto / Ayuda

Si sigue sin funcionar:
1. Revisa `SOLUCION-PROBLEMAS.md`
2. Mira los logs en las terminales
3. Mira la consola del navegador (F12)
