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
import { Plus } from 'lucide-react';
import { createLotAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Creando...' : 'Crear lote'}
    </Button>
  );
}

interface CreateLotModalProps {
  fieldId: string;
  fieldName: string;
}

export function CreateLotModal({ fieldId, fieldName }: CreateLotModalProps) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createLotAction(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 gap-2">
          <Plus className="h-4 w-4" />
          Nuevo lote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear lote</DialogTitle>
          <DialogDescription>
            Agregá un nuevo lote al campo &quot;{fieldName}&quot;.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="fieldId" value={fieldId} />
          <div className="space-y-2">
            <Label htmlFor="lot-name">
              Nombre del lote <span className="text-red-500">*</span>
            </Label>
            <Input id="lot-name" name="name" required placeholder="Ej: Lote A1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lot-hectares">
              Hectáreas <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lot-hectares"
              name="areaHectares"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="Ej: 25.5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lot-production">
              Tipo de producción <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lot-production"
              name="productionType"
              required
              placeholder="Ej: Limones, Naranjas, Arándanos..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lot-fruits">Descripción de frutas plantadas</Label>
            <Textarea
              id="lot-fruits"
              name="plantedFruitsDescription"
              placeholder="Descripción detallada de las variedades plantadas..."
              rows={3}
            />
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
