'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { updateTaskAction } from './actions';
import type { SerializedTask, SerializedTaskType } from './types';

interface EditTaskModalProps {
  task: SerializedTask;
  taskTypes: SerializedTaskType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskModal({ task, taskTypes, open, onOpenChange }: EditTaskModalProps) {
  const router = useRouter();
  const [description, setDescription] = useState(task.description);
  const [taskType, setTaskType] = useState(task.taskType);
  const [costValue, setCostValue] = useState(task.costValue?.toString() ?? '');
  const [costUnit, setCostUnit] = useState(task.costUnit ?? '');
  const [startDate, setStartDate] = useState(
    task.startDate ? task.startDate.slice(0, 10) : ''
  );
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : ''
  );
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  async function handleSubmit() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('taskId', task.id);
      formData.set('description', description);
      formData.set('taskType', taskType);
      formData.set('costValue', costValue);
      formData.set('costUnit', costUnit);
      formData.set('startDate', startDate);
      formData.set('dueDate', dueDate);
      await updateTaskAction(formData);
      onOpenChange(false);
      router.refresh();
    });
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Editar tarea</h2>
            <p className="text-sm text-gray-500 mt-0.5">Modificá los datos de la tarea.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tipo de tarea <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    required
                    className={`${inputCls} bg-white`}
                  >
                    <option value="">Seleccionar tipo...</option>
                    {taskTypes.map((tt) => (
                      <option key={tt.id} value={tt.name}>{tt.name}</option>
                    ))}
                    {taskType && !taskTypes.some((tt) => tt.name === taskType) && (
                      <option value={taskType}>{taskType} (personalizado)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Unidad de costo
                  </label>
                  <select
                    value={costUnit}
                    onChange={(e) => setCostUnit(e.target.value)}
                    className={`${inputCls} bg-white`}
                  >
                    <option value="Fijo">Fijo</option>
                    <option value="por hectárea">Por hectárea</option>
                    <option value="por hora">Por hora</option>
                    <option value="por jornal">Por jornal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Costo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costValue}
                    onChange={(e) => setCostValue(e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fecha límite
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
