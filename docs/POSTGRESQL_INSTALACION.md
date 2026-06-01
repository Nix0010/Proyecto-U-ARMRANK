# 🗄️ Guía de Instalación PostgreSQL para Windows

## 📥 PASO 1: Descargar PostgreSQL

1. Abre tu navegador y ve a:
   ```
   https://www.postgresql.org/download/windows/
   ```

2. Haz clic en el botón grande que dice:
   **"Download the installer"** (o "Descargar el instalador")

3. Selecciona la versión:
   - **PostgreSQL 16** (o la última disponible)
   - **Windows x86-64** (64-bit)

4. Descarga el archivo (aproximadamente 300 MB)

---

## 🚀 PASO 2: Ejecutar el Instalador

1. **Abre el archivo descargado** (ej: `postgresql-16.x-x-windows-x64.exe`)

2. Si Windows te pregunta "¿Quieres permitir que esta app haga cambios?", haz clic en **"Sí"**

---

## ⚙️ PASO 3: Configurar la Instalación

### Pantalla 1: Welcome (Bienvenida)
- Haz clic en **"Next"** (Siguiente)

### Pantalla 2: Installation Directory
- **NO CAMBIES NADA**
- Deja la ruta por defecto: `C:\Program Files\PostgreSQL\16`
- Haz clic en **"Next"**

### Pantalla 3: Select Components (IMPORTANTE)
- ✅ Deja marcadas TODAS estas opciones:
  - [x] PostgreSQL Server
  - [x] pgAdmin 4 (¡IMPORTANTE! Es la interfaz gráfica)
  - [x] Stack Builder
  - [x] Command Line Tools
- Haz clic en **"Next"**

### Pantalla 4: Data Directory
- **NO CAMBIES NADA**
- Haz clic en **"Next"**

### Pantalla 5: Password (¡MUY IMPORTANTE!)
- En el campo **"Password"** escribe una contraseña
- **Recomendado**: Usa algo simple como: `postgres` o `123456`
- **IMPORTANTE**: Escribe esta contraseña en un papel o bloc de notas
- En **"Retype password"** vuelve a escribir la misma contraseña
- Haz clic en **"Next"**

> ⚠️ **NO OLVIDES ESTA CONTRASEÑA** - La necesitarás más adelante

### Pantalla 6: Port
- **NO CAMBIES NADA** (deja 5432)
- Haz clic en **"Next"**

### Pantalla 7: Advanced Options
- **NO CAMBIES NADA**
- Haz clic en **"Next"**

### Pantalla 8: Pre Installation Summary
- Revisa que todo esté correcto
- Haz clic en **"Next"**

### Pantalla 9: Installing
- Espera a que termine la instalación (puede tardar 5-10 minutos)
- Verás una barra de progreso

### Pantalla 10: Completing
- **DESMARCA** la casilla que dice "Launch Stack Builder at exit?"
- Haz clic en **"Finish"**

---

## ✅ PASO 4: Verificar que PostgreSQL esté Corriendo

### Método 1: Servicios de Windows
1. Presiona `Windows + R`
2. Escribe: `services.msc` y presiona Enter
3. Busca **"postgresql-x64-16"** (o similar)
4. Debe decir **"Running"** o "En ejecución"
5. Si dice "Stopped", haz clic derecho → "Start" o "Iniciar"

### Método 2: SQL Shell (psql)
1. Ve al menú de inicio de Windows
2. Busca **"SQL Shell (psql)"**
3. Ábrelo
4. Te pedirá:
   - Server: presiona Enter (localhost)
   - Database: presiona Enter (postgres)
   - Port: presiona Enter (5432)
   - Username: escribe `postgres` y Enter
   - Password: escribe la contraseña que pusiste (no se verá al escribir) y Enter
5. Si ves algo como: `postgres=#` ¡Funciona!
6. Escribe: `\q` y Enter para salir

---

## 🗄️ PASO 5: Crear la Base de Datos

### Opción A: Usando SQL Shell (más rápido)

1. Abre **"SQL Shell (psql)"** desde el menú inicio

2. Presiona Enter 4 veces hasta que te pida password

3. Escribe tu contraseña y presiona Enter

4. Escribe este comando (exactamente así):
   ```sql
   CREATE DATABASE tournament_db;
   ```

5. Debe decir: `CREATE DATABASE`

6. Para verificar que se creó:
   ```sql
   \l
   ```

7. Debes ver `tournament_db` en la lista

8. Salir:
   ```sql
   \q
   ```

### Opción B: Usando pgAdmin 4 (interfaz gráfica)

1. Abre **"pgAdmin 4"** desde el menú inicio

2. Espera a que cargue (se abre en el navegador)

3. En el panel izquierdo, haz clic en **"Servers"**

4. Te pedirá contraseña - escríbela y marca "Save Password"

5. Navega a: Servers → PostgreSQL 16 → Databases

6. Click derecho en **"Databases"** → **"Create"** → **"Database..."**

7. En la pestaña "General":
   - Database: escribe `tournament_db`

8. Haz clic en **"Save"

---

## 📝 PASO 6: Configurar el Backend

1. Abre el archivo:
   ```
   D:\USUARIO\Documents\PROYECTO U\backend\.env
   ```

2. Edita la línea de DATABASE_URL con tu contraseña:
   ```env
   DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/tournament_db"
   ```

   Por ejemplo, si tu contraseña fue `123456`:
   ```env
   DATABASE_URL="postgresql://postgres:123456@localhost:5432/tournament_db"
   ```

3. Guarda el archivo (Ctrl + S)

---

## 🧪 PASO 7: Probar la Conexión

1. Abre PowerShell

2. Navega al backend:
   ```powershell
   cd "D:\USUARIO\Documents\PROYECTO U\backend"
   ```

3. Instala dependencias (si no lo has hecho):
   ```powershell
   npm install
   ```

4. Genera el cliente Prisma:
   ```powershell
   npm run db:generate
   ```

5. Ejecuta las migraciones:
   ```powershell
   npm run db:migrate
   ```

6. Si todo sale bien, verás:
   ```
   Applying migration... Your database is now in sync.
   ```

---

## 🎉 ¡LISTO!

Ahora PostgreSQL está instalado y configurado. Puedes continuar con:

```powershell
# Iniciar backend
cd "D:\USUARIO\Documents\PROYECTO U\backend"
npm run dev
```

Y en otra ventana:
```powershell
# Iniciar frontend
cd "D:\USUARIO\Documents\PROYECTO U\app"
npm run dev
```

---

## ❌ Solución de Problemas

### "Failed to create database"
- Asegúrate de que no exista ya una base de datos llamada `tournament_db`
- O usa otro nombre y actualiza el archivo `.env`

### "Password authentication failed"
- La contraseña en `backend/.env` no coincide con la de PostgreSQL
- Verifica que escribiste la contraseña correctamente

### "Port 5432 already in use"
- PostgreSQL ya está corriendo (esto está bien)
- O hay otro PostgreSQL instalado

### No encuentro "SQL Shell (psql)"
- Busca en el menú inicio: "PostgreSQL"
- Debe aparecer una carpeta con las herramientas
- Si no aparece, reinstala PostgreSQL asegurándote de marcar "Command Line Tools"

### "pgAdmin 4 no abre"
- Espera unos minutos, a veces tarda en iniciar
- Prueba abriéndolo desde el navegador: http://127.0.0.1:5050
- O usa el SQL Shell en su lugar

---

## 📞 Datos Importantes para Recordar

| Configuración | Valor |
|---------------|-------|
| **Usuario** | `postgres` |
| **Contraseña** | (la que elegiste) |
| **Puerto** | `5432` |
| **Base de datos** | `tournament_db` |
| **Host** | `localhost` |

**Ubicación del archivo de configuración:**
```
D:\USUARIO\Documents\PROYECTO U\backend\.env
```
