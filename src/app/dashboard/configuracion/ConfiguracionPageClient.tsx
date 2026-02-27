'use client';

import { useState } from 'react';
import { User, Building2, Crown, CreditCard, Package, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
import { Switch } from '@/components/dashboard/ui/switch';
import type {
  SerializedUserProfile,
  SerializedTenantConfig,
  SerializedModuleSetting,
  StripeSubscriptionInfo,
} from './types';
import { EditProfileModal } from './EditProfileModal';
import { EditPreferencesModal } from './EditPreferencesModal';
import { EditCompanyDataModal } from './EditCompanyDataModal';

interface ConfiguracionPageClientProps {
  userProfile: SerializedUserProfile;
  tenantConfig: SerializedTenantConfig;
  stripeInfo: StripeSubscriptionInfo | null;
  moduleSettings: SerializedModuleSetting[];
}

export function ConfiguracionPageClient({
  userProfile,
  tenantConfig,
  stripeInfo,
  moduleSettings,
}: ConfiguracionPageClientProps) {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editPreferencesOpen, setEditPreferencesOpen] = useState(false);
  const [editCompanyDataOpen, setEditCompanyDataOpen] = useState(false);

  const isAdmin = userProfile.role === 'ADMIN';

  // Mapeo de roles
  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
  };

  // Mapeo de módulos
  const moduleLabels: Record<string, string> = {
    DASHBOARD: 'Dashboard',
    USERS: 'Usuarios',
    WORKERS: 'Trabajadores',
    FIELD: 'Campo',
    INVENTORY: 'Inventario',
    MACHINERY: 'Maquinaria',
    PACKAGING: 'Empaque',
    SALES: 'Ventas',
    SETTINGS: 'Configuración',
  };

  // Mapeo de intervalos de plan
  const intervalLabels: Record<string, string> = {
    MONTHLY: 'Mensual',
    YEARLY: 'Anual',
  };

  // Mapeo de status de suscripción
  const statusLabels: Record<string, string> = {
    INACTIVE: 'Inactivo',
    TRIALING: 'En prueba',
    ACTIVE: 'Activo',
    PAST_DUE: 'Pago vencido',
    CANCELED: 'Cancelado',
    UNPAID: 'Sin pagar',
  };

  const statusColors: Record<string, string> = {
    INACTIVE: 'text-gray-600 bg-gray-100',
    TRIALING: 'text-blue-600 bg-blue-100',
    ACTIVE: 'text-green-600 bg-green-100',
    PAST_DUE: 'text-orange-600 bg-orange-100',
    CANCELED: 'text-red-600 bg-red-100',
    UNPAID: 'text-red-600 bg-red-100',
  };

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Configuración</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona tu cuenta y la configuración de Seedor
          </p>
        </div>

        <Tabs defaultValue="mi-cuenta" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mi-cuenta" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Mi Cuenta
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="empresa" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Configuración de la Empresa
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab: Mi Cuenta */}
          <TabsContent value="mi-cuenta" className="space-y-6">
            {/* Datos de mi cuenta */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Datos de mi cuenta</h3>
                    <p className="text-sm text-gray-500">
                      Información personal de tu usuario en Seedor
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6 px-6 py-5">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre completo</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {userProfile.firstName} {userProfile.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-sm text-gray-900">{userProfile.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Teléfono</p>
                  <p className="mt-1 text-sm text-gray-900">{userProfile.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Rol</p>
                  <p className="mt-1 text-sm text-gray-900">{roleLabels[userProfile.role]}</p>
                </div>
              </div>
            </div>

            {/* Preferencias generales */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Preferencias generales</h3>
                    <p className="text-sm text-gray-500">
                      Personaliza tu experiencia de uso en la plataforma
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditPreferencesOpen(true)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Idioma</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {userProfile.locale === 'es-AR' ? 'Español (Argentina)' : userProfile.locale}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Formato de fecha</p>
                    <p className="mt-1 text-sm text-gray-900">{userProfile.dateFormat}</p>
                  </div>
                </div>
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tema oscuro</p>
                      <p className="text-xs text-gray-500">Activar modo oscuro en la interfaz</p>
                    </div>
                    <div className="pointer-events-none">
                      <Switch checked={userProfile.darkMode} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notificaciones */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Notificaciones</h3>
                    <p className="text-sm text-gray-500">
                      Configura cómo y cuándo recibir notificaciones de Seedor
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditPreferencesOpen(true)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Notificaciones por email</p>
                      <p className="text-xs text-gray-500">
                        Recibir alertas y actualizaciones por correo electrónico
                      </p>
                    </div>
                  </div>
                  <div className="pointer-events-none">
                    <Switch checked={userProfile.emailNotifications} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Notificaciones por WhatsApp</p>
                      <p className="text-xs text-gray-500">
                        Recibir mensajes importantes por WhatsApp
                      </p>
                    </div>
                  </div>
                  <div className="pointer-events-none">
                    <Switch checked={userProfile.whatsappNotifications} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Resumen diario</p>
                      <p className="text-xs text-gray-500">
                        Recibir un resumen diario de actividades y tareas pendientes
                      </p>
                    </div>
                  </div>
                  <div className="pointer-events-none">
                    <Switch checked={userProfile.dailySummary} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Configuración de la Empresa (Solo ADMIN) */}
          {isAdmin && (
            <TabsContent value="empresa" className="space-y-6">
              {/* Advertencia */}
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
                <p className="text-sm font-medium text-yellow-800">
                  <strong>Importante:</strong> Estos cambios afectan a toda la empresa y todos sus
                  usuarios.
                </p>
              </div>

              {/* Plan de suscripción */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Plan de suscripción</h3>
                    <p className="text-sm text-gray-500">
                      Gestiona el plan de la empresa y sus beneficios
                    </p>
                  </div>
                  <button
                    disabled
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Crown className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {stripeInfo?.planName || 'Standard'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Plan estándar para empresas en crecimiento
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[tenantConfig.subscriptionStatus]
                      }`}
                    >
                      {statusLabels[tenantConfig.subscriptionStatus]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Método de pago */}
              {stripeInfo?.paymentMethod && (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Método de pago</h3>
                        <p className="text-sm text-gray-500">
                          Gestiona el método de pago para la suscripción
                        </p>
                      </div>
                    </div>
                    <button
                      disabled
                      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>
                  </div>
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Tarjeta de crédito</p>
                        <p className="text-xs text-gray-500">
                          Número: •••• •••• ••••{' '}
                          {stripeInfo.paymentMethod.last4}
                        </p>
                        <p className="text-xs text-gray-500">
                          Titular: {tenantConfig.legalName || tenantConfig.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Vencimiento: {stripeInfo.paymentMethod.expMonth}/
                          {stripeInfo.paymentMethod.expYear}
                        </p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-600">
                        Activo
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Datos de la empresa */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Datos de la empresa</h3>
                      <p className="text-sm text-gray-500">
                        Información general del tenant y datos fiscales
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditCompanyDataOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                </div>
                <div className="px-6 py-5">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nombre de la empresa</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {tenantConfig.legalName || tenantConfig.name}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">CUIT</p>
                        <p className="mt-1 text-sm text-gray-900">{tenantConfig.cuit || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Teléfono</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {tenantConfig.companyPhone || '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dirección</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {tenantConfig.companyAddress || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Módulos habilitados */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Módulos habilitados</h3>
                      <p className="text-sm text-gray-500">
                        Activa o desactiva los módulos opcionales para tu empresa
                      </p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                </div>
                <div className="px-6 py-5">
                  <div className="space-y-3">
                    {moduleSettings.map((module) => (
                      <div key={module.module} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {moduleLabels[module.module] || module.module}
                          </p>
                          <p className="text-xs text-gray-500">
                            {module.isOptional ? 'Módulo opcional' : 'Módulo obligatorio'}
                          </p>
                        </div>
                        <div className="pointer-events-none">
                          <Switch checked={module.enabled} disabled={!module.isOptional} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modales */}
      <EditProfileModal
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        userProfile={userProfile}
      />
      <EditPreferencesModal
        open={editPreferencesOpen}
        onOpenChange={setEditPreferencesOpen}
        userProfile={userProfile}
      />
      {isAdmin && (
        <EditCompanyDataModal
          open={editCompanyDataOpen}
          onOpenChange={setEditCompanyDataOpen}
          tenantConfig={tenantConfig}
        />
      )}
    </>
  );
}
