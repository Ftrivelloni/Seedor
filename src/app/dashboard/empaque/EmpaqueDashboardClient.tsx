'use client';

import {
  Scale,
  Filter,
  Thermometer,
  Cog,
  Package,
  Truck,
  ArrowRight,
  TrendingUp,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { StateCard } from '@/components/dashboard/StateCard';
import type { EmpaqueDashboardData } from './types';
import { preselectionStatusLabels, preselectionStatusColors } from './types';

interface Props {
  data: EmpaqueDashboardData;
}

const flowSteps = [
  { key: 'balanza', label: 'Balanza', icon: Scale, color: 'bg-green-100 text-green-700' },
  { key: 'preseleccion', label: 'Preselección', icon: Filter, color: 'bg-green-100 text-green-700' },
  { key: 'camaras', label: 'Cámaras', icon: Thermometer, color: 'bg-green-100 text-green-700' },
  { key: 'proceso', label: 'Proceso', icon: Cog, color: 'bg-green-100 text-green-700' },
  { key: 'pallets', label: 'Pallets', icon: Package, color: 'bg-green-100 text-green-700' },
  { key: 'despacho', label: 'Despacho', icon: Truck, color: 'bg-green-100 text-green-700' },
] as const;

export function EmpaqueDashboardClient({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StateCard
          title="Bines en Playa"
          value={data.binesEnPlaya}
          icon={Package}
          iconColor="text-green-600"
          trend={{ value: '+4 hoy', positive: true }}
        />
        <StateCard
          title="Kg Procesados Hoy"
          value={data.kgProcesadosHoy.toLocaleString('es-AR')}
          icon={TrendingUp}
          iconColor="text-green-600"
          trend={{ value: '+12% vs ayer', positive: true }}
        />
        <StateCard
          title="Cajas Producidas"
          value={data.cajasProducidasHoy}
          icon={Package}
          iconColor="text-orange-600"
          trend={{ value: '+8% vs ayer', positive: true }}
        />
        <StateCard
          title="Eficiencia Línea"
          value={`${data.eficienciaLinea}%`}
          icon={TrendingUp}
          iconColor="text-yellow-600"
          trend={{ value: 'Óptimo', positive: true }}
        />
      </section>

      {/* Process Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cog className="h-5 w-5 text-gray-500" />
            Flujo de Proceso en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {flowSteps.map((step, i) => {
              const Icon = step.icon;
              const count = data.flujo[step.key as keyof typeof data.flujo];
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`rounded-full p-4 ${step.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{step.label}</span>
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                      {count} activos
                    </span>
                  </div>
                  {i < flowSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-gray-300 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Cards Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chamber Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-gray-500" />
              Estado de Cámaras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.chambers.length === 0 && (
              <p className="text-sm text-gray-500">Sin cámaras configuradas</p>
            )}
            {data.chambers.map((ch) => (
              <div key={ch.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm text-gray-900">{ch.name}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{ch.temperature ?? '-'}°C</span>
                    <span>{ch.humidity ?? '-'}% HR</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (ch.binsCount / ch.capacity) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{ch.binsCount} bines</span>
                </div>
              </div>
            ))}
            <Link
              href="/dashboard/empaque/camaras"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Ver detalles
            </Link>
          </CardContent>
        </Card>

        {/* Active Preselection */}
        <Card className={data.activePreselection ? 'border-orange-200' : ''}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-5 w-5 text-orange-500" />
              Preselección en Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.activePreselection ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      preselectionStatusColors[data.activePreselection.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {preselectionStatusLabels[data.activePreselection.status]}
                  </span>
                  <span className="text-sm text-gray-500">{data.activePreselection.code}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Bines entrada</p>
                    <p className="font-medium">{data.activePreselection.inputBinCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Kg ingresados</p>
                    <p className="font-medium">{data.activePreselection.totalInputKg.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Trazabilidad: </span>
                  <span className="text-green-600 font-medium">completa</span>
                </div>
                <Link
                  href="/dashboard/empaque/preseleccion"
                  className="block w-full rounded-lg bg-orange-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  Ir a preselección
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin preselección activa</p>
            )}
          </CardContent>
        </Card>

        {/* Active Process */}
        <Card className={data.activeProcess ? 'border-purple-200' : ''}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cog className="h-5 w-5 text-purple-500" />
              Línea de Proceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.activeProcess ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    Procesando
                  </span>
                  <span className="text-sm text-gray-500">ID: {data.activeProcess.code}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Bines procesando</p>
                    <p className="font-medium">{data.activeProcess.inputBinCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cajas generadas</p>
                    <p className="font-medium">{data.activeProcess.boxCount}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Progreso estimado</span>
                    <span className="text-gray-700">45%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full w-[45%]" />
                  </div>
                </div>
                <Link
                  href="/dashboard/empaque/proceso"
                  className="block w-full rounded-lg bg-purple-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-purple-600 transition-colors"
                >
                  Ver proceso
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin proceso activo</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
