import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { LotDetailClient } from './LotDetailClient';
import type {
  SerializedField,
  SerializedLot,
  SerializedTask,
  SerializedHarvest,
  SerializedWorker,
  SerializedInventoryItem,
  SerializedWarehouse,
  SerializedTaskType,
} from '../../types';

interface LotPageProps {
  params: Promise<{ fieldId: string; lotId: string }>;
}

export default async function LotPage({ params }: LotPageProps) {
  const { fieldId, lotId } = await params;
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const [field, lot, tasks, harvests, workers, inventoryItems, warehouses, taskTypes, allFields] =
    await Promise.all([
      prisma.field.findFirst({
        where: { id: fieldId, tenantId: session.tenantId },
        include: {
          lots: {
            include: {
              taskLinks: {
                include: {
                  task: { select: { id: true, costValue: true, status: true } },
                },
              },
              harvestRecords: { select: { kilos: true } },
              lotCrops: { include: { cropType: { select: { name: true } } } },
            },
            orderBy: { name: 'asc' },
          },
        },
      }),
      prisma.lot.findFirst({
        where: { id: lotId, fieldId, tenantId: session.tenantId },
        include: {
          taskLinks: {
            include: {
              task: { select: { id: true, costValue: true, status: true } },
            },
          },
          harvestRecords: { select: { kilos: true } },
          lotCrops: { include: { cropType: { select: { name: true } } } },
        },
      }),
      prisma.task.findMany({
        where: {
          tenantId: session.tenantId,
          lotLinks: { some: { lotId } },
        },
        include: {
          lotLinks: { include: { lot: { select: { name: true } } } },
          workerAssignments: {
            include: { worker: { select: { firstName: true, lastName: true } } },
          },
          subtasks: { select: { id: true, description: true, status: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.harvestRecord.findMany({
        where: { lotId, tenantId: session.tenantId },
        include: {
          lot: {
            select: { name: true, field: { select: { name: true } } },
          },
        },
        orderBy: { harvestDate: 'desc' },
      }),
      prisma.worker.findMany({
        where: { tenantId: session.tenantId, active: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.inventoryItem.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' },
      }),
      prisma.warehouse.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' },
      }),
      prisma.taskType.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' },
      }),
      prisma.field.findMany({
        where: { tenantId: session.tenantId },
        include: {
          lots: {
            include: {
              taskLinks: {
                include: {
                  task: { select: { id: true, costValue: true, status: true } },
                },
              },
              harvestRecords: { select: { kilos: true } },
              lotCrops: { include: { cropType: { select: { name: true } } } },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

  if (!field || !lot) notFound();

  /* ── Serialize field ── */
  const serializedField: SerializedField = {
    id: field.id,
    name: field.name,
    location: field.location,
    description: field.description,
    lots: field.lots.map((l) => ({
      id: l.id,
      fieldId: l.fieldId,
      name: l.name,
      areaHectares: l.areaHectares,
      productionType: l.productionType,
      plantedFruitsDescription: l.plantedFruitsDescription,
      crops: (l as any).lotCrops?.map((lc: { cropType: { name: string } }) => lc.cropType.name) ?? [],
      lastTaskAt: l.lastTaskAt?.toISOString() ?? null,
      taskCost: l.taskLinks.reduce(
        (acc, link) => acc + Number(link.task.costValue || 0),
        0
      ),
      totalHarvestKilos: l.harvestRecords.reduce((acc, h) => acc + h.kilos, 0),
      taskCount: l.taskLinks.length,
      taskRecency: {},
    })),
  };

  /* ── Serialize lot ── */
  const serializedLot: SerializedLot = {
    id: lot.id,
    fieldId: lot.fieldId,
    name: lot.name,
    areaHectares: lot.areaHectares,
    productionType: lot.productionType,
    plantedFruitsDescription: lot.plantedFruitsDescription,
    crops: (lot as any).lotCrops?.map((lc: { cropType: { name: string } }) => lc.cropType.name) ?? [],
    lastTaskAt: lot.lastTaskAt?.toISOString() ?? null,
    taskCost: lot.taskLinks.reduce(
      (acc, link) => acc + Number(link.task.costValue || 0),
      0
    ),
    totalHarvestKilos: lot.harvestRecords.reduce((acc, h) => acc + h.kilos, 0),
    taskCount: lot.taskLinks.length,
    taskRecency: {},
  };

  /* ── Serialize tasks ── */
  const now = new Date();
  const serializedTasks: SerializedTask[] = tasks.map((t) => {
    const calculatedStatus =
      t.status !== 'COMPLETED' && t.dueDate < now && t.status !== 'LATE'
        ? 'LATE'
        : t.status;

    const completedSubs = t.subtasks.filter((s) => s.status === 'COMPLETED').length;
    const subtaskProgress = t.subtasks.length
      ? Math.round((completedSubs / t.subtasks.length) * 100)
      : 0;

    return {
      id: t.id,
      description: t.description,
      taskType: t.taskType,
      status: calculatedStatus,
      costValue: t.costValue,
      costUnit: t.costUnit,
      startDate: t.startDate.toISOString(),
      dueDate: t.dueDate.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
      isComposite: t.isComposite,
      parentTaskId: t.parentTaskId ?? null,
      subtaskProgress,
      subtasks: t.subtasks.map((s) => ({
        id: s.id,
        description: s.description,
        status: s.status,
      })),
      lots: t.lotLinks.map((l) => l.lot.name),
      workers: t.workerAssignments.map(
        (a) => `${a.worker.firstName} ${a.worker.lastName}`
      ),
      createdAt: t.createdAt.toISOString(),
    };
  });

  /* ── Serialize harvests ── */
  const serializedHarvests: SerializedHarvest[] = harvests.map((h) => ({
    id: h.id,
    lotId: h.lotId,
    lotName: h.lot.name,
    fieldName: h.lot.field.name,
    cropType: h.cropType,
    kilos: h.kilos,
    harvestDate: h.harvestDate.toISOString(),
  }));

  /* ── Serialize workers ── */
  const serializedWorkers: SerializedWorker[] = workers.map((w) => ({
    id: w.id,
    firstName: w.firstName,
    lastName: w.lastName,
    functionType: w.functionType,
  }));

  /* ── Serialize inventory items ── */
  const serializedItems: SerializedInventoryItem[] = inventoryItems.map((i) => ({
    id: i.id,
    code: i.code,
    name: i.name,
    unit: i.unit,
  }));

  /* ── Serialize warehouses ── */
  const serializedWarehouses: SerializedWarehouse[] = warehouses.map((w) => ({
    id: w.id,
    name: w.name,
  }));

  /* ── Serialize task types ── */
  const serializedTaskTypes: SerializedTaskType[] = taskTypes.map((tt) => ({
    id: tt.id,
    name: tt.name,
    color: tt.color,
  }));

  /* ── Serialize all fields for task modal ── */
  const serializedAllFields: SerializedField[] = allFields.map((f) => ({
    id: f.id,
    name: f.name,
    location: f.location,
    description: f.description,
    lots: f.lots.map((l) => ({
      id: l.id,
      fieldId: l.fieldId,
      name: l.name,
      areaHectares: l.areaHectares,
      productionType: l.productionType,
      plantedFruitsDescription: l.plantedFruitsDescription,
      crops: l.lotCrops.map((lc: { cropType: { name: string } }) => lc.cropType.name),
      lastTaskAt: l.lastTaskAt?.toISOString() ?? null,
      taskCost: l.taskLinks.reduce((acc, link) => acc + Number(link.task.costValue || 0), 0),
      totalHarvestKilos: l.harvestRecords.reduce((acc, h) => acc + h.kilos, 0),
      taskCount: l.taskLinks.length,
      taskRecency: {},
    })),
  }));

  return (
    <LotDetailClient
      field={serializedField}
      allFields={serializedAllFields}
      lot={serializedLot}
      tasks={serializedTasks}
      harvests={serializedHarvests}
      workers={serializedWorkers}
      inventoryItems={serializedItems}
      warehouses={serializedWarehouses}
      taskTypes={serializedTaskTypes}
    />
  );
}
