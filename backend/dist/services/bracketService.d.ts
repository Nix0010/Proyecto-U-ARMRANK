import type { Bracket } from '../types';
type BracketSection = 'winners' | 'losers' | 'grand_final' | 'group' | 'vendetta';
interface RawMatch {
    id: string;
    tournamentId: string;
    round: number;
    position: number;
    bracket: BracketSection;
    status: 'pending' | 'completed' | 'cancelled' | 'in_progress';
    participant1Id: string | null;
    participant2Id: string | null;
    winnerId: string | null;
    loserId: string | null;
    score1: number | null;
    score2: number | null;
    nextMatchId: string | null;
    nextMatchSlot: 0 | 1 | null;
    loserMatchId: string | null;
    loserMatchSlot: 0 | 1 | null;
    categoryId: string | null;
    arm: string | null;
    bestOf: number;
    resultType: string | null;
    seriesResults: string | null;
}
export declare function propagateWalkovers(matches: RawMatch[]): void;
export declare function generateSingleElimination(participants: {
    id: string;
    seed?: number | null;
}[], tournamentId: string, categoryId?: string | null, bestOf?: number): {
    matches: RawMatch[];
};
export declare function generateRoundRobin(participants: {
    id: string;
}[], tournamentId: string, categoryId?: string | null, bestOf?: number): {
    matches: RawMatch[];
};
export declare function generateDoubleElimination(participants: {
    id: string;
    seed?: number | null;
}[], tournamentId: string, categoryId?: string | null, bestOf?: number): {
    matches: RawMatch[];
    bracket: Bracket;
};
export declare function generateVendetta(participants: {
    id: string;
    seed?: number | null;
}[], tournamentId: string, categoryId?: string | null, bestOf?: number): {
    matches: RawMatch[];
};
export interface BracketGenerationResult {
    matches: RawMatch[];
}
export declare function generateBracket(type: string, participants: {
    id: string;
    seed?: number | null;
    categoryId?: string | null;
}[], tournamentId: string, categoryId: string | null, bestOf: number): BracketGenerationResult;
export {};
//# sourceMappingURL=bracketService.d.ts.map