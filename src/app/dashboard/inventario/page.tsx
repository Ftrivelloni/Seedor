import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { resolveStockAlertLevel } from '@/lib/domain/inventory';
import { InventoryPageClient } from './InventoryPageClient';
import type {
  SerializedWarehouse,
  SerializedItem,
  SerializedMovement,
  SerializedExtraordinaryRequest,
  SerializedAlert,
} from './types';

export default async function InventarioPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const [warehouses, items, movements, extraordinaryRequests] = await Promise.all([
    prisma.warehouse.findMany({
      where: { tenantId: session.tenantId },
      include: {
        stocks: {
          include: { item: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.inventoryItem.findMany({
      where: { tenantId: session.tenantId },
      include: {
        stocks: {
          include: {
            warehouse: { select: { name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.inventoryMovement.findMany({
      where: { tenantId: session.tenantId },
      include: {
        item: { select: { name: true, unit: true, code: true } },
        sourceWarehouse: { select: { name: true } },
        destinationWarehouse: { select: { name: true } },
        createdByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.extraordinaryItemRequest.findMany({
      where: { tenantId: session.tenantId },
      include: {
        requestedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { requestedAt: 'desc' },
    }),
  ]);

  /* ── serialize for client ── */
  const serializedWarehouses: SerializedWarehouse[] = warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    stocks: w.stocks.map((s) => {
      const level = resolveStockAlertLevel(s.quantity, s.lowThreshold, s.criticalThreshold);
      return {
        id: s.id,
        itemId: s.itemId,
        itemCode: s.item.code,
        itemName: s.item.name,
        itemUnit: s.item.unit,
        quantity: s.quantity,
        lowThreshold: s.lowThreshold,
        criticalThreshold: s.criticalThreshold,
        alertLevel: level,
      };
    }),
  }));

  const serializedItems: SerializedItem[] = items.map((i) => ({
    id: i.id,
    code: i.code,
    name: i.name,
    description: i.description,
    unit: i.unit,
    createdAt: i.createdAt.toISOString(),
    stocks: i.stocks.map((s) => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      quantity: s.quantity,
      lowThreshold: s.lowThreshold,
      criticalThreshold: s.criticalThreshold,
    })),
  }));

  const serializedMovements: SerializedMovement[] = movements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    itemCode: m.item.code,
    itemName: m.item.name,
    itemUnit: m.item.unit,
    sourceWarehouseName: m.sourceWarehouse?.name ?? null,
    destinationWarehouseName: m.destinationWarehouse?.name ?? null,
    createdByName: m.createdByUser
      ? `${m.createdByUser.firstName} ${m.createdByUser.lastName}`
      : null,
  }));

  const serializedExtraordinary: SerializedExtraordinaryRequest[] =
    extraordinaryRequests.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status,
      requestedAt: r.requestedAt.toISOString(),
      deliveredAt: r.deliveredAt?.toISOString() ?? null,
      requestedByName: `${r.requestedByUser.firstName} ${r.requestedByUser.lastName}`,
    }));

  /* ── alerts ── */
  const alerts: SerializedAlert[] = serializedWarehouses.flatMap((w) =>
    w.stocks
      .filter((s) => s.alertLevel !== 'OK')
      .map((s) => ({
        stockId: s.id,
        warehouseName: w.name,
        itemCode: s.itemCode,
        itemName: s.itemName,
        itemUnit: s.itemUnit,
        quantity: s.quantity,
        lowThreshold: s.lowThreshold,
        criticalThreshold: s.criticalThreshold,
        level: s.alertLevel,
      }))
  );

  return (
    <InventoryPageClient
      warehouses={serializedWarehouses}
      items={serializedItems}
      movements={serializedMovements}
      extraordinaryRequests={serializedExtraordinary}
      alerts={alerts}
    />
  );
}
