import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { MaquinariaPageClient } from './MaquinariaPageClient';
import { computeServiceStatus } from './types';
import type { SerializedMachine } from './types';

export default async function MaquinariaPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const machines = await prisma.machine.findMany({
    where: { tenantId: session.tenantId, active: true },
    include: {
      movements: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true, type: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const serializedMachines: SerializedMachine[] = machines.map((m) => {
    const hoursSince = m.hourMeter - m.lastServiceHourMeter;
    const daysSince = m.lastServiceAt
      ? Math.floor((Date.now() - m.lastServiceAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const antiquityYears = m.acquisitionDate
      ? Math.round(((Date.now() - m.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10
      : 0;

    const serviceStatus = computeServiceStatus(
      m.hourMeter,
      m.lastServiceHourMeter,
      m.lastServiceAt?.toISOString() ?? null,
      m.serviceIntervalHours,
      m.serviceIntervalDays,
    );

    return {
      id: m.id,
      name: m.name,
      description: m.description,
      type: m.type,
      location: m.location,
      imageUrl: m.imageUrl,
      acquisitionDate: m.acquisitionDate?.toISOString() ?? null,
      hourMeter: m.hourMeter,
      totalCost: m.totalCost,
      serviceIntervalHours: m.serviceIntervalHours,
      serviceIntervalDays: m.serviceIntervalDays,
      lastServiceAt: m.lastServiceAt?.toISOString() ?? null,
      lastServiceHourMeter: m.lastServiceHourMeter,
      active: m.active,
      createdAt: m.createdAt.toISOString(),
      serviceStatus,
      hoursSinceLastService: hoursSince,
      daysSinceLastService: daysSince,
      antiquityYears,
    };
  });

  return <MaquinariaPageClient machines={serializedMachines} />;
}
