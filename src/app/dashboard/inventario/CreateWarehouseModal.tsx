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
import { Warehouse } from 'lucide-react';
import { createWarehouseAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Creando...' : 'Crear depósito'}
    </Button>
  );
}

export function CreateWarehouseModal() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createWarehouseAction(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 gap-2">
          <Warehouse className="h-4 w-4" />
          Nuevo depósito
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear depósito</DialogTitle>
          <DialogDescription>
            Registrá un nuevo depósito donde almacenar insumos.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse-name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="warehouse-name"
              name="name"
              required
              placeholder="Ej: Depósito principal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouse-description">Descripción</Label>
            <Input
              id="warehouse-description"
              name="description"
              placeholder="Ubicación o detalles del depósito"
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
