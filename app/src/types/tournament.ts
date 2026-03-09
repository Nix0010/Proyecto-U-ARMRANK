// ─── Types ───────────────────────────────────────────────────────────────────

export type TournamentType =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'vendetta';

export type TournamentStatus =
  | 'draft'
  | 'registration'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ParticipantStatus = 'active' | 'eliminated' | 'withdrawn';

export type ArmSide = 'right' | 'left' | 'both';

export type ResultType = 'pin' | 'foul' | 'forfeit' | 'points' | 'default';

export type BracketSection = 'winners' | 'losers' | 'grand_final' | 'group' | 'vendetta';

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  weightClass?: string | null;
  arm: ArmSide;
  sortOrder: number;
  tournamentId: string;
  createdAt: string;
  participantCount?: number;
  matchCount?: number;
}

// ─── Participant ──────────────────────────────────────────────────────────────

export interface Participant {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  seed?: number | null;
  /** Legacy string category (kept for older data) */
  category?: string | null;
  /** FK to a Category object */
  categoryId?: string | null;
  categoryObj?: Category | null;
  team?: string | null;
  country?: string | null;
  weight?: number | null;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    pointsFor: number;
    pointsAgainst: number;
    matchesPlayed: number;
    rank?: number | null;
  };
  status: ParticipantStatus;
  createdAt: string;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  loserId: string | null;
  score1?: number | null;
  score2?: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  bracket: BracketSection;
  nextMatchId?: string | null;
  loserMatchId?: string | null;
  nextMatchSlot?: 0 | 1 | null;
  loserMatchSlot?: 0 | 1 | null;
  /** Legacy string category */
  category?: string | null;
  /** FK to Category */
  categoryId?: string | null;
  /** Armwrestling-specific */
  arm?: ArmSide | null;
  resultType?: ResultType | null;
  /** JSON string of [{score1, score2, winner, resultType}] for BO3/5/7 */
  seriesResults?: string | null;
  bestOf?: number;
}

// ─── Round ────────────────────────────────────────────────────────────────────

export interface Round {
  round: number;
  name: string;
  matches: Match[];
}

// ─── Bracket ──────────────────────────────────────────────────────────────────

export interface Bracket {
  winnersBracket: Round[];
  losersBracket: Round[];
  grandFinal: Match;
  grandFinalReset?: Match;
}

// ─── Round Robin ──────────────────────────────────────────────────────────────

export interface GroupStanding {
  participantId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

export interface RankedParticipant {
  id: string;
  name: string;
  team?: string | null;
  country?: string | null;
  wins: number;
  losses: number;
  matchesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  rank?: number;
}

// ─── Tournament ───────────────────────────────────────────────────────────────

export interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  type: TournamentType;
  status: TournamentStatus;
  sport: string;
  maxParticipants: number;
  currentParticipants: number;
  bestOf: number;
  participants: Participant[];
  matches: Match[];
  categories: Category[];
  bracket?: Bracket;
  createdAt: string;
  updatedAt: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  organizerId?: string | null;
  organizerName?: string | null;
  standings?: GroupStanding[];
}