'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CreditCard,
  Package,
  Wrench,
  ShoppingCart,
  ExternalLink,
  Pencil,
  X,
  Check,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Switch } from '@/components/dashboard/ui/switch';
import { Separator } from '@/components/dashboard/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/dashboard/ui/alert-dialog';
import {
  cancelSubscriptionAction,
  updatePlanModulesAction,
  getChangePaymentMethodUrlAction,
} from './actions';
import type { SerializedTenant, SerializedModuleSetting, SubscriptionPricingInfo } from './types';

// ── Constants ──────────────────────────────────────────────────────────────

const BASE_PRICE_USD = 200;
const MODULE_PRICE_USD = 20;

const OPTIONAL_MODULES = [
  { key: 'PACKAGING' as const, label: 'Empaque', description: 'Pipeline de 6 etapas de empaque de fruta.', icon: Package },
  { key: 'MACHINERY' as const, label: 'Maquinaria', description: 'Parque de máquinas, uso y mantenimiento.', icon: Wrench },
  { key: 'SALES' as const, label: 'Ventas', description: 'Registro de ventas y clientes.', icon: ShoppingCart },
];

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: 'Visa', master: 'Mastercard', mastercard: 'Mastercard',
  amex: 'American Express', naranja: 'Naranja', cabal: 'Cabal',
  debvisa: 'Visa Débito', debmaster: 'Maestro',
};

interface SuscripcionSectionProps {
  tenant: SerializedTenant;
  pricing: SubscriptionPricingInfo;
  moduleSettings: SerializedModuleSetting[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; badgeClass: string }> = {
  INACTIVE: { label: 'Inactiva', icon: XCircle, badgeClass: 'bg-gray-100 text-gray-800 border-gray-200' },
  TRIALING: { label: 'Período de prueba', icon: Info, badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  ACTIVE: { label: 'Activa', icon: CheckCircle2, badgeClass: 'bg-green-100 text-green-800 border-green-200' },
  PAST_DUE: { label: 'Pago pendiente', icon: AlertTriangle, badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  CANCELED: { label: 'Cancelada', icon: XCircle, badgeClass: 'bg-red-100 text-red-800 border-red-200' },
  UNPAID: { label: 'Impaga', icon: XCircle, badgeClass: 'bg-red-100 text-red-800 border-red-200' },
};

export function SuscripcionSection({ tenant, pricing, moduleSettings }: SuscripcionSectionProps) {
  const router = useRouter();

  const initialEnabled = OPTIONAL_MODULES.filter((m) => {
    const setting = moduleSettings.find((s) => s.module === m.key);
    return setting?.enabled ?? false;
  }).map((m) => m.key as string);

  const [enabledKeys, setEnabledKeys] = useState<string[]>(initialEnabled);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSavingPlan, startSavePlan] = useTransition();
  const [isCanceling, startCancel] = useTransition();
  const [isLoadingPaymentUrl, setIsLoadingPaymentUrl] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const statusInfo = STATUS_CONFIG[tenant.subscriptionStatus] ?? null;
  const canCancel = tenant.subscriptionStatus === 'ACTIVE';
  const hasActiveSubscription = canCancel;
  const liveTotal = BASE_PRICE_USD + MODULE_PRICE_USD * enabledKeys.length;

  function handleToggle(key: string, value: boolean) {
    setEnabledKeys((prev) => (value ? [...prev, key] : prev.filter((k) => k !== key)));
    setPlanError(null);
  }

  function handleSavePlan() {
    setShowConfirmSave(false);
    setAcceptedTerms(false);
    setPlanError(null);
    startSavePlan(async () => {
      const result = await updatePlanModulesAction(enabledKeys);
      if (result.success) {
        setIsEditingPlan(false);
        if (result.error) {
          // MP sync warning (DB was updated, MP failed)
          toast.warning(result.error);
        } else if (result.hasDeactivations && result.hasActivations) {
          // Mixed: activations applied immediately, deactivations deferred
          toast.success('Plan actualizado. Los módulos activados ya están disponibles.');
          toast.info(
            'El módulo ha sido desactivado. Los cambios en el costo de su suscripción se verán reflejados a partir del próximo ciclo de facturación.',
            { duration: 8000 }
          );
        } else if (result.hasDeactivations) {
          // Only deactivations → deferred billing notice
          toast.info(
            'El módulo ha sido desactivado. Los cambios en el costo de su suscripción se verán reflejados a partir del próximo ciclo de facturación.',
            { duration: 8000 }
          );
        } else {
          toast.success('Plan actualizado correctamente.');
        }
        router.refresh();
      } else {
        setPlanError(result.error ?? 'Error al guardar el plan.');
      }
    });
  }

  function handleCancelPlanEdit() {
    setEnabledKeys(initialEnabled);
    setIsEditingPlan(false);
    setShowConfirmSave(false);
    setAcceptedTerms(false);
    setPlanError(null);
  }

  // Compute what changed to show in the confirmation dialog
  const addedModules = enabledKeys.filter((k) => !initialEnabled.includes(k));
  const removedModules = initialEnabled.filter((k) => !enabledKeys.includes(k));
  const hasChanges = addedModules.length > 0 || removedModules.length > 0;

  function handleCancelSubscription() {
    setCancelError(null);
    startCancel(async () => {
      const result = await cancelSubscriptionAction();
      if (result.success) {
        toast.success('Suscripción marcada para cancelar al fin del período.');
        router.refresh();
      } else {
        setCancelError(result.error ?? 'Error al cancelar la suscripción.');
      }
    });
  }

  function handleChangePaymentMethod() {
    setIsLoadingPaymentUrl(true);
    getChangePaymentMethodUrlAction()
      .then((result) => {
        console.log('[handleChangePaymentMethod] result:', JSON.stringify(result));
        if (result.success && result.url) {
          window.location.assign(result.url);
        } else {
          setIsLoadingPaymentUrl(false);
          toast.error(result.error ?? 'No se pudo generar el enlace de Mercado Pago.');
        }
      })
      .catch((err) => {
        console.error('[handleChangePaymentMethod] catch:', err);
        setIsLoadingPaymentUrl(false);
        toast.error('Error al conectar con Mercado Pago.');
      });
  }

  return (
    <div className="space-y-4">

      {/* Card 1: Estado del plan */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Plan actual</h3>
              <p className="mt-0.5 text-sm text-gray-500">Estado y detalles de tu suscripción en Seedor.</p>
            </div>
            {statusInfo && (() => {
              const StatusIcon = statusInfo.icon;
              return (
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusInfo.badgeClass}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusInfo.label}
                </span>
              );
            })()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenant.cancelAtPeriodEnd && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">Tu suscripción se cancelará al finalizar el período actual.</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Facturación</p>
              <p className="text-sm text-gray-900">{tenant.planInterval === 'MONTHLY' ? 'Mensual' : 'Anual'}</p>
            </div>
            {tenant.currentPeriodEnd && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Próxima renovación</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(tenant.currentPeriodEnd), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Módulos y precios */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Detalle del plan</h3>
              <p className="mt-0.5 text-sm text-gray-500">Módulos incluidos en tu suscripción mensual.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Botón Más información */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <Info className="h-3.5 w-3.5" />
                    Más información
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Información sobre los cambios de módulos</AlertDialogTitle>
                    <p className="text-sm text-gray-500 mt-2 mb-3">Al presionar "Entendido" confirmás que leíste y comprendés esta información.</p>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4 text-sm text-gray-600">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
                          <p className="font-semibold text-amber-900">Al dar de baja un módulo</p>
                          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-amber-800">
                            <li>Si ya lo pagaste este mes, el cobro se deja de realizar a partir del <strong>mes siguiente</strong>.</li>
                            <li>Vas a <strong>perder acceso</strong> a toda la información relacionada a ese módulo.</li>
                            <li>Te recomendamos <strong>descargar o respaldar</strong> los datos que no quieras perder antes de dar de baja el módulo.</li>
                          </ul>
                        </div>
                        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4">
                          <p className="font-semibold text-green-900">Al dar de alta un módulo</p>
                          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-green-800">
                            <li>El cobro del módulo nuevo comienza a partir del <strong>mes siguiente</strong>.</li>
                            <li>Podés empezar a usar el módulo de inmediato.</li>
                          </ul>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Entendido</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Botones Editar / Cancelar + Guardar */}
              {!isEditingPlan ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPlan(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelPlanEdit}
                    disabled={isSavingPlan}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasChanges) {
                        setIsEditingPlan(false);
                        return;
                      }
                      setAcceptedTerms(false);
                      setShowConfirmSave(true);
                    }}
                    disabled={isSavingPlan}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isSavingPlan ? 'Guardando...' : 'Guardar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {planError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{planError}</p>
          )}

          {/* Precio base */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Plan base</p>
              <p className="text-xs text-gray-500">Incluye Dashboard, Usuarios, Campo, Inventario y Trabajadores</p>
            </div>
            <span className="text-sm font-semibold text-gray-900">USD ${BASE_PRICE_USD}/mes</span>
          </div>

          {/* Módulos opcionales */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Módulos opcionales — USD ${MODULE_PRICE_USD} c/u por mes
            </p>
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {OPTIONAL_MODULES.map((mod) => {
                const Icon = mod.icon;
                const isEnabled = enabledKeys.includes(mod.key);
                return (
                  <div key={mod.key} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{mod.label}</p>
                        <p className="text-xs text-gray-500">{mod.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isEditingPlan ? (
                        <>
                          {isEnabled && <span className="text-xs font-medium text-green-700">+ USD ${MODULE_PRICE_USD}</span>}
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(val) => handleToggle(mod.key, val)}
                            disabled={isSavingPlan}
                          />
                        </>
                      ) : (
                        <span className={`text-sm font-medium ${isEnabled ? 'text-green-700' : 'text-gray-400'}`}>
                          {isEnabled ? 'Activado' : 'Desactivado'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total mensual</span>
            <div className="text-right">
              <span className="text-xl font-bold text-green-700">
                USD ${isEditingPlan ? liveTotal : pricing.totalUsd}
              </span>
              {isEditingPlan && liveTotal !== pricing.totalUsd && (
                <p className="text-xs text-gray-400">Antes: USD ${pricing.totalUsd}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialog when saving plan changes */}
      <AlertDialog open={showConfirmSave} onOpenChange={setShowConfirmSave}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="mb-3">Confirmar cambios en el plan</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm text-gray-600">
                {removedModules.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="font-semibold text-red-900">Módulos a dar de baja</p>
                    <ul className="mt-3 list-disc space-y-1.5 pl-4 text-red-800">
                      {removedModules.map((k) => {
                        const mod = OPTIONAL_MODULES.find((m) => m.key === k);
                        return <li key={k}><strong>{mod?.label ?? k}</strong> — perderás acceso a toda la información de este módulo.</li>;
                      })}
                    </ul>
                    <p className="mt-3 text-xs text-red-700 border-t border-red-200 pt-2">
                      Te recomendamos descargar los datos que no quieras perder. El cobro se dejará de realizar a partir del mes siguiente.
                    </p>
                  </div>
                )}
                {addedModules.length > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <p className="font-semibold text-green-900">Módulos a dar de alta</p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-4 text-green-800">
                      {addedModules.map((k) => {
                        const mod = OPTIONAL_MODULES.find((m) => m.key === k);
                        return <li key={k}><strong>{mod?.label ?? k}</strong> — disponible de inmediato. Se cobra a partir del mes siguiente.</li>;
                      })}
                    </ul>
                  </div>
                )}
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-medium text-gray-800">
                    Nuevo total mensual: <span className="text-green-700">USD ${liveTotal}</span>
                    {liveTotal !== pricing.totalUsd && (
                      <span className="ml-1 text-xs text-gray-400">(antes: USD ${pricing.totalUsd})</span>
                    )}
                  </p>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    Entiendo los cambios descritos y acepto las consecuencias de modificar mi plan.
                  </span>
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAcceptedTerms(false)}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSavePlan}
              disabled={!acceptedTerms || isSavingPlan}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {isSavingPlan ? 'Guardando...' : 'Confirmar cambios'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Card 3: Método de pago */}
      <Card>
        <CardHeader className="pb-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Método de pago</h3>
            <p className="mt-0.5 text-sm text-gray-500">Tarjeta utilizada para el cobro automático de la suscripción.</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <CreditCard className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                {tenant.mpCardLastFour && tenant.mpCardBrand ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {CARD_BRAND_LABELS[tenant.mpCardBrand.toLowerCase()] ?? tenant.mpCardBrand} ····{tenant.mpCardLastFour}
                    </p>
                    <p className="text-xs text-gray-400">Método de pago vinculado a Mercado Pago</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">Sin información de tarjeta registrada</p>
                    <p className="text-xs text-gray-400">Los datos de pago se gestionan a través de Mercado Pago</p>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              onClick={() => {
                console.log('[Cambiar método] click!');
                handleChangePaymentMethod();
              }}
              disabled={isLoadingPaymentUrl}
            >
              {isLoadingPaymentUrl ? 'Cargando...' : (<>Cambiar método<ExternalLink className="h-3.5 w-3.5" /></>)}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Zona de peligro */}
      {canCancel && !tenant.cancelAtPeriodEnd && (
        <Card className="border-red-200">
          <CardHeader className="pb-4">
            <h3 className="text-sm font-semibold text-red-700">Zona de peligro</h3>
            <p className="mt-0.5 text-sm text-gray-500">Acciones destructivas sobre tu suscripción.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {cancelError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{cancelError}</p>
            )}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-red-900">Cancelar suscripción</p>
                <p className="text-xs text-red-600">Mantiene el acceso hasta el fin del período actual.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="shrink-0" disabled={isCanceling}>
                    {isCanceling ? 'Cancelando...' : 'Cancelar'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tu suscripción seguirá activa hasta el final del período actual. Después perderás
                      acceso a las funciones premium. Esta acción puede revertirse contactando soporte
                      antes de que finalice el período.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelSubscription} className="bg-red-600 hover:bg-red-700">
                      Sí, cancelar suscripción
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
