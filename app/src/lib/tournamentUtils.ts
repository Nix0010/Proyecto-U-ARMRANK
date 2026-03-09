import type { Bracket, Match, Round } from '@/types/tournament';

/**
 * Builds a map of category name → Bracket from a flat list of matches.
 *
 * Fixes vs old version:
 * - Groups by categoryId (not legacy m.category string)
 * - Supports single_elimination (only winners bracket + no grand final)
 * - Supports vendetta (bracket section = 'vendetta', treated as winners)
 * - Gracefully handles missing grand final (single_elim, vendetta, round_robin)
 */
export function buildBracketsFromMatches(
    matches: Match[] | undefined,
    categoryIdToName?: Map<string, string>
): Record<string, Bracket> | undefined {
    if (!matches || matches.length === 0) return undefined;

    const result: Record<string, Bracket> = {};

    // Group matches by category — prefer categoryId, fall back to legacy m.category string
    const matchesByCat = new Map<string, Match[]>();
    for (const m of matches) {
        // Skip plain round-robin group matches (they're displayed by RoundRobinTable, not here)
        if (m.bracket === 'group') continue;

        let cat: string;
        if (m.categoryId && categoryIdToName?.has(m.categoryId)) {
            cat = categoryIdToName.get(m.categoryId)!;
        } else if (m.category) {
            cat = m.category;
        } else {
            cat = 'Categoría Única';
        }

        if (!matchesByCat.has(cat)) matchesByCat.set(cat, []);
        matchesByCat.get(cat)!.push(m);
    }

    if (matchesByCat.size === 0) return undefined;

    for (const [cat, catMatches] of matchesByCat.entries()) {
        const wbRounds = new Map<number, Round>();
        const lbRounds = new Map<number, Round>();
        let grandFinal: Match | null = null;
        let grandFinalReset: Match | null = null;

        for (const match of catMatches) {
            // 'winners' = Single Elimination winners bracket OR Double Elim WB
            // 'vendetta' = Vendetta bracket (same visual structure as single elim)
            if (match.bracket === 'winners' || match.bracket === 'vendetta') {
                if (!wbRounds.has(match.round)) {
                    wbRounds.set(match.round, { round: match.round, name: '', matches: [] });
                }
                wbRounds.get(match.round)!.matches.push(match);
            } else if (match.bracket === 'losers') {
                if (!lbRounds.has(match.round)) {
                    lbRounds.set(match.round, { round: match.round, name: '', matches: [] });
                }
                lbRounds.get(match.round)!.matches.push(match);
            } else if (match.bracket === 'grand_final') {
                if (match.round === 999) grandFinal = match;
                else if (match.round === 1000) grandFinalReset = match;
            }
        }

        const wbRoundCount = wbRounds.size;
        const lbRoundCount = lbRounds.size;

        const winnersBracket = Array.from(wbRounds.values())
            .sort((a, b) => a.round - b.round)
            .map((round, idx) => ({
                ...round,
                matches: round.matches.sort((a, b) => a.position - b.position),
                name:
                    idx === wbRoundCount - 1
                        ? (lbRoundCount === 0 ? 'Final' : 'WB Final')
                        : idx === wbRoundCount - 2
                            ? (lbRoundCount === 0 ? 'Semifinal' : 'WB Semifinal')
                            : `Ronda ${idx + 1}`,
            }));

        const losersBracket = Array.from(lbRounds.values())
            .sort((a, b) => a.round - b.round)
            .map((round, idx) => ({
                ...round,
                matches: round.matches.sort((a, b) => a.position - b.position),
                name:
                    idx === lbRoundCount - 1
                        ? 'LB Final'
                        : idx === lbRoundCount - 2
                            ? 'LB Semifinal'
                            : `LB Ronda ${idx + 1}`,
            }));

        // For Single Elimination and Vendetta: no grand final exists.
        // Use a synthetic grand final derived from the last winners bracket match.
        const syntheticGrandFinal =
            grandFinal ??
            (winnersBracket.length > 0
                ? winnersBracket[winnersBracket.length - 1].matches[0] ?? null
                : null);

        if (syntheticGrandFinal) {
            result[cat] = {
                winnersBracket,
                losersBracket,
                grandFinal: syntheticGrandFinal,
                grandFinalReset: grandFinalReset ?? undefined,
            };
        }
    }

    return Object.keys(result).length > 0 ? result : undefined;
}
