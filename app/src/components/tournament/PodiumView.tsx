import type { RankedParticipant } from '@/types/tournament';
import { Trophy, Medal } from 'lucide-react';

interface Props {
    podium: RankedParticipant[];
    ranking: RankedParticipant[];
}

const PODIUM_CONFIG = [
    { rank: 1, label: '1°', emoji: '🥇', size: 'h-32 sm:h-40', bg: 'from-yellow-400/20 to-yellow-600/10 border-yellow-400/40', text: 'text-yellow-500', order: 'order-2' },
    { rank: 2, label: '2°', emoji: '🥈', size: 'h-24 sm:h-32', bg: 'from-slate-400/20 to-slate-600/10 border-slate-400/40', text: 'text-slate-400', order: 'order-1' },
    { rank: 3, label: '3°', emoji: '🥉', size: 'h-20 sm:h-24', bg: 'from-amber-700/20 to-amber-900/10 border-amber-700/40', text: 'text-amber-600', order: 'order-3' },
];

export function PodiumView({ podium, ranking }: Props) {
    if (podium.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">El podio estará disponible cuando finalicen los partidos</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Podium Visual */}
            <div className="flex items-end justify-center gap-4 pt-4">
                {PODIUM_CONFIG.map(({ rank, label, emoji, size, bg, text, order }) => {
                    const player = podium.find(p => p.rank === rank);
                    if (!player) return null;
                    return (
                        <div key={rank} className={`flex flex-col items-center gap-2 ${order}`}>
                            <div className="text-center space-y-1">
                                <div className="text-2xl">{emoji}</div>
                                <p className="font-bold text-sm sm:text-base max-w-[120px] truncate">{player.name}</p>
                                {player.team && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[100px]">{player.team}</p>
                                )}
                                <div className="flex gap-1 justify-center text-xs">
                                    <span className="text-green-600 font-medium">{player.wins}V</span>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="text-red-400 font-medium">{player.losses}D</span>
                                </div>
                            </div>
                            <div
                                className={`w-24 sm:w-32 ${size} bg-gradient-to-b ${bg} border-2 rounded-t-md flex items-end justify-center pb-2`}
                            >
                                <span className={`font-black text-3xl sm:text-4xl ${text}`}>{label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Full Ranking Table */}
            {ranking.length > 3 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Medal className="h-4 w-4" /> Clasificación completa
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                                <tr>
                                    <th className="text-left px-3 py-2 font-medium">#</th>
                                    <th className="text-left px-3 py-2 font-medium">Competidor</th>
                                    <th className="text-center px-3 py-2 font-medium">V</th>
                                    <th className="text-center px-3 py-2 font-medium">D</th>
                                    <th className="text-center px-3 py-2 font-medium">PJ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map((p, i) => (
                                    <tr key={p.id} className="border-t hover:bg-muted/20 transition-colors">
                                        <td className="px-3 py-2">
                                            <span className={`font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div>
                                                <p className="font-medium">{p.name}</p>
                                                {p.team && <p className="text-xs text-muted-foreground">{p.team}</p>}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center font-medium text-green-600">{p.wins}</td>
                                        <td className="px-3 py-2 text-center font-medium text-red-400">{p.losses}</td>
                                        <td className="px-3 py-2 text-center text-muted-foreground">{p.matchesPlayed}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
