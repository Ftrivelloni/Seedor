import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { PreseleccionPageClient } from './PreseleccionPageClient';
import type { SerializedPreselection, SerializedBin, SerializedWorkerOption } from '../types';

export default async function PreseleccionPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);
  const tenantId = session.tenantId;

  const binSelect = {
    id: true,
    code: true,
    binIdentifier: true,
    fieldName: true,
    fruitType: true,
    lotName: true,
    contractor: true,
    harvestType: true,
    binType: true,
    emptyWeight: true,
    netWeight: true,
    isTrazable: true,
    status: true,
    truckEntryId: true,
    preselectionId: true,
    internalLot: true,
    fruitColor: true,
    fruitQuality: true,
    caliber: true,
    chamberId: true,
    chamberEntryDate: true,
    chamberExitDate: true,
    createdAt: true,
  } as const;

  const [activePs, historyPs, yardBins, preselectionYardBins, workers, fieldsWithLots, inventoryItems, warehouses] = await Promise.all([
    prisma.preselectionSession.findFirst({
      where: { tenantId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
      include: {
        inputBins: { include: { bin: { select: { netWeight: true } } } },
        outputBins: { select: binSelect },
        workers: { include: { worker: { select: { firstName: true, lastName: true } } } },
        outputConfig: { orderBy: { outputNumber: 'asc' } },
      },
      orderBy: { startTime: 'desc' },
    }),
    prisma.preselectionSession.findMany({
      where: { tenantId, status: 'COMPLETED' },
      include: {
        inputBins: { include: { bin: { select: { netWeight: true } } } },
        outputBins: { select: binSelect },
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
    prisma.packingBin.findMany({
      where: { tenantId, status: 'READY_FOR_PROCESS', preselectionId: { not: null } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.worker.findMany({
      where: { tenantId, active: true },
      select: { id: true, firstName: true, lastName: true, functionType: true },
      orderBy: { firstName: 'asc' },
    }),
    prisma.field.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        lots: {
          select: {
            id: true,
            name: true,
            lotCrops: { select: { cropType: { select: { name: true } } } },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.inventoryItem.findMany({
      where: { tenantId },
      select: { id: true, name: true, unit: true },
      orderBy: { name: 'asc' },
    }),
    prisma.warehouse.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  type BinForSerialization = {
    id: string;
    code: string;
    binIdentifier: string | null;
    fieldName: string;
    fruitType: string;
    lotName: string;
    contractor: string | null;
    harvestType: string | null;
    binType: string | null;
    emptyWeight: number | null;
    netWeight: number;
    isTrazable: boolean;
    status: string;
    truckEntryId: string | null;
    preselectionId: string | null;
    internalLot: string | null;
    fruitColor: string | null;
    fruitQuality: string | null;
    caliber: string | null;
    chamberId: string | null;
    chamberEntryDate: Date | null;
    chamberExitDate: Date | null;
    createdAt: Date;
  };

  const serializeBin = (b: BinForSerialization): SerializedBin => ({
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

  const serializePs = (ps: NonNullable<typeof activePs>): SerializedPreselection => {
    const totalOutputKg = ps.outputBins.reduce((acc, b) => acc + b.netWeight, 0);
    return {
      id: ps.id,
      code: ps.code,
      status: ps.status,
      startTime: ps.startTime.toISOString(),
      endTime: ps.endTime?.toISOString() ?? null,
      pausedAt: ps.pausedAt?.toISOString() ?? null,
      totalDurationHours: ps.totalDurationHours,
      pauseCount: ps.pauseCount,
      totalPauseHours: ps.totalPauseHours,
      discardKg: ps.discardKg,
      notes: ps.notes,
      inputBinCount: ps.inputBins.length,
      outputBinCount: ps.outputBins.length,
      totalInputKg: ps.inputBins.reduce((acc, ib) => acc + ib.bin.netWeight, 0),
      totalOutputKg,
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
      outputBins: ps.outputBins.map(serializeBin),
    };
  };

  const serializedYardBins: SerializedBin[] = yardBins.map(serializeBin);
  const serializedPreselectionYardBins: SerializedBin[] = preselectionYardBins.map(serializeBin);

  const serializedWorkers: SerializedWorkerOption[] = workers.map((w) => ({
    id: w.id,
    firstName: w.firstName,
    lastName: w.lastName,
    functionType: w.functionType,
  }));

  const fields = fieldsWithLots.map((f) => ({
    id: f.id,
    name: f.name,
    lots: f.lots.map((l) => ({
      id: l.id,
      name: l.name,
      crops: l.lotCrops.map((lc) => lc.cropType.name),
    })),
  }));

  return (
    <PreseleccionPageClient
      activePreselection={activePs ? serializePs(activePs) : null}
      history={historyPs.map(serializePs)}
      availableBins={serializedYardBins}
      preselectionYardBins={serializedPreselectionYardBins}
      workers={serializedWorkers}
      fields={fields}
      inventoryItems={inventoryItems}
      warehouses={warehouses}
    />
  );
}
