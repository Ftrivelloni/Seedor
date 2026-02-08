'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Wheat,
  BarChart3,
  Layers,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { StateCard } from '@/components/dashboard/StateCard';
import { TaskKanbanBoard } from '@/components/dashboard/TaskKanbanBoard';
import type { SubtaskCardData } from '@/components/dashboard/TaskKanbanBoard';
import { CreateTaskModal } from '../../CreateTaskModal';
import { EditTaskModal } from '../../EditTaskModal';
import { CreateHarvestModal } from '../../CreateHarvestModal';
import type {
  SerializedField,
  SerializedLot,
  SerializedTask,
  SerializedHarvest,
  SerializedWorker,
  SerializedInventoryItem,
  SerializedWarehouse,
  SerializedTaskType,
} from '../../types';
import { taskStatusColors, taskStatusLabels } from '../../types';

interface LotDetailClientProps {
  field: SerializedField;
  lot: SerializedLot;
  tasks: SerializedTask[];
  harvests: SerializedHarvest[];
  workers: SerializedWorker[];
  inventoryItems: SerializedInventoryItem[];
  warehouses: SerializedWarehouse[];
  taskTypes: SerializedTaskType[];
}

export function LotDetailClient({
  field,
  lot,
  tasks,
  harvests,
  workers,
  inventoryItems,
  warehouses,
  taskTypes,
}: LotDetailClientProps) {
  const [activeTab, setActiveTab] = useState('tareas');
  const [editingTask, setEditingTask] = useState<SerializedTask | null>(null);

  const parentTasks = tasks.filter((t) => !t.parentTaskId);
  const activeTasks = parentTasks.filter((t) =>
    ['PENDING', 'IN_PROGRESS', 'LATE'].includes(t.status)
  ).length;

  const totalTaskCost = tasks.reduce((acc, t) => acc + Number(t.costValue || 0), 0);
  const totalHarvestKilos = harvests.reduce((acc, h) => acc + h.kilos, 0);

  // Build kanban tasks with subtask data
  const kanbanTasks = useMemo(() => {
    return parentTasks.map((t) => {
      // Use actual subtask records from the DB
      const subtasks: SubtaskCardData[] = (t.subtasks || []).map((s) => ({
        id: s.id,
        description: s.description,
        status: s.status,
      }));
      const ttColor = taskTypes.find((tt) => tt.name === t.taskType)?.color;
      return {
        id: t.id,
        description: t.description,
        taskType: t.taskType,
        taskTypeColor: ttColor,
        dueDate: t.dueDate,
        status: t.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'LATE',
        lots: t.lots,
        workers: t.workers,
        isComposite: t.isComposite,
        subtaskProgress: t.subtaskProgress,
        subtasks,
      };
    });
  }, [parentTasks, tasks, taskTypes]);

  function handleEditTask(taskId: string) {
    const t = tasks.find((t) => t.id === taskId);
    if (t) setEditingTask(t);
  }

  // Harvest data grouped by crop
  const harvestByCrop = harvests.reduce<Record<string, number>>((acc, h) => {
    acc[h.cropType] = (acc[h.cropType] || 0) + h.kilos;
    return acc;
  }, {});

  // Cost by task type
  const costByTaskType = tasks.reduce<Record<string, number>>((acc, t) => {
    if (t.costValue) {
      acc[t.taskType] = (acc[t.taskType] || 0) + t.costValue;
    }
    return acc;
  }, {});

  const tabs = [
    { key: 'tareas', label: 'Tareas', icon: ClipboardList, badge: activeTasks || undefined },
    { key: 'cosecha', label: 'Cosecha', icon: Wheat },
    { key: 'rendimiento', label: 'Rendimiento', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <header>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/campo" className="hover:text-green-700 transition-colors">
            Campo
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/dashboard/campo/${field.id}`}
            className="hover:text-green-700 transition-colors"
          >
            {field.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">{lot.name}</span>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{lot.name}</h1>
              <p className="text-sm text-gray-600">
                {lot.productionType} · {lot.areaHectares} ha
                {lot.plantedFruitsDescription
                  ? ` · ${lot.plantedFruitsDescription}`
                  : ''}
                {lot.crops && lot.crops.length > 0 && (
                  <span className="ml-1">· Cultivos: {lot.crops.join(', ')}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/campo/${field.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </Link>
            <CreateHarvestModal
              fields={[{ ...field, lots: [lot] }]}
              preselectedLotId={lot.id}
            />
            <CreateTaskModal
              fields={[{ ...field, lots: [lot] }]}
              workers={workers}
              inventoryItems={inventoryItems}
              warehouses={warehouses}
              taskTypes={taskTypes}
              preselectedLotId={lot.id}
            />
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StateCard
          title="Tareas activas"
          value={activeTasks}
          icon={ClipboardList}
          iconColor="text-amber-600"
        />
        <StateCard
          title="Costo acumulado"
          value={`$ ${totalTaskCost.toLocaleString('es-AR')}`}
          icon={DollarSign}
          iconColor="text-red-600"
        />
        <StateCard
          title="Cosecha total"
          value={`${totalHarvestKilos.toLocaleString('es-AR')} kg`}
          icon={Wheat}
          iconColor="text-emerald-600"
        />
        <StateCard
          title="Rendimiento"
          value={
            lot.areaHectares > 0
              ? `${(totalHarvestKilos / lot.areaHectares).toLocaleString('es-AR', {
                  maximumFractionDigits: 0,
                })} kg/ha`
              : '—'
          }
          icon={TrendingUp}
          iconColor="text-blue-600"
        />
      </section>

      {/* Custom Tabs */}
      <div>
        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge ? (
                  <span className="ml-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {/* ── TAB: Tareas ── */}
          {activeTab === 'tareas' && (
            <>
              {parentTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <ClipboardList className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Sin tareas</h3>
                  <p className="mt-2 text-center text-sm text-gray-500">
                    Creá la primera tarea para este lote.
                  </p>
                </div>
              ) : (
                <TaskKanbanBoard
                  tasks={kanbanTasks}
                  onEditTask={handleEditTask}
                />
              )}
            </>
          )}

          {/* ── TAB: Cosecha ── */}
          {activeTab === 'cosecha' && (
            <div className="space-y-4">
              {harvests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Wheat className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Sin cosechas</h3>
                  <p className="mt-2 text-center text-sm text-gray-500">
                    Registrá la primera cosecha de este lote.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary by crop */}
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(harvestByCrop).map(([crop, kilos]) => (
                      <article
                        key={crop}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                          {crop}
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-emerald-900">
                          {kilos.toLocaleString('es-AR')} kg
                        </p>
                      </article>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-3 text-left font-medium text-gray-600">
                            Cultivo
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">
                            Kilos
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">
                            Fecha
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {harvests.map((h) => (
                          <tr key={h.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {h.cropType}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 font-medium">
                              {h.kilos.toLocaleString('es-AR')} kg
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {new Date(h.harvestDate).toLocaleDateString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB: Rendimiento ── */}
          {activeTab === 'rendimiento' && (
            <div className="space-y-4">
              {/* Performance dashboard */}
              <div className="grid gap-4 xl:grid-cols-2">
                {/* Cost breakdown */}
                <article className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Costos por tipo de tarea
                  </h3>
                  {Object.keys(costByTaskType).length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Sin costos registrados.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(costByTaskType)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, cost]) => {
                          const pct =
                            totalTaskCost > 0 ? (cost / totalTaskCost) * 100 : 0;
                          return (
                            <div key={type}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-700">{type}</span>
                                <span className="font-medium text-gray-900">
                                  $ {cost.toLocaleString('es-AR')}
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-green-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      <div className="border-t pt-3 flex items-center justify-between text-sm font-semibold">
                        <span className="text-gray-700">Total</span>
                        <span className="text-gray-900">
                          $ {totalTaskCost.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  )}
                </article>

                {/* Harvest breakdown */}
                <article className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Producción por cultivo
                  </h3>
                  {Object.keys(harvestByCrop).length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                      Sin cosechas registradas.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(harvestByCrop)
                        .sort(([, a], [, b]) => b - a)
                        .map(([crop, kilos]) => {
                          const pct =
                            totalHarvestKilos > 0
                              ? (kilos / totalHarvestKilos) * 100
                              : 0;
                          return (
                            <div key={crop}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-700">{crop}</span>
                                <span className="font-medium text-gray-900">
                                  {kilos.toLocaleString('es-AR')} kg
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      <div className="border-t pt-3 flex items-center justify-between text-sm font-semibold">
                        <span className="text-gray-700">Total</span>
                        <span className="text-gray-900">
                          {totalHarvestKilos.toLocaleString('es-AR')} kg
                        </span>
                      </div>
                    </div>
                  )}
                </article>
              </div>

              {/* Summary metrics */}
              <article className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Resumen de rendimiento
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Superficie
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {lot.areaHectares} ha
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Gasto total
                    </p>
                    <p className="mt-1 text-xl font-semibold text-red-700">
                      $ {totalTaskCost.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Cosecha total
                    </p>
                    <p className="mt-1 text-xl font-semibold text-emerald-700">
                      {totalHarvestKilos.toLocaleString('es-AR')} kg
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Costo / kg</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {totalHarvestKilos > 0
                        ? `$ ${(totalTaskCost / totalHarvestKilos).toLocaleString('es-AR', {
                            maximumFractionDigits: 2,
                          })}`
                        : '—'}
                    </p>
                  </div>
                </div>
              </article>

              {/* Task history (read-only, no edit/subtask buttons) */}
              <article className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Historial de tareas
                </h3>
                {parentTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Sin tareas registradas.</p>
                ) : (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                            Tarea
                          </th>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                            Tipo
                          </th>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                            Estado
                          </th>
                          <th className="px-4 py-2.5 text-right font-medium text-gray-600">
                            Costo
                          </th>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                            Fecha límite
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {parentTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-900">{t.description}</td>
                            <td className="px-4 py-2.5 text-gray-600">{t.taskType}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                                  taskStatusColors[t.status] ||
                                  'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {taskStatusLabels[t.status] || t.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-900">
                              {t.costValue
                                ? `$ ${t.costValue.toLocaleString('es-AR')}`
                                : '—'}
                              {t.costUnit && (
                                <span className="text-gray-400 text-xs ml-1">
                                  /{t.costUnit}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">
                              {new Date(t.dueDate).toLocaleDateString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>
          )}
        </div>
      </div>

      {/* Edit task modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          taskTypes={taskTypes}
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
