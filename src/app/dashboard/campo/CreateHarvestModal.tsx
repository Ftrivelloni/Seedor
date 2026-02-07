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
import { Wheat } from 'lucide-react';
import { createHarvestRecordAction } from './actions';
import type { SerializedField } from './types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Registrando...' : 'Registrar cosecha'}
    </Button>
  );
}

interface CreateHarvestModalProps {
  fields: SerializedField[];
  /** If provided, pre-select this lot */
  preselectedLotId?: string;
}

export function CreateHarvestModal({ fields, preselectedLotId }: CreateHarvestModalProps) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createHarvestRecordAction(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wheat className="h-4 w-4" />
          Registrar cosecha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar cosecha</DialogTitle>
          <DialogDescription>
            Registrá un movimiento productivo de cosecha en un lote.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="harvest-lot">
              Lote <span className="text-red-500">*</span>
            </Label>
            <select
              id="harvest-lot"
              name="lotId"
              required
              defaultValue={preselectedLotId || ''}
              className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm"
            >
              <option value="">Seleccioná un lote</option>
              {fields.flatMap((f) =>
                f.lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {f.name} · {l.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="harvest-crop">
              Cultivo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="harvest-crop"
              name="cropType"
              required
              placeholder="Ej: Limones, Naranjas..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="harvest-kilos">
              Kilos cosechados <span className="text-red-500">*</span>
            </Label>
            <Input
              id="harvest-kilos"
              name="kilos"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="harvest-date">Fecha de cosecha</Label>
            <Input id="harvest-date" name="harvestDate" type="datetime-local" />
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
