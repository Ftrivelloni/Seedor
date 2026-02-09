import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { PreseleccionPageClient } from './PreseleccionPageClient';
import type { SerializedPreselection, SerializedBin, SerializedWorkerOption } from '../types';

export default async function PreseleccionPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);
  const tenantId = session.tenantId;

  const [activePs, historyPs, yardBins, workers] = await Promise.all([
    prisma.preselectionSession.findFirst({
      where: { tenantId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
      include: {
        inputBins: { include: { bin: { select: { netWeight: true } } } },
        outputBins: { select: { id: true } },
        workers: { include: { worker: { select: { firstName: true, lastName: true } } } },
        outputConfig: { orderBy: { outputNumber: 'asc' } },
      },
      orderBy: { startTime: 'desc' },
    }),
    prisma.preselectionSession.findMany({
      where: { tenantId, status: 'COMPLETED' },
      include: {
        inputBins: { include: { bin: { select: { netWeight: true } } } },
        outputBins: { select: { id: true } },
        workers: { include: { worker: { select: { firstName: true, lastName: true } } } },
        outputConfig: { orderBy: { outputNumber: 'asc' } },
      },
      orderBy: { startTime: 'desc' },
      take: 20,
    }),
    prisma.packingBin.findMany({
      where: { tenantId, status: 'IN_YARD' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.worker.findMany({
      where: { tenantId, active: true },
      select: { id: true, firstName: true, lastName: true, functionType: true },
      orderBy: { firstName: 'asc' },
    }),
  ]);

  const serializePs = (ps: NonNullable<typeof activePs>): SerializedPreselection => ({
    id: ps.id,
    code: ps.code,
    status: ps.status,
    startTime: ps.startTime.toISOString(),
    endTime: ps.endTime?.toISOString() ?? null,
    totalDurationHours: ps.totalDurationHours,
    pauseCount: ps.pauseCount,
    totalPauseHours: ps.totalPauseHours,
    discardKg: ps.discardKg,
    notes: ps.notes,
    inputBinCount: ps.inputBins.length,
    outputBinCount: ps.outputBins.length,
    totalInputKg: ps.inputBins.reduce((acc, ib) => acc + ib.bin.netWeight, 0),
    workers: ps.workers.map((w) => ({
      id: w.id,
      workerId: w.workerId,
      workerName: `${w.worker.firstName} ${w.worker.lastName}`,
      role: w.role,
      hoursWorked: w.hoursWorked,
    })),
    outputConfig: ps.outputConfig.map((oc) => ({
      id: oc.id,
      outputNumber: oc.outputNumber,
      color: oc.color,
      caliber: oc.caliber,
      isDiscard: oc.isDiscard,
      label: oc.label,
    })),
  });

  const serializedYardBins: SerializedBin[] = yardBins.map((b) => ({
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

  const serializedWorkers: SerializedWorkerOption[] = workers.map((w) => ({
    id: w.id,
    firstName: w.firstName,
    lastName: w.lastName,
    functionType: w.functionType,
  }));

  return (
    <PreseleccionPageClient
      activePreselection={activePs ? serializePs(activePs) : null}
      history={historyPs.map(serializePs)}
      availableBins={serializedYardBins}
      workers={serializedWorkers}
    />
  );
}
