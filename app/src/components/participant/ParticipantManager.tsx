import { useEffect, useRef, useState } from 'react';
import type { Category, Participant } from '@/types/tournament';
import { useApiStore } from '@/store/apiStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Upload, Trash2, Search, Edit2, Eye, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BracketPreview } from './BracketPreview';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { useExport } from '@/hooks/useExport';

interface ParticipantManagerProps {
  tournamentId: string;
  participants: Participant[];
  categories: Category[];
  maxParticipants: number;
  canEdit: boolean;
}

interface ParticipantFormState {
  name: string;
  email: string;
  categoryId: string;
}

const emptyForm: ParticipantFormState = {
  name: '',
  email: '',
  categoryId: '',
};

export function ParticipantManager({ tournamentId, participants, categories, maxParticipants, canEdit }: ParticipantManagerProps) {
  const { addParticipant, updateParticipant, removeParticipant, checkHealth, error: storeError } = useApiStore();
  const { isExporting, exportParticipantsToExcel } = useExport();
  const [searchTerm, setSearchTerm] = useState('');
  const [newParticipant, setNewParticipant] = useState<ParticipantFormState>(emptyForm);
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

  const filteredParticipants = participants.filter((participant) => {
    const haystack = [
      participant.name,
      participant.email,
      participant.category,
      participant.team,
      participant.country,
    ].filter(Boolean).join(' ').toLowerCase();

    return haystack.includes(searchTerm.toLowerCase());
  });

  const categoryLabel = (participant: Participant) => participant.category || participant.categoryObj?.name || '-';

  const closeDialogSafely = () => {
    window.setTimeout(() => {
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
    }, 100);
  };

  const handleAddParticipant = async () => {
    if (!newParticipant.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (participants.length >= maxParticipants) {
      toast.error(`Maximo de ${maxParticipants} participantes alcanzado`);
      return;
    }

    setIsAdding(true);
    try {
      await addParticipant(tournamentId, {
        name: newParticipant.name.trim(),
        email: newParticipant.email.trim(),
        categoryId: newParticipant.categoryId || undefined,
      });
      setNewParticipant(emptyForm);
      setIsAddDialogOpen(false);
      closeDialogSafely();
      toast.success('Participante agregado', {
        description: `${newParticipant.name.trim()} registrado correctamente`,
      });
    } catch (error) {
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
        name: editingParticipant.name.trim(),
        email: editingParticipant.email ?? '',
        seed: editingParticipant.seed,
        categoryId: editingParticipant.categoryId || undefined,
      });
      setEditingParticipant(null);
      setIsEditDialogOpen(false);
      closeDialogSafely();
      toast.success('Cambios guardados');
    } catch (error) {
      toast.error('Error al actualizar participante', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const confirmRemoveParticipant = (participant: Participant) => {
    setConfirmDelete({ open: true, participant });
  };

  const handleRemoveParticipant = async () => {
    if (!confirmDelete.participant) {
      setConfirmDelete({ open: false, participant: null });
      return;
    }

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
      setConfirmDelete({ open: false, participant: null });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading('Importando participantes...');

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const text = loadEvent.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        const availableSlots = maxParticipants - participants.length;

        const importedParticipants = lines
          .map((line) => {
            const parts = line.split(',').map((part) => part.trim());
            return { name: parts[0] || '', email: parts[1] || '' };
          })
          .filter((participant) => participant.name)
          .slice(0, availableSlots);

        if (importedParticipants.length === 0) {
          toast.error('No hay cupos disponibles', { id: toastId });
          return;
        }

        for (const participant of importedParticipants) {
          await addParticipant(tournamentId, participant);
        }

        toast.success(`${importedParticipants.length} participantes importados`, { id: toastId });
      } catch {
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
    const tempTournament = {
      name: 'Participantes',
      participants,
    };

    exportParticipantsToExcel(tempTournament as never, participants);
  };

  return (
    <div className="space-y-4">
      {healthStatus?.checked && !healthStatus.ok && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <span className="font-medium">Problema de conexion:</span> {healthStatus.message}
          <span className="text-xs">(Verifica el backend en el puerto 3001)</span>
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
              <Badge variant={participants.length >= maxParticipants ? 'destructive' : 'secondary'}>
                {participants.length} / {maxParticipants}
              </Badge>
              {healthStatus?.ok && <span className="text-xs text-green-600">Conectado</span>}
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
                            onChange={(event) => setNewParticipant({ ...newParticipant, name: event.target.value })}
                            placeholder="Nombre del participante"
                            onKeyDown={(event) => event.key === 'Enter' && handleAddParticipant()}
                          />
                        </div>
                        <div>
                          <Label>Ciudad o Club (opcional)</Label>
                          <Input
                            value={newParticipant.email}
                            onChange={(event) => setNewParticipant({ ...newParticipant, email: event.target.value })}
                            placeholder="Ej: Bogota, Club Pulso..."
                          />
                        </div>
                        {categories.length > 0 && (
                          <div>
                            <Label>Categoria</Label>
                            <Select
                              value={newParticipant.categoryId || '__none__'}
                              onValueChange={(value) => setNewParticipant({ ...newParticipant, categoryId: value === '__none__' ? '' : value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Sin categoria</SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
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
              onChange={(event) => setSearchTerm(event.target.value)}
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
                      <TableHead className="hidden sm:table-cell">Categoria</TableHead>
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
                          {categoryLabel(participant) !== '-' ? <Badge variant="secondary">{categoryLabel(participant)}</Badge> : '-'}
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
                                onClick={() => {
                                  setEditingParticipant({ ...participant });
                                  setIsEditDialogOpen(true);
                                }}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar Participante</DialogTitle></DialogHeader>
          {editingParticipant && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={editingParticipant.name}
                  onChange={(event) => setEditingParticipant({ ...editingParticipant, name: event.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <Label>Ciudad o Club</Label>
                <Input
                  value={editingParticipant.email || ''}
                  onChange={(event) => setEditingParticipant({ ...editingParticipant, email: event.target.value })}
                  placeholder="Ej: Bogota, Club Pulso..."
                />
              </div>
              {categories.length > 0 && (
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={editingParticipant.categoryId || '__none__'}
                    onValueChange={(value) => setEditingParticipant({
                      ...editingParticipant,
                      categoryId: value === '__none__' ? null : value,
                      category: value === '__none__' ? null : categories.find((category) => category.id === value)?.name || null,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Numero de Orden (Seed)</Label>
                <Input
                  type="number"
                  min={1}
                  max={participants.length}
                  value={editingParticipant.seed || ''}
                  onChange={(event) => setEditingParticipant({ ...editingParticipant, seed: parseInt(event.target.value, 10) || undefined })}
                  placeholder="1, 2, 3..."
                />
                <p className="text-xs text-muted-foreground mt-1">Los numeros mas bajos juegan primero</p>
              </div>
              <Button onClick={handleEditParticipant} className="w-full" disabled={isEditing}>
                {isEditing ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Previsualizacion de Llaves</DialogTitle></DialogHeader>
          <BracketPreview participants={participants} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ ...confirmDelete, open })}
        title="Eliminar participante"
        description={`${confirmDelete.participant?.name} sera removido del torneo. Esta accion no se puede deshacer.`}
        variant="destructive"
        onConfirm={handleRemoveParticipant}
        confirmText="Eliminar"
      />
    </div>
  );
}
