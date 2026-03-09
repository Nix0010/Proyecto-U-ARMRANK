import { prisma } from '../db';

export interface RankedParticipant {
    id: string;
    name: string;
    team: string | null;
    country: string | null;
    wins: number;
    losses: number;
    matchesPlayed: number;
    pointsFor: number;
    pointsAgainst: number;
    rank?: number;
}

export interface RankingResult {
    ranking: RankedParticipant[];
    podium: RankedParticipant[];
}

/**
 * Get tournament-level ranking sorted by wins, then by losses.
 */
export async function getTournamentRanking(tournamentId: string): Promise<RankingResult> {
    const participants = await prisma.participant.findMany({
        where: { tournamentId },
        include: { stats: true },
    });

    const ranked: RankedParticipant[] = participants
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
