import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/auth/auth';
import { resolveStockAlertLevel } from '@/lib/domain/inventory';
import { updateDashboardPreferenceAction } from '@/app/dashboard/actions';

const widgetCatalog = [
  { id: 'open_tasks', label: 'Tareas abiertas' },
  { id: 'today_tasks', label: 'Tareas próximas' },
  { id: 'stock_alerts', label: 'Alertas de stock' },
  { id: 'pending_payments', label: 'Pagos pendientes de trabajadores' },
  { id: 'harvest_kilos', label: 'Kilos de cosecha (30 días)' },
  { id: 'inventory_movements', label: 'Movimientos de inventario recientes' },
] as const;

const templateOptions = [
  { key: 'balanced', label: 'Balanceado' },
  { key: 'operations', label: 'Operativo' },
  { key: 'analytics', label: 'Analítico' },
] as const;

function parseWidgets(raw: string | null): string[] {
  if (!raw) {
    return ['open_tasks', 'stock_alerts', 'today_tasks'];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return ['open_tasks', 'stock_alerts', 'today_tasks'];
    }
    return parsed;
  } catch {
    return ['open_tasks', 'stock_alerts', 'today_tasks'];
  }
}

function getTemplateClass(template: string): string {
  if (template === 'operations') {
    return 'grid-cols-1 xl:grid-cols-3';
  }
  if (template === 'analytics') {
    return 'grid-cols-1 lg:grid-cols-2';
  }
  return 'grid-cols-1 lg:grid-cols-2';
}

export default async function DashboardPage() {
  const session = await requireAuthSession();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    preference,
    totalUsers,
    openTasks,
    upcomingTasks,
    workers,
    pendingWorkerPayments,
    stockRows,
    harvestSum,
    recentMovements,
  ] = await Promise.all([
    prisma.dashboardPreference.findUnique({
      where: {
        tenantId_userId: {
          tenantId: session.tenantId,
          userId: session.userId,
        },
      },
    }),
    prisma.tenantUserMembership.count({
      where: {
        tenantId: session.tenantId,
      },
    }),
    prisma.task.count({
      where: {
        tenantId: session.tenantId,
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'LATE'],
        },
      },
    }),
    prisma.task.findMany({
      where: {
        tenantId: session.tenantId,
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'LATE'],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
      include: {
        lotLinks: {
          include: {
            lot: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.worker.count({
      where: {
        tenantId: session.tenantId,
        active: true,
      },
    }),
    prisma.worker.count({
      where: {
        tenantId: session.tenantId,
        paymentStatus: {
          in: ['PENDING', 'PARTIAL'],
        },
      },
    }),
    prisma.warehouseStock.findMany({
      where: {
        warehouse: {
          tenantId: session.tenantId,
        },
      },
      include: {
        item: {
          select: {
            name: true,
          },
        },
        warehouse: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.harvestRecord.aggregate({
      where: {
        tenantId: session.tenantId,
        harvestDate: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        kilos: true,
      },
    }),
    prisma.inventoryMovement.findMany({
      where: {
        tenantId: session.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 8,
      include: {
        item: {
          select: {
            name: true,
            unit: true,
          },
        },
        sourceWarehouse: {
          select: {
            name: true,
          },
        },
        destinationWarehouse: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const selectedWidgets = parseWidgets(preference?.widgetsJson || null);
  const templateKey = preference?.templateKey || 'balanced';

  const stockAlerts = stockRows.filter((stock) => {
    const alertLevel = resolveStockAlertLevel(
      stock.quantity,
      stock.lowThreshold,
      stock.criticalThreshold
    );
    return alertLevel !== 'OK';
  });

  const isAdmin = session.role === 'ADMIN';

  const baseCards = [
    {
      label: 'Tareas abiertas',
      value: openTasks,
      helper: 'Pendientes + en progreso + atrasadas',
      color: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      label: 'Trabajadores activos',
      value: workers,
      helper: 'Personal operativo habilitado',
      color: 'border-blue-200 bg-blue-50 text-blue-800',
    },
    {
      label: 'Alertas de stock',
      value: stockAlerts.length,
      helper: 'Bajo, crítico o sin stock',
      color: 'border-red-200 bg-red-50 text-red-800',
    },
    {
      label: 'Kilos cosechados (30d)',
      value: Number(harvestSum._sum.kilos || 0).toLocaleString('es-AR'),
      helper: 'Producción registrada reciente',
      color: 'border-green-200 bg-green-50 text-green-800',
    },
    {
      label: 'Pagos pendientes',
      value: pendingWorkerPayments,
      helper: 'Trabajadores con pagos a regularizar',
      color: 'border-purple-200 bg-purple-50 text-purple-800',
    },
  ];

  if (isAdmin) {
    baseCards.unshift({
      label: 'Usuarios activos e invitados',
      value: totalUsers,
      helper: 'Gestión global del acceso',
      color: 'border-slate-200 bg-slate-50 text-slate-800',
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Vista general de Campo, Inventario y Trabajadores según tu rol.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Rol: {isAdmin ? 'Administrador' : 'Supervisor Operativo'}</span>
          <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Tenant: {session.tenantId}</span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {baseCards.map((card) => (
          <article
            key={card.label}
            className={`rounded-xl border p-4 ${card.color}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs opacity-80">{card.helper}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Configuración del Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Elegí template y widgets. La configuración se guarda por usuario.
        </p>

        <form action={updateDashboardPreferenceAction} className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Template</span>
            <select
              name="templateKey"
              defaultValue={templateKey}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            >
              {templateOptions.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-sm font-medium text-gray-700">Widgets visibles</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {widgetCatalog.map((widget) => (
                <label key={widget.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="widgets"
                    value={widget.id}
                    defaultChecked={selectedWidgets.includes(widget.id)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600"
                  />
                  {widget.label}
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Guardar configuración
            </button>
          </div>
        </form>
      </section>

      <section className={`grid gap-4 ${getTemplateClass(templateKey)}`}>
        {selectedWidgets.includes('today_tasks') ? (
          <article className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Tareas próximas</h3>
              <Link href="/dashboard/campo" className="text-sm text-green-700 hover:underline">
                Ver campo
              </Link>
            </div>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-gray-500">No hay tareas próximas.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingTasks.map((task) => (
                  <li key={task.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                    <p className="font-medium text-gray-900">{task.description}</p>
                    <p className="text-xs text-gray-500">
                      Vence: {task.dueDate.toLocaleDateString('es-AR')} • {task.taskType}
                    </p>
                    <p className="text-xs text-gray-500">
                      Lotes: {task.lotLinks.map((link) => link.lot.name).join(', ') || 'Sin lote'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ) : null}

        {selectedWidgets.includes('stock_alerts') ? (
          <article className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Alertas de inventario</h3>
              <Link href="/dashboard/inventario" className="text-sm text-green-700 hover:underline">
                Ver inventario
              </Link>
            </div>
            {stockAlerts.length === 0 ? (
              <p className="text-sm text-gray-500">No hay alertas de stock.</p>
            ) : (
              <ul className="space-y-2">
                {stockAlerts.slice(0, 8).map((stock) => {
                  const level = resolveStockAlertLevel(
                    stock.quantity,
                    stock.lowThreshold,
                    stock.criticalThreshold
                  );
                  return (
                    <li key={stock.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                      <p className="font-medium text-gray-900">{stock.item.name}</p>
                      <p className="text-xs text-gray-500">
                        Depósito: {stock.warehouse.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Stock: {stock.quantity.toLocaleString('es-AR')} • Estado: {level}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        ) : null}

        {selectedWidgets.includes('inventory_movements') ? (
          <article className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900">Movimientos recientes</h3>
            {recentMovements.length === 0 ? (
              <p className="text-sm text-gray-500">Sin movimientos recientes.</p>
            ) : (
              <ul className="space-y-2">
                {recentMovements.map((movement) => (
                  <li key={movement.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                    <p className="font-medium text-gray-900">
                      {movement.type} • {movement.item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {movement.quantity.toLocaleString('es-AR')} {movement.item.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      {movement.sourceWarehouse?.name || '-'} → {movement.destinationWarehouse?.name || '-'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ) : null}

        {selectedWidgets.includes('pending_payments') ? (
          <article className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900">Pagos de trabajadores</h3>
            <p className="text-sm text-gray-600">
              Trabajadores con pago pendiente o parcial: {pendingWorkerPayments}
            </p>
            <Link href="/dashboard/trabajadores" className="mt-2 inline-block text-sm text-green-700 hover:underline">
              Ir a Trabajadores
            </Link>
          </article>
        ) : null}

        {selectedWidgets.includes('harvest_kilos') ? (
          <article className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900">Cosecha reciente</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {Number(harvestSum._sum.kilos || 0).toLocaleString('es-AR')} kg
            </p>
            <p className="text-sm text-gray-500">Registros de los últimos 30 días.</p>
          </article>
        ) : null}
      </section>
    </div>
  );
}
