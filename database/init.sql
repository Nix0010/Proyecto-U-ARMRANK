-- Script SQL para crear la base de datos
-- Ejecutar en SQL Shell (psql) o pgAdmin

-- Crear base de datos (si no existe)
SELECT 'CREATE DATABASE tournament_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tournament_db')\gexec

-- Conectar a la base de datos (esto no funciona en scripts, hacer manualmente)
-- \c tournament_db;

-- El resto lo maneja Prisma con las migraciones
-- Ejecutar en el backend: npm run db:migrate
