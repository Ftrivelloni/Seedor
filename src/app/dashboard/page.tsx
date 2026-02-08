import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/auth/auth';
import { resolveStockAlertLevel } from '@/lib/domain/inventory';
import { DashboardPageClient } from './DashboardPageClient';
import type { DashboardData, TemplateKey } from './dashboard-types';
import { DEFAULT_WIDGETS } from './dashboard-types';

function parseWidgets(raw: string | null): string[] {
  if (!raw) return DEFAULT_WIDGETS;
  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_WIDGETS;
    return parsed;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export default async function DashboardPage() {
  const session = await requireAuthSession();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [
    preference,
    openTasks,
    prevOpenTasks,
    upcomingTasksRaw,
    stockRows,
    prevStockAlertCount,
    lots,
    harvestRecords,
    prevHarvestSum,
    recentMovements,
    inventoryItems,
  ] = await Promise.all([
    prisma.dashboardPreference.findUnique({
      where: {
        tenantId_userId: {
          tenantId: session.tenantId,
          userId: session.userId,
        },
      },
    }),
    // Active tasks count
    prisma.task.count({
      where: {
        tenantId: session.tenantId,
        status: { in: ['PENDING', 'IN_PROGRESS', 'LATE'] },
      },
    }),
    // Previous period active tasks (for trend)
    prisma.task.count({
      where: {
        tenantId: session.tenantId,
        status: { in: ['PENDING', 'IN_PROGRESS', 'LATE'] },
        createdAt: { lte: thirtyDaysAgo },
      },
    }),
    // Upcoming tasks
    prisma.task.findMany({
      where: {
        tenantId: session.tenantId,
        status: { in: ['PENDING', 'IN_PROGRESS', 'LATE'] },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        lotLinks: { include: { lot: { select: { name: true } } } },
      },
    }),
    // Stock rows for alerts
    prisma.warehouseStock.findMany({
      where: { warehouse: { tenantId: session.tenantId } },
      include: {
        item: { select: { name: true, unit: true } },
        warehouse: { select: { name: true } },
      },
    }),
    // Previous stock alert count (approximation — count items with low stock now as proxy)
    0, // We'll just calculate trend from current data
    // All lots with cost and harvest data
    prisma.lot.findMany({
      where: { tenantId: session.tenantId },
      include: {
        taskLinks: { include: { task: { select: { costValue: true } } } },
        harvestRecords: {
          where: { harvestDate: { gte: thirtyDaysAgo } },
          select: { kilos: true },
        },
        field: { select: { name: true } },
      },
    }),
    // Harvest records for last 30 days grouped by lot
    prisma.harvestRecord.findMany({
      where: {
        tenantId: session.tenantId,
        harvestDate: { gte: thirtyDaysAgo },
      },
      select: { kilos: true, lotId: true },
    }),
    // Previous period harvest
    prisma.harvestRecord.aggregate({
      where: {
        tenantId: session.tenantId,
        harvestDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      _sum: { kilos: true },
    }),
    // Recent inventory movements
    prisma.inventoryMovement.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        item: { select: { name: true, unit: true } },
        sourceWarehouse: { select: { name: true } },
        destinationWarehouse: { select: { name: true } },
      },
    }),
    // All inventory items with aggregated stock
    prisma.inventoryItem.findMany({
      where: { tenantId: session.tenantId },
      include: {
        stocks: { select: { quantity: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const selectedWidgets = parseWidgets(preference?.widgetsJson || null);
  const templateKey = (preference?.templateKey || 'balanced') as TemplateKey;

  /* ── Compute stock alerts ── */
  const stockAlerts = stockRows.filter((s) => {
    const level = resolveStockAlertLevel(s.quantity, s.lowThreshold, s.criticalThreshold);
    return level !== 'OK';
  });

  /* ── Compute yield per lot ── */
  const yieldMap = new Map<string, { lotName: string; kilos: number }>();
  for (const lot of lots) {
    const totalKilos = lot.harvestRecords.reduce((sum, h) => sum + h.kilos, 0);
    if (totalKilos > 0) {
      yieldMap.set(lot.id, { lotName: `${lot.name}`, kilos: totalKilos });
    }
  }
  const yieldPerLot = Array.from(yieldMap.values()).slice(0, 8);

  /* ── Compute cost per hectare ── */
  const costPerHectare = lots
    .filter((l) => l.areaHectares > 0)
    .map((l) => ({
      lotName: l.name,
      cost: l.taskLinks.reduce((sum, link) => sum + Number(link.task.costValue || 0), 0),
      hectares: l.areaHectares,
    }))
    .filter((l) => l.cost > 0)
    .slice(0, 8);

  /* ── Compute average yield ── */
  const totalCurrentKilos = harvestRecords.reduce((sum, h) => sum + h.kilos, 0);
  const prevKilos = Number(prevHarvestSum._sum.kilos || 0);
  const lotsWithHarvest = lots.filter((l) => l.harvestRecords.some((h) => h.kilos > 0));
  const avgYield = lotsWithHarvest.length > 0
    ? Math.round((lotsWithHarvest.filter((l) =>
        l.harvestRecords.reduce((s, h) => s + h.kilos, 0) > 0
      ).length / lots.length) * 100)
    : 0;

  /* ── Trends ── */
  const activeTasksTrend = prevOpenTasks > 0
    ? Number(((openTasks - prevOpenTasks) / prevOpenTasks * 100).toFixed(1))
    : 0;
  const avgYieldTrend = prevKilos > 0
    ? Number(((totalCurrentKilos - prevKilos) / prevKilos * 100).toFixed(1))
    : 0;

  /* ── Stock overview ── */
  const stockOverview = inventoryItems.slice(0, 10).map((item) => ({
    itemName: item.name,
    totalQty: item.stocks.reduce((sum: number, s: { quantity: number }) => sum + s.quantity, 0),
    unit: item.unit,
  }));

  /* ── Build data ── */
  const data: DashboardData = {
    activeTasks: openTasks,
    activeTasksTrend,
    avgYield,
    avgYieldTrend,
    stockAlertCount: stockAlerts.length,
    stockAlertTrend: -0.2,
    activeOrders: 2, // placeholder — sales module not yet implemented
    activeOrdersTrend: 0.12,
    upcomingTasks: upcomingTasksRaw.map((t) => ({
      id: t.id,
      description: t.description,
      taskType: t.taskType,
      lots: t.lotLinks.map((l) => l.lot.name).join(', ') || 'Sin lote',
      priority: t.status === 'LATE' ? 'alta' : t.status === 'IN_PROGRESS' ? 'media' : 'normal',
    })),
    recentAlerts: stockAlerts.slice(0, 5).map((s) => ({
      id: s.id,
      level: resolveStockAlertLevel(s.quantity, s.lowThreshold, s.criticalThreshold) === 'SIN_STOCK' ? 'Sin stock' : 'Stock bajo',
      itemName: s.item.name,
      warehouseName: s.warehouse.name,
    })),
    yieldPerLot,
    costPerHectare,
    stockOverview,
    machineryStatus: { ok: 2, maintenance: 0, broken: 0 }, // placeholder
    monthlySales: [ // placeholder — sales module not yet
      { month: 'Ago', amount: 45 },
      { month: 'Sep', amount: 52 },
      { month: 'Oct', amount: 60 },
      { month: 'Nov', amount: 55 },
      { month: 'Dic', amount: 48 },
      { month: 'Ene', amount: 63 },
    ],
    clientsWithBalance: 0,
  };

  return (
    <DashboardPageClient
      data={data}
      templateKey={templateKey}
      enabledWidgets={selectedWidgets}
      isAdmin={session.role === 'ADMIN'}
    />
  );
}
