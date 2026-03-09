import { v4 as uuidv4 } from 'uuid';
import type { Match, Round, Bracket } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helper ────────────────────────────────────────────────────────────────────

function mkMatch(
    bracket: BracketSection,
    round: number,
    position: number,
    tournamentId: string,
    categoryId: string | null = null,
    extra: Partial<{ arm: string; bestOf: number }> = {}
): RawMatch {
    return {
        id: uuidv4(),
        tournamentId,
        round,
        position,
        bracket,
        status: 'pending',
        participant1Id: null,
        participant2Id: null,
        winnerId: null,
        loserId: null,
        score1: null,
        score2: null,
        nextMatchId: null,
        nextMatchSlot: null,
        loserMatchId: null,
        loserMatchSlot: null,
        categoryId,
        arm: extra.arm ?? null,
        bestOf: extra.bestOf ?? 1,
        resultType: null,
        seriesResults: null,
    };
}

// ─── Propagate Walkovers (BYEs) ───────────────────────────────────────────────

export function propagateWalkovers(matches: RawMatch[]): void {
    let changed = true;
    while (changed) {
        changed = false;

        for (const m of matches) {
            if (m.status === 'completed') {
                // Advance winner to next match
                if (m.nextMatchId) {
                    const nextM = matches.find((x) => x.id === m.nextMatchId);
                    if (nextM && nextM.status !== 'completed' && nextM.status !== 'cancelled') {
                        const winnerVal = m.winnerId ?? null;
                        if (m.nextMatchSlot === 0) {
                            if (nextM.participant1Id !== winnerVal) {
                                nextM.participant1Id = winnerVal;
                                changed = true;
                            }
                        } else {
                            if (nextM.participant2Id !== winnerVal) {
                                nextM.participant2Id = winnerVal;
                                changed = true;
                            }
                        }
                    }
                }

                // Send loser to loser bracket
                if (m.loserMatchId) {
                    const loserM = matches.find((x) => x.id === m.loserMatchId);
                    if (loserM && loserM.status !== 'completed' && loserM.status !== 'cancelled') {
                        const loserVal = m.loserId ?? null;
                        if (m.loserMatchSlot === 0) {
                            if (loserM.participant1Id !== loserVal) {
                                loserM.participant1Id = loserVal;
                                changed = true;
                            }
                        } else {
                            if (loserM.participant2Id !== loserVal) {
                                loserM.participant2Id = loserVal;
                                changed = true;
                            }
                        }
                    }
                }
            }

            // Auto-resolve BYE matches
            if (m.status === 'pending' || m.status === 'in_progress') {
                if (m.participant1Id !== null && m.participant2Id !== null) {
                    if (m.participant1Id && !m.participant2Id) {
                        m.winnerId = m.participant1Id;
                        m.loserId = null;
                        m.status = 'completed';
                        changed = true;
                    } else if (m.participant2Id && !m.participant1Id) {
                        m.winnerId = m.participant2Id;
                        m.loserId = null;
                        m.status = 'completed';
                        changed = true;
                    } else if (!m.participant1Id && !m.participant2Id) {
                        m.winnerId = null;
                        m.loserId = null;
                        m.status = 'completed';
                        changed = true;
                    }
                }
            }
        }
    }
}

// ─── Single Elimination ───────────────────────────────────────────────────────

export function generateSingleElimination(
    participants: { id: string; seed?: number | null }[],
    tournamentId: string,
    categoryId: string | null = null,
    bestOf = 1
): { matches: RawMatch[] } {
    const sorted = [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
    const count = sorted.length;
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(count, 2))));
    const totalRounds = Math.log2(nextPow2);
    const matchesByRound: RawMatch[][] = [];

    // Round 1 with seeding (1 vs N, 2 vs N-1, ...)
    const r1: RawMatch[] = [];
    for (let i = 0; i < nextPow2 / 2; i++) {
        const m = mkMatch('winners', 1, i, tournamentId, categoryId, { bestOf });
        const p1 = sorted[i];
        const p2Idx = nextPow2 - 1 - i;
        const p2 = p2Idx < count ? sorted[p2Idx] : null;
        m.participant1Id = p1?.id ?? null;
        m.participant2Id = p2?.id ?? null;
        // Auto-advance BYE
        if (!m.participant2Id && m.participant1Id) {
            m.winnerId = m.participant1Id;
            m.status = 'completed';
        } else if (!m.participant1Id && m.participant2Id) {
            m.winnerId = m.participant2Id;
            m.status = 'completed';
        } else if (!m.participant1Id && !m.participant2Id) {
            m.status = 'completed';
        }
        r1.push(m);
    }
    matchesByRound.push(r1);

    // Subsequent rounds
    let prev = r1;
    for (let r = 2; r <= totalRounds; r++) {
        const cur: RawMatch[] = [];
        for (let i = 0; i < prev.length / 2; i++) {
            const m = mkMatch('winners', r, i, tournamentId, categoryId, { bestOf });
            prev[i * 2].nextMatchId = m.id;
            prev[i * 2].nextMatchSlot = 0;
            prev[i * 2 + 1].nextMatchId = m.id;
            prev[i * 2 + 1].nextMatchSlot = 1;
            cur.push(m);
        }
        matchesByRound.push(cur);
        prev = cur;
    }

    const allMatches: RawMatch[] = matchesByRound.flat();
    propagateWalkovers(allMatches);
    return { matches: allMatches };
}

// ─── Round Robin ──────────────────────────────────────────────────────────────

export function generateRoundRobin(
    participants: { id: string }[],
    tournamentId: string,
    categoryId: string | null = null,
    bestOf = 1
): { matches: RawMatch[] } {
    const ps: ({ id: string } | null)[] = [...participants];
    if (ps.length % 2 !== 0) ps.push(null); // BYE slot
    const n = ps.length;
    const rounds = n - 1;
    const allMatches: RawMatch[] = [];

    for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < n / 2; i++) {
            const p1 = ps[i];
            const p2 = ps[n - 1 - i];
            if (p1 && p2) {
                const m = mkMatch('group', r + 1, i, tournamentId, categoryId, { bestOf });
                m.participant1Id = p1.id;
                m.participant2Id = p2.id;
                allMatches.push(m);
            }
        }
        // Circle rotation: fix first, rotate the rest
        const last = ps.pop()!;
        ps.splice(1, 0, last);
    }

    return { matches: allMatches };
}

// ─── Double Elimination ───────────────────────────────────────────────────────

export function generateDoubleElimination(
    participants: { id: string; seed?: number | null }[],
    tournamentId: string,
    categoryId: string | null = null,
    bestOf = 1
): { matches: RawMatch[]; bracket: Bracket } {
    const sorted = [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
    const count = sorted.length;
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(count, 2))));
    const byes = nextPow2 - count;
    const totalWbRounds = Math.log2(nextPow2);

    // ── Winners Bracket ──
    const wbRounds: Round[] = [];
    const wb1: RawMatch[] = [];
    for (let i = 0; i < nextPow2 / 2; i++) {
        const m = mkMatch('winners', 1, i, tournamentId, categoryId, { bestOf });
        const p1 = sorted[i];
        const p2Offset = nextPow2 / 2 + i;
        const p2 = p2Offset < count ? sorted[p2Offset] : null;
        m.participant1Id = p1?.id ?? null;
        m.participant2Id = p2?.id ?? null;
        // Handle BYEs
        if (!m.participant2Id && m.participant1Id) {
            m.winnerId = m.participant1Id;
            m.loserId = null;
            m.status = 'completed';
        } else if (!m.participant1Id && m.participant2Id) {
            m.winnerId = m.participant2Id;
            m.loserId = null;
            m.status = 'completed';
        } else if (!m.participant1Id && !m.participant2Id) {
            m.status = 'completed';
        }
        wb1.push(m);
    }
    wbRounds.push({ round: 1, name: totalWbRounds === 1 ? 'WB Final' : 'WB Ronda 1', matches: wb1 as unknown as Match[] });
    let prevWb = wb1;
    for (let r = 2; r <= totalWbRounds; r++) {
        const cur: RawMatch[] = [];
        for (let i = 0; i < prevWb.length / 2; i++) {
            const m = mkMatch('winners', r, i, tournamentId, categoryId, { bestOf });
            cur.push(m);
            const m1 = prevWb[i * 2];
            const m2 = prevWb[i * 2 + 1];
            m1.nextMatchId = m.id; m1.nextMatchSlot = 0;
            m2.nextMatchId = m.id; m2.nextMatchSlot = 1;
        }
        const rl = totalWbRounds - r;
        wbRounds.push({ round: r, name: rl === 0 ? 'WB Final' : rl === 1 ? 'WB Semifinal' : 'WB Ronda ' + r, matches: cur as unknown as Match[] });
        prevWb = cur;
    }
    const wbFinal = prevWb[0];

    // ── Losers Bracket ──
    const lbRoundCount = Math.max(0, 2 * (totalWbRounds - 1));
    const lbRounds: Round[] = [];
    const lbByRound: RawMatch[][] = [];
    for (let lr = 1; lr <= lbRoundCount; lr++) {
        const matchCount = Math.max(1, nextPow2 / Math.pow(2, Math.ceil(lr / 2) + 1));
        const round: RawMatch[] = [];
        for (let i = 0; i < matchCount; i++) round.push(mkMatch('losers', lr, i, tournamentId, categoryId, { bestOf }));
        lbByRound.push(round);
    }
    // Connect LB rounds to each other
    for (let lr = 0; lr < lbRoundCount - 1; lr++) {
        const cur = lbByRound[lr];
        const next = lbByRound[lr + 1];
        const ratio = Math.max(1, cur.length / next.length);
        for (let i = 0; i < cur.length; i++) {
            const ti = Math.floor(i / ratio);
            const sl = (i % ratio === 0 ? 0 : 1) as 0 | 1;
            if (next[ti]) { cur[i].nextMatchId = next[ti].id; cur[i].nextMatchSlot = sl; }
        }
    }
    // Connect WB losers to LB
    for (let wr = 1; wr < totalWbRounds; wr++) {
        const wbMs = wbRounds[wr - 1].matches as unknown as RawMatch[];
        const lbIdx = wr === 1 ? 0 : (wr - 2) * 2 + 1;
        const lbR = lbByRound[lbIdx];
        if (!lbR) continue;
        const ratio = Math.max(1, wbMs.length / lbR.length);
        for (let i = 0; i < wbMs.length; i++) {
            const li = Math.floor(i / ratio);
            const sl = ratio === 1 ? 1 : ((i % ratio === 0 ? 0 : 1) as 0 | 1);
            if (lbR[li]) { wbMs[i].loserMatchId = lbR[li].id; wbMs[i].loserMatchSlot = sl; }
        }
    }

    // LB round names
    const lbFinal = lbByRound.length > 0 ? lbByRound[lbRoundCount - 1][0] : null;
    if (lbFinal) { wbFinal.loserMatchId = lbFinal.id; wbFinal.loserMatchSlot = 0; }
    for (let lr = 0; lr < lbRoundCount; lr++) {
        const rn = lr + 1;
        const rl = lbRoundCount - rn;
        lbRounds.push({ round: rn, name: rl === 0 ? 'LB Final' : rl === 1 ? 'LB Semifinal' : 'LB Ronda ' + rn, matches: lbByRound[lr] as unknown as Match[] });
    }

    // ── Grand Final ──
    const grandFinal = mkMatch('grand_final', 999, 0, tournamentId, categoryId, { bestOf });
    const grandFinalReset = mkMatch('grand_final', 1000, 0, tournamentId, categoryId, { bestOf });
    wbFinal.nextMatchId = grandFinal.id;
    wbFinal.nextMatchSlot = 0;
    if (lbFinal) { lbFinal.nextMatchId = grandFinal.id; lbFinal.nextMatchSlot = 1; }
    grandFinal.nextMatchId = grandFinalReset.id;

    const allMatches: RawMatch[] = [
        ...wbRounds.flatMap((r) => r.matches as unknown as RawMatch[]),
        ...lbRounds.flatMap((r) => r.matches as unknown as RawMatch[]),
        grandFinal,
        grandFinalReset,
    ];

    propagateWalkovers(allMatches);

    return {
        matches: allMatches,
        bracket: { winnersBracket: wbRounds, losersBracket: lbRounds, grandFinal: grandFinal as unknown as Match, grandFinalReset: grandFinalReset as unknown as Match },
    };
}


// ─── Vendetta ─────────────────────────────────────────────────────────────────
// A Vendetta is a challenge match (or series of challenge matches) where each
// encounter is a BO3/BO5/BO7 series. With 2 participants = 1 head-to-head series.
// With more participants = Single Elimination where each match IS a vendetta series.

export function generateVendetta(
    participants: { id: string; seed?: number | null }[],
    tournamentId: string,
    categoryId: string | null = null,
    bestOf = 5
): { matches: RawMatch[] } {
    const sorted = [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
    const count = sorted.length;

    if (count < 2) {
        return { matches: [] };
    }

    // Special case: exactly 2 participants = single vendetta match
    if (count === 2) {
        const m = mkMatch('vendetta', 1, 0, tournamentId, categoryId, { bestOf });
        m.participant1Id = sorted[0].id;
        m.participant2Id = sorted[1].id;
        return { matches: [m] };
    }

    // More than 2: build a single-elimination bracket where each match is a vendetta series
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(count, 2))));
    const totalRounds = Math.log2(nextPow2);
    const matchesByRound: RawMatch[][] = [];

    // Round 1 with seeding
    const r1: RawMatch[] = [];
    for (let i = 0; i < nextPow2 / 2; i++) {
        const m = mkMatch('vendetta', 1, i, tournamentId, categoryId, { bestOf });
        const p1 = sorted[i];
        const p2Idx = nextPow2 - 1 - i;
        const p2 = p2Idx < count ? sorted[p2Idx] : null;
        m.participant1Id = p1?.id ?? null;
        m.participant2Id = p2?.id ?? null;
        if (!m.participant2Id && m.participant1Id) { m.winnerId = m.participant1Id; m.status = 'completed'; }
        else if (!m.participant1Id && m.participant2Id) { m.winnerId = m.participant2Id; m.status = 'completed'; }
        else if (!m.participant1Id && !m.participant2Id) { m.status = 'completed'; }
        r1.push(m);
    }
    matchesByRound.push(r1);

    // Subsequent rounds
    let prev = r1;
    for (let r = 2; r <= totalRounds; r++) {
        const cur: RawMatch[] = [];
        for (let i = 0; i < prev.length / 2; i++) {
            const m = mkMatch('vendetta', r, i, tournamentId, categoryId, { bestOf });
            prev[i * 2].nextMatchId = m.id;
            prev[i * 2].nextMatchSlot = 0;
            prev[i * 2 + 1].nextMatchId = m.id;
            prev[i * 2 + 1].nextMatchSlot = 1;
            cur.push(m);
        }
        matchesByRound.push(cur);
        prev = cur;
    }

    const allMatches: RawMatch[] = matchesByRound.flat();
    propagateWalkovers(allMatches);
    return { matches: allMatches };
}

// ─── Tournament Bracket Dispatcher ───────────────────────────────────────────

export interface BracketGenerationResult {
    matches: RawMatch[];
}

export function generateBracket(
    type: string,
    participants: { id: string; seed?: number | null; categoryId?: string | null }[],
    tournamentId: string,
    categoryId: string | null,
    bestOf: number
): BracketGenerationResult {
    switch (type) {
        case 'single_elimination':
            return generateSingleElimination(participants, tournamentId, categoryId, bestOf);
        case 'round_robin':
            return generateRoundRobin(participants, tournamentId, categoryId, bestOf);
        case 'vendetta':
            return generateVendetta(participants, tournamentId, categoryId, bestOf);
        case 'double_elimination':
        default:
            return generateDoubleElimination(participants, tournamentId, categoryId, bestOf);
    }
}
