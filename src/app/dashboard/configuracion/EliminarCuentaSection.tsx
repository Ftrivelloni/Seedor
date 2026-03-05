'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/dashboard/ui/alert-dialog';
import { deleteTenantAccountAction } from './actions';
import type { SerializedTenant } from './types';

interface EliminarCuentaSectionProps {
  tenant: SerializedTenant;
}

export function EliminarCuentaSection({ tenant }: EliminarCuentaSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isConfirmValid = confirmText.trim().toLowerCase() === tenant.name.trim().toLowerCase();
  const canDelete = isConfirmValid && accepted && !isDeleting;

  const hasActiveSubscription = ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(tenant.subscriptionStatus);

  function handleClose() {
    setIsOpen(false);
    setConfirmText('');
    setAccepted(false);
    setError(null);
  }

  function handleDelete() {
    if (!canDelete) return;
    setError(null);

    startDelete(async () => {
      const result = await deleteTenantAccountAction(confirmText);

      if (result.success) {
        toast.success('Cuenta eliminada correctamente. Redirigiendo...');
        setTimeout(() => {
          router.push('/login');
          router.refresh();
        }, 1500);
      } else {
        setError(result.error ?? 'Error al eliminar la cuenta.');
      }
    });
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <Trash2 className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Eliminar cuenta</h3>
              <p className="mt-0.5 text-sm text-gray-500">
                Eliminá permanentemente <strong>{tenant.name}</strong> y todos los datos asociados.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 mt-0 pt-0">
        {/* Inline description — compact version */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-100 bg-red-50/60 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">
              Se eliminarán todos los datos de la organización, incluyendo campos, inventario, trabajadores, maquinaria y usuarios.
              {hasActiveSubscription && (
                <span className="font-medium"> La suscripción activa en Mercado Pago será cancelada automáticamente.</span>
              )}
            </p>
          </div>
          <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shrink-0">
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Eliminar cuenta permanentemente
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4 text-sm text-gray-600 mt-2">
                    <p>
                      Estás a punto de eliminar <strong className="text-gray-900">{tenant.name}</strong> y{' '}
                      <strong>todos los datos asociados</strong>. Esta acción no se puede deshacer.
                    </p>

                    {hasActiveSubscription && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm text-amber-800">
                          <strong>Suscripción activa detectada:</strong> Se cancelará automáticamente
                          la suscripción en Mercado Pago para evitar cobros futuros.
                        </p>
                      </div>
                    )}

                    {/* What will be deleted */}
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <p className="font-semibold text-red-900 mb-2">Se eliminará permanentemente:</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-red-800">
                        <span>• Campos y lotes</span>
                        <span>• Cosechas y tareas</span>
                        <span>• Inventario y depósitos</span>
                        <span>• Trabajadores</span>
                        <span>• Maquinaria</span>
                        <span>• Empaque y despachos</span>
                        <span>• Usuarios</span>
                        <span>• Configuración</span>
                      </div>
                    </div>

                    {/* Confirmation input */}
                    <div className="space-y-2">
                      <Label htmlFor="delete-confirm" className="text-gray-700">
                        Escribí <strong className="text-red-700 select-all">{tenant.name}</strong> para confirmar:
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={confirmText}
                        onChange={(e) => { setConfirmText(e.target.value); setError(null); }}
                        placeholder={tenant.name}
                        className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                        autoComplete="off"
                        disabled={isDeleting}
                      />
                    </div>

                    {/* Terms checkbox */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        disabled={isDeleting}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700">
                        Entiendo que esta acción es <strong>permanente e irreversible</strong>, y que
                        todos los datos de la organización serán eliminados.
                      </span>
                    </label>

                    {error && (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                      </p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
                  Cancelar
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!canDelete}
                  className="disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
