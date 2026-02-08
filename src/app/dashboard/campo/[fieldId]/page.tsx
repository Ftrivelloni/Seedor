import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { FieldDetailClient } from './FieldDetailClient';
import type { SerializedField, SerializedTaskType, SerializedCropType } from '../types';

interface FieldPageProps {
  params: Promise<{ fieldId: string }>;
}

export default async function FieldPage({ params }: FieldPageProps) {
  const { fieldId } = await params;
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const [field, taskTypes, cropTypes] = await Promise.all([
    prisma.field.findFirst({
      where: {
        id: fieldId,
        tenantId: session.tenantId,
      },
      include: {
        lots: {
          include: {
            taskLinks: {
              include: {
                task: {
                  select: {
                    id: true,
                    costValue: true,
                    status: true,
                    taskType: true,
                    createdAt: true,
                    completedAt: true,
                    startDate: true,
                  },
                },
              },
            },
            harvestRecords: { select: { kilos: true } },
            lotCrops: { include: { cropType: { select: { name: true } } } },
          },
          orderBy: { name: 'asc' },
        },
      },
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

  if (!field) notFound();

  const serializedField: SerializedField = {
    id: field.id,
    name: field.name,
    location: field.location,
    description: field.description,
    lots: field.lots.map((l) => {
      // Compute taskRecency: for each taskType, the ISO date of the most recent task
      const recency: Record<string, string> = {};
      for (const link of l.taskLinks) {
        const tt = link.task.taskType;
        const dateVal =
          link.task.completedAt ?? link.task.startDate ?? link.task.createdAt;
        const iso = dateVal instanceof Date ? dateVal.toISOString() : String(dateVal);
        if (!recency[tt] || iso > recency[tt]) {
          recency[tt] = iso;
        }
      }

      return {
        id: l.id,
        fieldId: l.fieldId,
        name: l.name,
        areaHectares: l.areaHectares,
        productionType: l.productionType,
        plantedFruitsDescription: l.plantedFruitsDescription,
        crops: l.lotCrops.map((lc: { cropType: { name: string } }) => lc.cropType.name),
        lastTaskAt: l.lastTaskAt?.toISOString() ?? null,
        taskCost: l.taskLinks.reduce(
          (acc, link) => acc + Number(link.task.costValue || 0),
          0
        ),
        totalHarvestKilos: l.harvestRecords.reduce(
          (acc, h) => acc + h.kilos,
          0
        ),
        taskCount: l.taskLinks.length,
        taskRecency: recency,
      };
    }),
  };

  const serializedTaskTypes: SerializedTaskType[] = taskTypes.map((tt) => ({
    id: tt.id,
    name: tt.name,
    color: tt.color,
  }));

  const serializedCropTypes: SerializedCropType[] = cropTypes.map((ct) => ({
    id: ct.id,
    name: ct.name,
    color: ct.color,
  }));

  return (
    <FieldDetailClient field={serializedField} taskTypes={serializedTaskTypes} cropTypes={serializedCropTypes} />
  );
}
