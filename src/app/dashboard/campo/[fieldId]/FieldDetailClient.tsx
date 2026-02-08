'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Grid3X3,
  List,
  Search,
  Wheat,
  MapPin,
  Calculator,
  Filter,
} from 'lucide-react';
import { StateCard } from '@/components/dashboard/StateCard';
import { CreateLotModal } from '../CreateLotModal';
import { ManageTaskTypesModal } from '../ManageTaskTypesModal';
import type { SerializedField, SerializedLot, SerializedTaskType, SerializedCropType, LotViewMode } from '../types';

interface FieldDetailClientProps {
  field: SerializedField;
  taskTypes: SerializedTaskType[];
  cropTypes: SerializedCropType[];
}

/**
 * Compute the recency color for a lot given a selected task type.
 * Green: <=14 days, Yellow: 15-30 days, Red: >30 days or never.
 */
function getRecencyColor(lot: SerializedLot, taskTypeName: string | null): string | null {
  if (!taskTypeName) return null;
  const dateStr = lot.taskRecency[taskTypeName];
  if (!dateStr) return 'border-red-400 bg-red-50/40'; // never done

  const diff = Date.now() - new Date(dateStr).getTime();
  const days = diff / (1000 * 60 * 60 * 24);

  if (days <= 14) return 'border-green-400 bg-green-50/40';
  if (days <= 30) return 'border-yellow-400 bg-yellow-50/40';
  return 'border-red-400 bg-red-50/40';
}

function getRecencyDot(lot: SerializedLot, taskTypeName: string | null): string | null {
  if (!taskTypeName) return null;
  const dateStr = lot.taskRecency[taskTypeName];
  if (!dateStr) return 'bg-red-500';

  const diff = Date.now() - new Date(dateStr).getTime();
  const days = diff / (1000 * 60 * 60 * 24);

  if (days <= 14) return 'bg-green-500';
  if (days <= 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function FieldDetailClient({ field, taskTypes, cropTypes }: FieldDetailClientProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<LotViewMode>('grid-large');
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);

  const totalHectares = field.lots.reduce((acc, l) => acc + l.areaHectares, 0);
  const totalCost = field.lots.reduce((acc, l) => acc + l.taskCost, 0);
  const totalKilos = field.lots.reduce((acc, l) => acc + l.totalHarvestKilos, 0);

  const filteredLots = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return field.lots;
    return field.lots.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.productionType.toLowerCase().includes(q) ||
        (l.plantedFruitsDescription?.toLowerCase().includes(q) ?? false)
    );
  }, [field.lots, search]);

  const selectedTT = taskTypes.find((tt) => tt.name === selectedTaskType);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <header>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/campo" className="hover:text-green-700 transition-colors">
            Campo
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">{field.name}</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{field.name}</h1>
            <p className="text-sm text-gray-600">
              {field.location || 'Sin ubicación definida'}
              {field.description ? ` · ${field.description}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/campo"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </Link>
            <ManageTaskTypesModal taskTypes={taskTypes} />
            <CreateLotModal fieldId={field.id} fieldName={field.name} cropTypes={cropTypes} />
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StateCard title="Lotes" value={field.lots.length} icon={Layers} iconColor="text-green-600" />
        <StateCard
          title="Superficie total"
          value={`${totalHectares.toLocaleString('es-AR')} ha`}
          icon={MapPin}
          iconColor="text-blue-600"
        />
        <StateCard
          title="Costo acumulado"
          value={`$ ${totalCost.toLocaleString('es-AR')}`}
          icon={Calculator}
          iconColor="text-amber-600"
        />
        <StateCard
          title="Cosecha total"
          value={`${totalKilos.toLocaleString('es-AR')} kg`}
          icon={Wheat}
          iconColor="text-emerald-600"
        />
      </section>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
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

          {/* Task-type color filter */}
          {taskTypes.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedTaskType ?? ''}
                onChange={(e) => setSelectedTaskType(e.target.value || null)}
                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Filtrar por tipo de tarea</option>
                {taskTypes.map((tt) => (
                  <option key={tt.id} value={tt.name}>
                    {tt.name}
                  </option>
                ))}
              </select>
              {selectedTaskType && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                    ≤14d
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    15-30d
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                    &gt;30d / nunca
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
          />
        </div>
      </div>

      {/* Lots */}
      {filteredLots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Layers className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {search ? 'Sin resultados' : 'Sin lotes'}
          </h3>
          <p className="mt-2 text-center text-sm text-gray-500">
            {search
              ? 'Intentá con otro término de búsqueda.'
              : 'Agregá tu primer lote para este campo.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {selectedTaskType && (
                  <th className="px-2 py-3 w-8" />
                )}
                <th className="px-4 py-3 text-left font-medium text-gray-600">Lote</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Producción</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Hectáreas</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Cosecha (kg)</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Costo tareas</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  {selectedTaskType ? `Última ${selectedTaskType}` : 'Última tarea'}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLots.map((lot) => {
                const dot = getRecencyDot(lot, selectedTaskType);
                const recencyDate = selectedTaskType
                  ? lot.taskRecency[selectedTaskType]
                  : lot.lastTaskAt;
                return (
                  <tr key={lot.id} className="hover:bg-gray-50">
                    {selectedTaskType && (
                      <td className="px-2 py-3">
                        <span className={`inline-block h-3 w-3 rounded-full ${dot}`} />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/campo/${field.id}/${lot.id}`}
                        className="font-medium text-gray-900 hover:text-green-700"
                      >
                        {lot.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lot.productionType}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{lot.areaHectares}</td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {lot.totalHarvestKilos.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      $ {lot.taskCost.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {recencyDate
                        ? new Date(recencyDate).toLocaleDateString('es-AR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/campo/${field.id}/${lot.id}`}
                        className="rounded p-1.5 text-gray-400 hover:text-green-700 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className={`grid gap-3 ${
            viewMode === 'grid-large'
              ? 'sm:grid-cols-2 xl:grid-cols-3'
              : 'sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
          }`}
        >
          {filteredLots.map((lot) => (
            <LotCard
              key={lot.id}
              lot={lot}
              fieldId={field.id}
              size={viewMode === 'grid-large' ? 'large' : 'medium'}
              selectedTaskType={selectedTaskType}
              taskTypeColor={selectedTT?.color ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Lot Card ── */

function LotCard({
  lot,
  fieldId,
  size,
  selectedTaskType,
  taskTypeColor,
}: {
  lot: SerializedLot;
  fieldId: string;
  size: 'large' | 'medium';
  selectedTaskType: string | null;
  taskTypeColor: string | null;
}) {
  const recencyBorder = getRecencyColor(lot, selectedTaskType);

  return (
    <Link
      href={`/dashboard/campo/${fieldId}/${lot.id}`}
      className={`group rounded-xl border-2 bg-white hover:shadow-sm transition-all ${
        recencyBorder ?? 'border-gray-200 hover:border-green-300'
      } ${size === 'large' ? 'p-5' : 'p-3'}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center rounded-lg bg-green-100 text-green-700 group-hover:bg-green-200 transition-colors ${
            size === 'large' ? 'h-12 w-12' : 'h-9 w-9'
          }`}
        >
          <Layers className={size === 'large' ? 'h-6 w-6' : 'h-4 w-4'} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold text-gray-900 truncate ${
              size === 'large' ? 'text-base' : 'text-sm'
            }`}
          >
            {lot.name}
          </p>
          <p className="text-xs text-gray-500 truncate">{lot.productionType}</p>
        </div>
        {selectedTaskType && (
          <span className={`inline-block h-3 w-3 rounded-full shrink-0 ${getRecencyDot(lot, selectedTaskType)}`} />
        )}
      </div>

      {size === 'large' && (
        <>
          {lot.plantedFruitsDescription && (
            <p className="mt-2 text-xs text-gray-500 line-clamp-2">
              {lot.plantedFruitsDescription}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-gray-50 p-2.5">
              <span className="text-gray-400 block">Superficie</span>
              <p className="font-semibold text-gray-900">{lot.areaHectares} ha</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5">
              <span className="text-gray-400 block">
                {selectedTaskType ? `Última ${selectedTaskType}` : 'Última tarea'}
              </span>
              <p className="font-semibold text-gray-900">
                {selectedTaskType
                  ? (lot.taskRecency[selectedTaskType]
                      ? new Date(lot.taskRecency[selectedTaskType]).toLocaleDateString('es-AR')
                      : 'Nunca')
                  : (lot.lastTaskAt
                      ? new Date(lot.lastTaskAt).toLocaleDateString('es-AR')
                      : '—')}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5">
              <span className="text-gray-400 block">Cosecha</span>
              <p className="font-semibold text-gray-900">
                {lot.totalHarvestKilos.toLocaleString('es-AR')} kg
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5">
              <span className="text-gray-400 block">Costo tareas</span>
              <p className="font-semibold text-gray-900">
                $ {lot.taskCost.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </>
      )}

      {size === 'medium' && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{lot.areaHectares} ha</span>
          <span>{lot.totalHarvestKilos.toLocaleString('es-AR')} kg</span>
        </div>
      )}
    </Link>
  );
}
