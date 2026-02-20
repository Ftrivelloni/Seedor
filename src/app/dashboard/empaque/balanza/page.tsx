import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { BalanzaPageClient } from './BalanzaPageClient';
import type { SerializedTruckEntry, SerializedBin } from '../types';

export default async function BalanzaPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);
  const tenantId = session.tenantId;

  const [entries, yardBins, fieldsWithLots, transports] = await Promise.all([
    prisma.packingTruckEntry.findMany({
      where: { tenantId },
      include: {
        bins: {
          select: {
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
            createdAt: true,
          },
        },
      },
      orderBy: { entryDate: 'desc' },
      take: 50,
    }),
    prisma.packingBin.findMany({
      where: { tenantId, status: 'IN_YARD' },
      orderBy: { createdAt: 'desc' },
      take: 20,
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
            lotCrops: {
              select: {
                cropType: { select: { name: true } },
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.packingTransport.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const serializedEntries: SerializedTruckEntry[] = entries.map((e) => ({
    id: e.id,
    remitoNumber: e.remitoNumber,
    dtv: e.dtv,
    transport: e.transport,
    chassis: e.chassis,
    trailer: e.trailer,
    driverName: e.driverName,
    driverDni: e.driverDni,
    operatorId: e.operatorId,
    producerUnit: e.producerUnit,
    fieldOrigin: e.fieldOrigin,
    entryDate: e.entryDate.toISOString(),
    status: e.status,
    bins: e.bins.map((b) => ({
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
      preselectionId: null,
      internalLot: null,
      fruitColor: null,
      fruitQuality: null,
      caliber: null,
      chamberId: null,
      chamberEntryDate: null,
      chamberExitDate: null,
      createdAt: b.createdAt.toISOString(),
    })),
    totalWeight: e.bins.reduce((acc, b) => acc + b.netWeight, 0),
  }));

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
    <BalanzaPageClient
      entries={serializedEntries}
      yardBins={serializedYardBins}
      fields={fields}
      transports={transports}
    />
  );
}
