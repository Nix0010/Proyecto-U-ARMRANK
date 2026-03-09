import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { generateBracket } from '../services/bracketService';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createTournamentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sport: z.string().default('armwrestling'),
  type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'vendetta']).default('double_elimination'),
  maxParticipants: z.number().min(2).max(256).default(16),
  location: z.string().optional(),
  organizerName: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  bestOf: z.number().int().refine(v => [1, 3, 5, 7].includes(v)).default(1),
});

const updateTournamentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'registration', 'in_progress', 'completed', 'cancelled']).optional(),
  sport: z.string().optional(),
  type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'vendetta']).optional(),
  maxParticipants: z.number().min(2).max(256).optional(),
  location: z.string().optional(),
  organizerName: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  bestOf: z.number().int().refine(v => [1, 3, 5, 7].includes(v)).optional(),
});

const participantSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  // 'email' field is used as Ciudad/Club in the UI — accept any string value
  email: z.union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => (val === '' ? null : val)),
  phone: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().transform(val => val === '' ? null : val),
  avatar: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().transform(val => val === '' ? null : val),
  seed: z.union([z.number(), z.null(), z.undefined()]).optional(),
  team: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().transform(val => val === '' ? null : val),
  country: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().transform(val => val === '' ? null : val),
  weight: z.union([z.number(), z.null(), z.undefined()]).optional(),
  categoryId: z.union([z.string(), z.null(), z.undefined()]).optional(),
  category: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().transform(val => val === '' ? null : val),
});

// ─── Tournament Routes ────────────────────────────────────────────────────────

// GET /api/tournaments - Listar todos los torneos
router.get('/', async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        _count: { select: { participants: true, matches: true, categories: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener torneos' });
  }
});

// GET /api/tournaments/:id - Obtener un torneo con todos sus datos
router.get('/:id', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        categories: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        participants: {
          include: { stats: true, category: true },
          orderBy: { seed: 'asc' },
        },
        matches: {
          orderBy: [
            { bracket: 'asc' },
            { round: 'asc' },
            { position: 'asc' },
          ],
        },
      },
    });
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener torneo' });
  }
});

// POST /api/tournaments - Crear torneo
router.post('/', async (req, res) => {
  try {
    const data = createTournamentSchema.parse(req.body);
    const tournament = await prisma.tournament.create({
      data: {
        name: data.name,
        description: data.description,
        sport: data.sport,
        type: data.type,
        maxParticipants: data.maxParticipants,
        bestOf: data.bestOf,
        location: data.location,
        organizerName: data.organizerName,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
    res.status(201).json(tournament);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Error al crear torneo' });
  }
});

// PATCH /api/tournaments/:id - Actualizar torneo
router.patch('/:id', async (req, res) => {
  try {
    const data = updateTournamentSchema.parse(req.body);

    // If reverting to draft, clean up matches and reset participant stats
    if (data.status === 'draft') {
      const tournamentId = req.params.id;
      await prisma.match.deleteMany({ where: { tournamentId } });
      const participants = await prisma.participant.findMany({
        where: { tournamentId }, select: { id: true },
      });
      if (participants.length > 0) {
        await prisma.participantStats.updateMany({
          where: { participantId: { in: participants.map(p => p.id) } },
          data: { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0, rank: null },
        });
      }
    }

    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
    res.json(tournament);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Error al actualizar torneo' });
  }
});

// DELETE /api/tournaments/:id - Eliminar torneo
router.delete('/:id', async (req, res) => {
  try {
    await prisma.tournament.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Torneo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar torneo' });
  }
});

// ─── Participant Routes ───────────────────────────────────────────────────────

// POST /api/tournaments/:id/participants - Agregar participante
router.post('/:id/participants', async (req, res) => {
  try {
    const data = participantSchema.parse(req.body);
    const tournamentId = req.params.id;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });

    if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });
    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({ error: 'Torneo lleno' });
    }

    const seed = data.seed ?? tournament.participants.length + 1;

    const participant = await prisma.participant.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        seed,
        team: data.team,
        country: data.country,
        weight: data.weight,
        categoryId: data.categoryId || null,
        tournamentId,
        stats: { create: { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0 } },
      },
      include: { stats: true, category: true },
    });

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { currentParticipants: { increment: 1 } },
    });

    res.status(201).json(participant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return res.status(400).json({ error: `Datos inválidos: ${issues}`, details: error.errors });
    }
    res.status(500).json({ error: 'Error al agregar participante' });
  }
});

// PATCH /api/tournaments/:id/participants/:participantId - Actualizar participante
router.patch('/:id/participants/:participantId', async (req, res) => {
  try {
    const data = participantSchema.partial().parse(req.body);
    const participant = await prisma.participant.update({
      where: { id: req.params.participantId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        seed: data.seed,
        team: data.team,
        country: data.country,
        weight: data.weight,
        categoryId: data.categoryId || null,
      },
      include: { stats: true, category: true },
    });
    res.json(participant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Error al actualizar participante' });
  }
});

// DELETE /api/tournaments/:id/participants/:participantId - Eliminar participante
router.delete('/:id/participants/:participantId', async (req, res) => {
  try {
    await prisma.participant.delete({
      where: { id: req.params.participantId },
    });

    await prisma.tournament.update({
      where: { id: req.params.id },
      data: { currentParticipants: { decrement: 1 } },
    });

    res.json({ message: 'Participante eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar participante' });
  }
});

// ─── Bracket Generation ───────────────────────────────────────────────────────

// POST /api/tournaments/:id/generate-bracket
// Delegates to bracketService.ts — single source of truth for all bracket logic
router.post('/:id/generate-bracket', async (req, res) => {
  try {
    const tournamentId = req.params.id;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: { include: { category: true } } },
    });

    if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });
    if (tournament.participants.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 participantes' });
    }

    // Delete existing matches before generating new bracket
    await prisma.match.deleteMany({ where: { tournamentId } });

    const bestOf = tournament.bestOf ?? 1;
    const type = tournament.type ?? 'double_elimination';

    // Group participants by category (or a single group if no categories)
    const byCategory = new Map<string, typeof tournament.participants>();
    for (const p of tournament.participants) {
      const key = p.categoryId ?? '__none__';
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(p);
    }
    // Fallback: if all participants have no category, treat as single group
    if (byCategory.size === 0) {
      byCategory.set('__none__', tournament.participants);
    }

    let allMatches: any[] = [];

    for (const [catKey, catPs] of byCategory.entries()) {
      if (catPs.length < 2) continue; // Skip categories with only 1 participant
      const catId = catKey === '__none__' ? null : catKey;

      // generateBracket handles all types: single_elimination, double_elimination, round_robin, vendetta
      const result = generateBracket(type, catPs, tournamentId, catId, bestOf);
      allMatches = allMatches.concat(result.matches);
    }

    if (allMatches.length === 0) {
      return res.status(400).json({
        error: 'No se puede generar el bracket. Necesitas al menos 2 participantes en la misma categoría.',
      });
    }

    // Persist all matches in a single batch
    await prisma.match.createMany({
      data: allMatches.map(m => ({
        id: m.id,
        tournamentId: m.tournamentId,
        round: m.round,
        position: m.position,
        bracket: m.bracket,
        status: m.status,
        participant1Id: m.participant1Id ?? null,
        participant2Id: m.participant2Id ?? null,
        winnerId: m.winnerId ?? null,
        loserId: m.loserId ?? null,
        score1: m.score1 ?? null,
        score2: m.score2 ?? null,
        nextMatchId: m.nextMatchId ?? null,
        nextMatchSlot: m.nextMatchSlot ?? null,
        loserMatchId: m.loserMatchId ?? null,
        loserMatchSlot: m.loserMatchSlot ?? null,
        categoryId: m.categoryId ?? null,
        arm: m.arm ?? null,
        bestOf: m.bestOf ?? 1,
        resultType: null,
        seriesResults: null,
      })),
    });

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'in_progress' },
    });

    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        categories: true,
        participants: { include: { stats: true, category: true } },
        matches: { orderBy: [{ bracket: 'asc' }, { round: 'asc' }, { position: 'asc' }] },
      },
    });

    res.json(updatedTournament);
  } catch (error) {
    console.error('[generate-bracket]', error);
    res.status(500).json({ error: 'Error al generar bracket' });
  }
});

// ─── Match Result ─────────────────────────────────────────────────────────────

// PATCH /api/tournaments/:id/matches/:matchId - Registrar resultado de partido
router.patch('/:id/matches/:matchId', async (req, res) => {
  try {
    const { winnerId, score1, score2, resultType, arm, seriesResults } = req.body;
    const matchId = req.params.matchId;
    const tournamentId = req.params.id;

    const match = await prisma.match.findFirst({
      where: { id: matchId, tournamentId },
    });

    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Partido ya completado' });
    }

    // Determine loser (the other participant)
    const loserId = match.participant1Id === winnerId
      ? match.participant2Id
      : match.participant1Id;

    // Update match result
    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        loserId,
        score1: score1 ?? null,
        score2: score2 ?? null,
        status: 'completed',
        resultType: resultType || null,
        arm: arm || match.arm || null,
        seriesResults: seriesResults ? JSON.stringify(seriesResults) : null,
      },
    });

    // Update winner stats
    if (winnerId) {
      await prisma.participantStats.updateMany({
        where: { participantId: winnerId },
        data: {
          wins: { increment: 1 },
          matchesPlayed: { increment: 1 },
          pointsFor: { increment: score1 ?? 0 },
          pointsAgainst: { increment: score2 ?? 0 },
        },
      });
    }

    // Update loser stats
    if (loserId) {
      await prisma.participantStats.updateMany({
        where: { participantId: loserId },
        data: {
          losses: { increment: 1 },
          matchesPlayed: { increment: 1 },
          pointsFor: { increment: score2 ?? 0 },
          pointsAgainst: { increment: score1 ?? 0 },
        },
      });
    }

    // Advance winner to next match
    if (match.nextMatchId && winnerId) {
      const nextMatch = await prisma.match.findFirst({
        where: { id: match.nextMatchId, tournamentId },
      });
      if (nextMatch && nextMatch.status !== 'completed') {
        const updateData: any = {};
        if (match.nextMatchSlot === 0) updateData.participant1Id = winnerId;
        else updateData.participant2Id = winnerId;

        // Both slots now filled → ready to play
        const p1 = updateData.participant1Id ?? nextMatch.participant1Id;
        const p2 = updateData.participant2Id ?? nextMatch.participant2Id;
        if (p1 && p2) updateData.status = 'pending';

        await prisma.match.update({
          where: { id: match.nextMatchId },
          data: updateData,
        });
      }
    }

    // Send loser to loser bracket match (Double Elimination)
    if (match.loserMatchId && loserId) {
      const loserMatch = await prisma.match.findFirst({
        where: { id: match.loserMatchId, tournamentId },
      });
      if (loserMatch && loserMatch.status !== 'completed') {
        const updateData: any = {};
        if (match.loserMatchSlot === 0) updateData.participant1Id = loserId;
        else updateData.participant2Id = loserId;

        const p1 = updateData.participant1Id ?? loserMatch.participant1Id;
        const p2 = updateData.participant2Id ?? loserMatch.participant2Id;
        if (p1 && p2) updateData.status = 'pending';

        await prisma.match.update({
          where: { id: match.loserMatchId },
          data: updateData,
        });
      }
    }

    // Grand Final reset logic (Double Elimination)
    // If the WB champion (participant1) loses the Grand Final,
    // the LB champion gets to play a reset match
    const gf = await prisma.match.findFirst({
      where: { tournamentId, bracket: 'grand_final', round: 999 },
    });
    const gfReset = await prisma.match.findFirst({
      where: { tournamentId, bracket: 'grand_final', round: 1000 },
    });

    if (gf && gfReset && matchId === gf.id) {
      if (winnerId === gf.participant2Id) {
        // LB champion won → play reset
        await prisma.match.update({
          where: { id: gfReset.id },
          data: {
            participant1Id: gf.participant1Id,
            participant2Id: gf.participant2Id,
            status: 'pending',
          },
        });
      } else {
        // WB champion won → cancel reset
        await prisma.match.update({
          where: { id: gfReset.id },
          data: { status: 'cancelled' },
        });
      }
    }

    // Return full updated tournament
    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        categories: true,
        participants: { include: { stats: true, category: true } },
        matches: { orderBy: [{ bracket: 'asc' }, { round: 'asc' }, { position: 'asc' }] },
      },
    });

    res.json(updatedTournament);
  } catch (error) {
    console.error('[PATCH match]', error);
    res.status(500).json({ error: 'Error al actualizar partido' });
  }
});

// ─── Ranking ──────────────────────────────────────────────────────────────────

// GET /api/tournaments/:id/ranking
router.get('/:id/ranking', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const participants = await prisma.participant.findMany({
      where: { tournamentId },
      include: { stats: true },
    });

    const ranked = participants
      .map(p => ({
        id: p.id,
        name: p.name,
        team: p.team,
        country: p.country,
        wins: p.stats?.wins ?? 0,
        losses: p.stats?.losses ?? 0,
        matchesPlayed: p.stats?.matchesPlayed ?? 0,
        pointsFor: p.stats?.pointsFor ?? 0,
        pointsAgainst: p.stats?.pointsAgainst ?? 0,
      }))
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    const podium = ranked.slice(0, 3).map((p, i) => ({ ...p, rank: i + 1 }));
    res.json({ ranking: ranked, podium });
  } catch (error) {
    console.error('[GET ranking]', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

export default router;
