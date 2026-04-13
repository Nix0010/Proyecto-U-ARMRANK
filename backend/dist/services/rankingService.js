"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTournamentRanking = getTournamentRanking;
const db_1 = require("../db");
/**
 * Get tournament-level ranking sorted by wins, then by losses.
 */
async function getTournamentRanking(tournamentId) {
    const participants = await db_1.prisma.participant.findMany({
        where: { tournamentId },
        include: { stats: true },
    });
    const ranked = participants
        .map((p) => ({
        id: p.id,
        name: p.name,
        team: p.team ?? null,
        country: p.country ?? null,
        wins: p.stats?.wins ?? 0,
        losses: p.stats?.losses ?? 0,
        matchesPlayed: p.stats?.matchesPlayed ?? 0,
        pointsFor: p.stats?.pointsFor ?? 0,
        pointsAgainst: p.stats?.pointsAgainst ?? 0,
    }))
        .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    const podium = ranked.slice(0, 3).map((p, i) => ({ ...p, rank: i + 1 }));
    return { ranking: ranked, podium };
}
//# sourceMappingURL=rankingService.js.map