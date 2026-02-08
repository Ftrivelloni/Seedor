'use client';

import { useMemo, useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskStatus } from '@prisma/client';
import { MoreHorizontal, Pencil, Check } from 'lucide-react';
import {
  createInlineSubtaskAction,
  toggleSubtaskStatusAction,
} from '@/app/dashboard/campo/actions';

/* ── Types ── */

export type SubtaskCardData = {
  id: string;
  description: string;
  status: string;
};

export type TaskCardData = {
  id: string;
  description: string;
  taskType: string;
  taskTypeColor?: string;
  dueDate: string;
  status: TaskStatus;
  lots: string[];
  workers: string[];
  isComposite: boolean;
  subtaskProgress: number;
  subtasks: SubtaskCardData[];
};

type Props = {
  tasks: TaskCardData[];
  onEditTask?: (taskId: string) => void;
};

const columns: Array<{ key: TaskStatus; label: string; dotColor: string }> = [
  { key: 'PENDING', label: 'Pendiente', dotColor: 'bg-yellow-400' },
  { key: 'IN_PROGRESS', label: 'En progreso', dotColor: 'bg-blue-400' },
  { key: 'COMPLETED', label: 'Completada', dotColor: 'bg-green-400' },
  { key: 'LATE', label: 'Atrasada', dotColor: 'bg-red-400' },
];

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  LATE: 'bg-red-100 text-red-800',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  LATE: 'Atrasada',
};

/* ── Worker initials circle ── */
function WorkerAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 ring-2 ring-white"
      title={name}
    >
      {initials}
    </span>
  );
}

/* ── Inline subtask input ── */
function InlineSubtaskInput({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleAdd() {
    const desc = value.trim();
    if (!desc) return;
    startTransition(async () => {
      await createInlineSubtaskAction(taskId, desc);
      setValue('');
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder="Agregar subtarea..."
        disabled={isPending}
        className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/30 disabled:opacity-50"
      />
      {value.trim() && (
        <button
          onClick={handleAdd}
          disabled={isPending}
          className="shrink-0 rounded-md bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '...' : 'Agregar'}
        </button>
      )}
    </div>
  );
}

/* ── Subtask checkbox row ── */
function SubtaskRow({ subtask }: { subtask: SubtaskCardData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isCompleted = subtask.status === 'COMPLETED';

  function handleToggle() {
    startTransition(async () => {
      await toggleSubtaskStatusAction(subtask.id);
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`shrink-0 flex h-4 w-4 items-center justify-center rounded border transition-colors ${
          isCompleted
            ? 'bg-green-600 border-green-600 text-white'
            : 'border-gray-300 bg-white hover:border-green-400'
        } ${isPending ? 'opacity-50' : ''}`}
      >
        {isCompleted && <Check className="h-2.5 w-2.5" />}
      </button>
      <span
        className={`text-xs ${
          isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
        }`}
      >
        {subtask.description}
      </span>
    </label>
  );
}

/* ── Card context menu ── */
function CardMenu({ onEdit }: { onEdit: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar tarea
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main component ── */

export function TaskKanbanBoard({ tasks, onEditTask }: Props) {
  const router = useRouter();
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [taskState, setTaskState] = useState(tasks);
  const [error, setError] = useState<string | null>(null);

  // Keep taskState in sync when parent re-renders with new tasks
  useMemo(() => {
    setTaskState(tasks);
  }, [tasks]);

  const grouped = useMemo(() => {
    return columns.reduce<Record<TaskStatus, TaskCardData[]>>(
      (acc, column) => {
        acc[column.key] = taskState.filter((task) => task.status === column.key);
        return acc;
      },
      { PENDING: [], IN_PROGRESS: [], COMPLETED: [], LATE: [] }
    );
  }, [taskState]);

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setError(null);
    const previous = taskState;
    setTaskState((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task))
    );

    const response = await fetch(`/api/campo/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setTaskState(previous);
      const payload = (await response
        .json()
        .catch(() => ({ error: 'No se pudo mover la tarea.' }))) as {
        error?: string;
      };
      setError(payload.error || 'No se pudo mover la tarea.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <section
            key={column.key}
            className="rounded-xl border border-gray-200 bg-gray-50/80 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!dragTaskId) return;
              void updateTaskStatus(dragTaskId, column.key);
              setDragTaskId(null);
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${column.dotColor}`} />
              <h3 className="text-sm font-semibold text-gray-800">{column.label}</h3>
              <span className="ml-auto text-xs text-gray-400">
                {grouped[column.key].length}
              </span>
            </div>

            <div className="space-y-2.5">
              {grouped[column.key].map((task) => {
                const completedSubs = task.subtasks.filter(
                  (s) => s.status === 'COMPLETED'
                ).length;
                const totalSubs = task.subtasks.length;
                const progressPct =
                  totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;

                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() => setDragTaskId(task.id)}
                    className="cursor-grab rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    {/* Top row: badges + menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            backgroundColor: task.taskTypeColor
                              ? `${task.taskTypeColor}20`
                              : '#f3f4f6',
                            color: task.taskTypeColor || '#374151',
                          }}
                        >
                          {task.taskType}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            statusBadge[task.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {statusLabel[task.status] || task.status}
                        </span>
                      </div>
                      {onEditTask && (
                        <CardMenu onEdit={() => onEditTask(task.id)} />
                      )}
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-sm font-medium text-gray-900 leading-snug">
                      {task.description}
                    </p>

                    {/* Due date */}
                    <p className="mt-1 text-xs text-gray-500">
                      Vence:{' '}
                      {new Date(task.dueDate).toLocaleDateString('es-AR')}
                    </p>

                    {/* Worker avatars */}
                    {task.workers.length > 0 && (
                      <div className="mt-2 flex items-center -space-x-1.5">
                        {task.workers.slice(0, 4).map((w, i) => (
                          <WorkerAvatar key={i} name={w} />
                        ))}
                        {task.workers.length > 4 && (
                          <span className="ml-2 text-[10px] text-gray-400">
                            +{task.workers.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Subtask progress */}
                    {totalSubs > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                          <span>Subtareas</span>
                          <span className="font-medium">
                            {completedSubs}/{totalSubs} completadas
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Subtask list */}
                    {totalSubs > 0 && (
                      <div className="mt-2 space-y-1">
                        {task.subtasks.map((sub) => (
                          <SubtaskRow key={sub.id} subtask={sub} />
                        ))}
                      </div>
                    )}

                    {/* Inline add subtask */}
                    <InlineSubtaskInput taskId={task.id} />
                  </article>
                );
              })}

              {grouped[column.key].length === 0 && (
                <p className="py-6 text-center text-xs text-gray-400">
                  Sin tareas
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
