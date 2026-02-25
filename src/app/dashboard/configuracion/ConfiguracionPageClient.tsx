'use client';

import { useState } from 'react';
import { User, Building2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MiCuentaSection } from './MiCuentaSection';
import { EmpresaSection } from './EmpresaSection';
import { SuscripcionSection } from './SuscripcionSection';
import type { ConfiguracionPageProps, ConfigTab } from './types';

const TABS: { key: ConfigTab; label: string; icon: typeof User; adminOnly: boolean }[] = [
  { key: 'mi-cuenta', label: 'Mi Cuenta', icon: User, adminOnly: false },
  { key: 'empresa', label: 'Empresa', icon: Building2, adminOnly: true },
  { key: 'suscripcion', label: 'Suscripción', icon: CreditCard, adminOnly: true },
];

export function ConfiguracionPageClient({ user, tenant, moduleSettings, pricing, isAdmin }: ConfiguracionPageProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('mi-cuenta');

  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Configuración</h1>
          <p className="text-sm text-gray-600 mt-2">Administrá tu cuenta, empresa y módulos.</p>
        </div>
      </header>

      {/* Horizontal tab bar */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content area */}
      <div>
        {activeTab === 'mi-cuenta' && <MiCuentaSection user={user} />}
        {activeTab === 'empresa' && isAdmin && <EmpresaSection tenant={tenant} />}
        {activeTab === 'suscripcion' && isAdmin && (
          <SuscripcionSection tenant={tenant} pricing={pricing} moduleSettings={moduleSettings} />
        )}
      </div>
    </div>
  );
}
