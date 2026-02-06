import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { resolveStockAlertLevel } from '@/lib/domain/inventory';
import {
  createExtraordinaryItemAction,
  createInventoryItemAction,
  createInventoryMovementAction,
  createWarehouseAction,
  markExtraordinaryDeliveredAction,
  updateStockThresholdAction,
} from '@/app/dashboard/inventario/actions';

export default async function InventarioPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const [warehouses, items, movements, extraordinaryRequests] = await Promise.all([
    prisma.warehouse.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        stocks: {
          include: {
            item: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        stocks: {
          include: {
            warehouse: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.inventoryMovement.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        item: {
          select: {
            name: true,
            unit: true,
            code: true,
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
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    }),
    prisma.extraordinaryItemRequest.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        requestedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    }),
  ]);

  const allStocks = warehouses.flatMap((warehouse) =>
    warehouse.stocks.map((stock) => ({
      ...stock,
      warehouseName: warehouse.name,
    }))
  );

  const alerts = allStocks
    .map((stock) => ({
      stock,
      level: resolveStockAlertLevel(stock.quantity, stock.lowThreshold, stock.criticalThreshold),
    }))
    .filter((entry) => entry.level !== 'OK');

  const lowStockCount = alerts.filter((entry) => entry.level === 'BAJO').length;
  const criticalCount = alerts.filter((entry) => entry.level === 'CRITICO').length;
  const outOfStockCount = alerts.filter((entry) => entry.level === 'SIN_STOCK').length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Inventario</h1>
        <p className="text-sm text-gray-600">
          Depósitos, insumos, movimientos, alertas de stock y pedidos extraordinarios.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <p className="text-xs font-medium uppercase tracking-wide">Depósitos</p>
          <p className="mt-2 text-2xl font-semibold">{warehouses.length}</p>
        </article>
        <article className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <p className="text-xs font-medium uppercase tracking-wide">Insumos</p>
          <p className="mt-2 text-2xl font-semibold">{items.length}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-xs font-medium uppercase tracking-wide">Alertas</p>
          <p className="mt-2 text-2xl font-semibold">{alerts.length}</p>
          <p className="text-xs opacity-80">Bajo: {lowStockCount} · Crítico: {criticalCount} · Sin stock: {outOfStockCount}</p>
        </article>
        <article className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-purple-800">
          <p className="text-xs font-medium uppercase tracking-wide">Movimientos recientes</p>
          <p className="mt-2 text-2xl font-semibold">{movements.length}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900">Nuevo depósito</h2>
          <form action={createWarehouseAction} className="mt-3 space-y-2">
            <input name="name" required placeholder="Nombre" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <input name="description" placeholder="Descripción" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
              Crear depósito
            </button>
          </form>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900">Nuevo insumo</h2>
          <form action={createInventoryItemAction} className="mt-3 space-y-2">
            <input name="name" required placeholder="Nombre del ítem" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <input name="description" required placeholder="Descripción" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <input name="unit" required placeholder="Unidad (kg, L, cajas, etc.)" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input name="lowThreshold" type="number" min="0" step="0.01" placeholder="Umbral bajo" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
              <input name="criticalThreshold" type="number" min="0" step="0.01" placeholder="Umbral crítico" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
              Crear insumo
            </button>
          </form>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900">Registrar movimiento</h2>
          <p className="mt-1 text-xs text-gray-500">
            Ingreso, traslado o consumo. Los cambios actualizan stock automáticamente.
          </p>
          <form action={createInventoryMovementAction} className="mt-3 space-y-2">
            <select name="type" defaultValue="INCOME" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="INCOME">Ingreso</option>
              <option value="TRANSFER">Traslado</option>
              <option value="CONSUMPTION">Consumo</option>
              <option value="ADJUSTMENT">Ajuste</option>
            </select>
            <select name="itemId" required className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="">Insumo</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
            <input name="quantity" type="number" min="0.01" step="0.01" required placeholder="Cantidad" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <select name="sourceWarehouseId" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="">Depósito origen (si aplica)</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <select name="destinationWarehouseId" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="">Depósito destino (si aplica)</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <input name="notes" placeholder="Referencia / notas" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
              Registrar movimiento
            </button>
          </form>
        </article>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Stock por depósito e ítem</h2>
        <p className="mt-1 text-sm text-gray-600">
          Umbrales de bajo stock por depósito (independientes por cada combinación depósito-insumo).
        </p>

        <div className="mt-4 space-y-4">
          {warehouses.map((warehouse) => (
            <article key={warehouse.id} className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">{warehouse.name}</h3>
              <p className="text-xs text-gray-500">{warehouse.description || 'Sin descripción'}</p>

              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500">Ítem</th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500">Stock</th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500">Alerta</th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500">Umbrales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {warehouse.stocks.map((stock) => {
                      const level = resolveStockAlertLevel(
                        stock.quantity,
                        stock.lowThreshold,
                        stock.criticalThreshold
                      );

                      return (
                        <tr key={stock.id}>
                          <td className="px-3 py-2 text-gray-800">
                            {stock.item.code} · {stock.item.name}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {stock.quantity.toLocaleString('es-AR')} {stock.item.unit}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{level}</td>
                          <td className="px-3 py-2">
                            <form action={updateStockThresholdAction} className="flex items-center gap-2">
                              <input type="hidden" name="stockId" value={stock.id} />
                              <input
                                name="lowThreshold"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={stock.lowThreshold}
                                className="w-24 rounded-md border border-gray-300 px-2 py-1"
                              />
                              <input
                                name="criticalThreshold"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={stock.criticalThreshold}
                                className="w-24 rounded-md border border-gray-300 px-2 py-1"
                              />
                              <button type="submit" className="rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-100">
                                Guardar
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Reporte de movimientos</h2>
          <p className="mt-1 text-sm text-gray-600">
            Historial para control, verificación y análisis de consumo/reposición.
          </p>

          <div className="mt-3 space-y-2">
            {movements.map((movement) => (
              <div key={movement.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-900">
                  {movement.type} · {movement.item.code} · {movement.item.name}
                </p>
                <p className="text-xs text-gray-600">
                  {movement.quantity.toLocaleString('es-AR')} {movement.item.unit}
                </p>
                <p className="text-xs text-gray-600">
                  {movement.sourceWarehouse?.name || '-'} → {movement.destinationWarehouse?.name || '-'}
                </p>
                <p className="text-xs text-gray-500">
                  {movement.createdAt.toLocaleString('es-AR')} · {movement.createdByUser ? `${movement.createdByUser.firstName} ${movement.createdByUser.lastName}` : 'Sistema'}
                </p>
                {movement.notes ? <p className="text-xs text-gray-500">{movement.notes}</p> : null}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Ítems extraordinarios</h2>
          <p className="mt-1 text-sm text-gray-600">
            Pedidos puntuales fuera del stock habitual. Preparado para integrar notificaciones externas.
          </p>

          <form action={createExtraordinaryItemAction} className="mt-3 space-y-2">
            <input name="name" required placeholder="Nombre del ítem" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <input name="description" required placeholder="Descripción" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <input name="requestedAt" type="datetime-local" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
              Registrar pedido
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {extraordinaryRequests.map((request) => (
              <div key={request.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-900">{request.name}</p>
                <p className="text-xs text-gray-600">{request.description}</p>
                <p className="text-xs text-gray-500">
                  Pedido por {request.requestedByUser.firstName} {request.requestedByUser.lastName} · {request.requestedAt.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-gray-500">Estado: {request.status}</p>

                {request.status === 'PENDING' ? (
                  <form action={markExtraordinaryDeliveredAction} className="mt-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <button type="submit" className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100">
                      Marcar como entregado
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-gray-500">
                    Entregado: {request.deliveredAt ? request.deliveredAt.toLocaleString('es-AR') : '-'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
