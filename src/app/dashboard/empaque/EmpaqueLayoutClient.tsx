'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Scale,
  Filter,
  Thermometer,
  Cog,
  Package,
  Truck,
} from 'lucide-react';

const tabs = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/empaque' },
  { icon: Scale, label: 'Balanza', path: '/dashboard/empaque/balanza' },
  { icon: Filter, label: 'Preselección', path: '/dashboard/empaque/preseleccion' },
  { icon: Thermometer, label: 'Cámaras', path: '/dashboard/empaque/camaras' },
  { icon: Cog, label: 'Proceso', path: '/dashboard/empaque/proceso' },
  { icon: Package, label: 'Cajas y Pallets', path: '/dashboard/empaque/pallets' },
  { icon: Truck, label: 'Despacho', path: '/dashboard/empaque/despacho' },
];

export function EmpaqueLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Module header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Módulo de Empaque</h1>
          <p className="text-sm text-gray-600">
            Gestión integral del proceso de empaque citrícola con trazabilidad completa
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Sistema Operativo
        </span>
      </header>

      {/* Sub-navigation tabs */}
      <nav className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/dashboard/empaque'
              ? pathname === '/dashboard/empaque'
              : pathname.startsWith(tab.path);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}
