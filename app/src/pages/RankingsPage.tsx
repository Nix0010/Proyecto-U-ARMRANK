import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, Loader2, Globe, Medal } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface RankingEntry {
  rank: number;
  name: string;
  team: string;
  country: string;
  avatar: string | null;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  matchesPlayed: number;
  totalPoints: number;
}

export function RankingsPage({ onBack }: { onBack: () => void }) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/rankings`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar rankings');
        return res.json();
      })
      .then(data => setRankings(data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-3xl font-extrabold tracking-tight">Clasificación Global</h2>
          </div>
          <p className="text-muted-foreground">Ranking oficial de atletas basado en puntos (Victorias: 3pts, Empates: 1pt).</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Torneos
        </Button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : rankings.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No hay estadísticas suficientes para generar el ranking aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4 w-16">#</th>
                  <th className="px-6 py-4">Atleta</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Equipo</th>
                  <th className="px-6 py-4 hidden md:table-cell">País</th>
                  <th className="px-6 py-4 text-center">Puntos</th>
                  <th className="px-6 py-4 hidden sm:table-cell text-center">V-D-E</th>
                  <th className="px-6 py-4 hidden lg:table-cell text-center">Puntos (F-C)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rankings.map(r => (
                  <tr key={r.rank + r.name} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-center">
                      {r.rank === 1 ? <Medal className="h-5 w-5 text-yellow-500 mx-auto" /> : 
                       r.rank === 2 ? <Medal className="h-5 w-5 text-gray-400 mx-auto" /> :
                       r.rank === 3 ? <Medal className="h-5 w-5 text-amber-700 mx-auto" /> :
                       r.rank}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                          {r.avatar ? <img src={r.avatar} alt={r.name} className="h-full w-full object-cover" /> : r.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-base">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground">{r.team || '-'}</td>
                    <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                      {r.country ? <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {r.country}</span> : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">
                        {r.totalPoints} PTS
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-center text-muted-foreground font-medium tracking-widest">
                      <span className="text-green-500">{r.wins}</span>-<span className="text-red-500">{r.losses}</span>-<span className="text-gray-400">{r.draws}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-center text-muted-foreground font-medium text-xs">
                      <span className="text-green-500">+{r.pointsFor}</span> / <span className="text-red-500">-{r.pointsAgainst}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
