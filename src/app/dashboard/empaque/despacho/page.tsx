import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { DespachoPageClient } from './DespachoPageClient';
import type { SerializedDispatch, SerializedPallet } from '../types';

export default async function DespachoPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);
  const tenantId = session.tenantId;

  const [dispatchesRaw, availablePalletsRaw] = await Promise.all([
    prisma.dispatch.findMany({
      where: { tenantId },
      include: {
        pallets: {
          include: {
            pallet: {
              include: { boxes: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pallet.findMany({
      where: { tenantId, status: 'ON_FLOOR' },
      include: { boxes: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const dispatches: SerializedDispatch[] = dispatchesRaw.map((d) => {
    const palletDetails = d.pallets.map((dp) => ({
      palletId: dp.palletId,
      palletCode: dp.pallet.code,
      boxCount: dp.pallet.boxes.length,
      totalWeight: dp.pallet.boxes.reduce((acc, b) => acc + b.weightKg, 0),
    }));

    return {
      id: d.id,
      code: d.code,
      clientName: d.clientName,
      clientType: d.clientType,
      saleType: d.saleType,
      deliveryAddress: d.deliveryAddress,
      remitoNumber: d.remitoNumber,
      dtv: d.dtv,
      dtc: d.dtc,
      closingCode: d.closingCode,
      destination: d.destination,
      discharge: d.discharge,
      transport: d.transport,
      driverName: d.driverName,
      licensePlate: d.licensePlate,
      departureDate: d.departureDate?.toISOString() ?? null,
      departureTime: d.departureTime,
      status: d.status,
      observations: d.observations,
      createdAt: d.createdAt.toISOString(),
      palletCount: palletDetails.length,
      boxCount: palletDetails.reduce((acc, p) => acc + p.boxCount, 0),
      pallets: palletDetails,
    };
  });

  const availablePallets: SerializedPallet[] = availablePalletsRaw.map((p) => ({
    id: p.id,
    number: p.number,
    code: p.code,
    status: p.status,
    operatorName: p.operatorName,
    createdAt: p.createdAt.toISOString(),
    boxCount: p.boxes.length,
    totalWeight: p.boxes.reduce((acc, b) => acc + b.weightKg, 0),
    boxes: p.boxes.map((b) => ({
      id: b.id,
      code: b.code,
      product: b.product,
      producer: b.producer,
      caliber: b.caliber,
      category: b.category,
      packagingCode: b.packagingCode,
      destination: b.destination,
      weightKg: b.weightKg,
      palletId: b.palletId,
      palletCode: p.code,
      createdAt: b.createdAt.toISOString(),
    })),
  }));

  return (
    <DespachoPageClient
      dispatches={dispatches}
      availablePallets={availablePallets}
    />
  );
}
