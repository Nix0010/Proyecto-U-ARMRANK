import { useMemo } from 'react';
import type { Participant } from '@/types/tournament';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BracketPreviewProps {
  participants?: Participant[];
}

export function BracketPreview({ participants: externalParticipants }: BracketPreviewProps) {
  // Usar participantes externos si se proporcionan, sino mostrar mensaje
  const participants = externalParticipants || [];
  
  const previewData = useMemo(() => {
    if (participants.length < 2) {
      return null;
    }

    // Generar preview de bracket de doble eliminación
    const sorted = [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
    const count = sorted.length;
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(count, 2))));
    const byes = nextPow2 - count;
    const totalRounds = Math.log2(nextPow2);

    // Generar rondas del bracket de ganadores
    const rounds = [];
    let matchesInRound = nextPow2 / 2;
    for (let i = 0; i < totalRounds; i++) {
      const roundMatches = [];
      for (let j = 0; j < matchesInRound; j++) {
        const p1Index = i === 0 ? j : -1;
        const p2Index = i === 0 ? (j < byes ? -1 : nextPow2 / 2 + j - byes) : -1;
        
        roundMatches.push({
          id: `preview-${i}-${j}`,
          p1: p1Index >= 0 && p1Index < sorted.length ? sorted[p1Index] : null,
          p2: p2Index >= 0 && p2Index < sorted.length ? sorted[p2Index] : null,
          hasBye: j < byes && i === 0,
        });
      }
      rounds.push({
        round: i + 1,
        name: i === totalRounds - 1 ? 'Final WB' : i === totalRounds - 2 ? 'Semi WB' : `R${i + 1}`,
        matches: roundMatches,
      });
      matchesInRound = Math.floor(matchesInRound / 2);
    }

    return { rounds, byes, count, nextPow2 };
  }, [participants]);

  if (participants.length < 2) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground font-medium">Se necesitan al menos 2 participantes</p>
        <p className="text-sm text-muted-foreground mt-1">Agrega participantes para ver la previsualización</p>
      </div>
    );
  }

  if (!previewData) return null;

  const { rounds, byes, count, nextPow2 } = previewData;

  return (
    <div className="space-y-6">
      {/* Info Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">Previsualización de Llaves</p>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-0.5">
              <p><strong>Participantes:</strong> {count} | <strong>Formato:</strong> Doble Eliminación</p>
              <p><strong>Estructura:</strong> {nextPow2} slots ({rounds.length} rondas WB)</p>
              {byes > 0 && (
                <p className="text-amber-600 dark:text-amber-400">
                  <strong>Byes:</strong> {byes} participante(s) pasan directo a Ronda 2
                </p>
              )}
            </div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">
              Los emparejamientos finales se generarán al iniciar el torneo
            </p>
          </div>
        </div>
      </div>

      {/* Bracket Preview */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max p-2">
          {rounds.map((round, roundIndex) => (
            <div 
              key={round.round} 
              className="flex flex-col"
              style={{ 
                justifyContent: roundIndex === 0 ? 'flex-start' : 'center', 
                gap: roundIndex === 0 ? '12px' : `${Math.pow(2, roundIndex) * 18}px` 
              }}
            >
              <div className="text-center mb-3">
                <p className="font-semibold text-sm text-foreground">{round.name}</p>
                <p className="text-xs text-muted-foreground">{round.matches.length} partidos</p>
              </div>
              
              {round.matches.map((match: any, matchIndex: number) => (
                <div 
                  key={match.id} 
                  className="relative"
                  style={{ 
                    marginTop: roundIndex > 0 && matchIndex > 0 ? `${Math.pow(2, roundIndex - 1) * 24}px` : 0 
                  }}
                >
                  <Card className={cn(
                    "w-44 overflow-hidden transition-shadow hover:shadow-md",
                    match.hasBye 
                      ? "border-blue-300 dark:border-blue-700 ring-1 ring-blue-100 dark:ring-blue-900" 
                      : "border-gray-200 dark:border-gray-700"
                  )}>
                    {/* Participant 1 */}
                    <div className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100 dark:border-gray-800",
                      match.hasBye ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-gray-50/50 dark:bg-gray-900/30",
                      !match.p1 && "text-muted-foreground italic"
                    )}>
                      <span className="truncate flex-1 font-medium">
                        {match.p1?.name || 'Por definir'}
                      </span>
                      {match.p1 && (
                        <Badge variant="outline" className="text-xs ml-2 shrink-0">#{match.p1.seed}</Badge>
                      )}
                      {match.hasBye && (
                        <Badge className="text-xs ml-2 shrink-0 bg-blue-500 text-white">BYE</Badge>
                      )}
                    </div>
                    
                    {/* Participant 2 */}
                    <div className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm",
                      !match.p2 && "text-muted-foreground italic bg-gray-50/30 dark:bg-gray-900/20"
                    )}>
                      <span className="truncate flex-1 font-medium">
                        {match.p2?.name || 'Por definir'}
                      </span>
                      {match.p2 && (
                        <Badge variant="outline" className="text-xs ml-2 shrink-0">#{match.p2.seed}</Badge>
                      )}
                    </div>
                  </Card>
                  
                  {/* Connector lines */}
                  {roundIndex < rounds.length - 1 && (
                    <>
                      <div 
                        className="absolute right-0 top-1/2 w-6 border-t-2 border-gray-300 dark:border-gray-600" 
                        style={{ transform: 'translateX(100%)' }} 
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Final Champion placeholder */}
          <div className="flex flex-col justify-center min-w-[120px]">
            <div className="text-center mb-3">
              <p className="font-semibold text-sm text-foreground">Campeón</p>
              <p className="text-xs text-muted-foreground">Final</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 rounded-xl border-2 border-yellow-400 dark:border-yellow-600 text-center">
              <Trophy className="h-10 w-10 mx-auto text-yellow-500 mb-2" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Por definir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300 dark:bg-blue-900/30 dark:border-blue-700" />
          <span>Bye (pasa directo)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200 dark:bg-gray-900/30 dark:border-gray-700" />
          <span>Partido normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3 w-3 text-yellow-500" />
          <span>Final doble eliminación</span>
        </div>
      </div>
    </div>
  );
}
