import { useCallback, memo } from 'react';
import type { Bracket, Match, Participant } from '@/types/tournament';
import { BracketMatchCard } from './BracketMatchCard';
import { Trophy, Info } from 'lucide-react';
import { MobileBracketView } from './MobileBracketView';

const MATCH_HEIGHT = 90; // Approx height of the compact card + spacing

interface DoubleEliminationBracketProps {
  bracket: Bracket;
  participants: Participant[];
  canEdit: boolean;
  onUpdateMatch: (matchId: string, winnerId: string, score1?: number, score2?: number) => void;
  matches: Match[];
}

// Componente para renderizar una ronda
const BracketRound = memo(function BracketRound({
  round,
  participants,
  canEdit,
  onUpdateMatch,
  isWinners,
}: {
  round: { round: number; name: string; matches: Match[] };
  participants: Participant[];
  canEdit: boolean;
  onUpdateMatch: (matchId: string, winnerId: string, score1?: number, score2?: number) => void;
  isWinners: boolean;
}) {
  const handleUpdateMatch = useCallback((matchId: string, winnerId: string, score1?: number, score2?: number) => {
    onUpdateMatch(matchId, winnerId, score1, score2);
  }, [onUpdateMatch]);

  return (
    <div className="flex flex-col relative w-[200px] shrink-0">
      <div className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wider mb-4 h-4">
        {round.name}
      </div>
      <div className="flex flex-col justify-around flex-1 relative">
        {round.matches.map((match) => {
          // Detect if it's the upper or lower match of the pair for winners bracket standard elbow lines
          // This is a naive heuristic that works for standard binary trees
          const isEven = match.position % 2 === 0;
          const hasNextMatch = round.matches.length < (isWinners ? 999 : 0) && match.nextMatchId; // simple toggle

          return (
            <div key={match.id} className="relative w-full flex items-center justify-center">
              <BracketMatchCard
                match={match}
                participants={participants}
                canEdit={canEdit}
                onUpdateMatch={handleUpdateMatch}
                compact={false}
              />
              {hasNextMatch && (
                <>
                  <div className={`bracket-connector-common ${isEven ? 'bracket-connector-top' : 'bracket-connector-bottom'}`} />
                  <div className="bracket-connector-common bracket-connector-right" />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Sección de Winners Bracket
const WinnersBracket = memo(function WinnersBracket({
  rounds,
  participants,
  canEdit,
  onUpdateMatch,
}: {
  rounds: { round: number; name: string; matches: Match[] }[];
  participants: Participant[];
  canEdit: boolean;
  onUpdateMatch: (matchId: string, winnerId: string, score1?: number, score2?: number) => void;
}) {
  if (rounds.length === 0) return null;

  const maxMatches = Math.max(...rounds.map(r => r.matches.length));
  const containerHeight = Math.max(minHeightFromMatches(maxMatches), 300);

  return (
    <section className="mb-12 relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
          <span className="text-blue-500 font-black text-sm">W</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight">Llave de Ganadores</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Winners Bracket</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div
          className="flex gap-12 items-stretch min-w-max"
          style={{ height: `${containerHeight}px` }}
        >
          {rounds.map((round) => (
            <BracketRound
              key={round.round}
              round={round}
              participants={participants}
              canEdit={canEdit}
              onUpdateMatch={onUpdateMatch}
              isWinners={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

function minHeightFromMatches(count: number) {
  return count > 0 ? count * MATCH_HEIGHT + (count - 1) * 20 + 40 : 200;
}

// Sección de Losers Bracket
const LosersBracket = memo(function LosersBracket({
  rounds,
  participants,
  canEdit,
  onUpdateMatch,
}: {
  rounds: { round: number; name: string; matches: Match[] }[];
  participants: Participant[];
  canEdit: boolean;
  onUpdateMatch: (matchId: string, winnerId: string, score1?: number, score2?: number) => void;
}) {
  if (rounds.length === 0) return null;

  const maxMatches = Math.max(...rounds.map(r => r.matches.length));
  const containerHeight = Math.max(minHeightFromMatches(maxMatches), 300);

  return (
    <section className="mb-12 relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
          <span className="text-orange-500 font-black text-sm">L</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight">Llave de Perdedores</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Losers Bracket</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div
          className="flex gap-12 items-stretch min-w-max"
          style={{ height: `${containerHeight}px` }}
        >
          {rounds.map((round) => (
            <BracketRound
              key={round.round}
              round={round}
              participants={participants}
              canEdit={canEdit}
              onUpdateMatch={onUpdateMatch}
              isWinners={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

// Sección de Gran Final
const GrandFinalSection = memo(function GrandFinalSection({
  grandFinal,
  grandFinalReset,
  participants,
  canEdit,
  onUpdateMatch,
}: {
  grandFinal: Match;
  grandFinalReset?: Match;
  participants: Participant[];
  canEdit: boolean;
  onUpdateMatch: (matchId: string, winnerId: string, score1?: number, score2?: number) => void;
}) {
  const champion = grandFinalReset?.winnerId
    ? participants.find((p) => p.id === grandFinalReset.winnerId)
    : grandFinal.winnerId && grandFinal.winnerId === grandFinal.participant1Id
      ? participants.find((p) => p.id === grandFinal.winnerId)
      : null;

  const needsReset = grandFinal.status === 'completed' &&
    grandFinal.winnerId === grandFinal.participant2Id &&
    grandFinalReset &&
    grandFinalReset.status !== 'cancelled';

  const handleUpdateMatch = useCallback((matchId: string, winnerId: string, score1?: number, score2?: number) => {
    onUpdateMatch(matchId, winnerId, score1, score2);
  }, [onUpdateMatch]);

  return (
    <section className="mb-12 relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
          <Trophy className="h-4 w-4 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight">Gran Final</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Grand Final</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-stretch min-h-[150px]">
        {/* Gran Final */}
        <div className="flex flex-col items-center w-[200px] shrink-0 justify-center h-full">
          <div className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wider mb-4">
            Final
          </div>
          <div className="w-full relative">
            <BracketMatchCard
              match={grandFinal}
              participants={participants}
              canEdit={canEdit}
              onUpdateMatch={handleUpdateMatch}
            />
          </div>
        </div>

        {/* Reset de llave */}
        {grandFinalReset && grandFinalReset.status !== 'cancelled' ? (
          <div className="flex flex-col items-center w-[200px] shrink-0 justify-center h-full relative">
            <div className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wider mb-4">
              Reset
            </div>
            {/* Connector line from GF to Reset */}
            <div className="absolute left-[-48px] top-[calc(50%+10px)] w-[48px] h-0 border-t-2 border-dashed border-gray-400 dark:border-gray-600 pointer-events-none" />
            <div className="w-full">
              {needsReset ? (
                <BracketMatchCard
                  match={grandFinalReset}
                  participants={participants}
                  canEdit={canEdit}
                  onUpdateMatch={handleUpdateMatch}
                />
              ) : (
                <div className="w-full h-[70px] rounded-md border border-dashed border-gray-300 dark:border-gray-700/50 flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#1e1e1e] opacity-60">
                  <span className="text-xs text-muted-foreground font-medium">Reset Bracket</span>
                  <span className="text-[10px] text-muted-foreground px-2 text-center mt-1">
                    {grandFinal.status === 'completed' ? 'Victoria WB - Innecesario' : 'Se activa si LB gana'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Campeón */}
        {champion && (
          <div className="flex flex-col items-center justify-center ml-4 shrink-0 h-full">
            <div className="text-[10px] font-bold text-center text-yellow-500 uppercase tracking-wider mb-4">
              Campeón
            </div>
            <div className="w-[180px] rounded border border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-transparent p-3 shadow-md animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-yellow-600 dark:text-yellow-400 truncate tracking-tight">
                    {champion.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

// Componente principal
export const DoubleEliminationBracket = memo(function DoubleEliminationBracket({
  bracket,
  participants,
  canEdit,
  onUpdateMatch,
}: DoubleEliminationBracketProps) {
  const { winnersBracket, losersBracket, grandFinal, grandFinalReset } = bracket;

  const handleUpdateMatch = useCallback((matchId: string, winnerId: string, score1?: number, score2?: number) => {
    onUpdateMatch(matchId, winnerId, score1, score2);
  }, [onUpdateMatch]);

  return (
    <div className="space-y-8">
      {/* Vista Móvil */}
      <div className="lg:hidden">
        <MobileBracketView
          bracket={bracket}
          participants={participants}
          canEdit={canEdit}
          onUpdateMatch={onUpdateMatch}
          matches={[]}
        />
      </div>

      {/* Vista Desktop */}
      <div className="hidden lg:block space-y-10">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded bg-[#fdfdfd] dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground relative -top-0.5">
            <p><strong>Doble Eliminación:</strong> Todos los competidores comienzan en el Winners Bracket. Una derrota te pasa al Losers Bracket. Una segunda derrota te elimina del torneo por completo.</p>
          </div>
        </div>

        {/* Winners Bracket */}
        <WinnersBracket
          rounds={winnersBracket}
          participants={participants}
          canEdit={canEdit}
          onUpdateMatch={handleUpdateMatch}
        />

        {/* Losers Bracket */}
        <LosersBracket
          rounds={losersBracket}
          participants={participants}
          canEdit={canEdit}
          onUpdateMatch={handleUpdateMatch}
        />

        {/* Grand Final */}
        <GrandFinalSection
          grandFinal={grandFinal}
          grandFinalReset={grandFinalReset}
          participants={participants}
          canEdit={canEdit}
          onUpdateMatch={handleUpdateMatch}
        />
      </div>
    </div>
  );
});
