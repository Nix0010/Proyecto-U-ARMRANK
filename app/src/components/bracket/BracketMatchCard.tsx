import { memo, useState, useCallback } from 'react';
import type { Match, Participant } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Swords, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface BracketMatchCardProps {
  match: Match;
  participants: Participant[];
  canEdit: boolean;
  onUpdateMatch: (matchId: string, winnerId: string, score1?: number, score2?: number) => void;
  compact?: boolean;
}

export const BracketMatchCard = memo(function BracketMatchCard({
  match,
  participants,
  canEdit,
  onUpdateMatch,
  compact = false,
}: BracketMatchCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');

  const p1 = participants.find((x) => x.id === match.participant1Id);
  const p2 = participants.find((x) => x.id === match.participant2Id);
  const isCompleted = match.status === 'completed';
  const isPending = !match.participant1Id || !match.participant2Id;
  const canPlay = canEdit && !isCompleted && !isPending;

  const winner = isCompleted ? participants.find((x) => x.id === match.winnerId) : null;

  const handleSelectWinner = useCallback((winnerId: string) => {
    const s1 = parseFloat(score1);
    const s2 = parseFloat(score2);
    onUpdateMatch(match.id, winnerId, isNaN(s1) ? undefined : s1, isNaN(s2) ? undefined : s2);
    setDialogOpen(false);
    setScore1('');
    setScore2('');
  }, [match.id, onUpdateMatch, score1, score2]);

  const getBracketStyles = () => {
    switch (match.bracket) {
      case 'winners':
        return 'border-l-blue-500/50';
      case 'losers':
        return 'border-l-orange-500/50';
      case 'grand_final':
        return 'border-l-yellow-500/50';
      default:
        return 'border-l-gray-600/50';
    }
  };

  const styles = getBracketStyles();

  if (isPending) {
    return (
      <div
        className={`
          flex flex-col justify-center rounded-md border border-gray-300 dark:border-gray-700/50
          ${compact ? 'w-[160px]' : 'w-[200px]'}
          bg-[#fafafa] dark:bg-[#1e1e1e]
          transition-all duration-200 opacity-60
        `}
      >
        <div className="flex px-2 py-1.5 border-b border-gray-200 dark:border-gray-800">
          <span className="text-xs text-muted-foreground italic truncate">Por definir...</span>
        </div>
        <div className="flex px-2 py-1.5">
          <span className="text-xs text-muted-foreground italic truncate">Por definir...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative group flex items-center">
        {/* Match identifier on the left */}
        <div className="absolute -left-6 text-[10px] text-muted-foreground font-mono font-medium hidden md:block">
          {match.position + 1}
        </div>

        <div
          className={`
            flex flex-col rounded-sm border border-gray-300 dark:border-gray-700/80
            bg-white dark:bg-[#2b2b2b] hover:dark:bg-[#333333]
            border-l-4 ${styles}
            ${compact ? 'w-[160px]' : 'w-[200px]'}
            overflow-hidden shadow-sm
            transition-all duration-200
            ${canPlay ? 'cursor-pointer hover:border-primary/50' : ''}
          `}
          onClick={() => canPlay && setDialogOpen(true)}
        >
          {/* Participant 1 */}
          <div className={`
            flex items-center justify-between px-2 py-1.5 border-b border-gray-200 dark:border-[#1a1a1a]
            ${isCompleted && winner?.id === p1?.id ? 'bg-green-50/50 dark:bg-emerald-950/20' : ''}
            ${isCompleted && winner?.id && winner?.id !== p1?.id ? 'opacity-50' : ''}
          `}>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`
                text-xs font-medium truncate
                ${isCompleted && winner?.id === p1?.id ? 'text-green-700 dark:text-emerald-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
              `}>
                {p1?.name || '?'}
              </span>
            </div>
            {isCompleted && match.score1 !== undefined && (
              <span className={`
                text-xs ml-2 shrink-0
                ${winner?.id === p1?.id ? 'text-green-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}
              `}>
                {match.score1}
              </span>
            )}
            {isCompleted && match.score1 === undefined && winner?.id === p1?.id && (
              <Crown className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />
            )}
          </div>

          {/* Participant 2 */}
          <div className={`
            flex items-center justify-between px-2 py-1.5
            ${isCompleted && winner?.id === p2?.id ? 'bg-green-50/50 dark:bg-emerald-950/20' : ''}
            ${isCompleted && winner?.id && winner?.id !== p2?.id ? 'opacity-50' : ''}
          `}>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`
                text-xs font-medium truncate
                ${isCompleted && winner?.id === p2?.id ? 'text-green-700 dark:text-emerald-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
              `}>
                {p2?.name || '?'}
              </span>
            </div>
            {isCompleted && match.score2 !== undefined && (
              <span className={`
                text-xs ml-2 shrink-0
                ${winner?.id === p2?.id ? 'text-green-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}
              `}>
                {match.score2}
              </span>
            )}
            {isCompleted && match.score2 === undefined && winner?.id === p2?.id && (
              <Crown className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />
            )}
          </div>
        </div>

        {/* Hover action overlay */}
        {canPlay && (
          <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-background/80 px-2 py-0.5 rounded shadow-sm">
              Editar
            </span>
          </div>
        )}
      </div>

      {/* Result Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" /> Registrar Resultado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="text-center">
                <p className="font-medium text-sm truncate">{p1?.name ?? '?'}</p>
                <Input
                  type="number"
                  min={0}
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full text-center"
                />
              </div>
              <div className="text-center text-muted-foreground font-bold">vs</div>
              <div className="text-center">
                <p className="font-medium text-sm truncate">{p2?.name ?? '?'}</p>
                <Input
                  type="number"
                  min={0}
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full text-center"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">Selecciona al ganador:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => p1?.id && handleSelectWinner(p1.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!p1?.id}
              >
                🏆 {p1?.name ?? '?'}
              </Button>
              <Button
                onClick={() => p2?.id && handleSelectWinner(p2.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!p2?.id}
              >
                🏆 {p2?.name ?? '?'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
