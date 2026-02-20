import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { CamarasPageClient } from './CamarasPageClient';
import type { SerializedChamber, SerializedBin } from '../types';

export default async function CamarasPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);
  const tenantId = session.tenantId;

  const [chambers, availableBins, egressedBins] = await Promise.all([
    prisma.chamber.findMany({
      where: { tenantId },
      include: {
        bins: {
          where: { status: 'IN_CHAMBER' },
          orderBy: { chamberEntryDate: 'asc' },
        },
        tasks: { orderBy: { date: 'desc' }, take: 50 },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.packingBin.findMany({
      where: {
        tenantId,
        status: 'READY_FOR_PROCESS',
        preselectionId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.packingBin.findMany({
      where: {
        tenantId,
        chamberExitDate: { not: null },
      },
      orderBy: { chamberExitDate: 'desc' },
      take: 50,
    }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializeBin = (b: any): SerializedBin => ({
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
  });

  const serializedChambers: SerializedChamber[] = chambers.map((ch) => ({
    id: ch.id,
    name: ch.name,
    binsCount: ch.bins.length,
    totalKg: ch.bins.reduce((acc, b) => acc + b.netWeight, 0),
    bins: ch.bins.map(serializeBin),
    tasks: ch.tasks.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      cost: t.cost,
      date: t.date.toISOString(),
    })),
  }));

  const serializedAvailableBins: SerializedBin[] = availableBins.map(serializeBin);
  const serializedEgressedBins: SerializedBin[] = egressedBins.map(serializeBin);

  return (
    <CamarasPageClient
      chambers={serializedChambers}
      availableBins={serializedAvailableBins}
      egressedBins={serializedEgressedBins}
    />
  );
}
