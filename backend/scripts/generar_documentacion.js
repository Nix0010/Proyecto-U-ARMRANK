// @ts-nocheck
const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, BorderStyle,
    AlignmentType, PageBreak, ShadingType
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── helpers ────────────────────────────────────────────────────────────────────
const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
const h2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } });
const h3 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } });

const p = (text, opts = {}) => new Paragraph({
    children: [new TextRun({ text, size: 22, ...opts })],
    spacing: { after: 120 },
});

const bullet = (text) => new Paragraph({
    children: [new TextRun({ text: `\u2022  ${text}`, size: 22 })],
    spacing: { after: 80 },
    indent: { left: 360 },
});

const codeLines = (text) => text.split('\n').map(line =>
    new Paragraph({
        children: [new TextRun({ text: line, font: 'Courier New', size: 18 })],
        spacing: { before: 0, after: 0 },
        indent: { left: 360 },
        shading: { type: ShadingType.SOLID, color: 'F2F2F2', fill: 'F2F2F2' },
    })
);

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const tableRow = (cells, isHeader = false) => new TableRow({
    children: cells.map(text => new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text: String(text), bold: isHeader, size: isHeader ? 20 : 18 })],
        })],
        width: { size: Math.floor(9000 / cells.length), type: WidthType.DXA },
        shading: isHeader ? { type: ShadingType.SOLID, color: 'E8E8E8', fill: 'E8E8E8' } : undefined,
    })),
});

const makeTable = (headers, rows) => new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [
        tableRow(headers, true),
        ...rows.map(r => tableRow(r)),
    ],
});

// ══════════════════════════════════════════════════════════════════════════════
// CONTENIDO DEL DOCUMENTO
// ══════════════════════════════════════════════════════════════════════════════
const sections = [];

// ── PORTADA ───────────────────────────────────────────────────────────────────
sections.push(
    new Paragraph({
        children: [new TextRun({ text: 'ARMRANK', bold: true, size: 72, color: '1a1a1a' })],
        alignment: AlignmentType.CENTER, spacing: { before: 1440, after: 240 },
    }),
    new Paragraph({
        children: [new TextRun({ text: 'Plataforma de Gesti\u00f3n de Torneos de Armwrestling', size: 32, color: '555555' })],
        alignment: AlignmentType.CENTER, spacing: { after: 240 },
    }),
    new Paragraph({
        children: [new TextRun({ text: 'Documentaci\u00f3n T\u00e9cnica Completa \u2014 Versi\u00f3n 1.0  |  Marzo 2026', size: 24, italics: true, color: '888888' })],
        alignment: AlignmentType.CENTER, spacing: { after: 2880 },
    }),
    pageBreak(),

    // ── 1. DESCRIPCION GENERAL ───────────────────────────────────────────────────
    h1('1. Descripci\u00f3n General del Proyecto'),
    p('ARMRANK es una aplicaci\u00f3n web full-stack para gesti\u00f3n de torneos de pulso (armwrestling). Permite crear torneos con 4 formatos de llaves distintos, registrar participantes por categor\u00eda de peso y brazo, y llevar un seguimiento completo de resultados y rankings en tiempo real.'),
    h2('1.1 Caracter\u00edsticas Principales'),
    bullet('4 formatos de torneo: Single Elimination, Double Elimination, Round Robin y Vendetta (1v1)'),
    bullet('Gesti\u00f3n de participantes con categor\u00edas por peso y brazo'),
    bullet('Generaci\u00f3n autom\u00e1tica de llaves (brackets) con BYEs autom\u00e1ticos'),
    bullet('Avance autom\u00e1tico de ganadores y perdedores entre rondas'),
    bullet('Sistema de ranking y podio al finalizar el torneo'),
    bullet('Exportaci\u00f3n a PDF y Excel'),
    bullet('Interfaz responsive con modo oscuro / modo claro'),
    bullet('Autenticaci\u00f3n JWT (login opcional)'),

    h2('1.2 Stack Tecnol\u00f3gico'),
    makeTable(
        ['Capa', 'Tecnolog\u00eda / Librer\u00eda', 'Versi\u00f3n'],
        [
            ['Frontend', 'React + TypeScript + Vite', '18 / 5+ / 7'],
            ['Estilos', 'Tailwind CSS + Shadcn/UI', '3 / latest'],
            ['Estado global', 'Zustand', '5'],
            ['Backend', 'Node.js + Express + TypeScript', '20 / 4 / 5'],
            ['Base de datos', 'PostgreSQL + Prisma ORM', '15 / 6'],
            ['Validaci\u00f3n', 'Zod', '3'],
            ['Autenticaci\u00f3n', 'JWT (jsonwebtoken)', 'latest'],
        ]
    ),
    pageBreak(),

    // ── 2. ARQUITECTURA ──────────────────────────────────────────────────────────
    h1('2. Arquitectura del Sistema'),
    h2('2.1 Estructura de Carpetas'),
    ...codeLines(`PROYECTO U/
\u251c\u2500\u2500 app/                          \u2190 Frontend React
\u2502   \u2514\u2500\u2500 src/
\u2502       \u251c\u2500\u2500 components/
\u2502       \u2502   \u251c\u2500\u2500 bracket/              \u2190 DoubleEliminationBracket, BracketMatchCard
\u2502       \u2502   \u251c\u2500\u2500 participant/          \u2190 ParticipantManager, BracketPreview
\u2502       \u2502   \u251c\u2500\u2500 tournament/           \u2190 TournamentView, CreateTournamentDialog
\u2502       \u2502   \u251c\u2500\u2500 category/             \u2190 CategoryManager
\u2502       \u2502   \u2514\u2500\u2500 ui/                   \u2190 Shadcn base components
\u2502       \u251c\u2500\u2500 store/
\u2502       \u2502   \u2514\u2500\u2500 apiStore.ts           \u2190 Estado global Zustand
\u2502       \u251c\u2500\u2500 types/
\u2502       \u2502   \u2514\u2500\u2500 tournament.ts         \u2190 Interfaces TypeScript
\u2502       \u2514\u2500\u2500 lib/
\u2502           \u2514\u2500\u2500 tournamentUtils.ts    \u2190 Construye Bracket desde matches
\u2514\u2500\u2500 backend/                      \u2190 Backend Node.js
    \u2514\u2500\u2500 src/
        \u251c\u2500\u2500 index.ts              \u2190 Servidor Express
        \u251c\u2500\u2500 db.ts                 \u2190 Conexi\u00f3n Prisma
        \u251c\u2500\u2500 routes/
        \u2502   \u251c\u2500\u2500 tournaments.ts    \u2190 CRUD + bracket + matches
        \u2502   \u2514\u2500\u2500 auth.ts           \u2190 Autenticaci\u00f3n JWT
        \u251c\u2500\u2500 services/
        \u2502   \u2514\u2500\u2500 bracketService.ts \u2190 Generadores de llaves
        \u2514\u2500\u2500 prisma/
            \u2514\u2500\u2500 schema.prisma     \u2190 Modelo de base de datos`),

    p(''),
    h2('2.2 Flujo de Datos'),
    ...codeLines(`Usuario (Navegador)
  \u2193  interacci\u00f3n
React App (Vite :5173)
  \u2193  hooks: useState / useMemo / useEffect
Zustand apiStore.ts
  \u2193  fetchWithTimeout() \u2192 HTTP
Express API (Node :3001)
  \u2193  Zod parse \u2192 Prisma ORM
PostgreSQL Database (:5432)`),
    pageBreak(),

    // ── 3. BASE DE DATOS ─────────────────────────────────────────────────────────
    h1('3. Esquema de Base de Datos'),
    h2('3.1 Tablas Principales'),
    makeTable(
        ['Tabla', 'Descripci\u00f3n', 'Campos clave'],
        [
            ['Tournament', 'Torneo principal', 'id, name, type, status, maxParticipants, bestOf'],
            ['Participant', 'Participante de un torneo', 'id, name, email*, seed, categoryId, tournamentId'],
            ['ParticipantStats', 'Estad\u00edsticas del participante', 'wins, losses, matchesPlayed, pointsFor, pointsAgainst'],
            ['Match', 'Partido individual', 'id, round, bracket, participant1Id, participant2Id, winnerId, nextMatchId, loserMatchId'],
            ['Category', 'Categor\u00eda de peso+brazo', 'id, name, weightClass, arm, tournamentId'],
        ]
    ),
    p('* El campo email se usa en el UI como "Ciudad o Club", acepta cualquier texto.'),

    h2('3.2 Modelo Prisma'),
    ...codeLines(`// schema.prisma (fragmento principal)

model Tournament {
  id                  String         @id @default(uuid())
  name                String
  type                TournamentType @default(double_elimination)
  status              Status         @default(draft)
  maxParticipants     Int            @default(16)
  currentParticipants Int            @default(0)
  bestOf              Int            @default(1)
  participants        Participant[]
  matches             Match[]
  categories          Category[]
}

model Match {
  id             String        @id @default(uuid())
  tournamentId   String
  round          Int
  position       Int
  bracket        BracketSection
  status         MatchStatus   @default(pending)
  participant1Id String?
  participant2Id String?
  winnerId       String?
  loserId        String?
  nextMatchId    String?        // Ganador avanza aqu\u00ed
  nextMatchSlot  Int?           // 0=participant1, 1=participant2
  loserMatchId   String?        // Perdedor cae aqu\u00ed (Double Elim)
  loserMatchSlot Int?
  bestOf         Int            @default(1)
}

enum TournamentType {
  single_elimination
  double_elimination
  round_robin
  vendetta
}

enum BracketSection {
  winners      // Llave de ganadores
  losers       // Llave de perdedores
  grand_final  // Final y reset (Double Elim)
  group        // Round Robin
  vendetta     // Vendetta 1v1
}`),
    pageBreak(),

    // ── 4. BACKEND API ───────────────────────────────────────────────────────────
    h1('4. Backend \u2014 API REST'),
    h2('4.1 Endpoints Disponibles'),
    makeTable(
        ['M\u00e9todo', 'Ruta', 'Descripci\u00f3n'],
        [
            ['GET', '/api/tournaments', 'Listar todos los torneos'],
            ['GET', '/api/tournaments/:id', 'Obtener torneo completo con participantes y partidos'],
            ['POST', '/api/tournaments', 'Crear nuevo torneo'],
            ['PATCH', '/api/tournaments/:id', 'Actualizar datos del torneo'],
            ['DELETE', '/api/tournaments/:id', 'Eliminar torneo'],
            ['POST', '/api/tournaments/:id/participants', 'Agregar participante'],
            ['PATCH', '/api/tournaments/:id/participants/:pid', 'Editar participante'],
            ['DELETE', '/api/tournaments/:id/participants/:pid', 'Eliminar participante'],
            ['POST', '/api/tournaments/:id/generate-bracket', 'Generar llaves e iniciar torneo'],
            ['PATCH', '/api/tournaments/:id/matches/:mid', 'Registrar resultado de partido'],
            ['GET', '/api/tournaments/:id/ranking', 'Obtener ranking y podio'],
            ['GET', '/api/health', 'Verificar estado del servidor y DB'],
        ]
    ),

    h2('4.2 Conexi\u00f3n a Base de Datos (db.ts)'),
    ...codeLines(`import { config } from 'dotenv';
import { resolve }  from 'path';
import { PrismaClient } from '@prisma/client';

// IMPORTANTE: dotenv.config() debe llamarse ANTES de instanciar PrismaClient
// para que DATABASE_URL est\u00e9 disponible cuando Prisma valida la conexi\u00f3n.
config({ path: resolve(__dirname, '..', '.env') });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;  // evitar m\u00faltiples instancias en dev
}`),

    h2('4.3 Validaci\u00f3n con Zod'),
    ...codeLines(`// participantSchema en tournaments.ts
const participantSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),

  // El campo 'email' se usa en el UI como 'Ciudad o Club'
  // NO se valida como email \u2014 acepta cualquier string
  email: z.union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => val === '' ? null : val),

  seed:       z.union([z.number(), z.null(), z.undefined()]).optional(),
  categoryId: z.union([z.string(), z.null(), z.undefined()]).optional(),
});`),
    pageBreak(),

    // ── 5. GENERACION DE LLAVES ──────────────────────────────────────────────────
    h1('5. Servicio de Generaci\u00f3n de Llaves (bracketService.ts)'),
    p('Ubicaci\u00f3n: backend/src/services/bracketService.ts'),
    p('Fuente \u00fanica de verdad para toda la l\u00f3gica de generaci\u00f3n de brackets. El endpoint /generate-bracket delega 100% a este servicio.'),

    h2('5.1 Dispatcher Principal'),
    ...codeLines(`export function generateBracket(type, participants, tournamentId, categoryId, bestOf) {
  switch (type) {
    case 'single_elimination':
      return generateSingleElimination(participants, tournamentId, categoryId, bestOf);
    case 'round_robin':
      return generateRoundRobin(participants, tournamentId, categoryId, bestOf);
    case 'vendetta':
      return generateVendetta(participants, tournamentId, categoryId, bestOf);
    case 'double_elimination':
    default:
      return generateDoubleElimination(participants, tournamentId, categoryId, bestOf);
  }
}`),

    h2('5.2 Single Elimination \u2014 L\u00f3gica'),
    ...codeLines(`// Ejemplo con 5 jugadores \u2192 nextPow2=8, 3 rondas, 4 matches en R1
//
// Seeding: p1=sorted[i], p2=sorted[nextPow2-1-i]
// Con 5 jugadores: posiciones 5,6,7 son BYE (null)
//
// Ronda 1:   1v8(bye)  2v7(bye)  3v6(bye)  4v5
//                \u21d3         \u21d3         \u21d3       |
// Ronda 2:   1 avanza  2 avanza  3 avanza  ganador(4v5)
//                \u21d3                         \u21d3
// Final:     1 vs ganador(3)    2 vs ganador(4v5)
//
// BYEs autom\u00e1ticos: si participant2Id es null \u2192 participant1 avanza directo
if (!m.participant2Id && m.participant1Id) {
  m.winnerId = m.participant1Id;
  m.status = 'completed';       // BYE resuelto autom\u00e1ticamente
}

// Conexi\u00f3n entre rondas:
prev[i*2].nextMatchId   = nextMatch.id; // ganador de match par
prev[i*2].nextMatchSlot = 0;            // va al slot 1 del siguiente
prev[i*2+1].nextMatchId   = nextMatch.id;
prev[i*2+1].nextMatchSlot = 1;          // va al slot 2 del siguiente`),

    h2('5.3 Double Elimination \u2014 L\u00f3gica'),
    ...codeLines(`// Estructura con 4 jugadores:
//
// WB R1:  1v4   2v3            m.loserMatchId \u2192 LB R1
//           \u2193\u2198       \u2193\u2198
// WB Final: (ganadores)         m.loserMatchId \u2192 LB R2
//               \u2193\u2198
//         GRAN FINAL (round=999)
//           [reset en round=1000 si gana el LB champion]
//
// LB R1:  perdedores de WB R1
// LB R2:  ganador LB R1 vs perdedor WB Final
// LB Final: ganador LB R2
//
// Conexiones clave:
//   wbMatch.nextMatchId   = ID siguiente match WB
//   wbMatch.loserMatchId  = ID match en LB donde cae el perdedor
//   lbMatch.nextMatchId   = ID siguiente match LB
//   lbFinal.nextMatchId   = grandFinal.id (slot 1)
//   wbFinal.nextMatchId   = grandFinal.id (slot 0)
//
// Grand Final Reset:
//   Si gana participant2 (LB champion) \u2192 se activa el match de reset
//   Si gana participant1 (WB champion) \u2192 se cancela el match de reset`),

    h2('5.4 Vendetta \u2014 L\u00f3gica'),
    ...codeLines(`// Vendetta: enfrentamiento 1v1 en serie (BO3/BO5/BO7)
// Con exactamente 2 participantes = 1 \u00fanico match con bestOf rounds
// Con m\u00e1s participantes = Single Elimination donde cada match es Vendetta

if (count === 2) {
  const m = mkMatch('vendetta', 1, 0, tournamentId, categoryId, { bestOf });
  m.participant1Id = sorted[0].id;
  m.participant2Id = sorted[1].id;
  return { matches: [m] };
}
// Con m\u00e1s de 2: Single Elimination con bracket='vendetta' y bestOf aplicado`),

    h2('5.5 Round Robin \u2014 L\u00f3gica'),
    ...codeLines(`// Algoritmo de rotaci\u00f3n de c\u00edrculo (Berry System)
// Todos los participantes se enfrentan entre s\u00ed exactamente una vez
//
// Con 4 jugadores (A,B,C,D) = 3 rondas, 6 partidos:
//   Ronda 1: A-D, B-C
//   Ronda 2: A-C, D-B
//   Ronda 3: A-B, C-D
//
// Si n\u00famero impar \u2192 agregar un BYE (null) como participante extra

for (let r = 0; r < rounds; r++) {
  for (let i = 0; i < n / 2; i++) {
    const p1 = ps[i];
    const p2 = ps[n - 1 - i];
    if (p1 && p2) createMatch(p1, p2, round=r+1);
  }
  // Rotar: fijar posici\u00f3n 0, rotar el resto
  const last = ps.pop();
  ps.splice(1, 0, last);
}`),
    pageBreak(),

    // ── 6. FRONTEND ─────────────────────────────────────────────────────────────
    h1('6. Frontend \u2014 React + TypeScript'),

    h2('6.1 Estado Global \u2014 apiStore.ts'),
    p('Zustand store centralizado. Maneja todos los datos de la app sin Redux ni Context complejo.'),
    ...codeLines(`export const useApiStore = create<ApiState>()((set) => ({
  tournaments:       [],
  currentTournament: null,
  isLoading:         false,
  error:             null,

  // Cargar lista \u2192 actualiza tournaments[]
  fetchTournaments: async () => { ... },

  // Cargar uno \u2192 actualiza currentTournament
  fetchTournament: async (id) => { ... },

  // Agregar participante \u2192 actualiza currentTournament.participants
  addParticipant: async (tournamentId, participant) => { ... },

  // Generar bracket \u2192 actualiza currentTournament con matches
  generateBracket: async (tournamentId) => { ... },

  // Registrar resultado \u2192 actualiza currentTournament
  advanceMatch: async (tournamentId, matchId, winnerId, ...) => { ... },
}))`),

    h2('6.2 tournamentUtils.ts \u2014 Construcci\u00f3n del Bracket'),
    ...codeLines(`// Convierte la lista plana de matches de la BD en la estructura Bracket visual
export function buildBracketsFromMatches(
  matches:          Match[],
  categoryIdToName: Map<string, string>   // categoryId \u2192 nombre
): Record<string, Bracket> | undefined {

  // 1. Agrupar por categor\u00eda usando categoryId (NO el campo legacy string)
  for (const m of matches) {
    if (m.bracket === 'group') continue;  // Round Robin \u2192 RoundRobinTable
    const cat = categoryIdToName?.get(m.categoryId) ?? 'Categor\u00eda \u00danica';
    // acumular en matchesByCat[cat]
  }

  // 2. Clasificar cada match en su secci\u00f3n
  if (m.bracket === 'winners' || m.bracket === 'vendetta') \u2192 wbRounds
  if (m.bracket === 'losers')                              \u2192 lbRounds
  if (m.bracket === 'grand_final')                         \u2192 grandFinal/reset

  // 3. Single Elim y Vendetta: no tienen grand_final
  //    Se crea un "grandFinal sint\u00e9tico" con el \u00faltimo match de WB
  const syntheticGF = grandFinal ?? lastWbMatch;

  return { [cat]: { winnersBracket, losersBracket, grandFinal: syntheticGF } };
}`),

    h2('6.3 Componentes Principales'),
    makeTable(
        ['Componente', 'Ubicaci\u00f3n', 'Funci\u00f3n'],
        [
            ['TournamentView', 'components/tournament/', 'Vista principal con tabs (General, Participantes, Categor\u00edas, Llaves, Ranking)'],
            ['CreateTournamentDialog', 'components/tournament/', 'Dialog para crear nuevo torneo con selector de tipo y formato'],
            ['ParticipantManager', 'components/participant/', 'CRUD de participantes: agregar, editar, eliminar, importar CSV, exportar Excel'],
            ['DoubleEliminationBracket', 'components/bracket/', 'Visualiza WB + LB + Gran Final en columnas horizontales con l\u00edneas de conexi\u00f3n'],
            ['BracketMatchCard', 'components/bracket/', 'Tarjeta de partido individual con nombres, botones de resultado y estado'],
            ['RoundRobinTable', 'components/bracket/', 'Tabla de posiciones + lista de partidos para Round Robin'],
            ['CategoryManager', 'components/category/', 'Gesti\u00f3n de categor\u00edas de peso y brazo por torneo'],
            ['PodiumView', 'components/tournament/', 'Podio y ranking completo al finalizar el torneo'],
        ]
    ),
    pageBreak(),

    // ── 7. FLUJO COMPLETO ────────────────────────────────────────────────────────
    h1('7. Flujo Completo de un Torneo'),
    h2('7.1 Estados del Torneo'),
    ...codeLines(`draft
  \u2502  Torneo creado. Se agregan participantes y categor\u00edas.
  \u25bc
registration (opcional)
  \u2502  Inscripciones abiertas.
  \u25bc
in_progress
  \u2502  POST /generate-bracket ejecutado. Los matches est\u00e1n activos.
  \u25bc
completed
  \u2502  Todos los partidos terminados. Podio disponible.
  \u25bc
cancelled`),

    h2('7.2 Proceso de Generaci\u00f3n de Llaves'),
    bullet('1. Frontend llama generateBracket(tournamentId) en apiStore'),
    bullet('2. POST /api/tournaments/:id/generate-bracket'),
    bullet('3. Backend borra matches anteriores (si existen)'),
    bullet('4. Agrupa participantes por categoryId'),
    bullet('5. Llama generateBracket(type, participants, ...) de bracketService.ts'),
    bullet('6. Guarda todos los matches en BD con prisma.match.createMany()'),
    bullet('7. Cambia estado del torneo a in_progress'),
    bullet('8. Responde con el torneo completo (categories + participants + matches)'),
    bullet('9. Frontend reconstruye el bracket visual con buildBracketsFromMatches()'),

    h2('7.3 Proceso de Registrar un Resultado'),
    bullet('1. Usuario hace clic en un participante en BracketMatchCard'),
    bullet('2. advanceMatch(tournamentId, matchId, winnerId, score1, score2) en apiStore'),
    bullet('3. PATCH /api/tournaments/:id/matches/:matchId'),
    bullet('4. Backend actualiza el match: status=completed, winnerId, loserId, scores'),
    bullet('5. Incrementa ParticipantStats del ganador: wins+1, matchesPlayed+1, pointsFor+=score1'),
    bullet('6. Incrementa ParticipantStats del perdedor: losses+1, matchesPlayed+1'),
    bullet('7. Si nextMatchId \u2192 coloca al ganador en el siguiente partido'),
    bullet('8. Si loserMatchId \u2192 coloca al perdedor en la llave de perdedores (Double Elim)'),
    bullet('9. L\u00f3gica de Grand Final Reset (si aplica)'),
    bullet('10. Responde con torneo completo actualizado'),
    pageBreak(),

    // ── 8. CONFIGURACION ─────────────────────────────────────────────────────────
    h1('8. Configuraci\u00f3n y Entorno'),
    h2('8.1 Variables de Entorno (backend/.env)'),
    ...codeLines(`DATABASE_URL="postgresql://postgres:Armrank2024!@localhost:5432/tournament_db"
JWT_SECRET="armrank_super_secret_jwt_key_2024"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173`),

    h2('8.2 Comandos de Ejecuci\u00f3n'),
    ...codeLines(`# ── Iniciar Backend ──────────────────────────────────────────
cd "d:/USUARIO/Documents/PROYECTO U/backend"
npm run dev
# Servidor en http://localhost:3001

# ── Iniciar Frontend ─────────────────────────────────────────
cd "d:/USUARIO/Documents/PROYECTO U/app"
npx vite --host 0.0.0.0 --port 5173
# App disponible en http://127.0.0.1:5173
# NOTA: Usar 127.0.0.1 no 'localhost' (bug IPv6 en Vite 7 + Windows)

# ── Base de Datos ────────────────────────────────────────────
npx prisma migrate deploy   # aplicar migraciones pendientes
npx prisma studio           # interfaz visual de la DB`),

    // ── 9. BUGS RESUELTOS ────────────────────────────────────────────────────────
    h1('9. Historial de Bugs Corregidos'),
    makeTable(
        ['Severidad', 'Problema', 'Soluci\u00f3n'],
        [
            ['Cr\u00edtico', 'tournaments.ts duplicaba ~300 LOC de generadores de bracket. El fix de bracketService.ts nunca se aplicaba.', 'Eliminado c\u00f3digo duplicado. Endpoint delega a bracketService.generateBracket().'],
            ['Cr\u00edtico', 'Estad\u00edsticas de participantes (wins/losses) nunca se actualizaban al registrar resultados.', 'Se a\u00f1adi\u00f3 updateMany para ganador y perdedor despu\u00e9s de cada resultado.'],
            ['Cr\u00edtico', 'tournamentUtils.ts agrupaba por m.category (string legacy). Brackets de categor\u00edas modernas nunca se constru\u00edan.', 'Ahora agrupa por categoryId con Map<string,string> como par\u00e1metro.'],
            ['Cr\u00edtico', 'Single Elimination y Vendetta nunca aparec\u00edan en pesta\u00f1a Llaves (requieren grand_final que no existe).', 'Se genera un grandFinal sint\u00e9tico usando el \u00faltimo match de la llave de ganadores.'],
            ['Grave', 'Campo email validado como z.string().email() pero en UI es "Ciudad o Club". Rechazaba textos como "Madrid".', 'Eliminada validaci\u00f3n de formato email. Acepta cualquier string.'],
            ['Grave', 'Descripci\u00f3n de tipo de torneo mostraba siempre "Doble Eliminaci\u00f3n" para todos los tipos.', 'Tarjeta de descripci\u00f3n es din\u00e1mica seg\u00fan tournament.type.'],
            ['Grave', 'Vendetta en bracketService generaba Double Elimination en vez de estructura 1v1.', 'Se cre\u00f3 generateVendetta() con l\u00f3gica propia.'],
            ['Medio', 'Bug hasBoth: operador || mezclaba null con valores existentes en avance de matches.', 'Reemplazado con checks expl\u00edcitos de null.'],
        ]
    ),
);

// ── Ensamblar y guardar ────────────────────────────────────────────────────────
const doc = new Document({
    styles: {
        default: {
            document: {
                run: { font: 'Calibri', size: 22 },
            },
        },
    },
    sections: [{ children: sections }],
});

const outputPath = path.join('D:\\USUARIO\\Documents\\PROYECTO U', 'ARMRANK_Documentacion.docx');

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(outputPath, buffer);
    console.log('\n✅ Documento generado exitosamente:');
    console.log('   ' + outputPath);
}).catch(err => {
    console.error('Error al generar el documento:', err);
    process.exit(1);
});
