import { useMemo } from 'react';
import type { Match, Participant } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';

interface Props {
    matches: Match[];
    participants: Participant[];
    canEdit?: boolean;
    onUpdateMatch?: (matchId: string, winnerId: string, score1?: number, score2?: number) => void;
}

interface Standing {
    participantId: string;
    name: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    pts: number;
}

export function RoundRobinTable({ matches, participants, canEdit, onUpdateMatch }: Props) {
    const standings = useMemo<Standing[]>(() => {
        const map = new Map<string, Standing>();
        for (const p of participants) {
            map.set(p.id, { participantId: p.id, name: p.name, played: 0, wins: 0, draws: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pts: 0 });
        }
        for (const m of matches) {
            if (m.status !== 'completed' || !m.winnerId) continue;
            const p1 = map.get(m.participant1Id ?? '');
            const p2 = map.get(m.participant2Id ?? '');
            if (p1) {
                p1.played++;
                p1.pointsFor += m.score1 ?? 0;
                p1.pointsAgainst += m.score2 ?? 0;
                if (m.winnerId === m.participant1Id) { p1.wins++; p1.pts += 3; }
                else { p1.losses++; }
            }
            if (p2) {
                p2.played++;
                p2.pointsFor += m.score2 ?? 0;
                p2.pointsAgainst += m.score1 ?? 0;
                if (m.winnerId === m.participant2Id) { p2.wins++; p2.pts += 3; }
                else { p2.losses++; }
            }
        }
        return Array.from(map.values()).sort((a, b) => b.pts - a.pts || b.wins - a.wins || a.losses - b.losses);
    }, [matches, participants]);

    const rounds = useMemo(() => {
        const byRound = new Map<number, Match[]>();
        for (const m of matches) {
            if (!byRound.has(m.round)) byRound.set(m.round, []);
            byRound.get(m.round)!.push(m);
        }
        return Array.from(byRound.entries()).sort((a, b) => a[0] - b[0]);
    }, [matches]);

    const getParticipantName = (id: string | null | undefined) => {
        if (!id) return 'BYE';
        return participants.find(p => p.id === id)?.name ?? 'Desconocido';
    };

    return (
        <div className="space-y-6">
            {/* Standings Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Clasificación — Round Robin</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 border-b">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-medium">#</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Competidor</th>
                                    <th className="text-center px-3 py-2.5 font-medium">PJ</th>
                                    <th className="text-center px-3 py-2.5 font-medium">V</th>
                                    <th className="text-center px-3 py-2.5 font-medium">D</th>
                                    <th className="text-center px-3 py-2.5 font-medium">PTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((s, i) => (
                                    <tr key={s.participantId} className="border-t hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <span className={`font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 font-medium">{s.name}</td>
                                        <td className="px-3 py-2.5 text-center text-muted-foreground">{s.played}</td>
                                        <td className="px-3 py-2.5 text-center text-green-600 font-medium">{s.wins}</td>
                                        <td className="px-3 py-2.5 text-center text-red-400 font-medium">{s.losses}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <Badge variant={i < 3 ? 'default' : 'secondary'} className="font-bold">
                                                {s.pts}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Matches by Round */}
            <div className="space-y-4">
                {rounds.map(([roundNum, roundMatches]) => (
                    <Card key={roundNum}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Ronda {roundNum}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                            {roundMatches.map(match => {
                                const p1Name = getParticipantName(match.participant1Id);
                                const p2Name = getParticipantName(match.participant2Id);
                                const isCompleted = match.status === 'completed';
                                return (
                                    <div
                                        key={match.id}
                                        className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="flex-1 text-right">
                                            <span className={`font-medium text-sm ${match.winnerId === match.participant1Id ? 'text-primary font-bold' : ''}`}>
                                                {p1Name}
                                            </span>
                                        </div>
                                        <div className="text-center shrink-0">
                                            {isCompleted ? (
                                                <div className="flex items-center gap-1 text-sm font-bold text-muted-foreground">
                                                    <span className={match.winnerId === match.participant1Id ? 'text-primary' : ''}>{match.score1 ?? '-'}</span>
                                                    <span className="text-xs">vs</span>
                                                    <span className={match.winnerId === match.participant2Id ? 'text-primary' : ''}>{match.score2 ?? '-'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">vs</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <span className={`font-medium text-sm ${match.winnerId === match.participant2Id ? 'text-primary font-bold' : ''}`}>
                                                {p2Name}
                                            </span>
                                        </div>
                                        <div className="shrink-0">
                                            {isCompleted ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : canEdit && match.participant1Id && match.participant2Id ? (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => onUpdateMatch?.(match.id, match.participant1Id!, undefined, undefined)}
                                                    >
                                                        {p1Name.split(' ')[0]} gana
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => onUpdateMatch?.(match.id, match.participant2Id!, undefined, undefined)}
                                                    >
                                                        {p2Name.split(' ')[0]} gana
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
