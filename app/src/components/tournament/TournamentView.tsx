import { useState, useRef, useMemo, useCallback, useEffect, memo } from 'react';
import type { Tournament, Match } from '@/types/tournament';
import { useApiStore } from '@/store/apiStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParticipantManager } from '@/components/participant/ParticipantManager';
import { DoubleEliminationBracket } from '@/components/bracket/DoubleEliminationBracket';
import { RoundRobinTable } from '@/components/bracket/RoundRobinTable';
import { CategoryManager } from '@/components/category/CategoryManager';
import { PodiumView } from '@/components/tournament/PodiumView';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useExport } from '@/hooks/useExport';
import { buildBracketsFromMatches } from '@/lib/tournamentUtils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Play,
  Trophy,
  Users,
  Calendar,
  MapPin,
  User,
  RotateCcw,
  Swords,
  FileDown,
  Share2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TournamentViewProps {
  tournament: Tournament;
  onBack: () => void;
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  registration: 'Inscripción',
  in_progress: 'En curso',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  registration: 'bg-blue-500',
  in_progress: 'bg-green-500',
  completed: 'bg-purple-500',
  cancelled: 'bg-red-500',
};



const TYPE_LABELS: Record<string, string> = {
  double_elimination: 'Doble Eliminación',
  single_elimination: 'Eliminación Simple',
  round_robin: 'Round Robin',
  vendetta: 'Vendetta',
};


// Componente memoizado para el header
const TournamentHeader = memo(function TournamentHeader({
  tournament,
  onBack,
  canEdit,
  hasBracket,
  isLoading,
  onStartTournament,
  onGenerateBracket,
  onResetBracket,
  onExportPDF,
  onCopyLink,
  isExporting,
}: {
  tournament: Tournament;
  onBack: () => void;
  canEdit: boolean;
  hasBracket: boolean;
  isLoading: boolean;
  onStartTournament: () => void;
  onGenerateBracket: () => void;
  onResetBracket: () => void;
  onExportPDF: () => void;
  onCopyLink: () => void;
  isExporting: boolean;
}) {
  const typeLabel = TYPE_LABELS[tournament.type] ?? tournament.type;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
      <Button variant="outline" size="icon" onClick={onBack} className="shrink-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{tournament.name}</h1>
          <Badge className={`${statusColors[tournament.status]} text-white shrink-0`}>
            {statusLabels[tournament.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Swords className="h-4 w-4 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            {typeLabel}
            {tournament.type === 'vendetta' && tournament.bestOf > 1 && ` · BO${tournament.bestOf}`}
            {' · '}{tournament.sport}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {hasBracket && (
          <Button variant="outline" size="sm" onClick={onExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Exportar PDF
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onCopyLink}>
          <Share2 className="h-4 w-4 mr-2" />
          Compartir
        </Button>
        {canEdit && tournament.status === 'draft' && (
          <Button onClick={onStartTournament} disabled={isLoading} size="sm">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Iniciar Torneo
          </Button>
        )}
        {canEdit && !hasBracket && tournament.status !== 'draft' && (
          <Button onClick={onGenerateBracket} disabled={isLoading} size="sm">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trophy className="h-4 w-4 mr-2" />}
            Generar Llaves
          </Button>
        )}
        {hasBracket && canEdit && (
          <Button variant="outline" onClick={onResetBracket} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        )}
      </div>
    </div>
  );
});

// Componente para las tarjetas de info
const InfoCards = memo(function InfoCards({ tournament }: { tournament: Tournament }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <Card>
        <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Participantes</p>
            <p className="font-medium text-sm sm:text-base truncate">{tournament.currentParticipants} / {tournament.maxParticipants}</p>
          </div>
        </CardContent>
      </Card>
      {tournament.startDate && (
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Inicio</p>
              <p className="font-medium text-sm sm:text-base truncate">{format(new Date(tournament.startDate), 'dd MMM', { locale: es })}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {tournament.location && (
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Ubicación</p>
              <p className="font-medium text-sm sm:text-base truncate">{tournament.location}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {tournament.organizerName && (
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Organizador</p>
              <p className="font-medium text-sm sm:text-base truncate">{tournament.organizerName}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

// Componente principal
export function TournamentView({ tournament, onBack }: TournamentViewProps) {
  const { generateBracket, advanceMatch, updateTournament, fetchTournament, fetchRanking, ranking, isLoading } = useApiStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'destructive' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'warning',
    onConfirm: () => { },
  });

  const { isExporting, exportToPDF } = useExport();
  const bracketRef = useRef<HTMLDivElement>(null);

  const canEdit = tournament.status !== 'completed' && tournament.status !== 'cancelled';
  const hasBracket = tournament.matches && tournament.matches.length > 0;

  // Reconstruir bracket - solo para formatos de eliminación
  const brackets = useMemo(() => {
    if (tournament.type === 'round_robin') return null;
    // Build a map of categoryId → category name for correct grouping
    const categoryIdToName = new Map<string, string>(
      (tournament.categories || []).map(c => [c.id, c.name])
    );
    return buildBracketsFromMatches(tournament.matches, categoryIdToName);
  }, [tournament.matches, tournament.type, tournament.categories]);

  const bracketCategories = brackets ? Object.keys(brackets) : [];

  // Category tabs derived from tournament.categories
  const tournamentCategories = tournament.categories || [];

  // CRITICAL FIX: Setting state during render causes an infinite loop crash in React 18+.
  // Use useEffect to safely update activeCategory after render.
  useEffect(() => {
    if (bracketCategories.length > 0 && !bracketCategories.includes(activeCategory)) {
      setActiveCategory(bracketCategories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bracketCategories.join(',')]);

  // Fetch ranking when switching to ranking tab
  useEffect(() => {
    if (activeTab === 'ranking') {
      fetchRanking(tournament.id);
    }
  }, [activeTab, tournament.id, fetchRanking, tournament.status]);

  // Callbacks memoizados
  const handleGenerateBracket = useCallback(async () => {
    if (tournament.participants.length < 2) {
      toast.error('Se necesitan al menos 2 participantes', {
        description: `Actualmente tienes ${tournament.participants.length} participante(s)`,
      });
      return;
    }

    try {
      await generateBracket(tournament.id);
      setActiveTab('bracket');
      toast.success('Llaves generadas correctamente', {
        description: `${tournament.participants.length} competidores posicionados`,
      });
    } catch (error) {
      toast.error('Error al generar llaves', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }, [generateBracket, tournament.id, tournament.participants.length]);

  const handleResetBracket = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: '¿Reiniciar las llaves?',
      description: 'Se perderán todos los resultados registrados. Esta acción no se puede deshacer.',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await updateTournament(tournament.id, { status: 'draft' });
          await fetchTournament(tournament.id);
          setActiveTab('overview');
          toast.success('Llaves reiniciadas');
        } catch {
          toast.error('Error al reiniciar');
        }
      },
    });
  }, [updateTournament, fetchTournament, tournament.id]);

  const handleStartTournament = useCallback(() => {
    if (tournament.participants.length < 2) {
      toast.error('Se necesitan al menos 2 participantes', {
        description: `Actualmente tienes ${tournament.participants.length} participante(s)`,
      });
      return;
    }

    setConfirmDialog({
      open: true,
      title: '¿Iniciar el torneo?',
      description: `Se generarán las llaves con ${tournament.participants.length} participantes y no podrás agregar más competidores.`,
      variant: 'info',
      onConfirm: async () => {
        try {
          await updateTournament(tournament.id, { status: 'in_progress' });
          await generateBracket(tournament.id);
          // Reload the full tournament data from the server to ensure
          // the bracket is complete and stable before switching tabs
          await fetchTournament(tournament.id);
          setActiveTab('bracket');
          toast.success('¡Torneo iniciado!', { icon: '🏆' });
        } catch {
          toast.error('Error al iniciar torneo');
        }
      },
    });
  }, [updateTournament, generateBracket, fetchTournament, tournament.id, tournament.participants.length]);

  const handleUpdateMatch = useCallback(async (matchId: string, winnerId: string, score1?: number, score2?: number, resultType?: string) => {
    try {
      await advanceMatch(tournament.id, matchId, winnerId, score1, score2, resultType);

      const match = tournament.matches?.find((m: Match) => m.id === matchId);
      const winner = tournament.participants.find((p) => p.id === winnerId);

      if (match?.bracket === 'grand_final' && winner) {
        toast.success(`¡${winner.name} es el CAMPEÓN!`, { icon: '🏆', duration: 5000 });
      } else if (winner) {
        toast.success(`Ganador: ${winner.name}`, {
          description: score1 !== undefined && score2 !== undefined ? `Marcador: ${score1} - ${score2}` : undefined,
        });
      }
    } catch {
      toast.error('Error al actualizar partido');
    }
  }, [advanceMatch, tournament.id, tournament.matches, tournament.participants]);

  const handleExportPDF = useCallback(() => {
    exportToPDF(tournament);
  }, [exportToPDF, tournament]);

  const handleCopyLink = useCallback(() => {
    const pubLink = `${window.location.origin}/?tournament=${tournament.id}`;
    navigator.clipboard.writeText(pubLink)
      .then(() => toast.success('Enlace público copiado al portapapeles'))
      .catch(() => toast.error('No se pudo copiar el enlace'));
  }, [tournament.id]);

  const handleCloseConfirmDialog = useCallback((open: boolean) => {
    setConfirmDialog(prev => ({ ...prev, open }));
  }, []);

  return (
    <div className="space-y-6">
      <TournamentHeader
        tournament={tournament}
        onBack={onBack}
        canEdit={canEdit}
        hasBracket={hasBracket}
        isLoading={isLoading}
        onStartTournament={handleStartTournament}
        onGenerateBracket={handleGenerateBracket}
        onResetBracket={handleResetBracket}
        onExportPDF={handleExportPDF}
        onCopyLink={handleCopyLink}
        isExporting={isExporting}
      />

      <InfoCards tournament={tournament} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="participants">
            Participantes
            {tournament.participants.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs hidden sm:inline-flex">
                {tournament.participants.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories">
            Categorías
            {tournamentCategories.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs hidden sm:inline-flex">
                {tournamentCategories.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bracket" disabled={!hasBracket}>
            Llaves
            {!hasBracket && <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">(pendiente)</span>}
          </TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {tournament.description && (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-medium mb-2">Descripción</h3>
                <p className="text-muted-foreground text-sm sm:text-base">{tournament.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 sm:p-6">
              {tournament.type === 'double_elimination' && (
                <>
                  <h3 className="font-medium mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Swords className="h-4 w-4" /> ⚡ Doble Eliminación — ¿Cómo funciona?
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1 text-xs sm:text-sm">🔵 Llave de Ganadores</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">Todos los participantes comienzan aquí. El que gana sigue avanzando.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                      <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1 text-xs sm:text-sm">🟠 Llave de Perdedores</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">Los que pierden caen aquí. Una derrota más y están eliminados.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1 text-xs sm:text-sm">🏆 Gran Final</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">El campeón de Ganadores vs el campeón de Perdedores.</p>
                    </div>
                  </div>
                </>
              )}
              {tournament.type === 'single_elimination' && (
                <>
                  <h3 className="font-medium mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Swords className="h-4 w-4" /> ⚔️ Eliminación Simple — ¿Cómo funciona?
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <p className="font-semibold text-red-700 dark:text-red-400 mb-1 text-xs sm:text-sm">⚔️ Una Sola Vida</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">Quien pierde, queda eliminado inmediatamente. Sin segunda oportunidad.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1 text-xs sm:text-sm">🏆 Campeón</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">El único competidor que gane todas sus llaves se corona campeón.</p>
                    </div>
                  </div>
                </>
              )}
              {tournament.type === 'round_robin' && (
                <>
                  <h3 className="font-medium mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Swords className="h-4 w-4" /> 🔄 Round Robin — ¿Cómo funciona?
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <p className="font-semibold text-green-700 dark:text-green-400 mb-1 text-xs sm:text-sm">🔄 Todos contra todos</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">Cada participante se enfrenta a todos los demás en la liga.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1 text-xs sm:text-sm">📊 Tabla de posiciones</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">Las victorias acumuladas determinan el ranking final.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1 text-xs sm:text-sm">🏆 Ganador</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">El de más victorias al final de todas las rondas.</p>
                    </div>
                  </div>
                </>
              )}
              {tournament.type === 'vendetta' && (
                <>
                  <h3 className="font-medium mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Swords className="h-4 w-4" /> 🥊 Vendetta — ¿Cómo funciona?
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                      <p className="font-semibold text-purple-700 dark:text-purple-400 mb-1 text-xs sm:text-sm">🥊 Enfrentamiento 1 vs 1</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">Dos atletas se enfrentan en una serie de rounds hasta definir al ganador.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                      <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1 text-xs sm:text-sm">
                        🎯 Mejor de {tournament.bestOf > 1 ? tournament.bestOf : 5} (BO{tournament.bestOf > 1 ? tournament.bestOf : 5})
                      </p>
                      <p className="text-muted-foreground text-xs sm:text-sm">Gana quien primero consiga la mayoría de rounds necesarios.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1 text-xs sm:text-sm">🏆 Campeón</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">El ganador de la serie se corona. Formato ideal para clásicos de pulso.</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {!hasBracket && canEdit && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 sm:p-6 text-center">
                <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-primary mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-2">¿Listo para comenzar?</h3>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  {tournament.participants.length < 2
                    ? `Agrega al menos 2 participantes (tienes ${tournament.participants.length})`
                    : `${tournament.participants.length} participantes registrados`}
                </p>
                <Button
                  onClick={handleStartTournament}
                  size="lg"
                  disabled={tournament.participants.length < 2 || isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Iniciar Torneo
                </Button>
              </CardContent>
            </Card>
          )}

          {hasBracket && tournament.status === 'completed' && (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 text-sm sm:text-base">Torneo Finalizado</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">Este torneo ha concluido. Puedes exportar los resultados.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <CategoryManager
            tournamentId={tournament.id}
            categories={tournamentCategories}
            disabled={tournament.status === 'in_progress' || tournament.status === 'completed'}
          />
          {tournament.status === 'in_progress' && (
            <p className="text-sm text-muted-foreground text-center">
              Las categorías no se pueden modificar mientras el torneo está en curso.
            </p>
          )}
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantManager
            tournamentId={tournament.id}
            participants={tournament.participants}
            categories={tournamentCategories}
            maxParticipants={tournament.maxParticipants}
            canEdit={canEdit && tournament.status !== 'in_progress'}
          />
        </TabsContent>

        <TabsContent value="bracket">
          {/* Round Robin: show standings + match list */}
          {hasBracket && tournament.type === 'round_robin' && (
            <RoundRobinTable
              matches={tournament.matches}
              participants={tournament.participants}
              canEdit={canEdit}
              onUpdateMatch={(matchId, winnerId) => handleUpdateMatch(matchId, winnerId)}
            />
          )}

          {/* Elimination brackets (Single and Double) */}
          {hasBracket && tournament.type !== 'round_robin' && brackets && bracketCategories.length > 0 && (
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
              {activeCategory && brackets[activeCategory] && (
                <Card>
                  <CardContent className="p-3 sm:p-6" ref={bracketRef}>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-base sm:text-lg font-semibold">
                        {bracketCategories.length > 1 ? activeCategory : 'Llaves del Torneo'}
                      </h2>
                      <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
                        {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                        Exportar PDF
                      </Button>
                    </div>
                    <DoubleEliminationBracket
                      bracket={brackets[activeCategory]}
                      participants={tournament.participants.filter(p =>
                        (p.categoryId
                          ? tournamentCategories.find(c => c.id === p.categoryId)?.name
                          : 'Categoría Única') === activeCategory
                      )}
                      canEdit={canEdit}
                      onUpdateMatch={handleUpdateMatch}
                      matches={tournament.matches?.filter(m =>
                        (m.categoryId
                          ? tournamentCategories.find(c => c.id === m.categoryId)?.name
                          : 'Categoría Única') === activeCategory
                      ) || []}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4">
          <PodiumView
            podium={ranking?.podium ?? []}
            ranking={ranking?.ranking ?? []}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={handleCloseConfirmDialog}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}


