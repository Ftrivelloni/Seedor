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
import { Wrench, Plus, Trash2 } from 'lucide-react';
import { registerServiceAction } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Registrando...' : 'Registrar service'}
    </Button>
  );
}

interface SparePartRow {
  name: string;
  quantity: string;
  cost: string;
}

interface WorkerRow {
  workerId: string;
  cost: string;
}

interface RegisterServiceModalProps {
  machineId: string;
  workers: { id: string; name: string }[];
}

export function RegisterServiceModal({
  machineId,
  workers: availableWorkers,
}: RegisterServiceModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spareParts, setSpareParts] = useState<SparePartRow[]>([]);
  const [workerRows, setWorkerRows] = useState<WorkerRow[]>([]);

  function addSparePart() {
    setSpareParts((prev) => [...prev, { name: '', quantity: '1', cost: '0' }]);
  }

  function removeSparePart(index: number) {
    setSpareParts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSparePart(index: number, field: keyof SparePartRow, value: string) {
    setSpareParts((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function addWorkerRow() {
    setWorkerRows((prev) => [...prev, { workerId: '', cost: '0' }]);
  }

  function removeWorkerRow(index: number) {
    setWorkerRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateWorkerRow(index: number, field: keyof WorkerRow, value: string) {
    setWorkerRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set('machineId', machineId);

    // Serialize spare parts
    const sparePartsData = spareParts
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        quantity: Number(p.quantity) || 1,
        cost: Number(p.cost) || 0,
      }));
    formData.set('spareParts', JSON.stringify(sparePartsData));

    // Serialize workers
    const workersData = workerRows
      .filter((w) => w.workerId)
      .map((w) => ({
        workerId: w.workerId,
        cost: Number(w.cost) || 0,
      }));
    formData.set('workers', JSON.stringify(workersData));

    try {
      await registerServiceAction(formData);
      setOpen(false);
      setSpareParts([]);
      setWorkerRows([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el service.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-green-600 text-green-700 hover:bg-green-50">
          <Wrench className="h-4 w-4" />
          Registrar Service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Service</DialogTitle>
          <DialogDescription>
            Al registrar un service se reinician los contadores de mantenimiento.
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
              <Label htmlFor="service-date">Fecha</Label>
              <Input
                id="service-date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-cost">Costo del servicio</Label>
              <Input
                id="service-cost"
                name="cost"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                placeholder="$ 0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-desc">Descripción</Label>
            <Textarea
              id="service-desc"
              name="description"
              rows={2}
              placeholder="Ej: Reparación del sistema hidráulico - Service completo"
            />
          </div>

          {/* ── Spare parts ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Repuestos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addSparePart}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar repuesto
              </Button>
            </div>

            {spareParts.map((part, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_60px_80px_32px] items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Repuesto</Label>
                  <Input
                    value={part.name}
                    onChange={(e) => updateSparePart(index, 'name', e.target.value)}
                    placeholder="Nombre del repuesto"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Cant.</Label>
                  <Input
                    type="number"
                    min="1"
                    value={part.quantity}
                    onChange={(e) => updateSparePart(index, 'quantity', e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Costo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={part.cost}
                    onChange={(e) => updateSparePart(index, 'cost', e.target.value)}
                    className="text-xs"
                    placeholder="$ 0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
                  onClick={() => removeSparePart(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {spareParts.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-1">
                Sin repuestos. Los repuestos no se descuentan del inventario.
              </p>
            )}
          </div>

          {/* ── Workers ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Trabajadores</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addWorkerRow}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar trabajador
              </Button>
            </div>

            {workerRows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_100px_32px] items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Trabajador</Label>
                  <Select
                    value={row.workerId}
                    onValueChange={(v) => updateWorkerRow(index, 'workerId', v)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWorkers.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Costo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={row.cost}
                    onChange={(e) => updateWorkerRow(index, 'cost', e.target.value)}
                    className="text-xs"
                    placeholder="$ 0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
                  onClick={() => removeWorkerRow(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {workerRows.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-1">
                Sin trabajadores asignados.
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
