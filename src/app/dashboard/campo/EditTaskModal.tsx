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
import { Textarea } from '@/components/dashboard/ui/textarea';
import { updateTaskAction } from './actions';
import type { SerializedTask, SerializedTaskType } from './types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Guardando...' : 'Guardar cambios'}
    </Button>
  );
}

interface EditTaskModalProps {
  task: SerializedTask;
  taskTypes: SerializedTaskType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskModal({ task, taskTypes, open, onOpenChange }: EditTaskModalProps) {
  const [description, setDescription] = useState(task.description);
  const [taskType, setTaskType] = useState(task.taskType);
  const [costValue, setCostValue] = useState(task.costValue?.toString() ?? '');
  const [costUnit, setCostUnit] = useState(task.costUnit ?? '');
  const [startDate, setStartDate] = useState(
    task.startDate ? task.startDate.slice(0, 16) : ''
  );
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 16) : ''
  );

  async function handleSubmit(formData: FormData) {
    formData.set('taskId', task.id);
    formData.set('description', description);
    formData.set('taskType', taskType);
    formData.set('costValue', costValue);
    formData.set('costUnit', costUnit);
    formData.set('startDate', startDate);
    formData.set('dueDate', dueDate);

    await updateTaskAction(formData);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
          <DialogDescription>
            Modificá los datos de la tarea.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-task-desc">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="edit-task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={2}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-task-type">
                Tipo de tarea <span className="text-red-500">*</span>
              </Label>
              <select
                id="edit-task-type"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar tipo...</option>
                {taskTypes.map((tt) => (
                  <option key={tt.id} value={tt.name}>
                    {tt.name}
                  </option>
                ))}
                {/* Keep current value even if not in list */}
                {taskType && !taskTypes.some((tt) => tt.name === taskType) && (
                  <option value={taskType}>{taskType} (personalizado)</option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-cost-unit">Unidad de costo</Label>
              <Input
                id="edit-task-cost-unit"
                value={costUnit}
                onChange={(e) => setCostUnit(e.target.value)}
                placeholder="Ej: por hectárea, por hora..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-cost">Costo</Label>
              <Input
                id="edit-task-cost"
                type="number"
                min="0"
                step="0.01"
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-start">Fecha inicio</Label>
              <Input
                id="edit-task-start"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-due">Fecha límite</Label>
              <Input
                id="edit-task-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
