'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog';
import { Label } from '@/components/dashboard/ui/label';
import { Switch } from '@/components/dashboard/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import { Button } from '@/components/dashboard/ui/button';
import { Separator } from '@/components/dashboard/ui/separator';
import { updateUserPreferencesAction } from './actions';
import type { SerializedUserProfile } from './types';

interface EditPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: SerializedUserProfile;
}

export function EditPreferencesModal({
  open,
  onOpenChange,
  userProfile,
}: EditPreferencesModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Estados locales para los switches
  const [darkMode, setDarkMode] = useState(userProfile.darkMode);
  const [emailNotifications, setEmailNotifications] = useState(userProfile.emailNotifications);
  const [whatsappNotifications, setWhatsappNotifications] = useState(
    userProfile.whatsappNotifications
  );
  const [dailySummary, setDailySummary] = useState(userProfile.dailySummary);
  const [locale, setLocale] = useState(userProfile.locale);
  const [dateFormat, setDateFormat] = useState(userProfile.dateFormat);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set('locale', locale);
    formData.set('dateFormat', dateFormat);
    formData.set('darkMode', darkMode.toString());
    formData.set('emailNotifications', emailNotifications.toString());
    formData.set('whatsappNotifications', whatsappNotifications.toString());
    formData.set('dailySummary', dailySummary.toString());

    startTransition(async () => {
      try {
        await updateUserPreferencesAction(formData);
        toast.success('Preferencias actualizadas exitosamente');
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar las preferencias';
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Editar preferencias</DialogTitle>
          <DialogDescription>
            Personaliza tu experiencia de uso en la plataforma y configura tus notificaciones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Preferencias generales</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="locale">Idioma</Label>
                <Select value={locale} onValueChange={setLocale} disabled={isPending}>
                  <SelectTrigger id="locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es-AR">Español (Argentina)</SelectItem>
                    <SelectItem value="es-ES">Español (España)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Formato de fecha</Label>
                <Select value={dateFormat} onValueChange={setDateFormat} disabled={isPending}>
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Tema oscuro</p>
                <p className="text-xs text-gray-500">Activar modo oscuro en la interfaz</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} disabled={isPending} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Notificaciones</h4>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Notificaciones por email</p>
                <p className="text-xs text-gray-500">
                  Recibir alertas y actualizaciones por correo electrónico
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                disabled={isPending}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Notificaciones por WhatsApp</p>
                <p className="text-xs text-gray-500">Recibir mensajes importantes por WhatsApp</p>
              </div>
              <Switch
                checked={whatsappNotifications}
                onCheckedChange={setWhatsappNotifications}
                disabled={isPending}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Resumen diario</p>
                <p className="text-xs text-gray-500">
                  Recibir un resumen diario de actividades y tareas pendientes
                </p>
              </div>
              <Switch
                checked={dailySummary}
                onCheckedChange={setDailySummary}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
