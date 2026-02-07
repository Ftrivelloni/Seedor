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
import { MapPin } from 'lucide-react';
import { createFieldAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Creando...' : 'Crear campo'}
    </Button>
  );
}

export function CreateFieldModal() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createFieldAction(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 gap-2">
          <MapPin className="h-4 w-4" />
          Nuevo campo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear campo</DialogTitle>
          <DialogDescription>
            Registrá un nuevo campo para organizar tus lotes de producción.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field-name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input id="field-name" name="name" required placeholder="Ej: Campo Norte" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-location">Ubicación</Label>
            <Input id="field-location" name="location" placeholder="Ej: Ruta 40 Km 120" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-description">Descripción</Label>
            <Input
              id="field-description"
              name="description"
              placeholder="Descripción general del campo"
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
