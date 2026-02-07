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
} from 'lucide-react';
import { Input } from '@/components/dashboard/ui/input';
import { Button } from '@/components/dashboard/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
import { StateCard } from '@/components/dashboard/StateCard';
import { CreateFieldModal } from './CreateFieldModal';
import { CreateHarvestModal } from './CreateHarvestModal';
import { ManageTaskTypesModal } from './ManageTaskTypesModal';
import type {
  SerializedField,
  SerializedHarvest,
  SerializedTaskType,
  LotViewMode,
} from './types';

interface CampoPageClientProps {
  fields: SerializedField[];
  recentHarvests: SerializedHarvest[];
  taskTypes: SerializedTaskType[];
}

export function CampoPageClient({
  fields,
  recentHarvests,
  taskTypes,
}: CampoPageClientProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<LotViewMode>('grid-large');

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
          <ManageTaskTypesModal taskTypes={taskTypes} />
          <CreateHarvestModal fields={fields} />
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
      <Tabs defaultValue="campos" className="w-full">
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="campos" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              Campos y lotes
            </TabsTrigger>
            <TabsTrigger value="cosecha" className="gap-1.5">
              <Wheat className="h-4 w-4" />
              Cosecha
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* TAB: Campos y lotes */}
        <TabsContent value="campos" className="mt-4 space-y-4">
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
        </TabsContent>

        {/* TAB: Cosecha */}
        <TabsContent value="cosecha" className="mt-4 space-y-3">
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
        </TabsContent>
      </Tabs>
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
        <Link href={`/dashboard/campo/${field.id}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
            Ver campo
            <ChevronRight className="h-4 w-4" />
          </Button>
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
          className={`mt-3 grid gap-3 ${
            viewMode === 'grid-large'
              ? 'sm:grid-cols-2 xl:grid-cols-3'
              : 'sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
          }`}
        >
          {field.lots.map((lot) => (
            <Link
              key={lot.id}
              href={`/dashboard/campo/${field.id}/${lot.id}`}
              className={`group rounded-lg border border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50 transition-colors ${
                viewMode === 'grid-large' ? 'p-4' : 'p-3'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center rounded-lg bg-green-100 text-green-700 group-hover:bg-green-200 transition-colors ${
                    viewMode === 'grid-large' ? 'h-10 w-10' : 'h-8 w-8'
                  }`}
                >
                  <Layers className={viewMode === 'grid-large' ? 'h-5 w-5' : 'h-4 w-4'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium text-gray-900 truncate ${
                      viewMode === 'grid-large' ? 'text-sm' : 'text-xs'
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
