'use client';

import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar';
import { Badge } from '@/components/dashboard/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Switch } from '@/components/dashboard/ui/switch';
import { Label } from '@/components/dashboard/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu';
import {
  Search,
  Download,
  MoreHorizontal,
  CreditCard,
  MessageCircle,
  UserX,
  UserCheck,
  CheckCircle2,
  Clock,
  Timer,
  Users,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';

import { updateWorkerActiveStatusAction } from './actions';
import type { SerializedWorker } from './types';
import {
  paymentTypeLabels,
  paymentTypeBadgeColors,
  paymentStatusLabels,
  paymentStatusColors,
  getPaymentValue,
  getWorkerInitials,
} from './types';

import { AddWorkerModal } from './AddWorkerModal';
import { WorkerDetailSheet } from './WorkerDetailSheet';
import { RegisterPaymentModal } from './RegisterPaymentModal';
import { WhatsAppModal } from './WhatsAppModal';

interface WorkersPageClientProps {
  workers: SerializedWorker[];
}

/* ── KPI card ── */
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100' },
  };
  const c = colorMap[color] ?? colorMap.green;

  return (
    <div className="rounded-xl border bg-white p-4 flex items-center gap-4">
      <div className={`${c.iconBg} rounded-lg p-2.5`}>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-semibold ${c.text}`}>{value}</p>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function WorkersPageClient({ workers }: WorkersPageClientProps) {
  const [search, setSearch] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState('ALL');
  const [filterFunction, setFilterFunction] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [onlyActive, setOnlyActive] = useState(true);

  // modals / sheet
  const [selectedWorker, setSelectedWorker] = useState<SerializedWorker | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  /* unique functions for filter dropdown */
  const uniqueFunctions = useMemo(
    () => [...new Set(workers.map((w) => w.functionType).filter(Boolean))],
    [workers],
  );

  /* filtered workers */
  const filtered = useMemo(() => {
    return workers.filter((w) => {
      if (onlyActive && !w.active) return false;

      if (filterPaymentType !== 'ALL' && w.paymentType !== filterPaymentType) return false;
      if (filterFunction !== 'ALL' && w.functionType !== filterFunction) return false;
      if (filterStatus !== 'ALL' && w.paymentStatus !== filterStatus) return false;

      if (search) {
        const q = search.toLowerCase();
        const haystack = `${w.firstName} ${w.lastName} ${w.dni} ${w.phone} ${w.email ?? ''} ${w.functionType}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [workers, search, filterPaymentType, filterFunction, filterStatus, onlyActive]);

  /* KPI data */
  const activeWorkers = workers.filter((w) => w.active);
  const totalHours = activeWorkers.reduce((s, w) => s + w.totalHours, 0);
  const pendingPayments = activeWorkers.filter((w) => w.paymentStatus === 'PENDING').length;
  const pendingTasks = activeWorkers.reduce((s, w) => s + w.pendingTasks, 0);

  /* handlers */
  function openSheet(worker: SerializedWorker) {
    setSelectedWorker(worker);
    setSheetOpen(true);
  }

  function openPaymentModal(worker: SerializedWorker) {
    setSelectedWorker(worker);
    setPaymentModalOpen(true);
  }

  function openWhatsappModal(worker: SerializedWorker) {
    setSelectedWorker(worker);
    setWhatsappModalOpen(true);
  }

  async function toggleActive(worker: SerializedWorker) {
    const fd = new FormData();
    fd.set('workerId', worker.id);
    fd.set('active', String(!worker.active));
    await updateWorkerActiveStatusAction(fd);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trabajadores</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de trabajadores, pagos y asignaciones
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <AddWorkerModal />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Trabajadores activos"
          value={activeWorkers.length}
          icon={Users}
          color="green"
        />
        <KpiCard
          label="Horas registradas"
          value={totalHours.toLocaleString('es-AR')}
          icon={Timer}
          color="blue"
        />
        <KpiCard
          label="Pagos pendientes"
          value={pendingPayments}
          icon={AlertCircle}
          color="amber"
        />
        <KpiCard
          label="Tareas pendientes"
          value={pendingTasks}
          icon={ClipboardList}
          color="red"
        />
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, DNI, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterPaymentType} onValueChange={setFilterPaymentType}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Modalidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas modalidades</SelectItem>
            <SelectItem value="HOURLY">Por hora</SelectItem>
            <SelectItem value="PER_TASK">Por tarea</SelectItem>
            <SelectItem value="FIXED_SALARY">Sueldo fijo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterFunction} onValueChange={setFilterFunction}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Función" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas funciones</SelectItem>
            {uniqueFunctions.map((fn) => (
              <SelectItem key={fn} value={fn}>
                {fn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos estados</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="PARTIAL">Parcial</SelectItem>
            <SelectItem value="PAID">Al día</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            id="only-active"
            checked={onlyActive}
            onCheckedChange={setOnlyActive}
          />
          <Label htmlFor="only-active" className="text-sm text-gray-600 whitespace-nowrap">
            Solo activos
          </Label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/60">
                <th className="text-left font-medium text-gray-500 px-4 py-3">Trabajador</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">DNI</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Teléfono</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Modalidad</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Función</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Stats</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Pago</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No se encontraron trabajadores.
                  </td>
                </tr>
              )}
              {filtered.map((w) => {
                const initials = getWorkerInitials(w.firstName, w.lastName);
                const payTypeColor =
                  paymentTypeBadgeColors[w.paymentType] ?? 'bg-gray-100 text-gray-700';
                const payStatusColor =
                  paymentStatusColors[w.paymentStatus] ?? 'bg-gray-100 text-gray-700';

                return (
                  <tr
                    key={w.id}
                    className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openSheet(w)}
                  >
                    {/* Worker name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 bg-green-100 text-green-700">
                          <AvatarFallback className="bg-green-100 text-green-700 text-xs font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {w.firstName} {w.lastName}
                          </p>
                          {!w.active && (
                            <span className="text-xs text-gray-400">Inactivo</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600">{w.dni}</td>
                    <td className="px-4 py-3 text-gray-600">{w.phone}</td>

                    {/* Payment type badge */}
                    <td className="px-4 py-3">
                      <Badge className={`${payTypeColor} border-0 text-xs`}>
                        {paymentTypeLabels[w.paymentType] ?? w.paymentType}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-gray-600">{w.functionType}</td>

                    {/* Stats icons */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1" title="Tareas completadas">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          {w.completedTasks}
                        </span>
                        <span className="flex items-center gap-1" title="Tareas pendientes">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          {w.pendingTasks}
                        </span>
                        <span className="flex items-center gap-1" title="Horas">
                          <Timer className="h-3.5 w-3.5 text-blue-500" />
                          {w.totalHours}
                        </span>
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-900">
                          {getPaymentValue(w)}
                        </span>
                        <Badge className={`${payStatusColor} border-0 text-[10px] w-fit`}>
                          {paymentStatusLabels[w.paymentStatus] ?? w.paymentStatus}
                        </Badge>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openPaymentModal(w);
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Registrar pago
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsappModal(w);
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Enviar WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActive(w);
                            }}
                          >
                            {w.active ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side sheet */}
      <WorkerDetailSheet
        worker={selectedWorker}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Payment modal */}
      <RegisterPaymentModal
        worker={selectedWorker}
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
      />

      {/* WhatsApp modal */}
      <WhatsAppModal
        worker={selectedWorker}
        open={whatsappModalOpen}
        onOpenChange={setWhatsappModalOpen}
      />
    </div>
  );
}
