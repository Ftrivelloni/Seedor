'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog';
import { Label } from '@/components/dashboard/ui/label';
import { Input } from '@/components/dashboard/ui/input';
import { Button } from '@/components/dashboard/ui/button';
import { updateUserProfileAction } from './actions';
import type { SerializedUserProfile } from './types';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: SerializedUserProfile;
}

export function EditProfileModal({ open, onOpenChange, userProfile }: EditProfileModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateUserProfileAction(formData);
        toast.success('Datos actualizados exitosamente');
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar los datos';
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar datos de mi cuenta</DialogTitle>
          <DialogDescription>
            Actualiza tu información personal. El email no puede ser modificado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                maxLength={100}
                defaultValue={userProfile.firstName}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido *</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                maxLength={100}
                defaultValue={userProfile.lastName}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={userProfile.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">El email no puede ser modificado</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              maxLength={50}
              defaultValue={userProfile.phone}
              disabled={isPending}
              placeholder="+54 351 1234567"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
