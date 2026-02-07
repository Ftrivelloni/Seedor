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
import { PackagePlus } from 'lucide-react';
import { createInventoryItemAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Creando...' : 'Crear insumo'}
    </Button>
  );
}

export function CreateItemModal() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createInventoryItemAction(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 gap-2">
          <PackagePlus className="h-4 w-4" />
          Nuevo insumo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear insumo</DialogTitle>
          <DialogDescription>
            El identificador se genera automáticamente. Completá los datos del insumo.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input id="item-name" name="name" required placeholder="Ej: Fertilizante NPK" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-description">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Input
              id="item-description"
              name="description"
              required
              placeholder="Detalles del insumo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-unit">
              Unidad de medida <span className="text-red-500">*</span>
            </Label>
            <Input id="item-unit" name="unit" required placeholder="kg, L, cajas, bolsas, unidades..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-low">Umbral bajo (por defecto)</Label>
              <Input
                id="item-low"
                name="lowThreshold"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-critical">Umbral crítico (por defecto)</Label>
              <Input
                id="item-critical"
                name="criticalThreshold"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Los umbrales se aplican a todos los depósitos al crear el insumo. Luego podés ajustarlos por depósito de manera independiente.
          </p>

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
