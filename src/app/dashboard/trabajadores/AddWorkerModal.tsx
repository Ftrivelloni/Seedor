'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/dashboard/ui/dialog';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import { Checkbox } from '@/components/dashboard/ui/checkbox';
import { UserPlus, MessageCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createWorkerAction } from './actions';

const BOT_LINK =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_LINK ?? 'https://t.me/SeedorTestBot';

function buildWhatsAppUrl(phone: string, firstName: string): string {
  const normalized = phone.replace(/[\s\-()]/g, '').replace(/^\+/, '');
  const text = encodeURIComponent(
    `Hola ${firstName}! 👋 Te agregamos al sistema Seedor.\n\nPara ver tus tareas del día a día, escribile al bot de Seedor en Telegram:\n👉 ${BOT_LINK}\n\nTocá el link, abrí la app y mandá /start.`
  );
  return `https://wa.me/${normalized}?text=${text}`;
}

interface CreatedWorker {
  firstName: string;
  phone: string;
}

export function AddWorkerModal() {
  const [open, setOpen] = useState(false);
  const [paymentType, setPaymentType] = useState('HOURLY');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedWorker | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await createWorkerAction(formData);
      setCreated({
        firstName: String(formData.get('firstName') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
      });
      setPaymentType('HOURLY');
      toast.success('Trabajador agregado exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el trabajador.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyLink() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(BOT_LINK);
      } else if (typeof document !== 'undefined') {
        const tempInput = document.createElement('input');
        tempInput.value = BOT_LINK;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      } else {
        throw new Error('Clipboard API no disponible');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar el enlace del bot:', err);
      setError('No se pudo copiar el enlace automáticamente. Copialo manualmente: ' + BOT_LINK);
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setError(null);
      setCreated(null);
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 gap-2">
          <UserPlus className="h-4 w-4" />
          Agregar trabajador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                ✅ Trabajador creado
              </DialogTitle>
              <DialogDescription>
                {created.firstName} fue agregado correctamente. Ahora podés invitarlo al bot de Seedor.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
              <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Invitar a Seedor Bot (Telegram)
              </p>
              <p className="text-xs text-green-700">
                El trabajador tiene que escribirle <strong>/start</strong> al bot para activar su cuenta y recibir tareas.
              </p>
              <div className="flex items-center gap-2 bg-white rounded border px-3 py-2">
                <span className="text-sm text-gray-600 flex-1 font-mono">{BOT_LINK}</span>
                <button
                  onClick={handleCopyLink}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copiar link"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cerrar
              </Button>
              {created.phone && (
                <Button
                  asChild
                  className="bg-[#25D366] hover:bg-[#1ebe5d] text-white gap-2"
                >
                  <a
                    href={buildWhatsAppUrl(created.phone, created.firstName)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar por WhatsApp
                  </a>
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
        <DialogHeader>
          <DialogTitle>Agregar trabajador</DialogTitle>
          <DialogDescription>
            Completá los datos del nuevo trabajador
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="worker-firstName">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input id="worker-firstName" name="firstName" required maxLength={100} placeholder="Nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="worker-lastName">
                Apellido <span className="text-red-500">*</span>
              </Label>
              <Input id="worker-lastName" name="lastName" required maxLength={100} placeholder="Apellido" />
            </div>
          </div>

          {/* DNI + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="worker-dni">
                DNI <span className="text-red-500">*</span>
              </Label>
              <Input id="worker-dni" name="dni" required maxLength={20} placeholder="12345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="worker-phone">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="worker-phone"
                name="phone"
                required
                placeholder="+54 9 11 1234-5678"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="worker-email">Email (opcional)</Label>
            <Input
              id="worker-email"
              name="email"
              type="email"
              placeholder="trabajador@email.com"
            />
          </div>

          {/* Payment type + Function */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                Modalidad de pago <span className="text-red-500">*</span>
              </Label>
              <Select
                name="paymentType"
                defaultValue="HOURLY"
                onValueChange={(v) => setPaymentType(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOURLY">Por hora</SelectItem>
                  <SelectItem value="PER_TASK">Por tarea</SelectItem>
                  <SelectItem value="FIXED_SALARY">Sueldo fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="worker-function">
                Función <span className="text-red-500">*</span>
              </Label>
              <Input
                id="worker-function"
                name="functionType"
                required
                placeholder="Ej: Tractorista"
              />
            </div>
          </div>

          {/* Conditional payment value */}
          {paymentType === 'HOURLY' && (
            <div className="space-y-2">
              <Label htmlFor="worker-hourlyRate">Valor por hora ($)</Label>
              <Input
                id="worker-hourlyRate"
                name="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          )}
          {paymentType === 'PER_TASK' && (
            <div className="space-y-2">
              <Label htmlFor="worker-taskRate">Valor por tarea ($)</Label>
              <Input
                id="worker-taskRate"
                name="taskRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          )}
          {paymentType === 'FIXED_SALARY' && (
            <div className="space-y-2">
              <Label htmlFor="worker-fixedSalary">Sueldo mensual ($)</Label>
              <Input
                id="worker-fixedSalary"
                name="fixedSalary"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Assignments */}
          <div className="space-y-2">
            <Label>Asignaciones</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="assign-campo" defaultChecked disabled />
                <Label htmlFor="assign-campo" className="text-sm font-normal">
                  Campo
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="assign-empaque" disabled />
                <Label htmlFor="assign-empaque" className="text-sm font-normal text-gray-400">
                  Empaque
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? 'Guardando...' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
