'use client';

import { useState, useMemo } from 'react';
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
import { Checkbox } from '@/components/dashboard/ui/checkbox';
import { Badge } from '@/components/dashboard/ui/badge';
import { Plus, Search, X } from 'lucide-react';
import { createTaskAction } from './actions';
import type {
  SerializedLot,
  SerializedWorker,
  SerializedInventoryItem,
  SerializedWarehouse,
  SerializedField,
  SerializedTaskType,
} from './types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Creando...' : 'Crear tarea'}
    </Button>
  );
}

interface CreateTaskModalProps {
  fields: SerializedField[];
  workers: SerializedWorker[];
  inventoryItems: SerializedInventoryItem[];
  warehouses: SerializedWarehouse[];
  taskTypes: SerializedTaskType[];
  /** If provided, pre-select this lot */
  preselectedLotId?: string;
}

export function CreateTaskModal({
  fields,
  workers,
  inventoryItems,
  warehouses,
  taskTypes,
  preselectedLotId,
}: CreateTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>(
    preselectedLotId ? [preselectedLotId] : []
  );
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [lotSearch, setLotSearch] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [usageRows, setUsageRows] = useState<
    Array<{ itemId: string; warehouseId: string; quantity: string; unit: string }>
  >([]);

  const allLots = useMemo(
    () =>
      fields.flatMap((f) =>
        f.lots.map((l) => ({ ...l, fieldName: f.name }))
      ),
    [fields]
  );

  const filteredLots = useMemo(() => {
    const q = lotSearch.toLowerCase();
    return allLots.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.fieldName.toLowerCase().includes(q)
    );
  }, [allLots, lotSearch]);

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.toLowerCase();
    return workers.filter(
      (w) =>
        w.firstName.toLowerCase().includes(q) ||
        w.lastName.toLowerCase().includes(q) ||
        w.functionType.toLowerCase().includes(q)
    );
  }, [workers, workerSearch]);

  function toggleLot(lotId: string) {
    setSelectedLotIds((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    );
  }

  function toggleWorker(workerId: string) {
    setSelectedWorkerIds((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  }

  function addUsageRow() {
    setUsageRows((prev) => [...prev, { itemId: '', warehouseId: '', quantity: '', unit: '' }]);
  }

  function removeUsageRow(index: number) {
    setUsageRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateUsageRow(
    index: number,
    key: 'itemId' | 'warehouseId' | 'quantity' | 'unit',
    value: string
  ) {
    setUsageRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  }

  async function handleSubmit(formData: FormData) {
    selectedLotIds.forEach((id) => formData.append('lotIds', id));
    selectedWorkerIds.forEach((id) => formData.append('workerIds', id));

    usageRows.forEach((row) => {
      formData.append('usageItemId', row.itemId);
      formData.append('usageWarehouseId', row.warehouseId);
      formData.append('usageQuantity', row.quantity);
      formData.append('usageUnit', row.unit);
    });

    await createTaskAction(formData);
    setOpen(false);
    setSelectedLotIds(preselectedLotId ? [preselectedLotId] : []);
    setSelectedWorkerIds([]);
    setUsageRows([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 gap-2">
          <Plus className="h-4 w-4" />
          Nueva tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear tarea</DialogTitle>
          <DialogDescription>
            Se creará una tarea independiente por cada lote seleccionado.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-5">
          {/* Basic info */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="task-desc">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="task-desc"
                name="description"
                required
                placeholder="Describe la tarea a realizar..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-type">
                Tipo de tarea <span className="text-red-500">*</span>
              </Label>
              <select
                id="task-type"
                name="taskType"
                required
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar tipo...</option>
                {taskTypes.map((tt) => (
                  <option key={tt.id} value={tt.name}>
                    {tt.name}
                  </option>
                ))}
              </select>
              {taskTypes.length === 0 && (
                <p className="text-xs text-amber-600">
                  No hay tipos de tarea creados. Crealos desde la vista del campo.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-cost-unit">Unidad de costo</Label>
              <Input
                id="task-cost-unit"
                name="costUnit"
                placeholder="Ej: por hectárea, por hora..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-cost">Costo</Label>
              <Input
                id="task-cost"
                name="costValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-start">
                Fecha inicio <span className="text-red-500">*</span>
              </Label>
              <Input id="task-start" name="startDate" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">
                Fecha límite <span className="text-red-500">*</span>
              </Label>
              <Input id="task-due" name="dueDate" type="datetime-local" required />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="isComposite"
                value="true"
                className="h-4 w-4 rounded border-gray-300"
              />
              Tarea compuesta (con subtareas)
            </label>
          </div>

          {/* Lot selection with search */}
          <div className="space-y-2">
            <Label>
              Lotes involucrados <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-gray-500">
              Se creará una tarea independiente para cada lote seleccionado.
            </p>
            {selectedLotIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedLotIds.map((id) => {
                  const lot = allLots.find((l) => l.id === id);
                  return lot ? (
                    <Badge
                      key={id}
                      className="bg-green-100 text-green-800 border-0 gap-1 cursor-pointer hover:bg-green-200"
                      onClick={() => toggleLot(id)}
                    >
                      {lot.fieldName} · {lot.name}
                      <X className="h-3 w-3" />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar lote..."
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg divide-y">
              {filteredLots.map((lot) => (
                <label
                  key={lot.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedLotIds.includes(lot.id)}
                    onCheckedChange={() => toggleLot(lot.id)}
                  />
                  <span className="text-gray-700">
                    {lot.fieldName} · {lot.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{lot.areaHectares} ha</span>
                </label>
              ))}
              {filteredLots.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
              )}
            </div>
          </div>

          {/* Worker selection with search */}
          <div className="space-y-2">
            <Label>Trabajadores asignados</Label>
            {selectedWorkerIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedWorkerIds.map((id) => {
                  const w = workers.find((w) => w.id === id);
                  return w ? (
                    <Badge
                      key={id}
                      className="bg-blue-100 text-blue-800 border-0 gap-1 cursor-pointer hover:bg-blue-200"
                      onClick={() => toggleWorker(id)}
                    >
                      {w.firstName} {w.lastName}
                      <X className="h-3 w-3" />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar trabajador..."
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg divide-y">
              {filteredWorkers.map((w) => (
                <label
                  key={w.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedWorkerIds.includes(w.id)}
                    onCheckedChange={() => toggleWorker(w.id)}
                  />
                  <span className="text-gray-700">
                    {w.firstName} {w.lastName}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{w.functionType}</span>
                </label>
              ))}
              {filteredWorkers.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
              )}
            </div>
          </div>

          {/* Inventory usages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Insumos utilizados (opcional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addUsageRow}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agregar insumo
              </Button>
            </div>
            {usageRows.length > 0 && (
              <div className="space-y-2">
                {usageRows.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1fr_80px_80px_32px] gap-2 items-end"
                  >
                    <select
                      value={row.itemId}
                      onChange={(e) => updateUsageRow(index, 'itemId', e.target.value)}
                      className="h-9 rounded-md border border-gray-300 px-3 text-sm"
                    >
                      <option value="">Insumo</option>
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.code} · {item.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={row.warehouseId}
                      onChange={(e) => updateUsageRow(index, 'warehouseId', e.target.value)}
                      className="h-9 rounded-md border border-gray-300 px-3 text-sm"
                    >
                      <option value="">Depósito</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cant."
                      value={row.quantity}
                      onChange={(e) => updateUsageRow(index, 'quantity', e.target.value)}
                    />
                    <Input
                      placeholder="Unid."
                      value={row.unit}
                      onChange={(e) => updateUsageRow(index, 'unit', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUsageRow(index)}
                      className="h-9 w-9 p-0 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-gray-500">
                  Cada consumo descuenta stock automáticamente del inventario.
                </p>
              </div>
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
