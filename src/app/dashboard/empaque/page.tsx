import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { EmpaqueDashboardClient } from './EmpaqueDashboardClient';
import type { EmpaqueDashboardData, SerializedChamber } from './types';

export default async function EmpaquePage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);
  const tenantId = session.tenantId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    binesEnPlaya,
    kgProcesadosHoy,
    cajasHoy,
    chambers,
    activePreselection,
    activeProcess,
    binesInPreselection,
    binesInChamber,
    binesInProcess,
    palletsOnFloor,
    dispatchesThisMonth,
    truckEntriesToday,
  ] = await Promise.all([
    prisma.packingBin.count({ where: { tenantId, status: 'IN_YARD' } }),
    prisma.packingBin.aggregate({
      where: { tenantId, status: { in: ['IN_PROCESS', 'PROCESSED'] }, updatedAt: { gte: today } },
      _sum: { netWeight: true },
    }),
    prisma.packingBox.count({ where: { tenantId, createdAt: { gte: today } } }),
    prisma.chamber.findMany({
      where: { tenantId },
      include: {
        bins: { where: { status: 'IN_CHAMBER' }, select: { id: true, netWeight: true } },
        tasks: { orderBy: { date: 'desc' }, take: 5 },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.preselectionSession.findFirst({
      where: { tenantId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
      include: {
        inputBins: { include: { bin: { select: { netWeight: true } } } },
        outputBins: {
          select: {
            id: true, code: true, binIdentifier: true, fieldName: true, fruitType: true,
            lotName: true, contractor: true, harvestType: true, binType: true,
            emptyWeight: true, netWeight: true, isTrazable: true, status: true,
            truckEntryId: true, preselectionId: true, internalLot: true,
            fruitColor: true, fruitQuality: true, caliber: true,
            chamberId: true, chamberEntryDate: true, chamberExitDate: true, createdAt: true,
          },
        },
        workers: { include: { worker: { select: { firstName: true, lastName: true } } } },
        outputConfig: true,
      },
      orderBy: { startTime: 'desc' },
    }),
    prisma.processSession.findFirst({
      where: { tenantId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
      include: {
        inputBins: { select: { id: true } },
        boxes: { select: { id: true } },
        products: true,
      },
      orderBy: { startTime: 'desc' },
    }),
    prisma.packingBin.count({ where: { tenantId, status: 'IN_PRESELECTION' } }),
    prisma.packingBin.count({ where: { tenantId, status: 'IN_CHAMBER' } }),
    prisma.packingBin.count({ where: { tenantId, status: 'IN_PROCESS' } }),
    prisma.pallet.count({ where: { tenantId, status: 'ON_FLOOR' } }),
    prisma.dispatch.count({
      where: { tenantId, createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } },
    }),
    prisma.packingTruckEntry.count({ where: { tenantId, entryDate: { gte: today } } }),
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
    bins: [],
    tasks: ch.tasks.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      cost: t.cost,
      date: t.date.toISOString(),
    })),
  }));

  const data: EmpaqueDashboardData = {
    binesEnPlaya,
    kgProcesadosHoy: kgProcesadosHoy._sum.netWeight ?? 0,
    cajasProducidasHoy: cajasHoy,
    eficienciaLinea: 92.5,
    flujo: {
      balanza: truckEntriesToday,
      preseleccion: binesInPreselection,
      camaras: binesInChamber,
      proceso: binesInProcess,
      pallets: palletsOnFloor,
      despacho: dispatchesThisMonth,
    },
    chambers: serializedChambers,
    activePreselection: activePreselection
      ? {
          id: activePreselection.id,
          code: activePreselection.code,
          status: activePreselection.status,
          startTime: activePreselection.startTime.toISOString(),
          endTime: activePreselection.endTime?.toISOString() ?? null,
          pausedAt: activePreselection.pausedAt?.toISOString() ?? null,
          totalDurationHours: activePreselection.totalDurationHours,
          pauseCount: activePreselection.pauseCount,
          totalPauseHours: activePreselection.totalPauseHours,
          discardKg: activePreselection.discardKg,
          notes: activePreselection.notes,
          inputBinCount: activePreselection.inputBins.length,
          outputBinCount: activePreselection.outputBins.length,
          totalInputKg: activePreselection.inputBins.reduce(
            (acc, ib) => acc + ib.bin.netWeight,
            0
          ),
          totalOutputKg: activePreselection.outputBins.reduce(
            (acc, ob) => acc + ob.netWeight,
            0
          ),
          outputBins: activePreselection.outputBins.map((b) => ({
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
          workers: activePreselection.workers.map((w) => ({
            id: w.id,
            workerId: w.workerId,
            workerName: `${w.worker.firstName} ${w.worker.lastName}`,
            role: w.role,
            hoursWorked: w.hoursWorked,
          })),
          outputConfig: activePreselection.outputConfig.map((oc) => ({
            id: oc.id,
            outputNumber: oc.outputNumber,
            color: oc.color,
            caliber: oc.caliber,
            isDiscard: oc.isDiscard,
            label: oc.label,
          })),
        }
      : null,
    activeProcess: activeProcess
      ? {
          id: activeProcess.id,
          code: activeProcess.code,
          status: activeProcess.status,
          startTime: activeProcess.startTime.toISOString(),
          endTime: activeProcess.endTime?.toISOString() ?? null,
          totalDurationHours: activeProcess.totalDurationHours,
          pauseCount: activeProcess.pauseCount,
          totalPauseHours: activeProcess.totalPauseHours,
          cleanDiscardKg: activeProcess.cleanDiscardKg,
          contaminatedDiscardKg: activeProcess.contaminatedDiscardKg,
          notes: activeProcess.notes,
          inputBinCount: activeProcess.inputBins.length,
          boxCount: activeProcess.boxes.length,
          products: activeProcess.products.map((p) => ({
            id: p.id,
            productName: p.productName,
            quantity: p.quantity,
            unit: p.unit,
            cost: p.cost,
          })),
        }
      : null,
  };

  return <EmpaqueDashboardClient data={data} />;
}
