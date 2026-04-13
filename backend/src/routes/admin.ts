import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const totalUsers = await prisma.user.count();
    const totalTournaments = await prisma.tournament.count();
    const activeTournaments = await prisma.tournament.count({
      where: { status: 'in_progress' },
    });
    const completedTournaments = await prisma.tournament.count({
      where: { status: 'completed' },
    });

    // Time-series data for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });
    
    const recentTournamentsList = await prisma.tournament.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const chartData = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = monthNames[d.getMonth()];
      
      const usersInMonth = recentUsers.filter(u => u.createdAt.getMonth() === d.getMonth() && u.createdAt.getFullYear() === d.getFullYear()).length;
      const tournamentsInMonth = recentTournamentsList.filter(t => t.createdAt.getMonth() === d.getMonth() && t.createdAt.getFullYear() === d.getFullYear()).length;
      
      chartData.push({
        name: monthStr,
        Usuarios: usersInMonth,
        Torneos: tournamentsInMonth
      });
    }

    res.json({
      totalUsers,
      totalTournaments,
      activeTournaments,
      completedTournaments,
      chartData,
    });
  })
);

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: { tournaments: true },
        },
      },
    });
    res.json(users);
  })
);

// ─── GET /api/admin/tournaments ───────────────────────────────────────────────

router.get(
  '/tournaments',
  asyncHandler(async (req, res) => {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { participants: true, matches: true } }
      }
    });
    res.json(tournaments);
  })
);

// ─── PATCH /api/admin/users/:id/status ────────────────────────────────────────

const updateStatusSchema = z.object({
  active: z.boolean(),
});

router.patch(
  '/users/:id/status',
  asyncHandler(async (req, res) => {
    const { active } = updateStatusSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { active },
      select: { id: true, name: true, email: true, active: true },
    });
    res.json(user);
  })
);

// ─── PATCH /api/admin/users/:id/role ──────────────────────────────────────────

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'organizer', 'athlete', 'spectator']),
});

router.patch(
  '/users/:id/role',
  asyncHandler(async (req, res) => {
    const { role } = updateRoleSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  })
);

// ─── GET /api/admin/config ────────────────────────────────────────────────────

router.get(
  '/config',
  asyncHandler(async (req, res) => {
    let config = await prisma.systemConfig.findUnique({
      where: { id: 'global' },
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: { id: 'global', registrationsEnabled: true, maintenanceMode: false },
      });
    }

    res.json(config);
  })
);

// ─── PATCH /api/admin/config ──────────────────────────────────────────────────

const updateConfigSchema = z.object({
  registrationsEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
});

router.patch(
  '/config',
  asyncHandler(async (req, res) => {
    const data = updateConfigSchema.parse(req.body);
    const config = await prisma.systemConfig.update({
      where: { id: 'global' },
      data,
    });
    res.json(config);
  })
);

export default router;
