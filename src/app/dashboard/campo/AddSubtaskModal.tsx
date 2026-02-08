'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { createSubtaskAction } from './actions';
import type { SerializedTask, SerializedTaskType } from './types';

interface AddSubtaskModalProps {
  parentTask: SerializedTask;
  taskTypes: SerializedTaskType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSubtaskModal({
  parentTask,
  taskTypes,
  open,
  onOpenChange,
}: AddSubtaskModalProps) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState(parentTask.taskType);
  const [costValue, setCostValue] = useState('');
  const [costUnit, setCostUnit] = useState('');
  const [dueDate, setDueDate] = useState(
    parentTask.dueDate ? parentTask.dueDate.slice(0, 10) : ''
  );
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  async function handleSubmit() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('parentTaskId', parentTask.id);
      formData.set('description', description);
      formData.set('taskType', taskType);
      formData.set('costValue', costValue);
      formData.set('costUnit', costUnit);
      formData.set('dueDate', dueDate);
      await createSubtaskAction(formData);
      onOpenChange(false);
      setDescription('');
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
            <h2 className="text-lg font-semibold text-gray-900">Agregar subtarea</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Se creará como subtarea de: <span className="font-medium">{parentTask.description}</span>
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Describe la subtarea..."
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className={`${inputCls} bg-white`}
                  >
                    <option value="">Heredar del padre</option>
                    {taskTypes.map((tt) => (
                      <option key={tt.id} value={tt.name}>{tt.name}</option>
                    ))}
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
                    Unidad de costo
                  </label>
                  <select
                    value={costUnit}
                    onChange={(e) => setCostUnit(e.target.value)}
                    className={`${inputCls} bg-white`}
                  >
                    <option value="">Sin unidad</option>
                    <option value="Fijo">Fijo</option>
                    <option value="por hectárea">Por hectárea</option>
                    <option value="por hora">Por hora</option>
                    <option value="por jornal">Por jornal</option>
                  </select>
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
                  disabled={isPending || !description.trim()}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Creando...' : 'Crear subtarea'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
