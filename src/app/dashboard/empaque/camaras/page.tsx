import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { CamarasPageClient } from './CamarasPageClient';
import type { SerializedChamber, SerializedBin } from '../types';

export default async function CamarasPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);
  const tenantId = session.tenantId;

  const [chambers, availableBins] = await Promise.all([
    prisma.chamber.findMany({
      where: { tenantId },
      include: {
        bins: {
          where: { status: 'IN_CHAMBER' },
          orderBy: { chamberEntryDate: 'asc' },
        },
        tasks: { orderBy: { date: 'desc' }, take: 20 },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.packingBin.findMany({
      where: {
        tenantId,
        status: { in: ['IN_YARD', 'READY_FOR_PROCESS'] },
        fruitColor: { in: ['Color 3', 'Color 4'] },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const serializedChambers: SerializedChamber[] = chambers.map((ch) => ({
    id: ch.id,
    name: ch.name,
    type: ch.type,
    capacity: ch.capacity,
    temperature: ch.temperature,
    humidity: ch.humidity,
    binsCount: ch.bins.length,
    totalKg: ch.bins.reduce((acc, b) => acc + b.netWeight, 0),
    bins: ch.bins.map((b) => ({
      id: b.id,
      code: b.code,
      binIdentifier: b.binIdentifier,
      fieldName: b.fieldName,
      fruitType: b.fruitType,
      lotName: b.lotName,
      contractor: b.contractor,
      harvestType: b.harvestType,
      binType: b.binType,
      emptyWeight: b.emptyWeight,
      netWeight: b.netWeight,
      isTrazable: b.isTrazable,
      status: b.status,
      truckEntryId: b.truckEntryId,
      preselectionId: b.preselectionId,
      internalLot: b.internalLot,
      fruitColor: b.fruitColor,
      fruitQuality: b.fruitQuality,
      caliber: b.caliber,
      chamberId: b.chamberId,
      chamberEntryDate: b.chamberEntryDate?.toISOString() ?? null,
      chamberExitDate: b.chamberExitDate?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
    tasks: ch.tasks.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      cost: t.cost,
      date: t.date.toISOString(),
    })),
  }));

  const serializedAvailableBins: SerializedBin[] = availableBins.map((b) => ({
    id: b.id,
    code: b.code,
    binIdentifier: b.binIdentifier,
    fieldName: b.fieldName,
    fruitType: b.fruitType,
    lotName: b.lotName,
    contractor: b.contractor,
    harvestType: b.harvestType,
    binType: b.binType,
    emptyWeight: b.emptyWeight,
    netWeight: b.netWeight,
    isTrazable: b.isTrazable,
    status: b.status,
    truckEntryId: b.truckEntryId,
    preselectionId: b.preselectionId,
    internalLot: b.internalLot,
    fruitColor: b.fruitColor,
    fruitQuality: b.fruitQuality,
    caliber: b.caliber,
    chamberId: b.chamberId,
    chamberEntryDate: b.chamberEntryDate?.toISOString() ?? null,
    chamberExitDate: b.chamberExitDate?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <CamarasPageClient
      chambers={serializedChambers}
      availableBins={serializedAvailableBins}
    />
  );
}
