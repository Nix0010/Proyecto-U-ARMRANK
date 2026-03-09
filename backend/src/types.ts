export interface Tournament {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  sport: string;
  category?: string;
  maxParticipants: number;
  currentParticipants: number;
  location?: string;
  organizerName?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  seed?: number;
  category?: string;
  team?: string;
  country?: string;
  status: string;
  createdAt: Date;
  tournamentId: string;
  stats?: ParticipantStats;
}

export interface ParticipantStats {
  id: string;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  matchesPlayed: number;
  rank?: number;
}

export interface Match {
  id: string;
  round: number;
  position: number;
  bracket: 'winners' | 'losers' | 'grand_final';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  participant1Id?: string | null;
  participant2Id?: string | null;
  winnerId?: string | null;
  loserId?: string | null;
  score1?: number;
  score2?: number;
  nextMatchId?: string;
  nextMatchSlot?: number;
  loserMatchId?: string;
  loserMatchSlot?: number;
  tournamentId: string;
  category?: string | null;
}

export interface Bracket {
  winnersBracket: Round[];
  losersBracket: Round[];
  grandFinal: Match;
  grandFinalReset?: Match;
}

export interface Round {
  round: number;
  name: string;
  matches: Match[];
}
