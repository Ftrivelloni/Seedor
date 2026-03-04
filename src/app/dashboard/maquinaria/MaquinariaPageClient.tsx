'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  SlidersHorizontal,
  ArrowUpDown,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/dashboard/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import { CreateMachineModal } from './CreateMachineModal';
import {
  serviceStatusConfig,
  formatCurrency,
  formatNumber,
  formatDate,
} from './types';
import type { SerializedMachine, ServiceStatus } from './types';

/* ── Helpers ── */

function getStatusIcon(status: ServiceStatus) {
  switch (status) {
    case 'NORMAL':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'SERVICE_SOON':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case 'SERVICE_OVERDUE':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
  }
}

function getRowClassName(status: ServiceStatus) {
  switch (status) {
    case 'SERVICE_SOON':
      return 'bg-amber-50/50 hover:bg-amber-50';
    case 'SERVICE_OVERDUE':
      return 'bg-red-50/50 hover:bg-red-50';
    default:
      return 'hover:bg-gray-50';
  }
}

type SortOption = 'name' | 'acquisitionDate' | 'totalCost' | 'hourMeter';

/* ── Component ── */

interface MaquinariaPageClientProps {
  machines: SerializedMachine[];
}

export function MaquinariaPageClient({ machines }: MaquinariaPageClientProps) {
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Unique values for filters
  const locations = useMemo(
    () => [...new Set(machines.map((m) => m.location).filter(Boolean))] as string[],
    [machines],
  );
  const types = useMemo(
    () => [...new Set(machines.map((m) => m.type))],
    [machines],
  );

  // Filtered & sorted
  const filtered = useMemo(() => {
    let result = machines;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.location?.toLowerCase().includes(q),
      );
    }

    if (filterLocation !== 'all') {
      result = result.filter((m) => m.location === filterLocation);
    }
    if (filterType !== 'all') {
      result = result.filter((m) => m.type === filterType);
    }
    if (filterStatus !== 'all') {
      result = result.filter((m) => m.serviceStatus === filterStatus);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'acquisitionDate':
          return (
            new Date(b.acquisitionDate ?? 0).getTime() -
            new Date(a.acquisitionDate ?? 0).getTime()
          );
        case 'totalCost':
          return b.totalCost - a.totalCost;
        case 'hourMeter':
          return b.hourMeter - a.hourMeter;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [machines, search, filterLocation, filterType, filterStatus, sortBy]);

  const normalCount = machines.filter((m) => m.serviceStatus === 'NORMAL').length;
  const soonCount = machines.filter((m) => m.serviceStatus === 'SERVICE_SOON').length;
  const overdueCount = machines.filter((m) => m.serviceStatus === 'SERVICE_OVERDUE').length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maquinaria</h1>
          <p className="text-sm text-gray-600">
            Gestión de equipos, uso y mantenimientos
          </p>
        </div>
        <CreateMachineModal />
      </header>

      {/* ── KPI cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Total máquinas</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{machines.length}</p>
        </article>
        <article className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Normal</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{normalCount}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Service próximo</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{soonCount}</p>
        </article>
        <article className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Service atrasado</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{overdueCount}</p>
        </article>
      </section>

      {/* ── Filters & Sort ── */}
      <section className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar máquina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ubicaciones</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="SERVICE_SOON">Próximo</SelectItem>
              <SelectItem value="SERVICE_OVERDUE">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="acquisitionDate">Fecha de adquisición</SelectItem>
              <SelectItem value="totalCost">Mayor gasto</SelectItem>
              <SelectItem value="hourMeter">Mayor horas de uso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <p className="text-sm text-gray-500">
        Mostrando {filtered.length} de {machines.length} máquinas
      </p>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12">
          <Truck className="h-10 w-10 text-gray-300" />
          <h3 className="mt-4 text-base font-medium text-gray-900">Sin máquinas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {machines.length === 0
              ? 'Registrá tu primera máquina para empezar.'
              : 'No se encontraron máquinas con los filtros aplicados.'}
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-14 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Máquina
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ubicación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Antigüedad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Último Service
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Gasto Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Contahoras
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((machine) => {
                  const statusCfg = serviceStatusConfig[machine.serviceStatus];
                  return (
                    <tr key={machine.id} className={getRowClassName(machine.serviceStatus)}>
                      <td className="px-4 py-3">
                        {machine.imageUrl ? (
                          <Image
                            src={machine.imageUrl}
                            alt={machine.type}
                            width={48}
                            height={48}
                            className="rounded-lg object-contain"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                            <Truck className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/maquinaria/${machine.id}`}
                          className="hover:underline"
                        >
                          <p className="text-sm font-medium text-gray-900">{machine.name}</p>
                          {machine.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {machine.description}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-gray-100 text-gray-700 border-0">
                          {machine.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {machine.location || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {machine.acquisitionDate
                          ? `${formatNumber(machine.antiquityYears)} años`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {machine.lastServiceAt ? formatDate(machine.lastServiceAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(machine.totalCost)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatNumber(machine.hourMeter)} hs
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {getStatusIcon(machine.serviceStatus)}
                          <Badge className={`${statusCfg.badgeClass} border-0`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
