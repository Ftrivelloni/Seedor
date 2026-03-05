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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import { ArrowLeftRight } from 'lucide-react';
import { createInventoryMovementAction } from './actions';
import type { SerializedWarehouse, SerializedItem } from './types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Registrando...' : 'Registrar movimiento'}
    </Button>
  );
}

const movementTypeLabels: Record<string, string> = {
  INCOME: 'Ingreso',
  TRANSFER: 'Traslado',
  CONSUMPTION: 'Consumo',
  ADJUSTMENT: 'Ajuste',
};

interface RegisterMovementModalProps {
  warehouses: SerializedWarehouse[];
  items: SerializedItem[];
}

export function RegisterMovementModal({ warehouses, items }: RegisterMovementModalProps) {
  const [open, setOpen] = useState(false);
  const [movementType, setMovementType] = useState('INCOME');

  const needsSource = movementType === 'TRANSFER' || movementType === 'CONSUMPTION' || movementType === 'ADJUSTMENT';
  const needsDestination = movementType === 'INCOME' || movementType === 'TRANSFER' || movementType === 'ADJUSTMENT';

  async function handleSubmit(formData: FormData) {
    await createInventoryMovementAction(formData);
    setOpen(false);
    setMovementType('INCOME');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Registrar movimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>
            Ingresá, trasladá o consumí insumos. El stock se actualiza automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Tipo de movimiento <span className="text-red-500">*</span>
            </Label>
            <Select
              name="type"
              defaultValue="INCOME"
              onValueChange={(v) => setMovementType(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(movementTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Insumo <span className="text-red-500">*</span>
            </Label>
            <Select name="itemId">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar insumo" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} · {item.name} ({item.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-quantity">
              Cantidad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="movement-quantity"
              name="quantity"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
            />
          </div>

          {needsSource && (
            <div className="space-y-2">
              <Label>
                Depósito origen{' '}
                {(movementType === 'TRANSFER' || movementType === 'CONSUMPTION') && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Select name="sourceWarehouseId">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar depósito origen" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsDestination && (
            <div className="space-y-2">
              <Label>
                Depósito destino{' '}
                {(movementType === 'INCOME' || movementType === 'TRANSFER') && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Select name="destinationWarehouseId">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar depósito destino" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="movement-notes">Notas / referencia</Label>
            <Input id="movement-notes" name="notes" placeholder="Descripción opcional" />
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
