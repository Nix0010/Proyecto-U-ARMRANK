"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const router = (0, express_1.Router)({ mergeParams: true });
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'El nombre es obligatorio'),
    weightClass: zod_1.z.string().optional().nullable(),
    arm: zod_1.z.enum(['right', 'left', 'both']).default('right'),
    sortOrder: zod_1.z.number().int().optional().default(0),
});
// GET /api/tournaments/:tournamentId/categories
router.get('/', async (req, res) => {
    const { tournamentId } = req.params;
    try {
        const categories = await db_1.prisma.category.findMany({
            where: { tournamentId },
            include: { _count: { select: { participants: true, matches: true } } },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        res.json(categories.map(c => ({ ...c, participantCount: c._count.participants, matchCount: c._count.matches })));
    }
    catch (error) {
        console.error('[GET categories]', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});
// POST /api/tournaments/:tournamentId/categories
router.post('/', async (req, res) => {
    const { tournamentId } = req.params;
    try {
        const body = categorySchema.parse(req.body);
        const tournament = await db_1.prisma.tournament.findUnique({ where: { id: tournamentId } });
        if (!tournament)
            return res.status(404).json({ error: 'Torneo no encontrado' });
        const category = await db_1.prisma.category.create({ data: { ...body, tournamentId } });
        return res.status(201).json(category);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        console.error('[POST category]', error);
        return res.status(500).json({ error: 'Error al crear categoría' });
    }
});
// PATCH /api/tournaments/:tournamentId/categories/:id
router.patch('/:id', async (req, res) => {
    const { id, tournamentId } = req.params;
    try {
        const body = categorySchema.partial().parse(req.body);
        const category = await db_1.prisma.category.findFirst({ where: { id, tournamentId } });
        if (!category)
            return res.status(404).json({ error: 'Categoría no encontrada' });
        const updated = await db_1.prisma.category.update({ where: { id }, data: body });
        return res.json(updated);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        console.error('[PATCH category]', error);
        return res.status(500).json({ error: 'Error al actualizar categoría' });
    }
});
// DELETE /api/tournaments/:tournamentId/categories/:id
router.delete('/:id', async (req, res) => {
    const { id, tournamentId } = req.params;
    try {
        const category = await db_1.prisma.category.findFirst({ where: { id, tournamentId } });
        if (!category)
            return res.status(404).json({ error: 'Categoría no encontrada' });
        await db_1.prisma.category.delete({ where: { id } });
        return res.json({ success: true });
    }
    catch (error) {
        console.error('[DELETE category]', error);
        return res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map