import { useState } from 'react';
import { useApiStore } from '@/store/apiStore';
import type { Category, ArmSide } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    tournamentId: string;
    categories: Category[];
    disabled?: boolean;
}

const ARM_LABELS: Record<ArmSide, string> = {
    right: '💪 Derecha',
    left: '💪 Izquierda',
    both: '↔ Ambos',
};

const ARM_COLORS: Record<ArmSide, string> = {
    right: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    left: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    both: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

export function CategoryManager({ tournamentId, categories, disabled = false }: Props) {
    const { createCategory, deleteCategory } = useApiStore();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: '', weightClass: '', arm: 'right' as ArmSide });
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        if (!form.name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }
        setSaving(true);
        try {
            await createCategory(tournamentId, {
                name: form.name.trim(),
                weightClass: form.weightClass || undefined,
                arm: form.arm,
            });
            toast.success(`Categoría "${form.name}" creada`);
            setForm({ name: '', weightClass: '', arm: 'right' });
            setOpen(false);
        } catch {
            toast.error('Error al crear categoría');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cat: Category) => {
        try {
            await deleteCategory(tournamentId, cat.id);
            toast.success(`Categoría "${cat.name}" eliminada`);
        } catch {
            toast.error('Error al eliminar categoría');
        }
    };

    // Auto-generate name when weight/arm changes
    const autoName = () => {
        if (!form.weightClass) return;
        const armLabel = form.arm === 'right' ? 'Derecha' : form.arm === 'left' ? 'Izquierda' : 'Ambos';
        setForm(prev => ({
            ...prev,
            name: `${prev.weightClass ? `-${prev.weightClass}kg` : ''} ${armLabel}`.trim(),
        }));
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Categorías
                        {categories.length > 0 && (
                            <Badge variant="secondary" className="ml-1">{categories.length}</Badge>
                        )}
                    </CardTitle>
                    {!disabled && (
                        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                            <Plus className="h-3 w-3 mr-1" /> Agregar
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">
                        Sin categorías — todos los participantes compiten juntos
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-sm"
                            >
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ARM_COLORS[cat.arm]}`}>
                                    {ARM_LABELS[cat.arm]}
                                </span>
                                <span className="font-medium">{cat.name}</span>
                                {cat.participantCount !== undefined && (
                                    <span className="text-muted-foreground text-xs">({cat.participantCount})</span>
                                )}
                                {!disabled && (
                                    <button
                                        onClick={() => handleDelete(cat)}
                                        className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Create Category Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nueva Categoría</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Peso (kg)</label>
                                <Input
                                    placeholder="ej. 70"
                                    value={form.weightClass}
                                    onChange={e => setForm(prev => ({ ...prev, weightClass: e.target.value }))}
                                    onBlur={autoName}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Brazo</label>
                                <Select
                                    value={form.arm}
                                    onValueChange={(v) => setForm(prev => ({ ...prev, arm: v as ArmSide }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="right">💪 Derecha</SelectItem>
                                        <SelectItem value="left">💪 Izquierda</SelectItem>
                                        <SelectItem value="both">↔ Ambos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Nombre de la categoría</label>
                            <Input
                                placeholder="ej. -70kg Derecha"
                                value={form.name}
                                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Puedes personalizarlo o se genera automáticamente con el peso y brazo.
                            </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} disabled={saving}>
                                {saving ? 'Guardando...' : 'Crear Categoría'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
