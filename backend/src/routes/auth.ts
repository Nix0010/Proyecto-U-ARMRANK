import { Router } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, getUserById, loginWithGoogle } from '../services/authService';
import { requireAuth } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { prisma } from '../db';

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const registerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    country: z.string().optional(),
    team: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post(
    '/register',
    asyncHandler(async (req, res) => {
        const data = registerSchema.parse(req.body);
        const { user, token } = await registerUser(data);
        res.status(201).json({ user, token });
    })
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post(
    '/login',
    asyncHandler(async (req, res) => {
        const { email, password } = loginSchema.parse(req.body);
        const { user, token } = await loginUser(email, password);
        res.json({ user, token });
    })
);

// ─── POST /api/auth/google ────────────────────────────────────────────────────

const googleSchema = z.object({
    credential: z.string().min(1, 'Token requerido'),
});

router.post(
    '/google',
    asyncHandler(async (req, res) => {
        const { credential } = googleSchema.parse(req.body);
        const { user, token } = await loginWithGoogle(credential);
        res.status(200).json({ user, token });
    })
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
        const user = await getUserById(req.user!.userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    })
);

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────

const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    country: z.string().optional(),
    team: z.string().optional(),
    avatar: z.string().url().optional().nullable(),
});

router.patch(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
        const data = updateProfileSchema.parse(req.body);
        const updated = await prisma.user.update({
            where: { id: req.user!.userId },
            data,
            select: { id: true, name: true, email: true, role: true, avatar: true, country: true, team: true },
        });
        res.json(updated);
    })
);

// ─── GET /api/auth/users (admin only) ────────────────────────────────────────

import { requireRole } from '../middlewares/auth';

router.get(
    '/users',
    requireAuth,
    requireRole('admin'),
    asyncHandler(async (req, res) => {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, role: true, avatar: true, country: true, team: true, createdAt: true, active: true },
        });
        res.json(users);
    })
);

// ─── PATCH /api/auth/users/:userId/role (admin only) ──────────────────────────

router.patch(
    '/users/:userId/role',
    requireAuth,
    requireRole('admin'),
    asyncHandler(async (req, res) => {
        const { role } = z.object({ role: z.enum(['admin', 'organizer', 'athlete', 'spectator']) }).parse(req.body);
        const updated = await prisma.user.update({
            where: { id: req.params.userId },
            data: { role },
            select: { id: true, name: true, email: true, role: true },
        });
        res.json(updated);
    })
);

export default router;
