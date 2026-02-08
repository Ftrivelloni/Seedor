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
} from '@/components/dashboard/ui/dialog';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import { registerPaymentAction } from './actions';
import type { SerializedWorker } from './types';
import { paymentTypeLabels } from './types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700 text-white">
      {pending ? 'Registrando...' : 'Registrar pago'}
    </Button>
  );
}

interface RegisterPaymentModalProps {
  worker: SerializedWorker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterPaymentModal({ worker, open, onOpenChange }: RegisterPaymentModalProps) {
  const [error, setError] = useState<string | null>(null);

  if (!worker) return null;

  const now = new Date();
  const currentPeriod = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  async function handleAction(formData: FormData) {
    setError(null);
    if (!worker) return;
    formData.set('workerId', worker.id);

    try {
      await registerPaymentAction(formData);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar pago.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Registrar pago para {worker.firstName} {worker.lastName} ({paymentTypeLabels[worker.paymentType] ?? worker.paymentType})
          </DialogDescription>
        </DialogHeader>

        <form action={handleAction} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Monto ($)</Label>
            <Input
              id="payment-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-period">Período</Label>
            <Input
              id="payment-period"
              name="period"
              type="text"
              defaultValue={currentPeriod}
              readOnly
              className="bg-gray-50 text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-status">Estado</Label>
            <Select name="paymentStatus" defaultValue="PAID">
              <SelectTrigger id="payment-status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="PARTIAL">Parcial</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
