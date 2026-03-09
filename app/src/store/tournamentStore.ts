import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tournament, Participant, Match, Round, Bracket } from '@/types/tournament';
import { v4 as uuidv4 } from 'uuid';

interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  createTournament: (data: Partial<Tournament>) => Tournament;
  updateTournament: (id: string, data: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;
  setCurrentTournament: (tournament: Tournament | null) => void;
  addParticipant: (tournamentId: string, participant: Partial<Participant>) => void;
  updateParticipant: (tournamentId: string, participantId: string, data: Partial<Participant>) => void;
  removeParticipant: (tournamentId: string, participantId: string) => void;
  importParticipants: (tournamentId: string, participants: Partial<Participant>[]) => void;
  generateBracket: (tournamentId: string) => void;
  advanceMatch: (tournamentId: string, matchId: string, winnerId: string, score1?: number, score2?: number) => void;
  generateBracketPreview: (tournamentId: string) => { rounds: unknown[]; matches?: unknown[] } | null;
}

const defaultSettings = { seedingEnabled: false, autoAdvance: true, bestOf: 1 };

function mkMatch(bracket: 'winners' | 'losers' | 'grand_final', round: number, position: number): Match {
  return { id: uuidv4(), tournamentId: '', round, position, participant1Id: null, participant2Id: null, winnerId: null, loserId: null, status: 'pending', bracket };
}

// Función para reconstruir el bracket desde los partidos actualizados
function rebuildBracketFromMatches(matches: Match[], originalBracket: Bracket): Bracket {
  // Crear un mapa de partidos por ID para acceso rápido
  const matchMap = new Map<string, Match>();
  matches.forEach(m => matchMap.set(m.id, { ...m }));

  // Reconstruir winnersBracket - crear copias profundas
  const winnersBracket: Round[] = originalBracket.winnersBracket.map(round => ({
    round: round.round,
    name: round.name,
    matches: round.matches.map(m => {
      const updatedMatch = matchMap.get(m.id);
      return updatedMatch ? { ...updatedMatch } : { ...m };
    }),
  }));

  // Reconstruir losersBracket - crear copias profundas
  const losersBracket: Round[] = originalBracket.losersBracket.map(round => ({
    round: round.round,
    name: round.name,
    matches: round.matches.map(m => {
      const updatedMatch = matchMap.get(m.id);
      return updatedMatch ? { ...updatedMatch } : { ...m };
    }),
  }));

  // Reconstruir grandFinal
  const grandFinalMatch = matchMap.get(originalBracket.grandFinal.id);
  const grandFinal: Match = grandFinalMatch ? { ...grandFinalMatch } : { ...originalBracket.grandFinal };

  // Reconstruir grandFinalReset si existe
  let grandFinalReset: Match | undefined = undefined;
  if (originalBracket.grandFinalReset) {
    const resetMatch = matchMap.get(originalBracket.grandFinalReset.id);
    grandFinalReset = resetMatch ? { ...resetMatch } : { ...originalBracket.grandFinalReset };
  }

  // Retornar un objeto bracket completamente nuevo
  return {
    winnersBracket: [...winnersBracket],
    losersBracket: [...losersBracket],
    grandFinal: { ...grandFinal },
    ...(grandFinalReset && { grandFinalReset: { ...grandFinalReset } }),
  };
}

function generateDoubleElimination(participants: Participant[]): { matches: Match[]; bracket: Bracket } {
  const sorted = [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  const count = sorted.length;
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(count, 2))));
  const byes = nextPow2 - count;
  const totalWbRounds = Math.log2(nextPow2);

  const wbRounds: Round[] = [];
  const wb1: Match[] = [];
  for (let i = 0; i < nextPow2 / 2; i++) {
    const m = mkMatch('winners', 1, i);
    const hasBye = i < byes;
    m.participant1Id = sorted[i]?.id ?? null;
    m.participant2Id = hasBye ? null : sorted[nextPow2 / 2 + i - byes]?.id ?? null;
    if (hasBye && m.participant1Id) { m.winnerId = m.participant1Id; m.status = 'completed'; }
    wb1.push(m);
  }
  wbRounds.push({ round: 1, name: totalWbRounds === 1 ? 'WB Final' : 'WB Ronda 1', matches: wb1 });
  let prevWb = wb1;
  for (let r = 2; r <= totalWbRounds; r++) {
    const cur: Match[] = [];
    for (let i = 0; i < prevWb.length / 2; i++) {
      const m = mkMatch('winners', r, i);
      cur.push(m);
      const m1 = prevWb[i * 2]; const m2 = prevWb[i * 2 + 1];
      m1.nextMatchId = m.id; m1.nextMatchSlot = 0;
      m2.nextMatchId = m.id; m2.nextMatchSlot = 1;
      if (m1.winnerId) m.participant1Id = m1.winnerId;
      if (m2.winnerId) m.participant2Id = m2.winnerId;
      if (m.participant1Id && m.participant2Id) m.status = 'pending';
    }
    const rl = totalWbRounds - r;
    wbRounds.push({ round: r, name: rl === 0 ? 'WB Final' : rl === 1 ? 'WB Semifinal' : 'WB Ronda ' + r, matches: cur });
    prevWb = cur;
  }
  const wbFinal = prevWb[0];

  const lbRoundCount = Math.max(0, 2 * (totalWbRounds - 1));
  const lbRounds: Round[] = [];
  const lbByRound: Match[][] = [];
  for (let lr = 1; lr <= lbRoundCount; lr++) {
    const matchCount = Math.max(1, nextPow2 / Math.pow(2, Math.ceil(lr / 2) + 1));
    const round: Match[] = [];
    for (let i = 0; i < matchCount; i++) round.push(mkMatch('losers', lr, i));
    lbByRound.push(round);
  }
  for (let lr = 0; lr < lbRoundCount - 1; lr++) {
    const cur = lbByRound[lr]; const next = lbByRound[lr + 1];
    const ratio = Math.max(1, cur.length / next.length);
    for (let i = 0; i < cur.length; i++) {
      const ti = Math.floor(i / ratio);
      const sl = (i % ratio === 0 ? 0 : 1) as 0 | 1;
      if (next[ti]) { cur[i].nextMatchId = next[ti].id; cur[i].nextMatchSlot = sl; }
    }
  }
  for (let wr = 1; wr < totalWbRounds; wr++) {
    const wbMs = wbRounds[wr - 1].matches;
    const lbIdx = wr === 1 ? 0 : (wr - 2) * 2 + 1;
    const lbR = lbByRound[lbIdx];
    if (!lbR) continue;
    const ratio = Math.max(1, wbMs.length / lbR.length);
    for (let i = 0; i < wbMs.length; i++) {
      const li = Math.floor(i / ratio);
      const sl = (i % ratio === 0 ? 0 : 1) as 0 | 1;
      if (lbR[li]) { wbMs[i].loserMatchId = lbR[li].id; wbMs[i].loserMatchSlot = sl; }
    }
  }
  const lbFinal = lbByRound.length > 0 ? lbByRound[lbRoundCount - 1][0] : null;
  if (lbFinal) { wbFinal.loserMatchId = lbFinal.id; wbFinal.loserMatchSlot = 0; }
  for (let lr = 0; lr < lbRoundCount; lr++) {
    const rn = lr + 1; const rl = lbRoundCount - rn;
    lbRounds.push({ round: rn, name: rl === 0 ? 'LB Final' : rl === 1 ? 'LB Semifinal' : 'LB Ronda ' + rn, matches: lbByRound[lr] });
  }

  const grandFinal = mkMatch('grand_final', 999, 0);
  const grandFinalReset = mkMatch('grand_final', 1000, 0);
  wbFinal.nextMatchId = grandFinal.id; wbFinal.nextMatchSlot = 0;
  if (lbFinal) { lbFinal.nextMatchId = grandFinal.id; lbFinal.nextMatchSlot = 1; }

  const allMatches: Match[] = [];
  wbRounds.forEach(r => allMatches.push(...r.matches));
  lbRounds.forEach(r => allMatches.push(...r.matches));
  allMatches.push(grandFinal, grandFinalReset);

  return { matches: allMatches, bracket: { winnersBracket: wbRounds, losersBracket: lbRounds, grandFinal, grandFinalReset } };
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      tournaments: [], currentTournament: null,
      createTournament: (data) => {
        const t: Tournament = {
          id: uuidv4(), name: data.name || 'Nuevo Torneo', description: data.description || '',
          type: 'double_elimination', status: 'draft', sport: data.sport || 'general',
          category: data.category || '', maxParticipants: data.maxParticipants || 16,
          currentParticipants: 0, participants: [], matches: [],
          settings: { ...defaultSettings, ...data.settings },
          createdAt: new Date(), updatedAt: new Date(),
          startDate: data.startDate, endDate: data.endDate,
          location: data.location, organizerName: data.organizerName,
        };
        set((s) => ({ tournaments: [...s.tournaments, t], currentTournament: t }));
        return t;
      },
      updateTournament: (id, data) => set((s) => ({
        tournaments: s.tournaments.map((t) => t.id === id ? { ...t, ...data, updatedAt: new Date() } : t),
        currentTournament: s.currentTournament?.id === id ? { ...s.currentTournament, ...data, updatedAt: new Date() } : s.currentTournament,
      })),
      deleteTournament: (id) => set((s) => ({
        tournaments: s.tournaments.filter((t) => t.id !== id),
        currentTournament: s.currentTournament?.id === id ? null : s.currentTournament,
      })),
      setCurrentTournament: (tournament) => set({ currentTournament: tournament }),
      addParticipant: (tournamentId, pd) => {
        const t = get().tournaments.find((x) => x.id === tournamentId);
        const seed = (t?.participants.length || 0) + 1;
        const p: Participant = {
          id: uuidv4(), name: pd.name || 'Jugador', email: pd.email || '', phone: pd.phone || '',
          avatar: pd.avatar || '', seed: pd.seed ?? seed, category: pd.category || '',
          team: pd.team || '', country: pd.country || '',
          stats: { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0 },
          status: 'active', createdAt: new Date(),
        };
        set((s) => ({
          tournaments: s.tournaments.map((x) => x.id === tournamentId ? { ...x, participants: [...x.participants, p], currentParticipants: x.currentParticipants + 1, updatedAt: new Date() } : x),
          currentTournament: s.currentTournament?.id === tournamentId ? { ...s.currentTournament, participants: [...s.currentTournament.participants, p], currentParticipants: s.currentTournament.currentParticipants + 1 } : s.currentTournament,
        }));
      },
      updateParticipant: (tournamentId, participantId, data) => set((s) => ({
        tournaments: s.tournaments.map((t) => t.id === tournamentId ? { ...t, participants: t.participants.map((p) => p.id === participantId ? { ...p, ...data } : p), updatedAt: new Date() } : t),
        currentTournament: s.currentTournament?.id === tournamentId ? { ...s.currentTournament, participants: s.currentTournament.participants.map((p) => p.id === participantId ? { ...p, ...data } : p) } : s.currentTournament,
      })),
      removeParticipant: (tournamentId, participantId) => set((s) => ({
        tournaments: s.tournaments.map((t) => {
          if (t.id !== tournamentId) return t;
          const f = t.participants.filter((p) => p.id !== participantId).map((p, i) => ({ ...p, seed: i + 1 }));
          return { ...t, participants: f, currentParticipants: f.length, updatedAt: new Date() };
        }),
        currentTournament: s.currentTournament?.id === tournamentId ? { ...s.currentTournament, participants: s.currentTournament.participants.filter((p) => p.id !== participantId).map((p, i) => ({ ...p, seed: i + 1 })), currentParticipants: s.currentTournament.currentParticipants - 1 } : s.currentTournament,
      })),
      importParticipants: (tournamentId, participants) => {
        const t = get().tournaments.find((x) => x.id === tournamentId);
        const start = (t?.participants.length || 0) + 1;
        const ps: Participant[] = participants.map((p, i) => ({
          id: uuidv4(), name: p.name || 'Jugador', email: p.email || '', phone: p.phone || '',
          avatar: p.avatar || '', seed: p.seed ?? start + i, category: p.category || '',
          team: p.team || '', country: p.country || '',
          stats: { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0 },
          status: 'active', createdAt: new Date(),
        }));
        set((s) => ({
          tournaments: s.tournaments.map((x) => x.id === tournamentId ? { ...x, participants: [...x.participants, ...ps], currentParticipants: x.currentParticipants + ps.length, updatedAt: new Date() } : x),
          currentTournament: s.currentTournament?.id === tournamentId ? { ...s.currentTournament, participants: [...s.currentTournament.participants, ...ps], currentParticipants: s.currentTournament.currentParticipants + ps.length } : s.currentTournament,
        }));
      },
      generateBracket: (tournamentId) => {
        const t = get().tournaments.find((x) => x.id === tournamentId);
        if (!t || t.participants.length < 2) return;
        const { matches, bracket } = generateDoubleElimination(t.participants);
        const stamped = matches.map((m) => ({ ...m, tournamentId }));
        set((s) => ({
          tournaments: s.tournaments.map((x) => x.id === tournamentId ? { ...x, matches: stamped, bracket, status: 'in_progress', updatedAt: new Date() } : x),
          currentTournament: s.currentTournament?.id === tournamentId ? { ...s.currentTournament, matches: stamped, bracket, status: 'in_progress' } : s.currentTournament,
        }));
      },
      advanceMatch: (tournamentId, matchId, winnerId, score1, score2) => {
        const t = get().tournaments.find((x) => x.id === tournamentId);
        if (!t) return;
        const match = t.matches.find((m) => m.id === matchId);
        if (!match || match.status === 'completed') return;
        const loserId = match.participant1Id === winnerId ? match.participant2Id : match.participant1Id;

        // Copiar todos los partidos
        const ms = t.matches.map((m) => ({ ...m }));
        const cur = ms.find((m) => m.id === matchId)!;
        cur.winnerId = winnerId; cur.loserId = loserId; cur.score1 = score1; cur.score2 = score2; cur.status = 'completed';

        // Actualizar siguiente partido (ganador avanza)
        if (cur.nextMatchId) {
          const next = ms.find((m) => m.id === cur.nextMatchId);
          if (next) { if (cur.nextMatchSlot === 0) next.participant1Id = winnerId; else next.participant2Id = winnerId; if (next.participant1Id && next.participant2Id) next.status = 'pending'; }
        }

        // Actualizar partido de perdedores
        if (cur.loserMatchId && loserId) {
          const lm = ms.find((m) => m.id === cur.loserMatchId);
          if (lm) { if (cur.loserMatchSlot === 0) lm.participant1Id = loserId; else lm.participant2Id = loserId; if (lm.participant1Id && lm.participant2Id) lm.status = 'pending'; }
        }

        // Lógica para el reset de la gran final
        const gf = ms.find((m) => m.bracket === 'grand_final' && m.round === 999);
        const gfR = ms.find((m) => m.bracket === 'grand_final' && m.round === 1000);
        if (gf && gfR && matchId === gf.id) {
          if (winnerId === gf.participant2Id) { gfR.participant1Id = gf.participant1Id; gfR.participant2Id = gf.participant2Id; gfR.status = 'pending'; }
          else { gfR.status = 'cancelled'; }
        }

        // Reconstruir el bracket desde cero usando los partidos actualizados
        const newBracket = t.bracket ? rebuildBracketFromMatches(ms, t.bracket) : undefined;

        // Crear una copia profunda completa del torneo para forzar re-renderizado
        const updatedTournament: Tournament = JSON.parse(JSON.stringify({
          ...t,
          matches: ms,
          bracket: newBracket,
          updatedAt: new Date()
        }));

        set((s) => ({
          tournaments: s.tournaments.map((x) => x.id === tournamentId ? updatedTournament : x),
          currentTournament: s.currentTournament?.id === tournamentId ? updatedTournament : s.currentTournament,
        }));
      },
      generateBracketPreview: (tournamentId) => {
        const t = get().tournaments.find((x) => x.id === tournamentId);
        if (!t || t.participants.length < 2) return null;

        // Generar preview simple del bracket de ganadores
        const participants = [...t.participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
        const count = participants.length;
        const nextPow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(count, 2))));
        const byes = nextPow2 - count;
        const totalRounds = Math.log2(nextPow2);

        const rounds = [];
        let matchesInRound = nextPow2 / 2;
        for (let i = 0; i < totalRounds; i++) {
          const roundMatches = [];
          for (let j = 0; j < matchesInRound; j++) {
            const p1Index = i === 0 ? j : -1;
            const p2Index = i === 0 ? (j < byes ? -1 : nextPow2 / 2 + j - byes) : -1;

            roundMatches.push({
              id: `preview-${i}-${j}`,
              participant1Id: p1Index >= 0 && p1Index < participants.length ? participants[p1Index].id : null,
              participant2Id: p2Index >= 0 && p2Index < participants.length ? participants[p2Index].id : null,
              position: j,
            });
          }
          rounds.push({
            round: i + 1,
            name: i === totalRounds - 1 ? 'Final' : i === totalRounds - 2 ? 'Semifinal' : `Ronda ${i + 1}`,
            matches: roundMatches,
          });
          matchesInRound = Math.floor(matchesInRound / 2);
        }

        return { rounds };
      },
    }),
    { name: 'tournament-storage-de-v1' }
  )
);