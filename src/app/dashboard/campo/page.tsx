import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { CampoPageClient } from './CampoPageClient';
import type {
  SerializedField,
  SerializedHarvest,
  SerializedTaskType,
  SerializedCropType,
} from './types';

export default async function CampoPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const [fields, recentHarvests, taskTypes, cropTypes] = await Promise.all([
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
    prisma.harvestRecord.findMany({
      where: { tenantId: session.tenantId },
      include: {
        lot: {
          select: { name: true, field: { select: { name: true } } },
        },
      },
      orderBy: { harvestDate: 'desc' },
      take: 50,
    }),
    prisma.taskType.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.cropType.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' },
    }),
  ]);

  /* ── Serialize fields ── */
  const serializedFields: SerializedField[] = fields.map((f) => ({
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
      crops: l.lotCrops.map((lc) => lc.cropType.name),
      lastTaskAt: l.lastTaskAt?.toISOString() ?? null,
      taskCost: l.taskLinks.reduce((acc, link) => acc + Number(link.task.costValue || 0), 0),
      totalHarvestKilos: l.harvestRecords.reduce((acc, h) => acc + h.kilos, 0),
      taskCount: l.taskLinks.length,
      taskRecency: {},
    })),
  }));

  /* ── Serialize harvests ── */
  const serializedHarvests: SerializedHarvest[] = recentHarvests.map((h) => ({
    id: h.id,
    lotId: h.lotId,
    lotName: h.lot.name,
    fieldName: h.lot.field.name,
    cropType: h.cropType,
    kilos: h.kilos,
    harvestDate: h.harvestDate.toISOString(),
  }));

  /* ── Serialize task types ── */
  const serializedTaskTypes: SerializedTaskType[] = taskTypes.map((tt) => ({
    id: tt.id,
    name: tt.name,
    color: tt.color,
  }));

  /* ── Serialize crop types ── */
  const serializedCropTypes: SerializedCropType[] = cropTypes.map((ct) => ({
    id: ct.id,
    name: ct.name,
    color: ct.color,
  }));

  return (
    <CampoPageClient
      fields={serializedFields}
      recentHarvests={serializedHarvests}
      taskTypes={serializedTaskTypes}
      cropTypes={serializedCropTypes}
    />
  );
}
