'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Map,
  Layers,
  Search,
  LayoutGrid,
  Grid3X3,
  List,
  ChevronRight,
  Wheat,
  MapPin,
  ClipboardList,
  Clock,
  Filter,
  User,
} from 'lucide-react';
import { StateCard } from '@/components/dashboard/StateCard';
import { CreateFieldModal } from './CreateFieldModal';
import { CreateHarvestModal } from './CreateHarvestModal';
import { CreateTaskModal } from './CreateTaskModal';
import { ManageTaskTypesModal } from './ManageTaskTypesModal';
import { ManageCropTypesModal } from './ManageCropTypesModal';
import type {
  SerializedField,
  SerializedHarvest,
  SerializedTaskType,
  SerializedCropType,
  SerializedWorker,
  SerializedInventoryItem,
  SerializedWarehouse,
  SerializedTaskHistory,
  LotViewMode,
} from './types';
import { taskStatusLabels, taskStatusColors } from './types';

interface CampoPageClientProps {
  fields: SerializedField[];
  recentHarvests: SerializedHarvest[];
  taskTypes: SerializedTaskType[];
  cropTypes: SerializedCropType[];
  workers: SerializedWorker[];
  inventoryItems: SerializedInventoryItem[];
  warehouses: SerializedWarehouse[];
  taskHistory: SerializedTaskHistory[];
}

export function CampoPageClient({
  fields,
  recentHarvests,
  taskTypes,
  cropTypes,
  workers,
  inventoryItems,
  warehouses,
  taskHistory,
}: CampoPageClientProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<LotViewMode>('grid-large');
  const [activeTab, setActiveTab] = useState<'campos' | 'cosecha' | 'historial'>('campos');
  const [columnFilters, setColumnFilters] = useState({
    tarea: '',
    tipo: '',
    estado: '',
    lugar: '',
    trabajador: '',
    asignador: '',
    vencimiento: '',
  });

  const totalLots = fields.reduce((acc, f) => acc + f.lots.length, 0);
  const totalHarvestKilos = recentHarvests.reduce((acc, h) => acc + h.kilos, 0);
  const totalHectares = fields.reduce(
    (acc, f) => acc + f.lots.reduce((a, l) => a + l.areaHectares, 0),
    0
  );

  const filteredFields = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return fields;
    return fields
      .map((f) => ({
        ...f,
        lots: f.lots.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.productionType.toLowerCase().includes(q)
        ),
      }))
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.location?.toLowerCase().includes(q) ||
          f.lots.length > 0
      );
  }, [fields, search]);

  const filteredTaskHistory = useMemo(() => {
    const hasFilters = Object.values(columnFilters).some((v) => v.trim());
    if (!hasFilters) return taskHistory;
    return taskHistory.filter((t) => {
      const statusLabel = (taskStatusLabels[t.status] || t.status).toLowerCase();
      const lotsText = t.lots.map((l) => `${l.fieldName} ${l.lotName}`).join(' ').toLowerCase();
      const workersText = t.workers.map((w) => `${w.firstName} ${w.lastName}`).join(' ').toLowerCase();
      const createdBy = (t.createdByName || '').toLowerCase();
      const dueDate = new Date(t.dueDate).toLocaleDateString('es-AR');
      return (
        (!columnFilters.tarea || t.description.toLowerCase().includes(columnFilters.tarea.toLowerCase())) &&
        (!columnFilters.tipo || t.taskType.toLowerCase().includes(columnFilters.tipo.toLowerCase())) &&
        (!columnFilters.estado || statusLabel.includes(columnFilters.estado.toLowerCase())) &&
        (!columnFilters.lugar || lotsText.includes(columnFilters.lugar.toLowerCase())) &&
        (!columnFilters.trabajador || workersText.includes(columnFilters.trabajador.toLowerCase())) &&
        (!columnFilters.asignador || createdBy.includes(columnFilters.asignador.toLowerCase())) &&
        (!columnFilters.vencimiento || dueDate.includes(columnFilters.vencimiento.toLowerCase()))
      );
    });
  }, [taskHistory, columnFilters]);

  const activeFilterCount = Object.values(columnFilters).filter((v) => v.trim()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Campo</h1>
          <p className="text-sm text-gray-600">
            Gestión de campos, lotes, cosecha y rendimiento operativo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ManageCropTypesModal cropTypes={cropTypes} />
          <ManageTaskTypesModal taskTypes={taskTypes} />
          <CreateHarvestModal fields={fields} />
          <CreateTaskModal
            fields={fields}
            workers={workers}
            inventoryItems={inventoryItems}
            warehouses={warehouses}
            taskTypes={taskTypes}
          />
          <CreateFieldModal />
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StateCard title="Campos" value={fields.length} icon={Map} iconColor="text-green-600" />
        <StateCard title="Lotes" value={totalLots} icon={Layers} iconColor="text-blue-600" />
        <StateCard
          title="Superficie total"
          value={`${totalHectares.toLocaleString('es-AR')} ha`}
          icon={MapPin}
          iconColor="text-amber-600"
        />
        <StateCard
          title="Cosecha reciente (kg)"
          value={totalHarvestKilos.toLocaleString('es-AR')}
          icon={Wheat}
          iconColor="text-emerald-600"
        />
      </section>

      {/* Tabs */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('campos')}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'campos'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <MapPin className="h-4 w-4" />
              Campos y lotes
            </button>
            <button
              onClick={() => setActiveTab('cosecha')}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cosecha'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Wheat className="h-4 w-4" />
              Cosecha
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'historial'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <ClipboardList className="h-4 w-4" />
              Historial de tareas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* TAB: Campos y lotes */}
        {activeTab === 'campos' && (
          <div className="mt-4 space-y-4">
            {/* View mode toggles */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 w-fit">
              <button
                onClick={() => setViewMode('grid-large')}
                className={`p-1.5 rounded ${viewMode === 'grid-large' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title="Íconos grandes"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid-medium')}
                className={`p-1.5 rounded ${viewMode === 'grid-medium' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title="Íconos medianos"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title="Lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {filteredFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Map className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Sin campos</h3>
                <p className="mt-2 text-center text-sm text-gray-500">
                  Creá tu primer campo para empezar a organizar la producción.
                </p>
              </div>
            ) : (
              filteredFields.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  viewMode={viewMode}
                />
              ))
            )}
          </div>)}

        {/* TAB: Cosecha */}
        {activeTab === 'cosecha' && (<div className="mt-4 space-y-3">
          {recentHarvests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Wheat className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Sin registros de cosecha</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                Registrá tu primera cosecha para analizar rendimiento y producción.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Cultivo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Campo · Lote</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Kilos</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentHarvests.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{h.cropType}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {h.fieldName} · {h.lotName}
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
          )}
        </div>)}

        {/* TAB: Historial de tareas */}
        {activeTab === 'historial' && (<div className="mt-4 space-y-3">
          {taskHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <ClipboardList className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Sin tareas pendientes</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                No hay tareas pendientes ni atrasadas en este momento.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Tarea</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Campo · Lote</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Trabajador(es)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Asignada por</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Vencimiento</th>
                  </tr>
                  <tr className="border-b bg-gray-50/50">
                    {[
                      { key: 'tarea', placeholder: 'Buscar tarea...' },
                      { key: 'tipo', placeholder: 'Tipo...' },
                      { key: 'estado', placeholder: 'Estado...' },
                      { key: 'lugar', placeholder: 'Campo o lote...' },
                      { key: 'trabajador', placeholder: 'Trabajador...' },
                      { key: 'asignador', placeholder: 'Asignó...' },
                      { key: 'vencimiento', placeholder: 'Fecha...' },
                    ].map(({ key, placeholder }) => (
                      <th key={key} className="px-3 py-2">
                        <input
                          type="text"
                          placeholder={placeholder}
                          value={columnFilters[key as keyof typeof columnFilters]}
                          onChange={(e) => setColumnFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full rounded-md border border-gray-200 bg-white py-1.5 px-2.5 text-xs font-normal text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/30 transition-all"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTaskHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Filter className="h-5 w-5 text-gray-300" />
                          <p>No se encontraron tareas con los filtros aplicados.</p>
                          <button
                            type="button"
                            onClick={() => setColumnFilters({ tarea: '', tipo: '', estado: '', lugar: '', trabajador: '', asignador: '', vencimiento: '' })}
                            className="text-green-600 hover:text-green-700 font-medium text-xs hover:underline"
                          >
                            Limpiar filtros
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTaskHistory.map((t) => {
                      const isOverdue = new Date(t.dueDate) < new Date();
                      return (
                        <tr key={t.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/40' : ''}`}>
                          <td className="px-4 py-3 font-medium text-gray-900">{t.description}</td>
                          <td className="px-4 py-3 text-gray-600">{t.taskType}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${taskStatusColors[t.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                              {t.status === 'LATE' && <Clock className="h-3 w-3" />}
                              {taskStatusLabels[t.status] || t.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {t.lots.length > 0
                              ? t.lots.map((l, i) => (
                                <span key={i}>
                                  {i > 0 && ', '}
                                  <span className="font-medium text-gray-900">{l.fieldName}</span>
                                  {' · '}
                                  {l.lotName}
                                </span>
                              ))
                              : <span className="text-gray-400 italic">Sin lote</span>}
                          </td>
                          <td className="px-4 py-3">
                            {t.workers.length > 0
                              ? t.workers.map((w, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-gray-700">
                                  {i > 0 && ', '}
                                  {w.firstName} {w.lastName}
                                </span>
                              ))
                              : <span className="text-gray-400 italic">Sin asignar</span>}
                          </td>
                          <td className="px-4 py-3">
                            {t.createdByName
                              ? <span className="inline-flex items-center gap-1 text-gray-600"><User className="h-3.5 w-3.5" />{t.createdByName}</span>
                              : <span className="text-gray-400 italic">Sistema</span>}
                          </td>
                          <td className={`px-4 py-3 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(t.dueDate).toLocaleDateString('es-AR')}
                            {isOverdue && (
                              <span className="ml-1.5 text-xs text-red-500 font-normal">Vencida</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>)}
      </div>
    </div>
  );
}

/* ── Field Card ── */

function FieldCard({
  field,
  viewMode,
}: {
  field: SerializedField;
  viewMode: LotViewMode;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/campo/${field.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-green-700 transition-colors"
          >
            {field.name}
          </Link>
          <p className="text-xs text-gray-500">
            {field.location || 'Sin ubicación'} · {field.lots.length} lote(s)
          </p>
        </div>
        <Link
          href={`/dashboard/campo/${field.id}`}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
        >
          Ver campo
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {field.lots.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400 italic">Sin lotes registrados.</p>
      ) : viewMode === 'list' ? (
        <div className="mt-3 divide-y">
          {field.lots.map((lot) => (
            <Link
              key={lot.id}
              href={`/dashboard/campo/${field.id}/${lot.id}`}
              className="flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-700">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{lot.name}</p>
                  <p className="text-xs text-gray-500">{lot.productionType}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{lot.areaHectares} ha</span>
                <span>
                  {lot.lastTaskAt
                    ? new Date(lot.lastTaskAt).toLocaleDateString('es-AR')
                    : 'Sin tareas'}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className={`mt-3 grid gap-3 ${viewMode === 'grid-large'
            ? 'sm:grid-cols-2 xl:grid-cols-3'
            : 'sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
            }`}
        >
          {field.lots.map((lot) => (
            <Link
              key={lot.id}
              href={`/dashboard/campo/${field.id}/${lot.id}`}
              className={`group rounded-lg border border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50 transition-colors ${viewMode === 'grid-large' ? 'p-4' : 'p-3'
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center rounded-lg bg-green-100 text-green-700 group-hover:bg-green-200 transition-colors ${viewMode === 'grid-large' ? 'h-10 w-10' : 'h-8 w-8'
                    }`}
                >
                  <Layers className={viewMode === 'grid-large' ? 'h-5 w-5' : 'h-4 w-4'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium text-gray-900 truncate ${viewMode === 'grid-large' ? 'text-sm' : 'text-xs'
                      }`}
                  >
                    {lot.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{lot.productionType}</p>
                </div>
              </div>
              {viewMode === 'grid-large' && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Superficie</span>
                    <p className="font-medium">{lot.areaHectares} ha</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Última tarea</span>
                    <p className="font-medium">
                      {lot.lastTaskAt
                        ? new Date(lot.lastTaskAt).toLocaleDateString('es-AR')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Cosecha</span>
                    <p className="font-medium">{lot.totalHarvestKilos.toLocaleString('es-AR')} kg</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Costo tareas</span>
                    <p className="font-medium">$ {lot.taskCost.toLocaleString('es-AR')}</p>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
