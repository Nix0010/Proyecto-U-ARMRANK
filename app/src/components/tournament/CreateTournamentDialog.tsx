import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiStore } from '@/store/apiStore';
import { Swords } from 'lucide-react';
import type { TournamentType } from '@/types/tournament';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TOURNAMENT_TYPES: { value: TournamentType; label: string; desc: string; icon: string }[] = [
  { value: 'double_elimination', label: 'Doble Eliminación', desc: 'Dos vidas. Bracket de ganadores y perdedores.', icon: '⚡' },
  { value: 'single_elimination', label: 'Eliminación Simple', desc: 'Una vida. El que pierde queda eliminado.', icon: '⚔️' },
  { value: 'round_robin', label: 'Round Robin', desc: 'Todos contra todos. Gana el que más victorias acumule.', icon: '🔄' },
  { value: 'vendetta', label: 'Vendetta', desc: 'Series al mejor de (BO3, BO5, BO7). Armwrestling intenso.', icon: '🥊' },
];

const initialForm = {
  name: '',
  description: '',
  type: 'double_elimination' as TournamentType,
  maxParticipants: 8,
  bestOf: 1,
  location: '',
  organizerName: '',
};

export function CreateTournamentDialog({ open, onOpenChange }: Props) {
  const { createTournament } = useApiStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = TOURNAMENT_TYPES.find(t => t.value === formData.type)!;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createTournament({
        ...formData,
        sport: 'Armwrestling',
        bestOf: formData.type === 'vendetta' ? formData.bestOf : 1,
      });
      onOpenChange(false);
      setTimeout(() => {
        document.body.style.pointerEvents = '';
        document.body.removeAttribute('data-scroll-locked');
      }, 100);
      setStep(1);
      setFormData(initialForm);
      toast.success('Torneo creado exitosamente');
    } catch (error) {
      toast.error('Error al crear el torneo', {
        description: error instanceof Error ? error.message : 'Verifica tu conexión y reintenta.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => step === 1 ? formData.name.trim() !== '' : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Crear Nuevo Torneo
          </DialogTitle>
        </DialogHeader>

        {/* Progreso */}
        <div className="flex items-center gap-2 mt-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Paso 1: Información básica + Tipo */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Nombre del torneo *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Copa Nacional de Pulso 2024"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descripción <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles del torneo, categorías, reglas..."
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Tournament Type Selector */}
            <div>
              <Label>Formato del torneo</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {TOURNAMENT_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, type: type.value, bestOf: type.value === 'vendetta' ? 5 : 1 })}
                    className={`text-left p-3 rounded-lg border-2 transition-all hover:border-primary/60 ${formData.type === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background'
                      }`}
                  >
                    <div className="text-lg mb-0.5">{type.icon}</div>
                    <div className="font-semibold text-sm">{type.label}</div>
                    <div className="text-xs text-muted-foreground leading-tight">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vendetta bestOf selector */}
            {formData.type === 'vendetta' && (
              <div>
                <Label>Serie (Mejor de...)</Label>
                <div className="flex gap-2 mt-1">
                  {[3, 5, 7].map(n => (
                    <button
                      key={n}
                      onClick={() => setFormData({ ...formData, bestOf: n })}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition-all ${formData.bestOf === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/60'
                        }`}
                    >
                      BO{n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Configuración */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Número de competidores</Label>
              <Select
                value={formData.maxParticipants.toString()}
                onValueChange={(v) => setFormData({ ...formData, maxParticipants: parseInt(v) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 8, 12, 16, 24, 32, 48, 64, 128].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n} competidores</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ubicación <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ciudad, gimnasio, sala..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Organizador <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                value={formData.organizerName}
                onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                placeholder="Nombre del organizador o federación"
                className="mt-1"
              />
            </div>

            {/* Resumen */}
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p className="font-medium mb-2">Resumen</p>
              <div className="grid grid-cols-2 gap-y-1 text-muted-foreground">
                <span>Nombre:</span> <span className="text-foreground font-medium">{formData.name}</span>
                <span>Deporte:</span> <span className="text-foreground">💪 Armwrestling</span>
                <span>Formato:</span>
                <span className="text-foreground font-medium">
                  {selectedType.icon} {selectedType.label}
                  {formData.type === 'vendetta' && ` (BO${formData.bestOf})`}
                </span>
                <span>Cupo:</span> <span className="text-foreground">{formData.maxParticipants} competidores</span>
                {formData.location && <><span>Lugar:</span> <span className="text-foreground">{formData.location}</span></>}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
            Anterior
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Swords className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creando...' : 'Crear Torneo'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
