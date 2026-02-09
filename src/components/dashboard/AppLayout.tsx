'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Package,
  Truck,
  ShoppingCart,
  Settings,
  Zap,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle,
  ChevronDown,
  Users,
  Briefcase,
} from 'lucide-react';
import type { UserRole } from '@prisma/client';

type MenuItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  adminOnly?: boolean;
};

const baseMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Usuarios', path: '/dashboard/usuarios', adminOnly: true },
  { icon: Map, label: 'Campo', path: '/dashboard/campo' },
  { icon: Package, label: 'Inventario', path: '/dashboard/inventario' },
  { icon: Briefcase, label: 'Trabajadores', path: '/dashboard/trabajadores' },
  { icon: Truck, label: 'Maquinaria', path: '/dashboard/maquinaria' },
  { icon: Package, label: 'Empaque', path: '/dashboard/empaque' },
  { icon: ShoppingCart, label: 'Ventas', path: '/dashboard/ventas', adminOnly: true },
  { icon: Settings, label: 'Configuración', path: '/dashboard/configuracion' },
  { icon: Zap, label: 'Integraciones', path: '/dashboard/integraciones' },
];

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [headerUserMenuOpen, setHeaderUserMenuOpen] = useState(false);

  const menuItems = useMemo(
    () => baseMenuItems.filter((item) => !(item.adminOnly && user.role !== 'ADMIN')),
    [user.role]
  );

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const roleLabel = user.role === 'ADMIN' ? 'Administrador' : 'Supervisor Operativo';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logos/logo-seedor.png"
              alt="Seedor"
              width={32}
              height={32}
              className="rounded-lg flex-shrink-0"
            />
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                Seedor
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path !== '/dashboard' && pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-green-600' : ''}`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-green-700">{initials}</span>
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{roleLabel}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {userMenuOpen && (
              <div className={`absolute ${sidebarCollapsed ? 'left-full ml-2' : 'left-0 right-0'} bottom-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50`}>
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Mi cuenta</p>
                </div>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <UserCircle className="h-4 w-4" />
                  Perfil
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4" />
                  Configuración
                </button>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tareas, lotes, insumos..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-medium text-gray-900">Notificaciones</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full px-4 py-3 hover:bg-gray-50 text-left">
                      <p className="text-sm font-medium text-gray-900">Stock bajo</p>
                      <p className="text-xs text-gray-500 mt-0.5">Fertilizante NPK por debajo del mínimo</p>
                    </button>
                    <button className="w-full px-4 py-3 hover:bg-gray-50 text-left">
                      <p className="text-sm font-medium text-gray-900">Service próximo</p>
                      <p className="text-xs text-gray-500 mt-0.5">Control programado próximamente</p>
                    </button>
                    <button className="w-full px-4 py-3 hover:bg-gray-50 text-left">
                      <p className="text-sm font-medium text-gray-900">Tarea pendiente</p>
                      <p className="text-xs text-gray-500 mt-0.5">Hay tareas para reasignar</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setHeaderUserMenuOpen(!headerUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-green-700">{initials}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user.firstName} {user.lastName}
                </span>
              </button>

              {headerUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Mi cuenta</p>
                  </div>
                  <button className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left">Perfil</button>
                  <button className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left">Configuración</button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      {(userMenuOpen || notificationsOpen || headerUserMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationsOpen(false);
            setHeaderUserMenuOpen(false);
          }}
        />
      )}
    </div>
  );
}
