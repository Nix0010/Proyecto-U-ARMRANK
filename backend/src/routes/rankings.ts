import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// ─── GET /api/rankings ────────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Buscar todos los participantes que tengan estadísticas
    const participants = await prisma.participant.findMany({
      include: {
        stats: true,
        user: { select: { avatar: true } },
      },
    });

    // Agrupar por nombre (para consolidar a la misma persona en múltiples torneos)
    const rankingMap = new Map<string, any>();

    for (const p of participants) {
      if (!p.stats) continue;

      const key = p.name.trim().toLowerCase();
      
      if (!rankingMap.has(key)) {
        rankingMap.set(key, {
          name: p.name,
          team: p.team || '',
          country: p.country || '',
          avatar: p.avatar || p.user?.avatar || null,
          wins: 0,
          losses: 0,
          draws: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          matchesPlayed: 0,
        });
      }

      const entry = rankingMap.get(key);
      entry.wins += p.stats.wins;
      entry.losses += p.stats.losses;
      entry.draws += p.stats.draws;
      entry.pointsFor += p.stats.pointsFor;
      entry.pointsAgainst += p.stats.pointsAgainst;
      entry.matchesPlayed += p.stats.matchesPlayed;
      
      // Actualizar equipo/país/avatar si no tenía pero en este torneo sí
      if (!entry.team && p.team) entry.team = p.team;
      if (!entry.country && p.country) entry.country = p.country;
      if (!entry.avatar && (p.avatar || p.user?.avatar)) entry.avatar = p.avatar || p.user?.avatar;
    }

    // Convertir a array y calcular puntos totales.
    // Victoria = 3 puntos, Empate = 1 punto.
    let rankingArray = Array.from(rankingMap.values()).map(r => ({
      ...r,
      totalPoints: (r.wins * 3) + (r.draws * 1),
    }));

    // Ordenar por puntos totales desc, luego victorias desc, luego puntos a favor desc
    rankingArray.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointsFor - a.pointsFor;
    });

    // Asignar posición (rank)
    rankingArray = rankingArray.map((r, index) => ({
      rank: index + 1,
      ...r,
    }));

    res.json(rankingArray);
  })
);

export default router;
