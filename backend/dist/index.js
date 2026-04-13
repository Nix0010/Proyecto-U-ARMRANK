"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const tournaments_1 = __importDefault(require("./routes/tournaments"));
const categories_1 = __importDefault(require("./routes/categories"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const rankings_1 = __importDefault(require("./routes/rankings"));
const db_1 = require("./db");
const errorHandler_1 = require("./middlewares/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// ─── Environment ──────────────────────────────────────────────────────────────
const isDevelopment = process.env.NODE_ENV !== 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
console.log(`🛠️  Environment: ${isDevelopment ? 'development' : 'production'}`);
console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: isDevelopment ? true : FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '2mb' }));
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
    try {
        await db_1.prisma.$queryRaw `SELECT 1`;
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
});
// ─── Routes ───────────────────────────────────────────────────────────────────
// Auth (register / login / profile)
app.use('/api/auth', auth_1.default);
// Tournament CRUD + bracket generation + match results
app.use('/api/tournaments', tournaments_1.default);
// Category management (nested under tournament)
app.use('/api/tournaments/:tournamentId/categories', categories_1.default);
// Admin dashboard and management
app.use('/api/admin', admin_1.default);
// Global Rankings
app.use('/api/rankings', rankings_1.default);
// ─── Error Handler (MUST be last) ─────────────────────────────────────────────
app.use(errorHandler_1.globalErrorHandler);
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 ARMRANK API corriendo en puerto ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
});
//# sourceMappingURL=index.js.map