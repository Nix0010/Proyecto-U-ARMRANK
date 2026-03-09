import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

const router = Router({ mergeParams: true });

type TournamentParams = { tournamentId: string };
type CategoryParams = { tournamentId: string; id: string };

const categorySchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    weightClass: z.string().optional().nullable(),
    arm: z.enum(['right', 'left', 'both']).default('right'),
    sortOrder: z.number().int().optional().default(0),
});

// GET /api/tournaments/:tournamentId/categories
router.get('/', async (req: Request<TournamentParams>, res: Response) => {
    const { tournamentId } = req.params;
    try {
        const categories = await prisma.category.findMany({
            where: { tournamentId },
            include: { _count: { select: { participants: true, matches: true } } },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        res.json(categories.map(c => ({ ...c, participantCount: c._count.participants, matchCount: c._count.matches })));
    } catch (error) {
        console.error('[GET categories]', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// POST /api/tournaments/:tournamentId/categories
router.post('/', async (req: Request<TournamentParams>, res: Response) => {
    const { tournamentId } = req.params;
    try {
        const body = categorySchema.parse(req.body);
        const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });

        const category = await prisma.category.create({ data: { ...body, tournamentId } });
        return res.status(201).json(category);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        console.error('[POST category]', error);
        return res.status(500).json({ error: 'Error al crear categoría' });
    }
});

// PATCH /api/tournaments/:tournamentId/categories/:id
router.patch('/:id', async (req: Request<CategoryParams>, res: Response) => {
    const { id, tournamentId } = req.params;
    try {
        const body = categorySchema.partial().parse(req.body);
        const category = await prisma.category.findFirst({ where: { id, tournamentId } });
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        const updated = await prisma.category.update({ where: { id }, data: body });
        return res.json(updated);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        console.error('[PATCH category]', error);
        return res.status(500).json({ error: 'Error al actualizar categoría' });
    }
});

// DELETE /api/tournaments/:tournamentId/categories/:id
router.delete('/:id', async (req: Request<CategoryParams>, res: Response) => {
    const { id, tournamentId } = req.params;
    try {
        const category = await prisma.category.findFirst({ where: { id, tournamentId } });
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        await prisma.category.delete({ where: { id } });
        return res.json({ success: true });
    } catch (error) {
        console.error('[DELETE category]', error);
        return res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});

export default router;
