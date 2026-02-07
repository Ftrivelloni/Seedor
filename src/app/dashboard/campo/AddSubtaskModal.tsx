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
import { createSubtaskAction } from './actions';
import type { SerializedTask, SerializedTaskType } from './types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Creando...' : 'Crear subtarea'}
    </Button>
  );
}

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
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState(parentTask.taskType);

  async function handleSubmit(formData: FormData) {
    formData.set('parentTaskId', parentTask.id);
    formData.set('description', description);
    formData.set('taskType', taskType);

    await createSubtaskAction(formData);
    onOpenChange(false);
    setDescription('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar subtarea</DialogTitle>
          <DialogDescription>
            Se creará como subtarea de: <span className="font-medium">{parentTask.description}</span>
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subtask-desc">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="subtask-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe la subtarea..."
              rows={2}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subtask-type">Tipo</Label>
              <select
                id="subtask-type"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Heredar del padre</option>
                {taskTypes.map((tt) => (
                  <option key={tt.id} value={tt.name}>
                    {tt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtask-cost">Costo</Label>
              <Input
                id="subtask-cost"
                name="costValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtask-cost-unit">Unidad de costo</Label>
              <Input
                id="subtask-cost-unit"
                name="costUnit"
                placeholder="Ej: por hectárea..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtask-due">Fecha límite</Label>
              <Input
                id="subtask-due"
                name="dueDate"
                type="datetime-local"
                defaultValue={parentTask.dueDate ? parentTask.dueDate.slice(0, 16) : ''}
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
