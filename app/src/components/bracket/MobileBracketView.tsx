import { useState, useMemo } from 'react';
import type { Bracket, Match, Participant } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Swords, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface MobileBracketViewProps {
  bracket: Bracket;
  participants: Participant[];
  canEdit: boolean;
  onUpdateMatch: (matchId: string, winnerId: string, score1?: number, score2?: number) => void;
  matches: Match[];
}

function MatchCard({
  match,
  participants,
  canEdit,
  onUpdateMatch,
  showBracket = true,
}: {
  match: Match;
  participants: Participant[];
  canEdit: boolean;
  onUpdateMatch: (matchId: string, winnerId: string, score1?: number, score2?: number) => void;
  showBracket?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');

  const p1 = participants.find((x) => x.id === match.participant1Id);
  const p2 = participants.find((x) => x.id === match.participant2Id);
  const isCompleted = match.status === 'completed';
  const isPending = !match.participant1Id || !match.participant2Id;
  const canPlay = canEdit && !isCompleted && !isPending;

  const winner = isCompleted ? participants.find((x) => x.id === match.winnerId) : null;
  // const loser = isCompleted ? participants.find((x) => x.id === match.loserId) : null;

  const handleSelectWinner = (winnerId: string) => {
    const s1 = parseFloat(score1);
    const s2 = parseFloat(score2);
    onUpdateMatch(match.id, winnerId, isNaN(s1) ? undefined : s1, isNaN(s2) ? undefined : s2);
    setDialogOpen(false);
    setScore1('');
    setScore2('');
  };

  const getBracketColor = () => {
    switch (match.bracket) {
      case 'winners':
        return 'border-l-blue-500';
      case 'losers':
        return 'border-l-orange-500';
      case 'grand_final':
        return 'border-l-yellow-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getBracketLabel = () => {
    switch (match.bracket) {
      case 'winners':
        return 'Ganadores';
      case 'losers':
        return 'Perdedores';
      case 'grand_final':
        return 'Final';
      default:
        return '';
    }
  };

  if (isPending) {
    return (
      <Card className={`border-l-4 ${getBracketColor()} opacity-60`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Por definir</span>
            <Badge variant="outline" className="text-xs">Pendiente</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className={`border-l-4 ${getBracketColor()} ${isCompleted ? 'bg-muted/30' : ''} ${canPlay ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={() => canPlay && setDialogOpen(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            {showBracket && (
              <Badge variant="outline" className="text-xs">
                {getBracketLabel()}
              </Badge>
            )}
            {isCompleted && <Badge className="bg-green-500 text-white text-xs">Completado</Badge>}
          </div>

          <div className="space-y-2">
            {/* Participante 1 */}
            <div className={`flex items-center justify-between p-2 rounded ${isCompleted && winner?.id === p1?.id ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
              <div className="flex items-center gap-2">
                {isCompleted && winner?.id === p1?.id && <Crown className="h-4 w-4 text-yellow-500" />}
                <span className={`font-medium ${isCompleted && winner?.id === p1?.id ? 'text-green-700 dark:text-green-400' : ''}`}>
                  {p1?.name || '?'}
                </span>
              </div>
              {isCompleted && match.score1 !== undefined && (
                <span className={`font-bold ${winner?.id === p1?.id ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {match.score1}
                </span>
              )}
            </div>

            {/* Separador */}
            <div className="h-px bg-border" />

            {/* Participante 2 */}
            <div className={`flex items-center justify-between p-2 rounded ${isCompleted && winner?.id === p2?.id ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
              <div className="flex items-center gap-2">
                {isCompleted && winner?.id === p2?.id && <Crown className="h-4 w-4 text-yellow-500" />}
                <span className={`font-medium ${isCompleted && winner?.id === p2?.id ? 'text-green-700 dark:text-green-400' : ''}`}>
                  {p2?.name || '?'}
                </span>
              </div>
              {isCompleted && match.score2 !== undefined && (
                <span className={`font-bold ${winner?.id === p2?.id ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {match.score2}
                </span>
              )}
            </div>
          </div>

          {canPlay && (
            <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setDialogOpen(true)}>
              <Swords className="h-3 w-3 mr-1" />
              Registrar resultado
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de resultado */}
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
}

export function MobileBracketView({
  bracket,
  participants,
  canEdit,
  onUpdateMatch,
}: MobileBracketViewProps) {
  const [activeTab, setActiveTab] = useState('winners');

  const { pendingMatches, completedMatches, grandFinal } = useMemo(() => {
    const allMatches = [
      ...bracket.winnersBracket.flatMap((r) => r.matches),
      ...bracket.losersBracket.flatMap((r) => r.matches),
    ];

    return {
      pendingMatches: allMatches.filter((m) => m.status === 'pending' && m.participant1Id && m.participant2Id),
      completedMatches: allMatches.filter((m) => m.status === 'completed'),
      grandFinal: bracket.grandFinal,
    };
  }, [bracket]);

  const champion = useMemo(() => {
    if (bracket.grandFinalReset?.winnerId) {
      return participants.find((p) => p.id === bracket.grandFinalReset?.winnerId);
    }
    if (bracket.grandFinal.winnerId && bracket.grandFinal.winnerId === bracket.grandFinal.participant1Id) {
      return participants.find((p) => p.id === bracket.grandFinal.winnerId);
    }
    return null;
  }, [bracket, participants]);

  return (
    <div className="space-y-4">
      {/* Campeón */}
      {champion && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 border-yellow-300 dark:border-yellow-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">🏆 ¡Campeón del Torneo!</p>
              <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{champion.name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{pendingMatches.length}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{completedMatches.length}</p>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="winners">Ganadores</TabsTrigger>
          <TabsTrigger value="losers">Perdedores</TabsTrigger>
          <TabsTrigger value="final">Final</TabsTrigger>
        </TabsList>

        <TabsContent value="winners" className="space-y-2">
          {bracket.winnersBracket.map((round) => (
            <div key={round.round} className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground px-1">{round.name}</h4>
              {round.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  participants={participants}
                  canEdit={canEdit}
                  onUpdateMatch={onUpdateMatch}
                  showBracket={false}
                />
              ))}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="losers" className="space-y-2">
          {bracket.losersBracket.map((round) => (
            <div key={round.round} className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground px-1">{round.name}</h4>
              {round.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  participants={participants}
                  canEdit={canEdit}
                  onUpdateMatch={onUpdateMatch}
                  showBracket={false}
                />
              ))}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="final" className="space-y-2">
          <MatchCard
            match={grandFinal}
            participants={participants}
            canEdit={canEdit}
            onUpdateMatch={onUpdateMatch}
            showBracket={false}
          />
          {bracket.grandFinalReset && bracket.grandFinalReset.status !== 'cancelled' && (
            <>
              <h4 className="text-sm font-semibold text-muted-foreground px-1 mt-4">Reset de Llave (si aplica)</h4>
              <MatchCard
                match={bracket.grandFinalReset}
                participants={participants}
                canEdit={canEdit}
                onUpdateMatch={onUpdateMatch}
                showBracket={false}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
