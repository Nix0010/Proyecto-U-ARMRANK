import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { generateBracket } from '../services/bracketService';
import { requireAuth, optionalAuth } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

const createTournamentSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  description: z.string().trim().optional(),
  sport: z.string().trim().default('armwrestling'),
  type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'vendetta']).default('double_elimination'),
  maxParticipants: z.number().int().min(2).max(256).default(16),
  location: z.string().trim().optional(),
  organizerName: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  bestOf: z.number().int().refine((value) => [1, 3, 5, 7].includes(value)).default(1),
});

const updateTournamentSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  status: z.enum(['draft', 'registration', 'in_progress', 'completed', 'cancelled']).optional(),
  sport: z.string().trim().optional(),
  type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'vendetta']).optional(),
  maxParticipants: z.number().int().min(2).max(256).optional(),
  location: z.string().trim().optional(),
  organizerName: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  bestOf: z.number().int().refine((value) => [1, 3, 5, 7].includes(value)).optional(),
});

const nullableString = z.union([z.string(), z.literal(''), z.null(), z.undefined()])
  .optional()
  .transform((value) => value && value.trim() !== '' ? value.trim() : null);

const participantSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: nullableString,
  phone: nullableString,
  avatar: nullableString,
  seed: z.union([z.number().int(), z.null(), z.undefined()]).optional(),
  team: nullableString,
  country: nullableString,
  weight: z.union([z.number(), z.null(), z.undefined()]).optional(),
  categoryId: z.union([z.string(), z.null(), z.undefined()]).optional(),
  category: nullableString,
});

const matchResultSchema = z.object({
  winnerId: z.string().min(1, 'Debes indicar un ganador'),
  score1: z.number().optional().nullable(),
  score2: z.number().optional().nullable(),
  resultType: nullableString,
  arm: nullableString,
  seriesResults: z.unknown().optional(),
});

const formatZodError = (error: z.ZodError) => error.errors.map((issue) => {
  const path = issue.path.length > 0 ? issue.path.join('.') : 'dato';
  return `${path}: ${issue.message}`;
}).join('; ');

const getTournamentWithRelations = (id: string) => prisma.tournament.findUnique({
  where: { id },
  include: {
    categories: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
    participants: {
      include: { stats: true, category: true },
      orderBy: [{ seed: 'asc' }, { createdAt: 'asc' }],
    },
    matches: {
      orderBy: [{ bracket: 'asc' }, { round: 'asc' }, { position: 'asc' }],
    },
  },
});

async function resolveCategoryId(tournamentId: string, categoryId?: string | null, categoryName?: string | null) {
  if (categoryId) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, tournamentId } });
    if (!category) {
      throw new Error('La categoria seleccionada no pertenece a este torneo');
    }
    return category.id;
  }

  if (!categoryName) {
    return null;
  }

  const category = await prisma.category.findFirst({
    where: {
      tournamentId,
      name: { equals: categoryName, mode: 'insensitive' },
    },
  });

  return category?.id ?? null;
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const whereClause: any = { isPublic: true }; // Default for guests

    if (req.user) {
      if (req.user.role === 'admin') {
        // Admins see everything
        delete whereClause.isPublic;
      } else {
        // Users see public ones OR their own
        whereClause.OR = [
          { isPublic: true },
          { createdById: req.user.userId }
        ];
        delete whereClause.isPublic;
      }
    }

    const tournaments = await prisma.tournament.findMany({
      where: whereClause,
      include: {
        _count: { select: { participants: true, matches: true, categories: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tournaments);
  } catch (error) {
    console.error('[GET /tournaments]', error);
    res.status(500).json({ error: 'Error al obtener torneos' });
  }
});

// ─── GET /api/tournaments/:id/public ──────────────────────────────────────────

router.get(
  '/:id/public',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            participants: {
              include: { stats: true },
            },
          },
        },
        participants: {
          include: { stats: true },
        },
        matches: true,
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    if (!(tournament as any).isPublic) {
      return res.status(403).json({ error: 'Este torneo es privado' });
    }

    res.json(tournament);
  })
);

// ─── GET /api/tournaments/:id ─────────────────────────────────────────────────

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const tournament = await getTournamentWithRelations(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    if (!tournament.isPublic) {
      const isOwner = req.user?.userId === tournament.createdById;
      const isAdmin = req.user?.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'No tienes permiso para ver este torneo' });
      }
    }

    return res.json(tournament);
  } catch {
    return res.status(500).json({ error: 'Error al obtener torneo' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const data = createTournamentSchema.parse(req.body);
    const tournament = await prisma.tournament.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        sport: data.sport.toLowerCase(),
        createdById: req.user!.userId, // Enforce ownership
      },
    });

    return res.status(201).json(tournament);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    return res.status(500).json({ error: 'Error al crear torneo' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const data = updateTournamentSchema.parse(req.body);
    const tournamentId = req.params.id;

    const existing = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!existing) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    const isAdmin = req.user!.role === 'admin';
    const isOwner = existing.createdById === req.user!.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'No tienes permisos para modificar este torneo' });
    }

    if (data.maxParticipants && data.maxParticipants < existing.currentParticipants) {
      return res.status(400).json({ error: 'El cupo maximo no puede ser menor al numero actual de participantes' });
    }

    if (data.status === 'draft') {
      await prisma.$transaction(async (tx) => {
        await tx.match.deleteMany({ where: { tournamentId } });
        const participants = await tx.participant.findMany({ where: { tournamentId }, select: { id: true } });
        if (participants.length > 0) {
          await tx.participantStats.updateMany({
            where: { participantId: { in: participants.map((participant) => participant.id) } },
            data: { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0, rank: null },
          });
        }
      });
    }

    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        ...data,
        sport: data.sport?.toLowerCase(),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    return res.json(tournament);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    return res.status(500).json({ error: 'Error al actualizar torneo' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.tournament.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Torneo no encontrado' });

    const isAdmin = req.user!.role === 'admin';
    const isOwner = existing.createdById === req.user!.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este torneo' });
    }

    await prisma.tournament.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Torneo eliminado' });
  } catch {
    return res.status(500).json({ error: 'Error al eliminar torneo' });
  }
});

router.post('/:id/participants', requireAuth, async (req, res) => {
  try {
    const data = participantSchema.parse(req.body);
    const tournamentId = req.params.id;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: { select: { id: true, seed: true } } },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    const isAdmin = req.user!.role === 'admin';
    const isOwner = tournament.createdById === req.user!.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'No tienes permisos para agregar participantes' });
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({ error: 'Torneo lleno' });
    }

    const nextSeed = Math.max(0, ...tournament.participants.map((participant) => participant.seed ?? 0)) + 1;
    const resolvedCategoryId = await resolveCategoryId(tournamentId, data.categoryId, data.category);

    const participant = await prisma.$transaction(async (tx) => {
      const created = await tx.participant.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar,
          seed: data.seed ?? nextSeed,
          team: data.team,
          country: data.country,
          weight: data.weight,
          categoryId: resolvedCategoryId,
          tournamentId,
          stats: {
            create: { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0 },
          },
        },
        include: { stats: true, category: true },
      });

      await tx.tournament.update({
        where: { id: tournamentId },
        data: { currentParticipants: { increment: 1 } },
      });

      return created;
    });

    return res.status(201).json(participant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error al agregar participante' });
  }
});

router.patch('/:id/participants/:participantId', requireAuth, async (req, res) => {
  try {
    const data = participantSchema.partial().parse(req.body);
    const tournamentId = req.params.id;
    const participantId = req.params.participantId;

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });

    const isAdmin = req.user!.role === 'admin';
    const isOwner = tournament.createdById === req.user!.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'No tienes permisos para modificar participantes' });
    }

    const participant = await prisma.participant.findFirst({ where: { id: participantId, tournamentId } });
    if (!participant) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }

    const resolvedCategoryId = await resolveCategoryId(tournamentId, data.categoryId, data.category);

    const updated = await prisma.participant.update({
      where: { id: participantId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        seed: data.seed,
        team: data.team,
        country: data.country,
        weight: data.weight,
        categoryId: resolvedCategoryId,
      },
      include: { stats: true, category: true },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error al actualizar participante' });
  }
});

router.delete('/:id/participants/:participantId', requireAuth, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const participantId = req.params.participantId;

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });

    const isAdmin = req.user!.role === 'admin';
    const isOwner = tournament.createdById === req.user!.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar participantes' });
    }

    const participant = await prisma.participant.findFirst({ where: { id: participantId, tournamentId } });
    if (!participant) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.participant.delete({ where: { id: participantId } });
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { currentParticipants: { decrement: 1 } },
      });
    });

    return res.json({ message: 'Participante eliminado' });
  } catch {
    return res.status(500).json({ error: 'Error al eliminar participante' });
  }
});

router.post('/:id/generate-bracket', requireAuth, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: { include: { category: true } } },
    });

    if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });

    const isAdmin = req.user!.role === 'admin';
    const isOwner = tournament.createdById === req.user!.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'No tienes permisos para generar llaves' });
    }

    if (tournament.participants.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 participantes' });
    }

    await prisma.match.deleteMany({ where: { tournamentId } });

    const byCategory = new Map<string, typeof tournament.participants>();
    for (const participant of tournament.participants) {
      const key = participant.categoryId ?? '__none__';
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)?.push(participant);
    }

    let allMatches: ReturnType<typeof generateBracket>['matches'] = [];
    const type = tournament.type ?? 'double_elimination';
    const bestOf = tournament.bestOf ?? 1;

    for (const [categoryKey, participants] of byCategory.entries()) {
      if (participants.length < 2) continue;
      const categoryId = categoryKey === '__none__' ? null : categoryKey;
      const result = generateBracket(type, participants, tournamentId, categoryId, bestOf);
      allMatches = allMatches.concat(result.matches);
    }

    if (allMatches.length === 0) {
      return res.status(400).json({ error: 'No se puede generar el bracket. Debe haber al menos 2 participantes en la misma categoria.' });
    }

    await prisma.match.createMany({
      data: allMatches.map((match) => ({
        id: match.id,
        tournamentId: match.tournamentId,
        round: match.round,
        position: match.position,
        bracket: match.bracket,
        status: match.status,
        participant1Id: match.participant1Id ?? null,
        participant2Id: match.participant2Id ?? null,
        winnerId: match.winnerId ?? null,
        loserId: match.loserId ?? null,
        score1: match.score1 ?? null,
        score2: match.score2 ?? null,
        nextMatchId: match.nextMatchId ?? null,
        nextMatchSlot: match.nextMatchSlot ?? null,
        loserMatchId: match.loserMatchId ?? null,
        loserMatchSlot: match.loserMatchSlot ?? null,
        categoryId: match.categoryId ?? null,
        arm: match.arm ?? null,
        bestOf: match.bestOf ?? 1,
        resultType: null,
        seriesResults: null,
      })),
    });

    await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'in_progress' } });
    const updatedTournament = await getTournamentWithRelations(tournamentId);
    return res.json(updatedTournament);
  } catch (error) {
    console.error('[generate-bracket]', error);
    return res.status(500).json({ error: 'Error al generar bracket' });
  }
});

router.patch('/:id/matches/:matchId', requireAuth, async (req, res) => {
  try {
    const data = matchResultSchema.parse(req.body);
    const matchId = req.params.matchId;
    const tournamentId = req.params.id;

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });

    const isAdmin = req.user!.role === 'admin';
    const isOwner = tournament.createdById === req.user!.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar partidos' });
    }

    const match = await prisma.match.findFirst({ where: { id: matchId, tournamentId } });
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.status === 'completed') return res.status(400).json({ error: 'Partido ya completado' });
    if (![match.participant1Id, match.participant2Id].includes(data.winnerId)) {
      return res.status(400).json({ error: 'El ganador no pertenece a este partido' });
    }

    const loserId = match.participant1Id === data.winnerId ? match.participant2Id : match.participant1Id;

    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId: data.winnerId,
        loserId,
        score1: data.score1 ?? null,
        score2: data.score2 ?? null,
        status: 'completed',
        resultType: data.resultType || null,
        arm: data.arm || match.arm || null,
        seriesResults: data.seriesResults ? JSON.stringify(data.seriesResults) : null,
      },
    });

    if (data.winnerId) {
      await prisma.participantStats.updateMany({
        where: { participantId: data.winnerId },
        data: {
          wins: { increment: 1 },
          matchesPlayed: { increment: 1 },
          pointsFor: { increment: data.score1 ?? 0 },
          pointsAgainst: { increment: data.score2 ?? 0 },
        },
      });
    }

    if (loserId) {
      await prisma.participantStats.updateMany({
        where: { participantId: loserId },
        data: {
          losses: { increment: 1 },
          matchesPlayed: { increment: 1 },
          pointsFor: { increment: data.score2 ?? 0 },
          pointsAgainst: { increment: data.score1 ?? 0 },
        },
      });
    }

    if (match.nextMatchId && data.winnerId) {
      const nextMatch = await prisma.match.findFirst({ where: { id: match.nextMatchId, tournamentId } });
      if (nextMatch && nextMatch.status !== 'completed') {
        const updateData: Record<string, string> & { status?: string } = {} as Record<string, string> & { status?: string };
        if (match.nextMatchSlot === 0) updateData.participant1Id = data.winnerId;
        else updateData.participant2Id = data.winnerId;

        const participant1Id = updateData.participant1Id ?? nextMatch.participant1Id ?? undefined;
        const participant2Id = updateData.participant2Id ?? nextMatch.participant2Id ?? undefined;
        if (participant1Id && participant2Id) updateData.status = 'pending';

        await prisma.match.update({ where: { id: match.nextMatchId }, data: updateData });
      }
    }

    if (match.loserMatchId && loserId) {
      const loserMatch = await prisma.match.findFirst({ where: { id: match.loserMatchId, tournamentId } });
      if (loserMatch && loserMatch.status !== 'completed') {
        const updateData: Record<string, string> & { status?: string } = {} as Record<string, string> & { status?: string };
        if (match.loserMatchSlot === 0) updateData.participant1Id = loserId;
        else updateData.participant2Id = loserId;

        const participant1Id = updateData.participant1Id ?? loserMatch.participant1Id ?? undefined;
        const participant2Id = updateData.participant2Id ?? loserMatch.participant2Id ?? undefined;
        if (participant1Id && participant2Id) updateData.status = 'pending';

        await prisma.match.update({ where: { id: match.loserMatchId }, data: updateData });
      }
    }

    const grandFinal = await prisma.match.findFirst({ where: { tournamentId, bracket: 'grand_final', round: 999 } });
    const grandFinalReset = await prisma.match.findFirst({ where: { tournamentId, bracket: 'grand_final', round: 1000 } });

    if (grandFinal && grandFinalReset && matchId === grandFinal.id) {
      if (data.winnerId === grandFinal.participant2Id) {
        await prisma.match.update({
          where: { id: grandFinalReset.id },
          data: {
            participant1Id: grandFinal.participant1Id,
            participant2Id: grandFinal.participant2Id,
            status: 'pending',
          },
        });
      } else {
        await prisma.match.update({ where: { id: grandFinalReset.id }, data: { status: 'cancelled' } });
      }
    }

    const updatedTournament = await getTournamentWithRelations(tournamentId);
    return res.json(updatedTournament);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    console.error('[PATCH match]', error);
    return res.status(500).json({ error: 'Error al actualizar partido' });
  }
});

router.get('/:id/ranking', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const participants = await prisma.participant.findMany({
      where: { tournamentId },
      include: { stats: true },
    });

    const ranked = participants
      .map((participant) => ({
        id: participant.id,
        name: participant.name,
        team: participant.team,
        country: participant.country,
        wins: participant.stats?.wins ?? 0,
        losses: participant.stats?.losses ?? 0,
        matchesPlayed: participant.stats?.matchesPlayed ?? 0,
        pointsFor: participant.stats?.pointsFor ?? 0,
        pointsAgainst: participant.stats?.pointsAgainst ?? 0,
      }))
      .sort((left, right) => right.wins - left.wins || left.losses - right.losses);

    const podium = ranked.slice(0, 3).map((participant, index) => ({ ...participant, rank: index + 1 }));
    return res.json({ ranking: ranked, podium });
  } catch (error) {
    console.error('[GET ranking]', error);
    return res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

export default router;
