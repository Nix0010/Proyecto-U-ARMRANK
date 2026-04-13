"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const auth_1 = require("../middlewares/auth");
const errorHandler_1 = require("../middlewares/errorHandler");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// ─── Schemas ──────────────────────────────────────────────────────────────────
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    country: zod_1.z.string().optional(),
    team: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'Contraseña requerida'),
});
// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const { user, token } = await (0, authService_1.registerUser)(data);
    res.status(201).json({ user, token });
}));
// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const { user, token } = await (0, authService_1.loginUser)(email, password);
    res.json({ user, token });
}));
// ─── POST /api/auth/google ────────────────────────────────────────────────────
const googleSchema = zod_1.z.object({
    credential: zod_1.z.string().min(1, 'Token requerido'),
});
router.post('/google', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { credential } = googleSchema.parse(req.body);
    const { user, token } = await (0, authService_1.loginWithGoogle)(credential);
    res.status(200).json({ user, token });
}));
// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await (0, authService_1.getUserById)(req.user.userId);
    if (!user)
        return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
}));
// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    country: zod_1.z.string().optional(),
    team: zod_1.z.string().optional(),
    avatar: zod_1.z.string().url().optional().nullable(),
});
router.patch('/me', auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    const updated = await db_1.prisma.user.update({
        where: { id: req.user.userId },
        data,
        select: { id: true, name: true, email: true, role: true, avatar: true, country: true, team: true },
    });
    res.json(updated);
}));
// ─── GET /api/auth/users (admin only) ────────────────────────────────────────
const auth_2 = require("../middlewares/auth");
router.get('/users', auth_1.requireAuth, (0, auth_2.requireRole)('admin'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const users = await db_1.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, avatar: true, country: true, team: true, createdAt: true, active: true },
    });
    res.json(users);
}));
// ─── PATCH /api/auth/users/:userId/role (admin only) ──────────────────────────
router.patch('/users/:userId/role', auth_1.requireAuth, (0, auth_2.requireRole)('admin'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { role } = zod_1.z.object({ role: zod_1.z.enum(['admin', 'organizer', 'athlete', 'spectator']) }).parse(req.body);
    const updated = await db_1.prisma.user.update({
        where: { id: req.params.userId },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
    });
    res.json(updated);
}));
exports.default = router;
//# sourceMappingURL=auth.js.map