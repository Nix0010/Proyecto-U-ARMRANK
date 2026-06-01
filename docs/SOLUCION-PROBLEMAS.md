# Solución de Problemas - Tournament Manager

## Problema: "No se terminan de agregar participantes"

### Causa Raíz
El frontend no puede comunicarse con el backend. Esto ocurre cuando:
1. El backend NO está corriendo en el puerto 3001
2. PostgreSQL NO está corriendo o no está configurado
3. Las migraciones de Prisma no se han aplicado

### Solución Paso a Paso

#### OPCIÓN 1: Script Automático (Recomendado)
1. Abre el proyecto en tu explorador de archivos
2. Haz doble clic en `iniciar-todo.bat`
3. Espera a que se abran dos ventanas de terminal
4. Cuando veas "Servidor corriendo" en la primera y "Local: http://localhost:5173" en la segunda, abre tu navegador en http://localhost:5173

#### OPCIÓN 2: Manual

**Terminal 1 - Backend:**
```powershell
cd D:\USUARIO\Documents\PROYECTO U\backend
npm install
npm run db:migrate  # Solo la primera vez
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd D:\USUARIO\Documents\PROYECTO U\app
npm install
npm run dev
```

**Navegador:**
Abre http://localhost:5173

### Verificación Rápida

Abre esta URL en tu navegador:
```
http://localhost:3001/api/health
```

Si ves algo como:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

¡Todo está funcionando! Ahora puedes usar la app.

Si ves un error o no carga, el backend no está corriendo.

### Errores Comunes

#### "La conexión tardó demasiado"
El backend no está corriendo. Sigue los pasos de arriba.

#### "database": "disconnected"
PostgreSQL no está corriendo o la base de datos no existe:
1. Abre Services (services.msc)
2. Busca "PostgreSQL" y asegúrate de que esté "Running"
3. Si no existe la base de datos, creala:
   ```sql
   CREATE DATABASE tournament_db;
   ```

#### "Error 404" o "Cannot POST"
La URL del API no es correcta. Verifica que `app/.env.local` tenga:
```
VITE_API_URL=http://localhost:3001/api
```

### Indicadores Visuales Nuevos

Ahora la aplicación muestra:
- ✅ "Conectado" en verde cuando el backend responde
- ⚠️ Mensaje de error si no hay conexión al backend
- Logs detallados en la consola del navegador (F12 → Console)

### Comandos Útiles

**Verificar si el backend responde:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health"
```

**Reiniciar todo:**
1. Cierra todas las terminales
2. Ejecuta `iniciar-todo.bat` de nuevo

**Ver logs del backend:**
Mira la ventana de terminal donde ejecutaste `npm run dev` en la carpeta backend.
