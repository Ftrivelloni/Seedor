import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { MachineDetailClient } from './MachineDetailClient';
import { computeServiceStatus } from '../types';
import type { SerializedMachine, SerializedMachineMovement } from '../types';

export const dynamic = 'force-dynamic';

interface MachineDetailPageProps {
  params: Promise<{ machineId: string }>;
}

export default async function MachineDetailPage({ params }: MachineDetailPageProps) {
  const { machineId } = await params;
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const [machine, workers, warehouses, inventoryItems] = await Promise.all([
    prisma.machine.findFirst({
      where: { id: machineId, tenantId: session.tenantId },
      include: {
        movements: {
          orderBy: { date: 'desc' },
          include: {
            createdByUser: { select: { firstName: true, lastName: true } },
            workers: {
              include: {
                worker: { select: { firstName: true, lastName: true } },
              },
            },
            spareParts: true,
            inventoryUsages: {
              include: {
                item: { select: { name: true, unit: true } },
                warehouse: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.worker.findMany({
      where: { tenantId: session.tenantId, active: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: 'asc' },
    }),
    prisma.warehouse.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.inventoryItem.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, code: true, name: true, unit: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!machine) notFound();

  const hoursSince = machine.hourMeter - machine.lastServiceHourMeter;
  const daysSince = machine.lastServiceAt
    ? Math.floor((Date.now() - machine.lastServiceAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const antiquityYears = machine.acquisitionDate
    ? Math.round(((Date.now() - machine.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10
    : 0;

  const serviceStatus = computeServiceStatus(
    machine.hourMeter,
    machine.lastServiceHourMeter,
    machine.lastServiceAt?.toISOString() ?? null,
    machine.serviceIntervalHours,
    machine.serviceIntervalDays,
  );

  const serializedMachine: SerializedMachine = {
    id: machine.id,
    name: machine.name,
    description: machine.description,
    type: machine.type,
    location: machine.location,
    imageUrl: machine.imageUrl,
    acquisitionDate: machine.acquisitionDate?.toISOString() ?? null,
    hourMeter: machine.hourMeter,
    totalCost: machine.totalCost,
    serviceIntervalHours: machine.serviceIntervalHours,
    serviceIntervalDays: machine.serviceIntervalDays,
    lastServiceAt: machine.lastServiceAt?.toISOString() ?? null,
    lastServiceHourMeter: machine.lastServiceHourMeter,
    active: machine.active,
    createdAt: machine.createdAt.toISOString(),
    serviceStatus,
    hoursSinceLastService: hoursSince,
    daysSinceLastService: daysSince,
    antiquityYears,
  };

  const serializedMovements: SerializedMachineMovement[] = machine.movements.map((m) => ({
    id: m.id,
    type: m.type,
    date: m.date.toISOString(),
    description: m.description,
    hoursUsed: m.hoursUsed,
    cost: m.cost,
    notes: m.notes,
    createdByName: m.createdByUser
      ? `${m.createdByUser.firstName} ${m.createdByUser.lastName}`
      : null,
    workers: m.workers.map((w) => ({
      workerId: w.workerId,
      workerName: `${w.worker.firstName} ${w.worker.lastName}`,
      cost: w.cost,
    })),
    spareParts: m.spareParts.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      cost: p.cost,
    })),
    inventoryUsages: m.inventoryUsages.map((u) => ({
      id: u.id,
      itemName: u.item.name,
      itemUnit: u.item.unit,
      warehouseName: u.warehouse.name,
      quantity: u.quantity,
    })),
  }));

  const serializedWorkers = workers.map((w) => ({
    id: w.id,
    name: `${w.firstName} ${w.lastName}`,
  }));

  const serializedWarehouses = warehouses.map((w) => ({
    id: w.id,
    name: w.name,
  }));

  const serializedItems = inventoryItems.map((i) => ({
    id: i.id,
    code: i.code,
    name: i.name,
    unit: i.unit,
  }));

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MachineDetailClient
        machine={serializedMachine}
        movements={serializedMovements}
        workers={serializedWorkers}
        warehouses={serializedWarehouses}
        inventoryItems={serializedItems}
      />
    </Suspense>
  );
}
