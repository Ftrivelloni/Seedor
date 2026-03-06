'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/dashboard/ui/dialog';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
import { Textarea } from '@/components/dashboard/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createMachineAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Registrando...' : 'Registrar máquina'}
    </Button>
  );
}

const machineTypes = [
  'Cosechadora',
  'Tractor',
  'Segadora',
  'Pulverizadora',
  'Riego',
  'Fumigadora',
  'Sembradora',
  'Enfardadora',
  'Otro',
];

const machineImages: Record<string, string> = {
  Cosechadora: '/images/maquinaria/cosechadora.png',
  Tractor: '/images/maquinaria/tractor.png',
  Segadora: '/images/maquinaria/segadora.png',
  Pulverizadora: '/images/maquinaria/pulverizadora.png',
  Riego: '/images/maquinaria/riego.png',
};

export function CreateMachineModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('');

  async function handleSubmit(formData: FormData) {
    setError(null);
    // Auto-assign image based on type
    const type = formData.get('type') as string;
    if (type && machineImages[type]) {
      formData.set('imageUrl', machineImages[type]);
    }
    try {
      await createMachineAction(formData);
      setOpen(false);
      setSelectedType('');
      toast.success('Máquina registrada exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar la máquina.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Registrar máquina
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar máquina</DialogTitle>
          <DialogDescription>
            Completá los datos de la nueva máquina.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="machine-name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="machine-name"
                name="name"
                required
                maxLength={100}
                placeholder="Ej: Cosechadora Case IH 7130"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select
                name="type"
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {machineTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine-location">Ubicación</Label>
              <Input
                id="machine-location"
                name="location"
                placeholder="Ej: Campo Norte"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="machine-desc">Descripción</Label>
              <Textarea
                id="machine-desc"
                name="description"
                rows={2}
                placeholder="Descripción de la máquina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine-acquisition">Fecha de adquisición</Label>
              <Input
                id="machine-acquisition"
                name="acquisitionDate"
                type="date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine-hours">Contahoras actual</Label>
              <Input
                id="machine-hours"
                name="hourMeter"
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine-sih">Service cada (horas)</Label>
              <Input
                id="machine-sih"
                name="serviceIntervalHours"
                type="number"
                min="0"
                step="1"
                placeholder="Ej: 40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine-sid">Service cada (días)</Label>
              <Input
                id="machine-sid"
                name="serviceIntervalDays"
                type="number"
                min="0"
                step="1"
                placeholder="Ej: 14"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
