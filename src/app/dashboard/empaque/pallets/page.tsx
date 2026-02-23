import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { PalletsPageClient } from './PalletsPageClient';
import type { SerializedBox, SerializedPallet, ConfigOption } from '../types';

export default async function PalletsPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);
  const tenantId = session.tenantId;

  const [availableBoxesRaw, palletsRaw, destinations] = await Promise.all([
    prisma.packingBox.findMany({
      where: { tenantId, palletId: null },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pallet.findMany({
      where: { tenantId },
      include: {
        boxes: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.processDestination.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
  ]);

  const availableBoxes: SerializedBox[] = availableBoxesRaw.map((b) => ({
    id: b.id,
    code: b.code,
    product: b.product,
    producer: b.producer,
    caliber: b.caliber,
    category: b.category,
    packagingCode: b.packagingCode,
    weightKg: b.weightKg,
    palletId: b.palletId,
    palletCode: null,
    createdAt: b.createdAt.toISOString(),
  }));

  const pallets: SerializedPallet[] = palletsRaw.map((p) => ({
    id: p.id,
    number: p.number,
    code: p.code,
    status: p.status,
    destination: p.destination,
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
      weightKg: b.weightKg,
      palletId: b.palletId,
      palletCode: p.code,
      createdAt: b.createdAt.toISOString(),
    })),
  }));

  const destinationOptions: ConfigOption[] = destinations.map((d) => ({ id: d.id, name: d.name }));

  return (
    <PalletsPageClient
      availableBoxes={availableBoxes}
      pallets={pallets}
      destinationOptions={destinationOptions}
    />
  );
}
