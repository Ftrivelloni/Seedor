'use client';

import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar';
import { Badge } from '@/components/dashboard/ui/badge';
import { Switch } from '@/components/dashboard/ui/switch';
import { Label } from '@/components/dashboard/ui/label';
import { Separator } from '@/components/dashboard/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/dashboard/ui/sheet';
import { Phone, Mail, CreditCard, MessageCircle } from 'lucide-react';
import type { SerializedWorker } from './types';
import {
  paymentTypeLabels,
  paymentTypeBadgeColors,
  paymentStatusLabels,
  paymentStatusColors,
  getPaymentValue,
  getWorkerInitials,
} from './types';

interface WorkerDetailSheetProps {
  worker: SerializedWorker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkerDetailSheet({ worker, open, onOpenChange }: WorkerDetailSheetProps) {
  if (!worker) return null;

  const initials = getWorkerInitials(worker.firstName, worker.lastName);
  const paymentTypeColor = paymentTypeBadgeColors[worker.paymentType] ?? 'bg-gray-100 text-gray-700';
  const paymentStatusColor = paymentStatusColors[worker.paymentStatus] ?? 'bg-gray-100 text-gray-700';

  const paymentValueLabel = getPaymentValue(worker);

  // Estimate monthly total (rough estimate for display purposes)
  const estimatedMonthly =
    worker.paymentType === 'HOURLY'
      ? (worker.hourlyRate ?? 0) * (worker.totalHours || 0)
      : worker.paymentType === 'PER_TASK'
        ? (worker.taskRate ?? 0) * (worker.completedTasks || 0)
        : (worker.fixedSalary ?? 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 bg-green-100 text-green-700">
              <AvatarFallback className="bg-green-100 text-green-700 text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-lg">
                {worker.firstName} {worker.lastName}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${paymentTypeColor} border-0 text-xs`}>
                  {paymentTypeLabels[worker.paymentType] ?? worker.paymentType}
                </Badge>
                <span className="text-sm text-gray-500">{worker.functionType}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="px-4 space-y-5">
          {/* Contact info */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Datos de contacto
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span>DNI: {worker.dni}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{worker.phone}</span>
              </div>
              {worker.email && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{worker.email}</span>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Statistics */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Estadísticas
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center rounded-xl border border-green-200 bg-green-50 p-3">
                <span className="text-xl font-semibold text-green-700">
                  {worker.completedTasks}
                </span>
                <span className="text-[11px] text-green-600">Realizadas</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-amber-200 bg-amber-50 p-3">
                <span className="text-xl font-semibold text-amber-700">
                  {worker.pendingTasks}
                </span>
                <span className="text-[11px] text-amber-600">Pendientes</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-blue-200 bg-blue-50 p-3">
                <span className="text-xl font-semibold text-blue-700">
                  {worker.totalHours.toLocaleString('es-AR')}
                </span>
                <span className="text-[11px] text-blue-600">Horas</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* Payment info */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Información de pago
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  {worker.paymentType === 'HOURLY'
                    ? 'Valor por hora'
                    : worker.paymentType === 'PER_TASK'
                      ? 'Valor por tarea'
                      : 'Sueldo mensual'}
                </span>
                <span className="font-medium text-gray-900">{paymentValueLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total estimado (mes)</span>
                <span className="font-medium text-gray-900">
                  $ {estimatedMonthly.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Estado</span>
                <Badge className={`${paymentStatusColor} border-0`}>
                  {paymentStatusLabels[worker.paymentStatus] ?? worker.paymentStatus}
                </Badge>
              </div>
            </div>
          </section>

          <Separator />

          {/* Assignments */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Asignaciones
            </h4>
            <div className="space-y-1">
              <span className="text-sm font-medium text-green-700 hover:underline cursor-pointer">
                Campo
              </span>
              <p className="text-xs text-gray-500">Puede asignarse a tareas de Campo</p>
            </div>
          </section>

          <Separator />

          {/* WhatsApp notifications */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              Notificaciones WhatsApp
            </h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="whatsapp-toggle" className="text-sm text-gray-700 font-normal">
                Notificaciones habilitadas
              </Label>
              <Switch id="whatsapp-toggle" defaultChecked />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Se usaría el teléfono registrado para avisos automáticos
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
