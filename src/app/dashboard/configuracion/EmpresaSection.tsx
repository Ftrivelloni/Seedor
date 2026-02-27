'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/dashboard/ui/card';
import { Label } from '@/components/dashboard/ui/label';
import { Input } from '@/components/dashboard/ui/input';
import { updateTenantAction } from './actions';
import type { SerializedTenant } from './types';

interface EmpresaSectionProps {
  tenant: SerializedTenant;
  isAdmin: boolean;
}

// ── Read-only field ──
function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm text-gray-900">
        {value || <span className="italic text-gray-400">Sin completar</span>}
      </p>
    </div>
  );
}

export function EmpresaSection({ tenant, isAdmin }: EmpresaSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateTenantAction(formData);
        toast.success('Datos de la empresa actualizados.');
        setIsEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar los datos.');
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          {/* Header row with edit/save/cancel */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Información de la empresa</h3>
              <p className="mt-0.5 text-sm text-gray-500">Datos fiscales y de contacto de tu organización.</p>
            </div>
            {!isEditing && isAdmin ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            ) : isEditing ? (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setError(null); }}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="empresa-form"
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {!isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField label="Nombre de la organización" value={tenant.name} />
              <ReadField label="CUIT" value={tenant.cuit} />
              <ReadField label="Teléfono" value={tenant.companyPhone} />
              <ReadField label="Slug" value={tenant.slug} />
              <div className="sm:col-span-2">
                <ReadField label="Dirección fiscal" value={tenant.companyAddress} />
              </div>
            </div>
          ) : (
            <form id="empresa-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tenant-name">Nombre de la organización</Label>
                <Input
                  id="tenant-name"
                  name="name"
                  defaultValue={tenant.name}
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-cuit">CUIT</Label>
                <Input
                  id="tenant-cuit"
                  name="cuit"
                  defaultValue={tenant.cuit ?? ''}
                  placeholder="XX-XXXXXXXX-X"
                  maxLength={13}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-phone">Teléfono</Label>
                <Input
                  id="tenant-phone"
                  name="companyPhone"
                  defaultValue={tenant.companyPhone ?? ''}
                  placeholder="+54 ..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-slug">Slug</Label>
                <Input id="tenant-slug" value={tenant.slug} disabled />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tenant-address">Dirección fiscal</Label>
                <Input
                  id="tenant-address"
                  name="companyAddress"
                  defaultValue={tenant.companyAddress ?? ''}
                  placeholder="Av. Colón 1234, Córdoba, Argentina"
                  maxLength={500}
                />
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
