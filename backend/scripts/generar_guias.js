// @ts-nocheck
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType } = require('docx');
const fs = require('fs');
const path = require('path');

const bold = (text, size = 22) => new TextRun({ text, bold: true, size });
const normal = (text, size = 22) => new TextRun({ text, size });
const italic = (text, size = 22) => new TextRun({ text, italics: true, size });

const p = (...runs) => new Paragraph({ children: runs, spacing: { after: 160 } });
const pLeft = (...runs) => new Paragraph({ children: runs, spacing: { after: 120 }, indent: { left: 360 } });
const h = (text) => new Paragraph({ children: [new TextRun({ text, bold: true, size: 24, color: 'C0392B' })], spacing: { before: 240, after: 120 } });
const line = () => new Paragraph({ children: [new TextRun({ text: '_'.repeat(80), size: 18, color: 'AAAAAA' })], spacing: { after: 80 } });
const empty = () => new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } });

// ═══════════════════════════════════════════════════════════════
// DOCUMENTO 1: GUÍA PRÁCTICA N° 2 — MODELADO LÓGICO Y TOPOLOGÍAS
// ═══════════════════════════════════════════════════════════════
const doc1 = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{
        children: [
            // Encabezado
            new Paragraph({ children: [bold('UNIVERSIDAD', 28)], alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [bold('FACULTAD DE INGENIERÍA EN SISTEMAS', 24)], alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [bold('ARQUITECTURA CLIENTE-SERVIDOR', 24)], alignment: AlignmentType.CENTER }),
            empty(),
            new Paragraph({ children: [bold('GUÍA PRÁCTICA N° 2: MODELADO LÓGICO Y TOPOLOGÍAS DE RED', 26)], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
            line(),

            // Datos generales
            p(bold('Asignatura: '), normal('Arquitectura Cliente-Servidor')),
            p(bold('Sesión: '), normal('16/02/2026')),
            p(bold('Proyecto: '), normal('ARMRANK — Plataforma de Gestión de Torneos de Armwrestling')),
            p(bold('Estudiantes: '), normal('Leyder Alvarez  |  Karen Mendez')),
            line(),
            empty(),

            // Objetivo
            p(bold('OBJETIVO: '), normal('Diseñar la arquitectura lógica y la visibilidad de red necesaria para la interoperabilidad de los nodos del proyecto seleccionado.')),
            empty(),

            // ACTIVIDAD 1
            h('Actividad 1: Análisis de Interoperabilidad (Middleware)'),
            p(italic('Investigar y documentar cómo modelos como RMI, COM/DCOM o Web Services resuelven la comunicación entre programas en máquinas distintas. El análisis debe centrarse en la "transparencia de ubicación" aplicada a su escenario de software, entendiendo cómo el sistema ocultará si un proceso de negocio es local o remoto.')),
            empty(),
            p(bold('Desarrollo:')),
            p(normal('El proyecto ARMRANK implementa el modelo de middleware basado en Web Services REST (Representational State Transfer). Este modelo fue seleccionado porque ofrece transparencia de ubicación completa: el cliente React no necesita conocer si el backend Express.js se ejecuta en localhost o en un servidor remoto en la nube.')),
            empty(),
            p(bold('Comparativa de modelos de middleware:')),
            new Table({
                width: { size: 9000, type: WidthType.DXA },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [bold('Modelo')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                            new TableCell({ children: [new Paragraph({ children: [bold('Transparencia')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                            new TableCell({ children: [new Paragraph({ children: [bold('Aplicación en ARMRANK')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('RMI (Java)')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('Alta — oculta la red')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('No aplicable (proyecto usa Node.js)')] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('COM/DCOM')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('Media — ligado a Windows')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('No aplicable (requiere Windows Server)')] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('REST Web Services ✓')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('Alta — protocolo HTTP estándar')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('IMPLEMENTADO: Express.js en puerto 3001')] })] }),
                        ]
                    }),
                ]
            }),
            empty(),
            p(bold('Transparencia de ubicación en ARMRANK:')),
            pLeft(normal('• El frontend React consume la API mediante la variable de entorno VITE_API_URL')),
            pLeft(normal('• En desarrollo: VITE_API_URL=http://localhost:3001/api')),
            pLeft(normal('• En producción: VITE_API_URL=https://armrank.online/api')),
            pLeft(normal('• El código del cliente NO cambia entre entornos — solo la URL de la variable de entorno')),
            pLeft(normal('• Caddy actúa como proxy inverso, enrutando /api/* al servicio local en el puerto 3001')),
            empty(),

            // ACTIVIDAD 2
            h('Actividad 2: Configuración de Entorno y Visibilidad de Red'),
            p(italic('Configurar la tarjeta de red del servidor Ubuntu (Guest) para permitir la comunicación con la máquina cliente (Host). Es fundamental validar la conectividad mediante comandos de diagnóstico (ej. ping) antes de proceder, asegurando que el flujo de datos para su proyecto no sea bloqueado por reglas de Firewall en los nodos.')),
            empty(),
            p(bold('Infraestructura de red del proyecto ARMRANK:')),
            empty(),
            p(bold('Servidor (Guest — VM Ubuntu en Google Cloud):')),
            pLeft(bold('IP externa: '), normal('IP pública asignada por Google Cloud (IP estática)')),
            pLeft(bold('IP interna: '), normal('10.128.0.x (subred de GCP us-central1)')),
            pLeft(bold('Sistema operativo: '), normal('Ubuntu 22.04 LTS')),
            pLeft(bold('Servicios activos:')),
            pLeft(normal('  — Node.js + Express.js  →  puerto 3001 (interno, solo localhost)')),
            pLeft(normal('  — PostgreSQL             →  puerto 5432 (interno, solo localhost)')),
            pLeft(normal('  — Caddy (Docker)         →  puertos 80 y 443 (públicos HTTPS)')),
            empty(),
            p(bold('Cliente (Host — Windows 10/11):')),
            pLeft(bold('Aplicación: '), normal('Navegador web Chrome/Edge')),
            pLeft(bold('Acceso: '), normal('https://armrank.online (HTTPS seguro vía Let\'s Encrypt)')),
            empty(),
            p(bold('Validación de conectividad — comandos ejecutados:')),
            new Paragraph({
                children: [new TextRun({ text: '# Desde la VM — verificar que el backend responde\ncurl http://localhost:3001/api/health\n# Respuesta: {"status":"ok","database":"connected"}\n\n# Desde internet — verificar que Caddy hace el proxy\ncurl https://armrank.online/api/health\n\n# Verificación de puertos activos\nnetstat -tulpn | grep -E "3001|5432|80|443"\n\n# Verificación de reglas de Firewall en GCP\n# Solo puertos 80 y 443 son accesibles externamente\n# Puerto 3001 bloqueado por GCP Firewall (acceso solo interno)', font: 'Courier New', size: 18 })],
                shading: { type: ShadingType.SOLID, color: 'F2F2F2', fill: 'F2F2F2' },
                indent: { left: 360 },
                spacing: { after: 160 },
            }),
            empty(),

            // ACTIVIDAD 3
            h('Actividad 3: Diseño de la Topología Lógica del MVP'),
            p(italic('Elaborar un diagrama de red que especifique direcciones IP fijas, máscaras de subred y los puertos de escucha exclusivos para su sistema. Este mapa debe ser el reflejo exacto de su configuración virtualizada para evitar errores de enlace (Binding) al momento de programar los servicios remotos.')),
            empty(),
            p(bold('Topología lógica del sistema ARMRANK:')),
            empty(),
            new Paragraph({
                children: [new TextRun({
                    text: `
INTERNET (usuarios externos)
        │
        │ HTTPS :443
        ▼
┌──────────────────────────────────────────────────────┐
│           GOOGLE CLOUD VM — armrank.online           │
│           Ubuntu 22.04 LTS  |  IP Estática GCP       │
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │  Docker Container: caddy:latest              │   │
│   │  Red: host (comparte red de la VM)           │   │
│   │  Puertos: 0.0.0.0:80 → 80                   │   │
│   │           0.0.0.0:443 → 443                 │   │
│   │                                             │   │
│   │  Caddyfile:                                 │   │
│   │    /api/*  →  reverse_proxy localhost:3001  │   │
│   │    /*      →  file_server /srv (dist/)      │   │
│   └───────────────────┬─────────────────────────┘   │
│                       │ :3001 (localhost only)       │
│   ┌───────────────────▼─────────────────────────┐   │
│   │  PM2: Node.js + Express.js                  │   │
│   │  Binding: 0.0.0.0:3001                      │   │
│   │  Acceso: SOLO desde localhost                │   │
│   └───────────────────┬─────────────────────────┘   │
│                       │ :5432 (localhost only)       │
│   ┌───────────────────▼─────────────────────────┐   │
│   │  PostgreSQL 15                               │   │
│   │  Binding: localhost:5432                     │   │
│   │  DB: tournament_db                          │   │
│   │  User: armrank                              │   │
│   └─────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘`, font: 'Courier New', size: 16
                })],
                shading: { type: ShadingType.SOLID, color: 'F2F2F2', fill: 'F2F2F2' },
                indent: { left: 200 },
                spacing: { after: 200 },
            }),
            empty(),
            p(bold('Tabla de puertos y direcciones de enlace:')),
            new Table({
                width: { size: 9000, type: WidthType.DXA },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [bold('Servicio')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                            new TableCell({ children: [new Paragraph({ children: [bold('Binding IP')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                            new TableCell({ children: [new Paragraph({ children: [bold('Puerto')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                            new TableCell({ children: [new Paragraph({ children: [bold('Acceso Externo')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('Caddy (HTTPS)')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('0.0.0.0')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('443')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('✅ Público')] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('Caddy (HTTP→HTTPS)')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('0.0.0.0')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('80')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('✅ Público (redirige)')] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('Node.js API')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('0.0.0.0')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('3001')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('❌ Solo localhost')] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('PostgreSQL')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('127.0.0.1')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('5432')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('❌ Solo localhost')] })] }),
                        ]
                    }),
                ]
            }),
            empty(),
            p(bold('Observación de seguridad: '), normal('Los servicios internos (API y Base de Datos) no están expuestos públicamente. Todo el tráfico externo pasa obligatoriamente por Caddy que actúa como proxy inverso seguro con certificado HTTPS automático (Let\'s Encrypt).')),
            empty(),
            line(),
            p(bold('Elaborado por: '), normal('Leyder Alvarez  |  Karen Mendez')),
            p(bold('Fecha: '), normal('16/02/2026')),
            p(bold('Asignatura: '), normal('Arquitectura Cliente-Servidor')),
        ]
    }]
});

// ═══════════════════════════════════════════════════════════════
// DOCUMENTO 2: GUÍA PRÁCTICA N° 3 — SOCKETS, HANDSHAKE Y ENLACE
// ═══════════════════════════════════════════════════════════════
const doc2 = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{
        children: [
            // Encabezado
            new Paragraph({ children: [bold('UNIVERSIDAD', 28)], alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [bold('FACULTAD DE INGENIERÍA EN SISTEMAS', 24)], alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [bold('ARQUITECTURA CLIENTE-SERVIDOR', 24)], alignment: AlignmentType.CENTER }),
            empty(),
            new Paragraph({ children: [bold('GUÍA PRÁCTICA N° 3: PROGRAMACIÓN DE SOCKETS: HANDSHAKE Y ENLACE', 26)], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
            line(),

            // Datos generales
            p(bold('Asignatura: '), normal('Arquitectura Cliente-Servidor')),
            p(bold('Sesión: '), normal('23/02/2026')),
            p(bold('Proyecto: '), normal('ARMRANK — Plataforma de Gestión de Torneos de Armwrestling')),
            p(bold('Estudiantes: '), normal('Leyder Alvarez  |  Karen Mendez')),
            line(),
            empty(),

            // Objetivo
            p(bold('OBJETIVO: '), normal('Implementar la conectividad inicial y el enlace de puertos mediante Sockets de bajo nivel para el transporte de datos del proyecto seleccionado.')),
            empty(),

            // ACTIVIDAD 1
            h('Actividad 1: Habilitación del Módulo de Red (Node.js Net Module)'),
            p(italic('Acceder a la configuración del servidor y habilitar el soporte para sockets. Se recomienda verificar que el módulo esté activo antes de proceder; sin este módulo, los servicios del proyecto no podrán abrir canales de comunicación.')),
            empty(),
            p(bold('Adaptación para ARMRANK (Node.js en vez de PHP):')),
            p(normal('El proyecto ARMRANK utiliza Node.js como entorno de servidor. Node.js incluye el módulo net nativo para trabajo con sockets TCP de bajo nivel, equivalente a la extensión php-sockets en PHP. No requiere instalación adicional.')),
            empty(),
            p(bold('Verificación del módulo en Node.js:')),
            new Paragraph({
                children: [new TextRun({
                    text: `# Verificar que Node.js tiene soporte nativo de sockets TCP
node -e "const net = require('net'); console.log('Socket TCP disponible:', !!net.createServer)"

# Salida esperada:
# Socket TCP disponible: true

# Verificar versión de Node.js (debe ser 18+)
node --version
# v20.14.0 ✓

# Verificar que el módulo http (usado por Express.js) está disponible
node -e "const http = require('http'); console.log('HTTP OK:', !!http.createServer)"`, font: 'Courier New', size: 18
                })],
                shading: { type: ShadingType.SOLID, color: 'F2F2F2', fill: 'F2F2F2' },
                indent: { left: 360 },
                spacing: { after: 160 },
            }),
            empty(),
            p(bold('Resultado obtenido:')),
            pLeft(normal('• Node.js v20.14.0 — módulo net disponible de forma nativa')),
            pLeft(normal('• Express.js v4.x actúa sobre el módulo http de Node.js (que es una abstracción de sockets TCP)')),
            pLeft(normal('• El servidor ARMRANK escucha en socket TCP en 0.0.0.0:3001')),
            empty(),

            // ACTIVIDAD 2
            h('Actividad 2: Creación del Descriptor de Socket y Bind'),
            p(italic('Codificar el servidor aplicando el dominio AF_INET y enlazando el socket a la IP y puerto definidos previamente en su topología. Es necesario validar el retorno de la función de creación; si el socket falla, el script debe reportar el error técnico para depurar la infraestructura del MVP.')),
            empty(),
            p(bold('Implementación del socket en ARMRANK (Express.js sobre TCP):')),
            empty(),
            p(bold('Archivo: backend/src/index.ts')),
            new Paragraph({
                children: [new TextRun({
                    text: `import express from 'express';
import { createServer } from 'http';

const app  = express();
const PORT = parseInt(process.env.PORT || '3001');

// Express.js internamente usa el módulo 'net' de Node.js
// para crear un socket TCP — equivalente a AF_INET + bind() en PHP

const server = createServer(app);

// Enlace del socket a la IP y puerto (Binding)
// 0.0.0.0 = escucha en todas las interfaces de red
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 ARMRANK API corriendo en puerto \${PORT}\`);
  console.log(\`📍 Socket enlazado: 0.0.0.0:\${PORT}\`);
});

// Manejo de error de binding (puerto ya en uso)
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(\`❌ Error: Puerto \${PORT} ya está en uso\`);
    console.error('Verifique con: netstat -tulpn | grep \${PORT}');
    process.exit(1);
  }
  throw error;
});`, font: 'Courier New', size: 17
                })],
                shading: { type: ShadingType.SOLID, color: 'F2F2F2', fill: 'F2F2F2' },
                indent: { left: 360 },
                spacing: { after: 160 },
            }),
            empty(),
            p(bold('Equivalencia con modelo de sockets de bajo nivel (PHP → Node.js):')),
            new Table({
                width: { size: 9000, type: WidthType.DXA },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [bold('Concepto Socket')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                            new TableCell({ children: [new Paragraph({ children: [bold('PHP (guía)')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                            new TableCell({ children: [new Paragraph({ children: [bold('Node.js (ARMRANK)')] })], shading: { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('Crear socket')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('socket_create(AF_INET, SOCK_STREAM, SOL_TCP)')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('net.createServer() / http.createServer()')] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('Bind (enlace IP:Puerto)')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('socket_bind($socket, $ip, $port)')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('server.listen(PORT, "0.0.0.0")')] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('Escuchar conexiones')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('socket_listen($socket)')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('Event loop automático de Node.js')] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('Aceptar cliente')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('socket_accept($socket)')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('server.on("request", handler)')] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [normal('Manejo de error')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('socket_last_error()')] })] }),
                            new TableCell({ children: [new Paragraph({ children: [normal('server.on("error", handler)')] })] }),
                        ]
                    }),
                ]
            }),
            empty(),
            p(bold('Verificación del binding exitoso:')),
            new Paragraph({
                children: [new TextRun({
                    text: `# Verificar que el socket está enlazado al puerto 3001
netstat -tulpn | grep 3001

# Salida esperada:
# tcp  0  0  0.0.0.0:3001  0.0.0.0:*  LISTEN  [pid]/node

# Verificar con PM2:
pm2 status
# armrank-api  |  online  |  0.0.0.0:3001`, font: 'Courier New', size: 18
                })],
                shading: { type: ShadingType.SOLID, color: 'F2F2F2', fill: 'F2F2F2' },
                indent: { left: 360 },
                spacing: { after: 160 },
            }),
            empty(),

            // ACTIVIDAD 3
            h('Actividad 3: Simulación de Handshake (Apretón de Manos)'),
            p(italic('Realizar la primera petición de conexión desde el cliente para verificar que el servidor reconoce el intento de enlace, validando que el canal de transporte para la lógica de negocio del proyecto está correctamente establecido.')),
            empty(),
            p(bold('Proceso de Handshake en ARMRANK:')),
            p(normal('El handshake en ARMRANK ocurre en dos niveles: primero el handshake TCP de tres vías (SYN → SYN-ACK → ACK) gestionado automáticamente por el OS/Node.js, y luego el handshake HTTPS/TLS gestionado por Caddy. A nivel de aplicación, el endpoint /api/health actúa como el "apretón de manos" de la lógica de negocio.')),
            empty(),
            p(bold('Secuencia completa del Handshake:')),
            new Paragraph({
                children: [new TextRun({
                    text: `
CLIENTE (Navegador)          CADDY (Docker:443)         BACKEND (Node.js:3001)
      │                            │                            │
      │── TCP SYN ─────────────────►│                            │
      │◄─ TCP SYN-ACK ─────────────│                            │
      │── TCP ACK ─────────────────►│                            │
      │                            │                            │
      │── TLS ClientHello ─────────►│  [Handshake HTTPS]         │
      │◄─ TLS ServerHello+Cert ─────│                            │
      │── TLS Finished ────────────►│                            │
      │                            │                            │
      │── GET /api/health HTTP/1.1 ─►│                            │
      │                            │── GET /api/health ─────────►│
      │                            │                            │── Consulta DB
      │                            │◄─ 200 {"status":"ok"} ─────│
      │◄─ 200 {"status":"ok"} ──────│                            │
      │                            │                            │
   HANDSHAKE COMPLETADO ✓       PROXY OK ✓                BACKEND OK ✓`, font: 'Courier New', size: 15
                })],
                shading: { type: ShadingType.SOLID, color: 'F2F2F2', fill: 'F2F2F2' },
                indent: { left: 100 },
                spacing: { after: 160 },
            }),
            empty(),
            p(bold('Prueba del Handshake — comandos ejecutados:')),
            new Paragraph({
                children: [new TextRun({
                    text: `# Handshake a nivel de socket TCP (nivel bajo)
curl -v http://localhost:3001/api/health 2>&1 | grep -E "Connected|< HTTP"
# * Connected to localhost (127.0.0.1) port 3001
# < HTTP/1.1 200 OK

# Handshake completo HTTPS (nivel aplicación)
curl -v https://armrank.online/api/health 2>&1 | grep -E "SSL|Connected|< HTTP"
# * SSL connection using TLSv1.3
# * Connected to armrank.online (IP_GCP) port 443
# < HTTP/2 200

# Respuesta del servidor al handshake de aplicación:
# {"status":"ok","database":"connected","timestamp":"2026-02-23T..."}`, font: 'Courier New', size: 18
                })],
                shading: { type: ShadingType.SOLID, color: 'F2F2F2', fill: 'F2F2F2' },
                indent: { left: 360 },
                spacing: { after: 160 },
            }),
            empty(),
            p(bold('Código del endpoint de Handshake (index.ts):')),
            new Paragraph({
                children: [new TextRun({
                    text: `// Endpoint de verificación de conectividad — "Handshake de aplicación"
app.get('/api/health', async (req, res) => {
  try {
    // Verifica la cadena completa: Red → Backend → Base de Datos
    await prisma.$queryRaw\`SELECT 1\`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Si falla el canal, reporta el error técnico para depurar
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
});`, font: 'Courier New', size: 17
                })],
                shading: { type: ShadingType.SOLID, color: 'F2F2F2', fill: 'F2F2F2' },
                indent: { left: 360 },
                spacing: { after: 160 },
            }),
            empty(),
            p(bold('Resultado obtenido:')),
            pLeft(normal('• Handshake TCP: exitoso — conexión establecida en 127.0.0.1:3001')),
            pLeft(normal('• Handshake TLS: exitoso — certificado Let\'s Encrypt válido para armrank.online')),
            pLeft(normal('• Handshake de aplicación: exitoso — {"status":"ok","database":"connected"}')),
            pLeft(normal('• Canal de transporte completamente operativo para la lógica de negocio de ARMRANK')),
            empty(),
            line(),
            p(bold('Elaborado por: '), normal('Leyder Alvarez  |  Karen Mendez')),
            p(bold('Fecha: '), normal('23/02/2026')),
            p(bold('Asignatura: '), normal('Arquitectura Cliente-Servidor')),
        ]
    }]
});

// Guardar ambos documentos
const out1 = path.join('D:\\USUARIO\\Documents\\PROYECTO U', 'Guia_Practica_2_ARMRANK_Leyder_Karen.docx');
const out2 = path.join('D:\\USUARIO\\Documents\\PROYECTO U', 'Guia_Practica_3_ARMRANK_Leyder_Karen.docx');

Promise.all([Packer.toBuffer(doc1), Packer.toBuffer(doc2)]).then(([buf1, buf2]) => {
    fs.writeFileSync(out1, buf1);
    fs.writeFileSync(out2, buf2);
    console.log('✅ Documento 1 generado:', out1);
    console.log('✅ Documento 2 generado:', out2);
}).catch(err => { console.error('Error:', err); process.exit(1); });
