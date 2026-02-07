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
import { ListPlus } from 'lucide-react';
import { createExtraordinaryItemAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Registrando...' : 'Registrar pedido'}
    </Button>
  );
}

export function CreateExtraordinaryModal() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createExtraordinaryItemAction(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ListPlus className="h-4 w-4" />
          Nuevo pedido extraordinario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ítem extraordinario</DialogTitle>
          <DialogDescription>
            Registrá un pedido puntual de algo que no forma parte del stock habitual (repuestos,
            herramientas, etc.).
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="extra-name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input id="extra-name" name="name" required placeholder="Ej: Correa para tractor" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra-description">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Input
              id="extra-description"
              name="description"
              required
              placeholder="Detalles del pedido"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra-date">Fecha de solicitud</Label>
            <Input
              id="extra-date"
              name="requestedAt"
              type="datetime-local"
            />
            <p className="text-xs text-gray-500">
              Si no se indica, se usa la fecha y hora actual.
            </p>
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
