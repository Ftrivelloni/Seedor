'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, X, Check } from 'lucide-react';
import { createTaskAction } from './actions';
import type {
  SerializedLot,
  SerializedWorker,
  SerializedInventoryItem,
  SerializedWarehouse,
  SerializedField,
  SerializedTaskType,
} from './types';

/* ── Reusable stepper ── */
function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : isDone
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isDone ? <Check className="h-4 w-4" /> : step}
            </div>
            {step < total && (
              <div
                className={`h-0.5 w-16 sm:w-24 ${
                  isDone ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface CreateTaskModalProps {
  fields: SerializedField[];
  workers: SerializedWorker[];
  inventoryItems: SerializedInventoryItem[];
  warehouses: SerializedWarehouse[];
  taskTypes: SerializedTaskType[];
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [costValue, setCostValue] = useState('');
  const [costUnit, setCostUnit] = useState('Fijo');
  const [detailedDescription, setDetailedDescription] = useState('');

  // Step 2 fields
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>(
    preselectedLotId ? [preselectedLotId] : []
  );
  const [lotSearch, setLotSearch] = useState('');

  // Step 3 fields
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');
  const [usageRows, setUsageRows] = useState<
    Array<{ itemId: string; warehouseId: string; quantity: string; unit: string }>
  >([]);

  const allLots = useMemo(
    () => fields.flatMap((f) => f.lots.map((l) => ({ ...l, fieldName: f.name }))),
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

  const toggleLot = useCallback((lotId: string) => {
    setSelectedLotIds((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    );
  }, []);

  const toggleWorker = useCallback((workerId: string) => {
    setSelectedWorkerIds((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  }, []);

  function resetForm() {
    setStep(1);
    setDescription('');
    setTaskType('');
    setStartDate('');
    setDueDate('');
    setCostValue('');
    setCostUnit('Fijo');
    setDetailedDescription('');
    setSelectedLotIds(preselectedLotId ? [preselectedLotId] : []);
    setLotSearch('');
    setSelectedWorkerIds([]);
    setWorkerSearch('');
    setUsageRows([]);
    setError(null);
  }

  function canGoNext(): boolean {
    if (step === 1) return !!description.trim() && !!taskType && !!startDate && !!dueDate;
    if (step === 2) return selectedLotIds.length > 0;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set('description', description.trim());
      formData.set('taskType', taskType);
      formData.set('startDate', startDate);
      formData.set('dueDate', dueDate);
      formData.set('costValue', costValue || '0');
      formData.set('costUnit', costUnit);
      formData.set('isComposite', 'false');
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
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la tarea.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Agregar tarea
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={() => { setOpen(false); resetForm(); }} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => { setOpen(false); resetForm(); }}
            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6">
            {/* Header */}
            <h2 className="text-lg font-semibold text-gray-900">Crear tarea</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === 1 ? 'Datos de la tarea' : step === 2 ? 'Seleccionar lotes' : 'Asignar recursos'}
            </p>

            {/* Stepper */}
            <div className="mt-4 mb-6">
              <Stepper current={step} total={3} />
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Step 1: Task Data */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Descripción corta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ej: Aplicación de herbicida"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tipo de tarea <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
                    >
                      <option value="">Seleccionar tipo</option>
                      {taskTypes.map((tt) => (
                        <option key={tt.id} value={tt.name}>{tt.name}</option>
                      ))}
                    </select>
                    {taskTypes.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        No hay tipos creados. Crealos desde la configuración del campo.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Fecha inicio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Fecha límite <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Costo (opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={costValue}
                      onChange={(e) => setCostValue(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Unidad costo
                    </label>
                    <select
                      value={costUnit}
                      onChange={(e) => setCostUnit(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
                    >
                      <option value="Fijo">Fijo</option>
                      <option value="por hectárea">Por hectárea</option>
                      <option value="por hora">Por hora</option>
                      <option value="por jornal">Por jornal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Descripción detallada (opcional)
                  </label>
                  <textarea
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    placeholder="Descripción detallada de la tarea..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Lot Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Se creará una tarea independiente para cada lote seleccionado.
                </p>

                {selectedLotIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLotIds.map((id) => {
                      const lot = allLots.find((l) => l.id === id);
                      return lot ? (
                        <span
                          key={id}
                          onClick={() => toggleLot(id)}
                          className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 cursor-pointer hover:bg-green-200 transition-colors"
                        >
                          {lot.fieldName} · {lot.name}
                          <X className="h-3 w-3" />
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar lote..."
                    value={lotSearch}
                    onChange={(e) => setLotSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y">
                  {filteredLots.map((lot) => (
                    <label
                      key={lot.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLotIds.includes(lot.id)}
                        onChange={() => toggleLot(lot.id)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-700">
                        {lot.fieldName} · {lot.name}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">{lot.areaHectares} ha</span>
                    </label>
                  ))}
                  {filteredLots.length === 0 && (
                    <p className="px-3 py-3 text-sm text-gray-400 text-center">Sin resultados</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Workers + Inventory */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Workers */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Trabajadores asignados</p>

                  {selectedWorkerIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedWorkerIds.map((id) => {
                        const w = workers.find((w) => w.id === id);
                        return w ? (
                          <span
                            key={id}
                            onClick={() => toggleWorker(id)}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                          >
                            {w.firstName} {w.lastName}
                            <X className="h-3 w-3" />
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar trabajador..."
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
                    />
                  </div>
                  <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-gray-200 divide-y">
                    {filteredWorkers.map((w) => (
                      <label
                        key={w.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedWorkerIds.includes(w.id)}
                          onChange={() => toggleWorker(w.id)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">{w.firstName} {w.lastName}</span>
                        <span className="ml-auto text-xs text-gray-400">{w.functionType}</span>
                      </label>
                    ))}
                    {filteredWorkers.length === 0 && (
                      <p className="px-3 py-2 text-sm text-gray-400 text-center">Sin resultados</p>
                    )}
                  </div>
                </div>

                {/* Inventory usages */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Insumos utilizados (opcional)</p>
                    <button
                      type="button"
                      onClick={() =>
                        setUsageRows((prev) => [
                          ...prev,
                          { itemId: '', warehouseId: '', quantity: '', unit: '' },
                        ])
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar insumo
                    </button>
                  </div>
                  {usageRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_70px_70px_28px] gap-2 items-center mb-2">
                      <select
                        value={row.itemId}
                        onChange={(e) =>
                          setUsageRows((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, itemId: e.target.value } : r))
                          )
                        }
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white"
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
                        onChange={(e) =>
                          setUsageRows((prev) =>
                            prev.map((r, i) =>
                              i === index ? { ...r, warehouseId: e.target.value } : r
                            )
                          )
                        }
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white"
                      >
                        <option value="">Depósito</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Cant."
                        value={row.quantity}
                        onChange={(e) =>
                          setUsageRows((prev) =>
                            prev.map((r, i) =>
                              i === index ? { ...r, quantity: e.target.value } : r
                            )
                          )
                        }
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                      />
                      <input
                        placeholder="Unid."
                        value={row.unit}
                        onChange={(e) =>
                          setUsageRows((prev) =>
                            prev.map((r, i) =>
                              i === index ? { ...r, unit: e.target.value } : r
                            )
                          )
                        }
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setUsageRows((prev) => prev.filter((_, i) => i !== index))}
                        className="flex items-center justify-center h-7 w-7 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  if (step === 1) { setOpen(false); resetForm(); }
                  else setStep((s) => s - 1);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {step === 1 ? 'Cancelar' : 'Atrás'}
              </button>

              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canGoNext()}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Creando...' : 'Crear tarea'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
