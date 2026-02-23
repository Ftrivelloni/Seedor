import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { ProcesoPageClient } from './ProcesoPageClient';
import type { SerializedProcessSession, SerializedBin, SerializedBox, ConfigOption, FieldLotOption } from '../types';

export default async function ProcesoPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);
  const tenantId = session.tenantId;

  const [activeRaw, historyRaw, availableBinsRaw, cropTypes, destinations, fields] = await Promise.all([
    prisma.processSession.findFirst({
      where: { tenantId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
      include: {
        inputBins: {
          include: { bin: true },
        },
        boxes: { orderBy: { createdAt: 'desc' } },
        products: true,
      },
      orderBy: { startTime: 'desc' },
    }),
    prisma.processSession.findMany({
      where: { tenantId, status: 'COMPLETED' },
      include: {
        _count: { select: { inputBins: true, boxes: true } },
        products: true,
      },
      orderBy: { startTime: 'desc' },
      take: 20,
    }),
    prisma.packingBin.findMany({
      where: { tenantId, status: 'READY_FOR_PROCESS' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.cropType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.processDestination.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.field.findMany({
      where: { tenantId },
      include: { lots: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  const serializeBin = (b: typeof availableBinsRaw[number]): SerializedBin => ({
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

  const serializeBox = (bx: NonNullable<typeof activeRaw>['boxes'][number]): SerializedBox => ({
    id: bx.id,
    code: bx.code,
    product: bx.product,
    producer: bx.producer,
    caliber: bx.caliber,
    category: bx.category,
    packagingCode: bx.packagingCode,
    weightKg: bx.weightKg,
    palletId: bx.palletId,
    palletCode: null,
    createdAt: bx.createdAt.toISOString(),
  });

  let activeSession: (SerializedProcessSession & { inputBins: SerializedBin[]; boxes: SerializedBox[] }) | null = null;

  if (activeRaw) {
    activeSession = {
      id: activeRaw.id,
      code: activeRaw.code,
      status: activeRaw.status,
      startTime: activeRaw.startTime.toISOString(),
      endTime: activeRaw.endTime?.toISOString() ?? null,
      pausedAt: activeRaw.pausedAt?.toISOString() ?? null,
      totalDurationHours: activeRaw.totalDurationHours,
      pauseCount: activeRaw.pauseCount,
      totalPauseHours: activeRaw.totalPauseHours,
      cleanDiscardKg: activeRaw.cleanDiscardKg,
      contaminatedDiscardKg: activeRaw.contaminatedDiscardKg,
      notes: activeRaw.notes,
      inputBinCount: activeRaw.inputBins.length,
      boxCount: activeRaw.boxes.length,
      products: activeRaw.products.map((p) => ({
        id: p.id,
        productName: p.productName,
        quantity: p.quantity,
        unit: p.unit,
        cost: p.cost,
      })),
      inputBins: activeRaw.inputBins.map((pb) => serializeBin(pb.bin)),
      boxes: activeRaw.boxes.map(serializeBox),
    };
  }

  const history: SerializedProcessSession[] = historyRaw.map((s) => ({
    id: s.id,
    code: s.code,
    status: s.status,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime?.toISOString() ?? null,
    pausedAt: null,
    totalDurationHours: s.totalDurationHours,
    pauseCount: s.pauseCount,
    totalPauseHours: s.totalPauseHours,
    cleanDiscardKg: s.cleanDiscardKg,
    contaminatedDiscardKg: s.contaminatedDiscardKg,
    notes: s.notes,
    inputBinCount: s._count.inputBins,
    boxCount: s._count.boxes,
    products: s.products.map((p) => ({
      id: p.id,
      productName: p.productName,
      quantity: p.quantity,
      unit: p.unit,
      cost: p.cost,
    })),
  }));

  const availableBins: SerializedBin[] = availableBinsRaw.map(serializeBin);

  const fruitOptions: ConfigOption[] = cropTypes.map((ct) => ({ id: ct.id, name: ct.name }));
  const destinationOptions: ConfigOption[] = destinations.map((d) => ({ id: d.id, name: d.name }));
  const fieldLotOptions: FieldLotOption[] = fields.flatMap((f) =>
    f.lots.map((l) => ({
      fieldId: f.id,
      fieldName: f.name,
      lotId: l.id,
      lotName: l.name,
      label: `${f.name} — ${l.name}`,
    }))
  );

  return (
    <ProcesoPageClient
      activeSession={activeSession}
      history={history}
      availableBins={availableBins}
      fruitOptions={fruitOptions}
      destinationOptions={destinationOptions}
      fieldLotOptions={fieldLotOptions}
    />
  );
}
