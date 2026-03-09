# 🏆 Tournament App - Sistema de Gestión de Torneos

Sistema completo para gestionar torneos de eliminación doble (doble bracket) con interfaz web moderna y base de datos PostgreSQL.

## ✨ Características

- 🎯 **Doble Eliminación**: Llave de ganadores y perdedores
- 👥 **Gestión de Participantes**: Importación CSV, edición, seeds
- 🏅 **Brackets Automáticos**: Generación automática de brackets
- 📊 **Resultados en Tiempo Real**: Marcador y avance automático
- 📱 **Responsive**: Funciona en móviles y desktop
- 🌙 **Modo Oscuro/Claro**: Interfaz adaptable
- 📄 **Exportación PDF**: Exporta brackets a PDF

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

1. **Abre PowerShell como Administrador**

2. **Ejecuta el script de configuración:**
```powershell
cd "D:\USUARIO\Documents\PROYECTO U"
.\setup-local.ps1
```

3. **Sigue las instrucciones en pantalla**

### Opción 2: Manual

#### Requisitos
- [Node.js 20.x](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/download/windows/)

#### 1. Configurar Base de Datos
```sql
-- En SQL Shell (psql) o pgAdmin
CREATE DATABASE tournament_db;
```

#### 2. Backend
```powershell
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

#### 3. Frontend
```powershell
cd app
npm install
npm run dev
```

## 📖 Documentación

| Archivo | Descripción |
|---------|-------------|
| `SETUP_LOCAL.md` | Guía completa de configuración local |
| `DEPLOY_UBUNTU.md` | Guía de despliegue en Ubuntu Server |
| `QUICKSTART.md` | Referencia rápida de comandos |

## 🌐 URLs de Desarrollo

| Servicio | URL |
|----------|-----|
| Aplicación Web | http://localhost:5173 |
| API Backend | http://localhost:3001/api |
| Health Check | http://localhost:3001/api/health |

## 🛠️ Comandos Útiles

### Iniciar todo (con logs)
```powershell
.\start-dev.ps1
```

### Solo Backend
```powershell
cd backend
npm run dev
```

### Solo Frontend
```powershell
cd app
npm run dev
```

### Base de datos
```powershell
cd backend
npm run db:migrate    # Ejecutar migraciones
npm run db:studio     # Abrir Prisma Studio (GUI)
```

## 📁 Estructura del Proyecto

```
PROYECTO U/
├── app/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # Componentes UI
│   │   ├── store/         # Estado global (Zustand)
│   │   └── types/         # Tipos TypeScript
│   └── package.json
│
├── backend/                # Backend (Express + Prisma)
│   ├── src/
│   │   ├── routes/        # Endpoints API
│   │   └── db.ts          # Cliente Prisma
│   ├── prisma/
│   │   └── schema.prisma  # Modelos de datos
│   └── package.json
│
├── deploy/                 # Scripts de despliegue
├── database/               # Scripts SQL
└── README.md
```

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Revisa la contraseña en `backend/.env`
- Asegúrate de que la base de datos `tournament_db` exista

### Error: "Port already in use"
- Cambia el puerto en `backend/.env` (PORT=3002)
- O cierra el programa que usa el puerto

### Error de CORS
- Verifica que el backend esté corriendo
- Revisa que `FRONTEND_URL` en `backend/.env` sea correcto

## 📦 Despliegue en Producción

Ver guía completa en: `DEPLOY_UBUNTU.md`

Resumen rápido:
1. Compilar frontend: `cd app && npm run build`
2. Configurar PostgreSQL en servidor
3. Subir archivos al servidor
4. Configurar Nginx
5. Iniciar con PM2

## 📝 Licencia

Proyecto privado - Uso personal

## 👨‍💻 Desarrollo

Desarrollado con:
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Express + Prisma + PostgreSQL
- Zustand + Zod

---

¿Necesitas ayuda? Revisa los archivos `.md` en la carpeta raíz.
