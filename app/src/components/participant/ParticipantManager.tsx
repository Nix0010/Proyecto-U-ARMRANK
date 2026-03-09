import { useState, useRef, useEffect } from 'react';
import type { Participant } from '@/types/tournament';
import { useApiStore } from '@/store/apiStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Upload, Trash2, Search, Edit2, Eye, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BracketPreview } from './BracketPreview';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { useExport } from '@/hooks/useExport';

interface ParticipantManagerProps {
  tournamentId: string;
  participants: Participant[];
  maxParticipants: number;
  canEdit: boolean;
}

export function ParticipantManager({ tournamentId, participants, maxParticipants, canEdit }: ParticipantManagerProps) {
  const { addParticipant, updateParticipant, removeParticipant, checkHealth, error: storeError } = useApiStore();
  const { isExporting, exportParticipantsToExcel } = useExport();
  const [searchTerm, setSearchTerm] = useState('');
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', category: '' });
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; participant: Participant | null }>({
    open: false,
    participant: null,
  });
  const [isImporting, setIsImporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [, setIsRemoving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ checked: boolean; ok?: boolean; message?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar conexión al backend al montar el componente
  useEffect(() => {
    const checkConnection = async () => {
      const result = await checkHealth();
      setHealthStatus({
        checked: true,
        ok: result.ok,
        message: result.ok ? 'Conectado al backend' : (result.error || 'No se pudo conectar al backend'),
      });
    };
    checkConnection();
  }, [checkHealth]);

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddParticipant = async () => {
    if (!newParticipant.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (participants.length >= maxParticipants) {
      toast.error(`Máximo de ${maxParticipants} participantes alcanzado`);
      return;
    }

    setIsAdding(true);
    console.log('[handleAddParticipant] Enviando:', { tournamentId, newParticipant });
    try {
      await addParticipant(tournamentId, newParticipant);
      setNewParticipant({ name: '', email: '', category: '' });
      setIsAddDialogOpen(false);
      setTimeout(() => {
        document.body.style.pointerEvents = '';
        document.body.removeAttribute('data-scroll-locked');
      }, 100);
      toast.success('Participante agregado', {
        description: `${newParticipant.name} registrado correctamente`,
      });
    } catch (error) {
      console.error('[handleAddParticipant] Error:', error);
      toast.error('Error al agregar participante', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditParticipant = async () => {
    if (!editingParticipant || !editingParticipant.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsEditing(true);
    try {
      await updateParticipant(tournamentId, editingParticipant.id, {
        name: editingParticipant.name,
        email: editingParticipant.email,
        seed: editingParticipant.seed,
        category: editingParticipant.category,
      });
      setEditingParticipant(null);
      setIsEditDialogOpen(false);
      setTimeout(() => {
        document.body.style.pointerEvents = '';
        document.body.removeAttribute('data-scroll-locked');
      }, 100);
      toast.success('Cambios guardados');
    } catch (error) {
      toast.error('Error al actualizar participante', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const openEditDialog = (participant: Participant) => {
    setEditingParticipant({ ...participant });
    setIsEditDialogOpen(true);
  };

  const confirmRemoveParticipant = (participant: Participant) => {
    setConfirmDelete({ open: true, participant });
  };

  const handleRemoveParticipant = async () => {
    if (confirmDelete.participant) {
      setIsRemoving(true);
      try {
        await removeParticipant(tournamentId, confirmDelete.participant.id);
        toast.success('Participante eliminado', {
          description: `${confirmDelete.participant.name} fue removido del torneo`,
        });
      } catch (error) {
        toast.error('Error al eliminar participante', {
          description: error instanceof Error ? error.message : 'Error desconocido',
        });
      } finally {
        setIsRemoving(false);
      }
    }
    setConfirmDelete({ open: false, participant: null });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading('Importando participantes...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        const importedParticipants = lines.map(line => {
          const parts = line.split(',').map(p => p.trim());
          return { name: parts[0] || '', email: parts[1] || '' };
        }).filter(p => p.name);

        const availableSlots = maxParticipants - participants.length;
        const toImport = importedParticipants.slice(0, availableSlots);

        if (toImport.length === 0) {
          toast.error('No hay cupos disponibles', { id: toastId });
          setIsImporting(false);
          return;
        }

        // Importar uno por uno usando la API
        for (const p of toImport) {
          await addParticipant(tournamentId, p);
        }

        if (importedParticipants.length > availableSlots) {
          toast.warning(`Solo se importaron ${toImport.length} de ${importedParticipants.length} participantes (límite alcanzado)`, { id: toastId });
        } else {
          toast.success(`${toImport.length} participantes importados`, { id: toastId });
        }
      } catch (error) {
        toast.error('Error al importar archivo', { id: toastId });
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      toast.error('Error leyendo el archivo', { id: toastId });
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    // Crear objeto temporal de torneo para la exportación
    const tempTournament = {
      name: 'Participantes',
      participants
    } as any;
    exportParticipantsToExcel(tempTournament, participants);
  };

  return (
    <div className="space-y-4">
      {/* Indicador de estado del backend */}
      {healthStatus?.checked && !healthStatus.ok && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <span className="font-medium">⚠️ Problema de conexión:</span> {healthStatus.message}
          <span className="text-xs">(¿Está corriendo el backend en puerto 3001?)</span>
        </div>
      )}
      {storeError && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
          <span className="font-medium">Error:</span> {storeError}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle className="text-lg">Participantes</CardTitle>
              <Badge variant={participants.length >= maxParticipants ? "destructive" : "secondary"}>
                {participants.length} / {maxParticipants}
              </Badge>
              {healthStatus?.ok && (
                <span className="text-xs text-green-600">● Conectado</span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {participants.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Exportar CSV
                </Button>
              )}
              {participants.length >= 2 && (
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Previsualizar</span>
                  <span className="sm:hidden">Vista previa</span>
                </Button>
              )}
              {canEdit && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.txt"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={participants.length >= maxParticipants || isImporting}
                  >
                    {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Importar
                  </Button>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={participants.length >= maxParticipants}>
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Agregar</span>
                        <span className="sm:hidden">Nuevo</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader><DialogTitle>Agregar Participante</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Nombre *</Label>
                          <Input
                            value={newParticipant.name}
                            onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                            placeholder="Nombre del participante"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                          />
                        </div>
                        <div>
                          <Label>Ciudad o Club (opcional)</Label>
                          <Input
                            value={newParticipant.email}
                            onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                            placeholder="Ej: Madrid, Club Pulso..."
                          />
                        </div>
                        <div>
                          <Label>Categoría / Peso (opcional)</Label>
                          <Input
                            value={newParticipant.category}
                            onChange={(e) => setNewParticipant({ ...newParticipant, category: e.target.value })}
                            placeholder="Ej: -90kg, Open..."
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Orden asignado: <Badge variant="outline">{participants.length + 1}</Badge>
                        </p>
                        <Button onClick={handleAddParticipant} className="w-full" disabled={isAdding}>
                          {isAdding ? 'Agregando...' : 'Agregar Participante'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Buscar participantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No se encontraron participantes' : 'No hay participantes registrados'}
              {!searchTerm && canEdit && (
                <p className="text-sm mt-2">Haz clic en "Agregar" para registrar competidores</p>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Ciudad/Club</TableHead>
                      <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                      <TableHead className="w-20 text-center">Orden</TableHead>
                      <TableHead className="w-24 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant, index) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{participant.name}</span>
                            <span className="sm:hidden text-xs text-muted-foreground">
                              {participant.email || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">{participant.email || '-'}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          {participant.category ? <Badge variant="secondary">{participant.category}</Badge> : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">{participant.seed || index + 1}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(participant)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => confirmRemoveParticipant(participant)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar Participante</DialogTitle></DialogHeader>
          {editingParticipant && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={editingParticipant.name}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, name: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <Label>Ciudad o Club</Label>
                <Input
                  value={editingParticipant.email || ''}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, email: e.target.value })}
                  placeholder="Ej: Madrid, Club Pulso..."
                />
              </div>
              <div>
                <Label>Categoría / Peso</Label>
                <Input
                  value={editingParticipant.category || ''}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, category: e.target.value })}
                  placeholder="Ej: -90kg, Open..."
                />
              </div>
              <div>
                <Label>Número de Orden (Seed)</Label>
                <Input
                  type="number"
                  min={1}
                  max={participants.length}
                  value={editingParticipant.seed || ''}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, seed: parseInt(e.target.value) || undefined })}
                  placeholder="1, 2, 3..."
                />
                <p className="text-xs text-muted-foreground mt-1">Los números más bajos juegan primero</p>
              </div>
              <Button onClick={handleEditParticipant} className="w-full" disabled={isEditing}>
                {isEditing ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de previsualización */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Previsualización de Llaves</DialogTitle></DialogHeader>
          <BracketPreview participants={participants} />
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ ...confirmDelete, open })}
        title="¿Eliminar participante?"
        description={`${confirmDelete.participant?.name} será removido del torneo. Esta acción no se puede deshacer.`}
        variant="destructive"
        onConfirm={handleRemoveParticipant}
        confirmText="Eliminar"
      />
    </div>
  );
}
