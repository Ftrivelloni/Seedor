'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/dashboard/ui/card';
import { Label } from '@/components/dashboard/ui/label';
import { Input } from '@/components/dashboard/ui/input';
import { Switch } from '@/components/dashboard/ui/switch';
import { updateProfileAction, updateNotificationsAction } from './actions';
import { EliminarCuentaSection } from './EliminarCuentaSection';
import type { SerializedUser, SerializedTenant } from './types';

interface MiCuentaSectionProps {
  user: SerializedUser;
  tenant?: SerializedTenant;
  isAdmin?: boolean;
}

export function MiCuentaSection({ user, tenant, isAdmin }: MiCuentaSectionProps) {
  return (
    <div className="space-y-4">
      <PersonalInfoCard user={user} />
      <NotificationsCard user={user} />

      {/* Zona de peligro — solo visible para ADMIN */}
      {isAdmin && tenant && (
        <>
          <div className="relative mt-8 mb-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-red-200" />
            </div>
            <div className="relative flex justify-start">
              <span className="bg-white pr-3 text-xs font-medium uppercase tracking-wide text-red-400">
                Zona de peligro
              </span>
            </div>
          </div>
          <EliminarCuentaSection tenant={tenant} />
        </>
      )}
    </div>
  );
}

// ── Shared: card header with edit/save/cancel controls ──

function CardSectionHeader({
  title,
  description,
  isEditing,
  isPending,
  onEdit,
  onCancel,
  onSave,
  formId,
}: {
  title: string;
  description: string;
  isEditing: boolean;
  isPending?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave?: () => void;
  formId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      {!isEditing ? (
        <button
          type="button"
          onClick={onEdit}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
          {onSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          ) : (
            <button
              type="submit"
              form={formId}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Read-only field ──

function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm text-gray-900">
        {value || <span className="italic text-gray-400">Sin completar</span>}
      </p>
    </div>
  );
}

// ── Personal Info Card ──

function PersonalInfoCard({ user }: { user: SerializedUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateProfileAction(formData);
        toast.success('Datos personales actualizados.');
        setIsEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar los datos.');
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardSectionHeader
          title="Datos personales"
          description="Tu nombre, email y teléfono de contacto."
          isEditing={isEditing}
          isPending={isPending}
          onEdit={() => setIsEditing(true)}
          onCancel={() => { setIsEditing(false); setError(null); }}
          formId="personal-info-form"
        />
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {!isEditing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadField label="Nombre" value={user.firstName} />
            <ReadField label="Apellido" value={user.lastName} />
            <ReadField label="Email" value={user.email} />
            <ReadField label="Teléfono" value={user.phone} />
            <ReadField label="Rol" value={user.role === 'ADMIN' ? 'Administrador' : 'Supervisor'} />
          </div>
        ) : (
          <form id="personal-info-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" name="firstName" defaultValue={user.firstName} required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" name="lastName" defaultValue={user.lastName} required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={user.phone ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Input value={user.role === 'ADMIN' ? 'Administrador' : 'Supervisor'} disabled />
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ── Notifications Card ──

function NotificationsCard({ user }: { user: SerializedUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications);
  const [whatsappNotifications, setWhatsappNotifications] = useState(user.whatsappNotifications);
  const [dailySummary, setDailySummary] = useState(user.dailySummary);
  const router = useRouter();

  function handleCancel() {
    setEmailNotifications(user.emailNotifications);
    setWhatsappNotifications(user.whatsappNotifications);
    setDailySummary(user.dailySummary);
    setError(null);
    setIsEditing(false);
  }

  function handleSave() {
    setError(null);
    const formData = new FormData();
    formData.set('emailNotifications', String(emailNotifications));
    formData.set('whatsappNotifications', String(whatsappNotifications));
    formData.set('dailySummary', String(dailySummary));
    startTransition(async () => {
      try {
        await updateNotificationsAction(formData);
        toast.success('Notificaciones actualizadas.');
        setIsEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar las notificaciones.');
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardSectionHeader
          title="Notificaciones"
          description="Canales por los que recibís alertas y recordatorios."
          isEditing={isEditing}
          isPending={isPending}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-xs text-gray-500">Alertas y recordatorios por correo electrónico</p>
            </div>
            {!isEditing ? (
              <span className={`text-sm font-medium ${emailNotifications ? 'text-green-700' : 'text-gray-400'}`}>
                {emailNotifications ? 'Activado' : 'Desactivado'}
              </span>
            ) : (
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">WhatsApp</p>
              <p className="text-xs text-gray-500">Alertas y recordatorios por WhatsApp</p>
            </div>
            {!isEditing ? (
              <span className={`text-sm font-medium ${whatsappNotifications ? 'text-green-700' : 'text-gray-400'}`}>
                {whatsappNotifications ? 'Activado' : 'Desactivado'}
              </span>
            ) : (
              <Switch checked={whatsappNotifications} onCheckedChange={setWhatsappNotifications} />
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Resumen Diario</p>
              <p className="text-xs text-gray-500">Recibí un resumen diario de actividades</p>
            </div>
            {!isEditing ? (
              <span className={`text-sm font-medium ${dailySummary ? 'text-green-700' : 'text-gray-400'}`}>
                {dailySummary ? 'Activado' : 'Desactivado'}
              </span>
            ) : (
              <Switch checked={dailySummary} onCheckedChange={setDailySummary} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
