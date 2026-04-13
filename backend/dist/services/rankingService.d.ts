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
export declare function getTournamentRanking(tournamentId: string): Promise<RankingResult>;
//# sourceMappingURL=rankingService.d.ts.map