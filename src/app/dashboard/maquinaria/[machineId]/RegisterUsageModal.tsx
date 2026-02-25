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
import { Textarea } from '@/components/dashboard/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { registerUsageAction } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Registrando...' : 'Registrar uso'}
    </Button>
  );
}

interface InventoryUsageRow {
  itemId: string;
  warehouseId: string;
  quantity: string;
}

interface RegisterUsageModalProps {
  machineId: string;
  warehouses: { id: string; name: string }[];
  inventoryItems: { id: string; code: string; name: string; unit: string }[];
}

export function RegisterUsageModal({
  machineId,
  warehouses,
  inventoryItems,
}: RegisterUsageModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryRows, setInventoryRows] = useState<InventoryUsageRow[]>([]);

  function addInventoryRow() {
    setInventoryRows((prev) => [
      ...prev,
      { itemId: '', warehouseId: '', quantity: '' },
    ]);
  }

  function removeInventoryRow(index: number) {
    setInventoryRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInventoryRow(index: number, field: keyof InventoryUsageRow, value: string) {
    setInventoryRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set('machineId', machineId);

    // Serialize inventory usages as JSON
    const usages = inventoryRows
      .filter((r) => r.itemId && r.warehouseId && Number(r.quantity) > 0)
      .map((r) => ({
        itemId: r.itemId,
        warehouseId: r.warehouseId,
        quantity: Number(r.quantity),
      }));
    formData.set('inventoryUsages', JSON.stringify(usages));

    try {
      await registerUsageAction(formData);
      setOpen(false);
      setInventoryRows([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el uso.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700">
          <Clock className="h-4 w-4" />
          Registrar Uso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Uso</DialogTitle>
          <DialogDescription>
            Registrá el uso de la máquina e indicá los insumos consumidos.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usage-date">Fecha</Label>
              <Input
                id="usage-date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usage-hours">
                Horas de uso <span className="text-red-500">*</span>
              </Label>
              <Input
                id="usage-hours"
                name="hoursUsed"
                type="number"
                min="0.1"
                step="0.1"
                required
                placeholder="Ej: 8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage-desc">Descripción</Label>
            <Textarea
              id="usage-desc"
              name="description"
              rows={2}
              placeholder="Ej: Cosecha de soja en Lote B-1"
            />
          </div>

          {/* ── Inventory usage rows ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Insumos utilizados</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addInventoryRow}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar insumo
              </Button>
            </div>

            {inventoryRows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_80px_32px] items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Insumo</Label>
                  <Select
                    value={row.itemId}
                    onValueChange={(v) => updateInventoryRow(index, 'itemId', v)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.code} · {item.name} ({item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Depósito</Label>
                  <Select
                    value={row.warehouseId}
                    onValueChange={(v) => updateInventoryRow(index, 'warehouseId', v)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Seleccionar" />
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
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Cant.</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={row.quantity}
                    onChange={(e) => updateInventoryRow(index, 'quantity', e.target.value)}
                    className="text-xs"
                    placeholder="0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
                  onClick={() => removeInventoryRow(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {inventoryRows.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">
                Sin insumos agregados. Los insumos se descuentan automáticamente del inventario.
              </p>
            )}
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
