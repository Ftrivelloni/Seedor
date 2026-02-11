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
import { UserPlus } from 'lucide-react';
import { createWorkerAction } from './actions';

export function AddWorkerModal() {
  const [open, setOpen] = useState(false);
  const [paymentType, setPaymentType] = useState('HOURLY');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await createWorkerAction(formData);
      setOpen(false);
      setPaymentType('HOURLY');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el trabajador.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) setError(null);
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
      </DialogContent>
    </Dialog>
  );
}
