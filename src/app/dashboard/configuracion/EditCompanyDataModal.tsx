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
import { Textarea } from '@/components/dashboard/ui/textarea';
import { Button } from '@/components/dashboard/ui/button';
import { updateCompanyDataAction } from './actions';
import type { SerializedTenantConfig } from './types';

interface EditCompanyDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantConfig: SerializedTenantConfig;
}

export function EditCompanyDataModal({
  open,
  onOpenChange,
  tenantConfig,
}: EditCompanyDataModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateCompanyDataAction(formData);
        toast.success('Datos de la empresa actualizados exitosamente');
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error al actualizar los datos de la empresa';
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar datos de la empresa</DialogTitle>
          <DialogDescription>
            Actualiza la información general del tenant y datos fiscales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="legalName">Nombre legal de la empresa</Label>
            <Input
              id="legalName"
              name="legalName"
              maxLength={200}
              defaultValue={tenantConfig.legalName || tenantConfig.name}
              disabled={isPending}
              placeholder="Agropecuaria San Pedro S.A."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                name="cuit"
                maxLength={20}
                defaultValue={tenantConfig.cuit || ''}
                disabled={isPending}
                placeholder="30-12345678-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Teléfono</Label>
              <Input
                id="companyPhone"
                name="companyPhone"
                type="tel"
                maxLength={50}
                defaultValue={tenantConfig.companyPhone || ''}
                disabled={isPending}
                placeholder="+54 3329 123456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Dirección</Label>
            <Textarea
              id="companyAddress"
              name="companyAddress"
              maxLength={500}
              defaultValue={tenantConfig.companyAddress || ''}
              disabled={isPending}
              placeholder="Ruta 9 Km 156, San Pedro, Buenos Aires"
              rows={3}
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
