'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskStatus } from '@prisma/client';

type TaskCardData = {
  id: string;
  description: string;
  taskType: string;
  dueDate: string;
  status: TaskStatus;
  lots: string[];
  workers: string[];
  isComposite: boolean;
  subtaskProgress: number;
};

type Props = {
  tasks: TaskCardData[];
};

const columns: Array<{ key: TaskStatus; label: string }> = [
  { key: 'PENDING', label: 'Pendiente' },
  { key: 'IN_PROGRESS', label: 'En progreso' },
  { key: 'COMPLETED', label: 'Completada' },
  { key: 'LATE', label: 'Atrasada' },
];

export function TaskKanbanBoard({ tasks }: Props) {
  const router = useRouter();
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [taskState, setTaskState] = useState(tasks);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return columns.reduce<Record<TaskStatus, TaskCardData[]>>(
      (acc, column) => {
        acc[column.key] = taskState.filter((task) => task.status === column.key);
        return acc;
      },
      {
        PENDING: [],
        IN_PROGRESS: [],
        COMPLETED: [],
        LATE: [],
      }
    );
  }, [taskState]);

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setError(null);

    const previous = taskState;
    setTaskState((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
            }
          : task
      )
    );

    const response = await fetch(`/api/campo/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setTaskState(previous);
      const payload = (await response.json().catch(() => ({ error: 'No se pudo mover la tarea.' }))) as {
        error?: string;
      };
      setError(payload.error || 'No se pudo mover la tarea.');
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <section
            key={column.key}
            className="rounded-xl border border-gray-200 bg-gray-50 p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!dragTaskId) return;
              void updateTaskStatus(dragTaskId, column.key);
              setDragTaskId(null);
            }}
          >
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              {column.label} ({grouped[column.key].length})
            </h3>

            <div className="space-y-2">
              {grouped[column.key].map((task) => (
                <article
                  key={task.id}
                  draggable
                  onDragStart={() => setDragTaskId(task.id)}
                  className="cursor-grab rounded-lg border border-gray-200 bg-white p-3 active:cursor-grabbing"
                >
                  <p className="text-sm font-medium text-gray-900">{task.description}</p>
                  <p className="mt-1 text-xs text-gray-500">{task.taskType}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Vence: {new Date(task.dueDate).toLocaleDateString('es-AR')}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Lotes: {task.lots.join(', ') || 'Sin lote'}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Trabajadores: {task.workers.join(', ') || 'Sin asignar'}
                  </p>
                  {task.isComposite ? (
                    <p className="mt-2 text-xs font-medium text-blue-700">
                      Progreso subtareas: {task.subtaskProgress}%
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
