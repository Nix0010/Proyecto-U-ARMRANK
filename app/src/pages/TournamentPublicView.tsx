import { useState, useEffect, useMemo } from 'react';
import type { Tournament } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DoubleEliminationBracket } from '@/components/bracket/DoubleEliminationBracket';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Trophy, Users, Calendar, MapPin, Swords, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { buildBracketsFromMatches } from '@/lib/tournamentUtils';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function TournamentPublicView({ tournamentId, onBack }: { tournamentId: string, onBack: () => void }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch(`${API_URL}/tournaments/${tournamentId}/public`)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar el torneo o es privado');
        return res.json();
      })
      .then(data => setTournament(data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  const brackets = useMemo(() => {
    if (!tournament || tournament.type === 'round_robin') return null;
    const categoryIdToName = new Map<string, string>(
      (tournament.categories || []).map(c => [c.id, c.name])
    );
    return buildBracketsFromMatches(tournament.matches || [], categoryIdToName);
  }, [tournament]);

  const bracketCategories = brackets ? Object.keys(brackets) : [];

  useEffect(() => {
    if (bracketCategories.length > 0 && !bracketCategories.includes(activeCategory)) {
      setActiveCategory(bracketCategories[0]);
    }
  }, [bracketCategories.join(',')]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando datos públicos...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Trophy className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Torneo no disponible</h2>
        <p className="text-muted-foreground max-w-md mb-6">El torneo que buscas no existe o el organizador lo ha marcado como privado.</p>
        <Button onClick={onBack}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-tight">{tournament.name}</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20"><Globe className="h-3 w-3 mr-1"/> Público</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Swords className="h-4 w-4" /> {tournament.type.replace('_', ' ')} · {tournament.sport}</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {tournament.participants?.length || 0} competidores</span>
            {tournament.startDate && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {format(new Date(tournament.startDate), 'dd MMM', { locale: es })}</span>}
            {tournament.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {tournament.location}</span>}
          </div>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Salir de la vista
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Información</TabsTrigger>
          <TabsTrigger value="bracket">Llaves y Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sobre el evento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{tournament.description || 'Sin descripción adicional proporcionada por el organizador.'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bracket" className="mt-6">
          {(!tournament.matches || tournament.matches.length === 0) ? (
             <Card className="bg-muted/30">
               <CardContent className="p-12 text-center text-muted-foreground">
                 Aún no se han generado las llaves para este torneo.
               </CardContent>
             </Card>
          ) : (
            <div className="space-y-4">
              {bracketCategories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {bracketCategories.map((cat) => (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveCategory(cat)}
                      className="whitespace-nowrap"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              )}
              {activeCategory && brackets && brackets[activeCategory] && (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b pb-4">
                    <CardTitle className="text-lg">{activeCategory}</CardTitle>
                    <CardDescription>Vista de solo lectura</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <div className="p-6 min-w-max">
                      <DoubleEliminationBracket
                        bracket={brackets[activeCategory]}
                        participants={tournament.participants || []}
                        canEdit={false}
                        onUpdateMatch={() => {}}
                        matches={tournament.matches || []}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
