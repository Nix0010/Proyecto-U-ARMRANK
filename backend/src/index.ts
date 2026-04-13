import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tournamentRoutes from './routes/tournaments';
import categoryRoutes from './routes/categories';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import rankingsRoutes from './routes/rankings';
import { prisma } from './db';
import { globalErrorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Environment ──────────────────────────────────────────────────────────────

const isDevelopment = process.env.NODE_ENV !== 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log(`🛠️  Environment: ${isDevelopment ? 'development' : 'production'}`);
console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: isDevelopment ? true : FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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
app.use('/api/auth', authRoutes);

// Tournament CRUD + bracket generation + match results
app.use('/api/tournaments', tournamentRoutes);

// Category management (nested under tournament)
app.use('/api/tournaments/:tournamentId/categories', categoryRoutes);

// Admin dashboard and management
app.use('/api/admin', adminRoutes);

// Global Rankings
app.use('/api/rankings', rankingsRoutes);

// ─── Error Handler (MUST be last) ─────────────────────────────────────────────

app.use(globalErrorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 ARMRANK API corriendo en puerto ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
});
