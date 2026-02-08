'use client';

import Link from 'next/link';
import {
  ClipboardList,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  CalendarClock,
  Package,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import type { DashboardData } from '../dashboard-types';

/* ════════════════════════════════════════
   Simple bar-chart (CSS only, no lib)
   ════════════════════════════════════════ */
function BarChart({
  data,
  color = '#16a34a',
  maxHeight = 100,
}: {
  data: { label: string; value: number }[];
  color?: string;
  maxHeight?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 min-w-0">
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${(d.value / max) * maxHeight}px`,
              backgroundColor: color,
              minHeight: d.value > 0 ? '4px' : '0px',
            }}
          />
          <span className="mt-1.5 text-[10px] text-gray-500 truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   Donut chart (SVG)
   ════════════════════════════════════════ */
function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { value: number; color: string; label: string }[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 100 100">
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              className="transition-all duration-700"
              transform="rotate(-90 50 50)"
            />
          );
        })}
        <text x="50" y="50" textAnchor="middle" dy="0.35em" className="text-xs font-semibold fill-gray-700">
          {centerValue}
        </text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600">{seg.label} {seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   KPI trend badge
   ════════════════════════════════════════ */
function TrendBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? '↗' : '↘'} {Math.abs(value)}%
    </span>
  );
}

/* ════════════════════════════════════════
   Priority badge
   ════════════════════════════════════════ */
function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    alta: 'bg-red-100 text-red-700',
    media: 'bg-amber-100 text-amber-700',
    normal: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[priority] || colors.normal}`}>
      {priority}
    </span>
  );
}


/* ════════════════════════════════════════
   WIDGET COMPONENTS
   ════════════════════════════════════════ */

export function ActiveTasksWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex items-start justify-between h-full">
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Tareas activas</p>
        <p className="text-3xl font-semibold text-gray-900">{data.activeTasks}</p>
        <TrendBadge value={data.activeTasksTrend} />
      </div>
      <div className="rounded-lg bg-green-50 p-3">
        <ClipboardList className="h-6 w-6 text-green-600" />
      </div>
    </div>
  );
}

export function AvgYieldWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex items-start justify-between h-full">
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Rendimiento promedio</p>
        <p className="text-3xl font-semibold text-gray-900">{data.avgYield}%</p>
        <TrendBadge value={data.avgYieldTrend} />
      </div>
      <div className="rounded-lg bg-green-50 p-3">
        <TrendingUp className="h-6 w-6 text-green-600" />
      </div>
    </div>
  );
}

export function StockAlertsKpiWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex items-start justify-between h-full">
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Alertas de stock</p>
        <p className="text-3xl font-semibold text-gray-900">{data.stockAlertCount}</p>
        <TrendBadge value={data.stockAlertTrend} />
      </div>
      <div className="rounded-lg bg-amber-50 p-3">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
      </div>
    </div>
  );
}

export function ActiveOrdersWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex items-start justify-between h-full">
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Órdenes activas</p>
        <p className="text-3xl font-semibold text-gray-900">{data.activeOrders}</p>
        <TrendBadge value={data.activeOrdersTrend} />
      </div>
      <div className="rounded-lg bg-purple-50 p-3">
        <ShoppingCart className="h-6 w-6 text-purple-600" />
      </div>
    </div>
  );
}

export function YieldPerLotWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Rendimiento por lote</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Rendimiento
        </div>
      </div>
      <div className="flex-1 min-h-[120px]">
        {data.yieldPerLot.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin datos de cosecha reciente.</p>
        ) : (
          <BarChart
            data={data.yieldPerLot.map((y) => ({ label: y.lotName, value: y.kilos }))}
            color="#16a34a"
            maxHeight={100}
          />
        )}
      </div>
    </div>
  );
}

export function UpcomingTasksWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Tareas próximas</h3>
        <Link href="/dashboard/campo" className="text-xs text-green-600 hover:text-green-700 font-medium">
          Ver todas
        </Link>
      </div>
      {data.upcomingTasks.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No hay tareas pendientes.</p>
      ) : (
        <ul className="space-y-2 flex-1">
          {data.upcomingTasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm truncate">{task.description}</p>
                <p className="text-xs text-gray-500">{task.lots}</p>
              </div>
              <PriorityBadge priority={task.priority} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CostPerHectareWidget({ data }: { data: DashboardData }) {
  const chartData = data.costPerHectare.map((c) => ({
    label: c.lotName,
    value: c.hectares > 0 ? Math.round(c.cost / c.hectares) : 0,
  }));

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-gray-900 mb-4">Costo por Hectárea ($/ha)</h3>
      <div className="flex-1 min-h-[120px]">
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin datos de costos.</p>
        ) : (
          <BarChart data={chartData} color="#2563eb" maxHeight={100} />
        )}
      </div>
    </div>
  );
}

export function RecentAlertsWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Alertas recientes</h3>
        <Link href="/dashboard/inventario" className="text-xs text-green-600 hover:text-green-700 font-medium">
          Ver todas
        </Link>
      </div>
      {data.recentAlerts.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin alertas de stock.</p>
      ) : (
        <ul className="space-y-2 flex-1">
          {data.recentAlerts.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-lg p-3 text-sm ${
                alert.level === 'Sin stock'
                  ? 'bg-red-50 border border-red-100'
                  : 'bg-amber-50 border border-amber-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${alert.level === 'Sin stock' ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="min-w-0">
                  <p className={`font-medium ${alert.level === 'Sin stock' ? 'text-red-700' : 'text-amber-800'}`}>
                    {alert.level}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{alert.itemName}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StockOverviewWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Stock de Insumos</h3>
        <Link href="/dashboard/inventario" className="text-xs text-green-600 hover:text-green-700 font-medium">
          Ver todo
        </Link>
      </div>
      {data.stockOverview.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin insumos registrados.</p>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Insumo</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.stockOverview.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">{item.itemName}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{item.totalQty.toLocaleString('es-AR')} {item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function MachineryStatusWidget({ data }: { data: DashboardData }) {
  const { ok, maintenance, broken } = data.machineryStatus;
  const total = ok + maintenance + broken;

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-gray-900 mb-4">Estado de Maquinaria</h3>
      {total === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin maquinaria registrada.</p>
      ) : (
        <DonutChart
          segments={[
            { value: ok, color: '#16a34a', label: 'OK' },
            { value: maintenance, color: '#eab308', label: 'Mantenimiento' },
            { value: broken, color: '#ef4444', label: 'Averiada' },
          ]}
          centerLabel="Total"
          centerValue={total}
        />
      )}
    </div>
  );
}

export function MonthlySalesWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Ventas últimos 6 meses</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          Ventas (millones)
        </div>
      </div>
      <div className="flex-1 min-h-[120px]">
        {data.monthlySales.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin datos de ventas.</p>
        ) : (
          <BarChart
            data={data.monthlySales.map((s) => ({ label: s.month, value: s.amount }))}
            color="#f97316"
            maxHeight={100}
          />
        )}
      </div>
    </div>
  );
}

export function ClientsBalanceWidget({ data }: { data: DashboardData }) {
  return (
    <div className="flex items-start justify-between h-full">
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Clientes con Saldo</p>
        <p className="text-3xl font-semibold text-gray-900">{data.clientsWithBalance}</p>
      </div>
      <div className="rounded-lg bg-blue-50 p-3">
        <Package className="h-6 w-6 text-blue-600" />
      </div>
    </div>
  );
}

/* ── Widget renderer ── */
export function renderWidget(widgetId: string, data: DashboardData): React.ReactNode {
  switch (widgetId) {
    case 'active_tasks': return <ActiveTasksWidget data={data} />;
    case 'avg_yield': return <AvgYieldWidget data={data} />;
    case 'stock_alerts_kpi': return <StockAlertsKpiWidget data={data} />;
    case 'active_orders': return <ActiveOrdersWidget data={data} />;
    case 'yield_per_lot': return <YieldPerLotWidget data={data} />;
    case 'upcoming_tasks': return <UpcomingTasksWidget data={data} />;
    case 'cost_per_hectare': return <CostPerHectareWidget data={data} />;
    case 'recent_alerts': return <RecentAlertsWidget data={data} />;
    case 'stock_overview': return <StockOverviewWidget data={data} />;
    case 'machinery_status': return <MachineryStatusWidget data={data} />;
    case 'monthly_sales': return <MonthlySalesWidget data={data} />;
    case 'clients_balance': return <ClientsBalanceWidget data={data} />;
    default: return <p className="text-sm text-gray-400">Widget desconocido</p>;
  }
}
