# 🖥️ CONFIGURACIÓN LOCAL - PASO A PASO

## ⚡ MÉTODO RÁPIDO (PowerShell)

### Paso 1: Abre PowerShell como Administrador

Haz clic derecho en el botón de inicio → "Windows PowerShell (Administrador)" o "Terminal (Administrador)"

### Paso 2: Navega a la carpeta del proyecto
```powershell
cd "D:\USUARIO\Documents\PROYECTO U"
```

### Paso 3: Ejecuta el script de configuración
```powershell
.\setup-local.ps1
```

Este script hará:
- ✅ Verificar Node.js
- ✅ Verificar PostgreSQL
- ✅ Instalar dependencias del backend
- ✅ Instalar dependencias del frontend
- ✅ Generar cliente Prisma
- ✅ Crear archivos de configuración

---

## 🚀 INICIAR LA APLICACIÓN

### Opción A: Script Automático (una sola ventana)
```powershell
cd "D:\USUARIO\Documents\PROYECTO U"
.\start-dev.ps1
```

### Opción B: Ventanas Separadas (recomendado para desarrollo)

**VENTANA 1 - Backend:**
```powershell
cd "D:\USUARIO\Documents\PROYECTO U\backend"
npm run dev
```

**VENTANA 2 - Frontend:**
```powershell
cd "D:\USUARIO\Documents\PROYECTO U\app"
npm run dev
```

---

## 🌐 ABRIR EN NAVEGADOR

Ve a: **http://localhost:5173**

---

## 🗄️ CONFIGURACIÓN DE POSTGRESQL

### Si no tienes PostgreSQL instalado:

1. **Descarga** de: https://www.postgresql.org/download/windows/
2. **Instala** con las opciones por defecto
3. **Anota la contraseña** que pongas durante la instalación
4. **Dejar seleccionado**: pgAdmin 4 y Command Line Tools

### Crear la base de datos:

Abre **SQL Shell (psql)** desde el menú inicio de Windows:

```sql
CREATE DATABASE tournament_db;
\q
```

### Configurar contraseña:

Edita el archivo: `D:\USUARIO\Documents\PROYECTO U\backend\.env`

```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/tournament_db"
```

---

## ✅ VERIFICAR QUE FUNCIONA

### Test 1: Backend corriendo
Abre navegador en: http://localhost:3001/api/health

Debe mostrar:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Test 2: Frontend corriendo  
Abre navegador en: http://localhost:5173

Debe mostrar la aplicación de torneos.

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### "No se encuentra el comando npm"
```powershell
# Descarga e instala Node.js desde:
# https://nodejs.org/
# Luego cierra y vuelve a abrir PowerShell
```

### "Cannot connect to database"
1. Verifica que PostgreSQL esté instalado
2. Verifica que el servicio esté corriendo (Services → postgresql)
3. Verifica la contraseña en `backend/.env`
4. Asegúrate de que exista la base de datos `tournament_db`

### "Port 3001 already in use"
Cambia el puerto en `backend/.env`:
```env
PORT=3002
```

### Error de permisos en PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error "Cannot find module '@prisma/client'"
```powershell
cd "D:\USUARIO\Documents\PROYECTO U\backend"
npm install
npm run db:generate
```

---

## 📁 ARCHIVOS IMPORTANTES

| Archivo | Descripción |
|---------|-------------|
| `backend/.env` | Configuración de base de datos |
| `app/.env.local` | URL del API para el frontend |
| `setup-local.ps1` | Script de configuración inicial |
| `start-dev.ps1` | Script para iniciar todo |
| `SETUP_LOCAL.md` | Guía completa detallada |

---

## 🎯 RESUMEN DE COMANDOS

```powershell
# 1. Configurar (solo una vez)
cd "D:\USUARIO\Documents\PROYECTO U"
.\setup-local.ps1

# 2. Iniciar backend (ventana 1)
cd "D:\USUARIO\Documents\PROYECTO U\backend"
npm run dev

# 3. Iniciar frontend (ventana 2)  
cd "D:\USUARIO\Documents\PROYECTO U\app"
npm run dev

# 4. Abrir navegador en http://localhost:5173
```

---

## 📞 ¿AYUDA?

Si tienes problemas:
1. Revisa que PostgreSQL esté instalado y corriendo
2. Verifica la contraseña en `backend/.env`
3. Lee el archivo `SETUP_LOCAL.md` para más detalles
4. Revisa los mensajes de error en la consola
