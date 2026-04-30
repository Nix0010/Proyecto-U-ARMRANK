# ARMRANK

Sistema web para gestionar torneos, participantes, categorias, rankings y llaves de competencia. El proyecto esta construido como una plataforma full-stack con frontend moderno, API propia y base de datos PostgreSQL.

> Proyecto desarrollado por Leyder Alvarez bajo la marca NetFlow como muestra de software a medida para organizadores, clubes y negocios que necesitan digitalizar procesos operativos.

## Resumen

ARMRANK permite crear torneos, registrar participantes, organizar categorias, generar brackets y actualizar resultados desde una interfaz web. El sistema esta pensado para competencias de armwrestling, pero su arquitectura puede adaptarse a otros modelos de torneos o eventos.

## Funcionalidades

- Gestion de torneos con estados, cupos, fechas, ubicacion y organizador.
- Registro de participantes con equipo, pais, peso, seed y categoria.
- Categorias por peso, brazo o modalidad.
- Llaves de eliminacion simple, doble eliminacion, round robin y vendetta.
- Avance automatico de ganadores y perdedores.
- Ranking, podio y estadisticas de participantes.
- Autenticacion con email/password y Google OAuth.
- Panel administrativo y control de permisos por rol.
- Enlaces publicos para compartir torneos.
- Exportacion de brackets y resultados a PDF.
- API REST conectada a PostgreSQL mediante Prisma.

## Stack Tecnologico

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=fff)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=fff)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=fff)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=fff)

## Arquitectura

```text
ARMRANK/
|-- app/        Frontend React + Vite + TypeScript
|-- backend/    API Express + Prisma + PostgreSQL
|-- database/   Scripts SQL
|-- deploy/     Configuracion de despliegue
```

### Frontend

- React 19 con TypeScript.
- Vite para desarrollo y build.
- Tailwind CSS y componentes estilo shadcn/ui.
- Zustand para estado global conectado a la API.
- Formularios validados con Zod.
- Interfaz responsive para escritorio y movil.

### Backend

- Express con rutas REST.
- Prisma ORM sobre PostgreSQL.
- JWT para autenticacion.
- Google OAuth.
- Validacion de datos con Zod.
- Servicios separados para brackets, rankings y autenticacion.

## Modelo de Negocio que Resuelve

Muchos organizadores gestionan torneos con hojas de calculo, mensajes sueltos o registros manuales. ARMRANK centraliza el proceso en una plataforma:

- Reduce errores al mover participantes entre rondas.
- Acelera el registro y la organizacion de categorias.
- Facilita compartir resultados con publico y competidores.
- Permite adaptar reglas y formatos segun la competencia.

## Instalacion Local

### Requisitos

- Node.js 20+
- PostgreSQL 15+
- Base de datos `tournament_db`

### Backend

```powershell
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

API local:

```text
http://localhost:3001/api
```

Health check:

```text
http://localhost:3001/api/health
```

### Frontend

```powershell
cd app
npm install
npm run dev
```

Aplicacion local:

```text
http://localhost:5173
```

## Variables de Entorno

Backend:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/tournament_db"
JWT_SECRET="cambia-este-secreto"
PORT=3001
FRONTEND_URL="http://localhost:5173"
GOOGLE_CLIENT_ID="tu-google-client-id"
```

Frontend:

```env
VITE_API_URL="http://localhost:3001/api"
VITE_GOOGLE_CLIENT_ID="tu-google-client-id"
```

## Scripts Utiles

```powershell
# Iniciar frontend y backend con script local
.\iniciar-todo.bat

# Backend
cd backend
npm run dev
npm run build
npm run db:studio

# Frontend
cd app
npm run dev
npm run build
npm run lint
```

## Estado del Proyecto

El proyecto cuenta con una base funcional para uso local y despliegue. Las siguientes mejoras recomendadas para produccion son:

- Configurar CI/CD.
- Agregar pruebas automatizadas de API y componentes criticos.
- Documentar endpoints con OpenAPI.
- Separar entornos de desarrollo, staging y produccion.
- Agregar monitoreo de errores y logs centralizados.

## Autor

**Leyder Alvarez**  
Desarrollador web y automatizaciones bajo la marca **NetFlow**.

Servicios relacionados:

- Paginas web para negocios.
- Sistemas web a medida.
- Automatizaciones de procesos.
- Chatbots de WhatsApp.
- Integraciones con IA aplicada a negocios.

GitHub: [@Nix0010](https://github.com/Nix0010)
