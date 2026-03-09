import { useState } from 'react';
import type { Tournament } from '@/types/tournament';
import { useApiStore } from '@/store/apiStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trophy, Users, Calendar, Search, Plus, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TournamentListProps {
  onCreateClick: () => void;
  onEditClick: (tournament: Tournament) => void;
  onViewClick: (tournament: Tournament) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500', registration: 'bg-blue-500', in_progress: 'bg-green-500', completed: 'bg-purple-500', cancelled: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador', registration: 'Inscripción', in_progress: 'En curso', completed: 'Finalizado', cancelled: 'Cancelado',
};

const TYPE_LABEL = '⚔️ Doble Eliminación';

export function TournamentList({ onCreateClick, onEditClick, onViewClick }: TournamentListProps) {
  const { tournaments, deleteTournament } = useApiStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; tournament: Tournament | null }>({
    open: false,
    tournament: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.sport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteClick = (tournament: Tournament) => {
    setConfirmDelete({ open: true, tournament });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.tournament) return;
    
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    deleteTournament(confirmDelete.tournament.id);
    toast.success('Torneo eliminado', {
      description: `"${confirmDelete.tournament.name}" fue eliminado permanentemente`,
    });
    
    setIsDeleting(false);
    setConfirmDelete({ open: false, tournament: null });
  };

  const getEmptyStateMessage = () => {
    if (tournaments.length === 0) {
      return {
        title: 'No hay torneos',
        description: 'Crea tu primer torneo para comenzar a gestionar competencias de armwrestling',
      };
    }
    if (filteredTournaments.length === 0 && searchTerm) {
      return {
        title: 'No se encontraron resultados',
        description: `No hay torneos que coincidan con "${searchTerm}"`,
      };
    }
    if (filteredTournaments.length === 0 && statusFilter !== 'all') {
      return {
        title: 'No hay torneos en este estado',
        description: 'Prueba seleccionando otro filtro o crea un nuevo torneo',
      };
    }
    return {
      title: 'No hay torneos',
      description: 'Crea tu primer torneo',
    };
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar torneos..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="px-3 py-2 rounded-md border border-input bg-background text-sm flex-1 sm:flex-none"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="registration">Inscripción</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Finalizado</option>
          </select>
          <Button onClick={onCreateClick} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Torneo</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {filteredTournaments.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">{emptyState.title}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{emptyState.description}</p>
          {tournaments.length === 0 && (
            <Button onClick={onCreateClick} className="mt-6">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer torneo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTournaments.map((tournament) => (
            <Card 
              key={tournament.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onViewClick(tournament)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-primary transition-colors" title={tournament.name}>
                      {tournament.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{TYPE_LABEL}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewClick(tournament); }}>
                        <Eye className="h-4 w-4 mr-2" />Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditClick(tournament); }}>
                        <Edit className="h-4 w-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(tournament); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className={`${statusColors[tournament.status]} text-white`}>
                    {statusLabels[tournament.status]}
                  </Badge>
                  <Badge variant="outline">{tournament.sport}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 shrink-0" />
                    <span>{tournament.currentParticipants} / {tournament.maxParticipants} participantes</span>
                  </div>
                  {tournament.startDate && (
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2 shrink-0" />
                      <span>{format(new Date(tournament.startDate), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                  )}
                  {tournament.location && (
                    <div className="flex items-center text-muted-foreground truncate">
                      <span className="mr-2">📍</span>
                      <span className="truncate">{tournament.location}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => { e.stopPropagation(); onViewClick(tournament); }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Torneo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, open }))}
        title="¿Eliminar torneo?"
        description={confirmDelete.tournament ? 
          `"${confirmDelete.tournament.name}" será eliminado permanentemente junto con todos sus datos. Esta acción no se puede deshacer.` : 
          ''
        }
        variant="destructive"
        onConfirm={handleConfirmDelete}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}
