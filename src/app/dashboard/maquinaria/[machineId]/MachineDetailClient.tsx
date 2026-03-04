'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Truck,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Gauge,
  Search,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
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
import { RegisterUsageModal } from './RegisterUsageModal';
import { RegisterServiceModal } from './RegisterServiceModal';
import { RegisterMaintenanceModal } from './RegisterMaintenanceModal';
import {
  serviceStatusConfig,
  movementTypeLabels,
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
} from '../types';
import type {
  SerializedMachine,
  SerializedMachineMovement,
  ServiceStatus,
} from '../types';

/* ── Props ── */

interface MachineDetailClientProps {
  machine: SerializedMachine;
  movements: SerializedMachineMovement[];
  workers: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  inventoryItems: { id: string; code: string; name: string; unit: string }[];
}

/* ── Helpers ── */

function getStatusIcon(status: ServiceStatus) {
  switch (status) {
    case 'NORMAL':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'SERVICE_SOON':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'SERVICE_OVERDUE':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
  }
}

function getServiceBarWidth(
  hoursSince: number,
  intervalHours: number | null,
  daysSince: number,
  intervalDays: number | null,
): number {
  let pctHours = 0;
  let pctDays = 0;
  if (intervalHours && intervalHours > 0) {
    pctHours = Math.min((hoursSince / intervalHours) * 100, 100);
  }
  if (intervalDays && intervalDays > 0) {
    pctDays = Math.min((daysSince / intervalDays) * 100, 100);
  }
  return Math.max(pctHours, pctDays);
}

function getServiceBarColor(status: ServiceStatus): string {
  switch (status) {
    case 'NORMAL':
      return 'bg-green-500';
    case 'SERVICE_SOON':
      return 'bg-amber-500';
    case 'SERVICE_OVERDUE':
      return 'bg-red-500';
  }
}

/* ── Component ── */

export function MachineDetailClient({
  machine,
  movements,
  workers,
  warehouses,
  inventoryItems,
}: MachineDetailClientProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredMovements = useMemo(() => {
    let result = movements;
    if (filterType !== 'all') {
      result = result.filter((m) => m.type === filterType);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.description?.toLowerCase().includes(q) ||
          m.notes?.toLowerCase().includes(q) ||
          m.workers.some((w) => w.workerName.toLowerCase().includes(q)) ||
          m.createdByName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [movements, filterType, search]);

  const statusCfg = serviceStatusConfig[machine.serviceStatus];
  const barWidth = getServiceBarWidth(
    machine.hoursSinceLastService,
    machine.serviceIntervalHours,
    machine.daysSinceLastService,
    machine.serviceIntervalDays,
  );
  const barColor = getServiceBarColor(machine.serviceStatus);

  const serviceLabel = (() => {
    const parts: string[] = [];
    if (machine.serviceIntervalHours) {
      const remaining = machine.serviceIntervalHours - machine.hoursSinceLastService;
      parts.push(`${formatNumber(Math.max(remaining, 0))} hs`);
    }
    if (machine.serviceIntervalDays) {
      const remaining = machine.serviceIntervalDays - machine.daysSinceLastService;
      parts.push(`${Math.max(remaining, 0)} días`);
    }
    if (parts.length === 0) return 'Sin intervalo configurado';
    return `${parts.join(' o cada ')}`;
  })();

  return (
    <div className="space-y-6">
      {/* ── Back link ── */}
      <Link
        href="/dashboard/maquinaria"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      {/* ── Machine info card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Image */}
          <div className="flex-shrink-0">
            {machine.imageUrl ? (
              <Image
                src={machine.imageUrl}
                alt={machine.type}
                width={120}
                height={120}
                className="rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-xl bg-gray-100">
                <Truck className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{machine.name}</h1>
                {machine.description && (
                  <p className="text-sm text-gray-500">{machine.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(machine.serviceStatus)}
                <Badge className={`${statusCfg.badgeClass} border-0 text-sm`}>
                  Service {statusCfg.label.toLowerCase()}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-600 border-0">
                  <Truck className="mr-1 h-3 w-3" />
                  Tipo
                </Badge>
                <span className="text-sm font-medium">{machine.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-600 border-0">
                  <MapPin className="mr-1 h-3 w-3" />
                  Ubicación
                </Badge>
                <span className="text-sm font-medium">{machine.location || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-600 border-0">
                  <Calendar className="mr-1 h-3 w-3" />
                  Antigüedad
                </Badge>
                <span className="text-sm font-medium">
                  {machine.acquisitionDate
                    ? `${formatNumber(machine.antiquityYears)} años`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-600 border-0">
                  <Gauge className="mr-1 h-3 w-3" />
                  Contahoras
                </Badge>
                <span className="text-sm font-medium">
                  {formatNumber(machine.hourMeter)} hs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-600 border-0">
                  <DollarSign className="mr-1 h-3 w-3" />
                  Gasto Total
                </Badge>
                <span className="text-sm font-medium">
                  {formatCurrency(machine.totalCost)}
                </span>
              </div>
            </div>

            {/* Service progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Próximo service en</span>
                <span>{serviceLabel}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2.5 rounded-full transition-all ${barColor}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  Último service:{' '}
                  {machine.lastServiceAt ? formatDate(machine.lastServiceAt) : 'Nunca'}
                </span>
                {machine.serviceIntervalHours && (
                  <span>
                    Cada {formatNumber(machine.serviceIntervalHours)} hs
                    {machine.serviceIntervalDays
                      ? ` o cada ${machine.serviceIntervalDays} días`
                      : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-3">
        <RegisterUsageModal
          machineId={machine.id}
          warehouses={warehouses}
          inventoryItems={inventoryItems}
        />
        <RegisterServiceModal
          machineId={machine.id}
          workers={workers}
        />
        <RegisterMaintenanceModal
          machineId={machine.id}
          workers={workers}
        />
      </div>

      {/* ── Movement history ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Movimientos</h2>

          <div className="flex items-center gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="USE">Uso</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
                <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-60"
              />
            </div>
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12">
            <Clock className="h-10 w-10 text-gray-300" />
            <h3 className="mt-4 text-base font-medium text-gray-900">Sin movimientos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Los movimientos aparecerán acá cuando registres usos, servicios o mantenimientos.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Detalle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Trabajadores
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Horas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Costo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredMovements.map((m) => {
                    const typeInfo = movementTypeLabels[m.type] ?? {
                      label: m.type,
                      color: 'bg-gray-100 text-gray-700',
                    };
                    return (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDateTime(m.date)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${typeInfo.color} border-0`}>
                            {typeInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div>
                            {m.description && (
                              <p className="font-medium">{m.description}</p>
                            )}
                            {m.spareParts.length > 0 && (
                              <p className="text-xs text-gray-500">
                                Repuestos: {m.spareParts.map((p) => p.name).join(', ')}
                              </p>
                            )}
                            {m.inventoryUsages.length > 0 && (
                              <p className="text-xs text-gray-500">
                                Insumos: {m.inventoryUsages.map((u) => `${u.itemName} (${formatNumber(u.quantity)} ${u.itemUnit})`).join(', ')}
                              </p>
                            )}
                            {m.notes && (
                              <p className="text-xs text-gray-400">{m.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {m.workers.length > 0
                            ? m.workers.map((w) => w.workerName).join(', ')
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {m.hoursUsed != null ? `${formatNumber(m.hoursUsed)} hs` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(m.cost)}
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
    </div>
  );
}
