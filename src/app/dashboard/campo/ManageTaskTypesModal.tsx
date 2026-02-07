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
import { Settings, Trash2 } from 'lucide-react';
import { createTaskTypeAction, deleteTaskTypeAction } from './actions';
import type { SerializedTaskType } from './types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm" className="bg-green-600 hover:bg-green-700">
      {pending ? 'Creando...' : 'Crear'}
    </Button>
  );
}

interface ManageTaskTypesModalProps {
  taskTypes: SerializedTaskType[];
}

export function ManageTaskTypesModal({ taskTypes }: ManageTaskTypesModalProps) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState('#22c55e');
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    formData.set('color', color);
    await createTaskTypeAction(formData);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteTaskTypeAction(id);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings className="h-3.5 w-3.5" />
          Tipos de tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Administrar tipos de tarea</DialogTitle>
          <DialogDescription>
            Los tipos de tarea se usan para categorizar y filtrar las tareas de tus lotes.
          </DialogDescription>
        </DialogHeader>

        {/* Existing types */}
        {taskTypes.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {taskTypes.map((tt) => (
              <div
                key={tt.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-4 w-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: tt.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{tt.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deleting === tt.id}
                  onClick={() => handleDelete(tt.id)}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {taskTypes.length === 0 && (
          <p className="text-sm text-gray-400 italic text-center py-4">
            No hay tipos creados todavía.
          </p>
        )}

        {/* Create new type */}
        <form action={handleCreate} className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium text-gray-700">Nuevo tipo de tarea</p>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="tt-name" className="text-xs">
                Nombre
              </Label>
              <Input
                id="tt-name"
                name="name"
                required
                placeholder="Ej: Fumigación, Poda..."
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tt-color" className="text-xs">
                Color
              </Label>
              <input
                id="tt-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 rounded-md border border-gray-300 cursor-pointer"
              />
            </div>
            <SubmitButton />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
