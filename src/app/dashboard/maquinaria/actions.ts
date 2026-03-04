'use server';

import { Prisma } from '@prisma/client';
import type { MachineMovementType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { createInventoryMovement } from '@/lib/domain/inventory';

/* ────────────────────────────────────────────────────────
 * CREATE MACHINE
 * ──────────────────────────────────────────────────────── */

export async function createMachineAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const type = String(formData.get('type') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const imageUrl = String(formData.get('imageUrl') || '').trim();
  const acquisitionDateRaw = String(formData.get('acquisitionDate') || '').trim();
  const hourMeter = Number(formData.get('hourMeter') || 0);
  const serviceIntervalHours = Number(formData.get('serviceIntervalHours') || 0);
  const serviceIntervalDays = Number(formData.get('serviceIntervalDays') || 0);

  if (!name) throw new Error('El nombre de la máquina es obligatorio.');
  if (name.length > 100) throw new Error('El nombre no puede superar los 100 caracteres.');
  if (!type) throw new Error('El tipo de máquina es obligatorio.');

  try {
    await prisma.machine.create({
      data: {
        tenantId: session.tenantId,
        name,
        description: description || null,
        type,
        location: location || null,
        imageUrl: imageUrl || null,
        acquisitionDate: acquisitionDateRaw ? new Date(acquisitionDateRaw) : null,
        hourMeter: hourMeter > 0 ? hourMeter : 0,
        serviceIntervalHours: serviceIntervalHours > 0 ? serviceIntervalHours : null,
        serviceIntervalDays: serviceIntervalDays > 0 ? serviceIntervalDays : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new Error('Ya existe una máquina con ese nombre.');
    }
    throw err;
  }

  revalidatePath('/dashboard/maquinaria');
}

/* ────────────────────────────────────────────────────────
 * UPDATE MACHINE
 * ──────────────────────────────────────────────────────── */

export async function updateMachineAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const machineId = String(formData.get('machineId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const type = String(formData.get('type') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const imageUrl = String(formData.get('imageUrl') || '').trim();
  const acquisitionDateRaw = String(formData.get('acquisitionDate') || '').trim();
  const serviceIntervalHours = Number(formData.get('serviceIntervalHours') || 0);
  const serviceIntervalDays = Number(formData.get('serviceIntervalDays') || 0);

  if (!machineId) throw new Error('Máquina inválida.');
  if (!name) throw new Error('El nombre de la máquina es obligatorio.');
  if (!type) throw new Error('El tipo de máquina es obligatorio.');

  const machine = await prisma.machine.findFirst({
    where: { id: machineId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!machine) throw new Error('La máquina no existe en el tenant activo.');

  try {
    await prisma.machine.update({
      where: { id: machineId },
      data: {
        name,
        description: description || null,
        type,
        location: location || null,
        imageUrl: imageUrl || null,
        acquisitionDate: acquisitionDateRaw ? new Date(acquisitionDateRaw) : null,
        serviceIntervalHours: serviceIntervalHours > 0 ? serviceIntervalHours : null,
        serviceIntervalDays: serviceIntervalDays > 0 ? serviceIntervalDays : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new Error('Ya existe una máquina con ese nombre.');
    }
    throw err;
  }

  revalidatePath('/dashboard/maquinaria');
  revalidatePath(`/dashboard/maquinaria/${machineId}`);
}

/* ────────────────────────────────────────────────────────
 * REGISTER USAGE MOVEMENT
 * ──────────────────────────────────────────────────────── */

interface InventoryUsageInput {
  itemId: string;
  warehouseId: string;
  quantity: number;
}

export async function registerUsageAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const machineId = String(formData.get('machineId') || '').trim();
  const dateRaw = String(formData.get('date') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const hoursUsed = Number(formData.get('hoursUsed') || 0);
  const inventoryUsagesJson = String(formData.get('inventoryUsages') || '[]');

  if (!machineId) throw new Error('Máquina inválida.');
  if (hoursUsed <= 0) throw new Error('Las horas de uso deben ser mayores a cero.');

  const machine = await prisma.machine.findFirst({
    where: { id: machineId, tenantId: session.tenantId },
    select: { id: true, hourMeter: true, totalCost: true },
  });
  if (!machine) throw new Error('La máquina no existe en el tenant activo.');

  let inventoryUsages: InventoryUsageInput[] = [];
  try {
    inventoryUsages = JSON.parse(inventoryUsagesJson) as InventoryUsageInput[];
  } catch {
    // ignore parse errors
  }

  const date = dateRaw ? new Date(dateRaw) : new Date();

  await prisma.$transaction(async (tx) => {
    // Create the movement
    const movement = await tx.machineMovement.create({
      data: {
        tenantId: session.tenantId,
        machineId,
        type: 'USE',
        date,
        description: description || null,
        hoursUsed,
        cost: 0,
        createdByUserId: session.userId,
      },
    });

    // Process inventory usages (deduct from stock)
    for (const usage of inventoryUsages) {
      if (usage.quantity <= 0) continue;

      const invMovement = await createInventoryMovement({
        tenantId: session.tenantId,
        type: 'CONSUMPTION',
        itemId: usage.itemId,
        quantity: usage.quantity,
        sourceWarehouseId: usage.warehouseId,
        destinationWarehouseId: null,
        notes: `Uso de maquinaria: ${machine.id}`,
        createdByUserId: session.userId,
      });

      await tx.machineInventoryUsage.create({
        data: {
          movementId: movement.id,
          itemId: usage.itemId,
          warehouseId: usage.warehouseId,
          quantity: usage.quantity,
          inventoryMovementId: invMovement.id,
        },
      });
    }

    // Update machine hour meter
    await tx.machine.update({
      where: { id: machineId },
      data: {
        hourMeter: machine.hourMeter + hoursUsed,
      },
    });
  });

  revalidatePath('/dashboard/maquinaria');
  revalidatePath(`/dashboard/maquinaria/${machineId}`);
  revalidatePath('/dashboard/inventario');
}

/* ────────────────────────────────────────────────────────
 * REGISTER SERVICE
 * ──────────────────────────────────────────────────────── */

interface SparePartInput {
  name: string;
  quantity: number;
  cost: number;
}

interface WorkerInput {
  workerId: string;
  cost: number;
}

export async function registerServiceAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const machineId = String(formData.get('machineId') || '').trim();
  const dateRaw = String(formData.get('date') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const cost = Number(formData.get('cost') || 0);
  const sparePartsJson = String(formData.get('spareParts') || '[]');
  const workersJson = String(formData.get('workers') || '[]');

  if (!machineId) throw new Error('Máquina inválida.');
  if (cost < 0) throw new Error('El costo no puede ser negativo.');

  const machine = await prisma.machine.findFirst({
    where: { id: machineId, tenantId: session.tenantId },
    select: { id: true, hourMeter: true, totalCost: true },
  });
  if (!machine) throw new Error('La máquina no existe en el tenant activo.');

  let spareParts: SparePartInput[] = [];
  let workers: WorkerInput[] = [];
  try { spareParts = JSON.parse(sparePartsJson) as SparePartInput[]; } catch { /* ignore */ }
  try { workers = JSON.parse(workersJson) as WorkerInput[]; } catch { /* ignore */ }

  const date = dateRaw ? new Date(dateRaw) : new Date();
  const totalSparePartsCost = spareParts.reduce((acc, p) => acc + p.cost * p.quantity, 0);
  const totalWorkerCost = workers.reduce((acc, w) => acc + w.cost, 0);
  const totalCost = cost + totalSparePartsCost + totalWorkerCost;

  await prisma.$transaction(async (tx) => {
    const movement = await tx.machineMovement.create({
      data: {
        tenantId: session.tenantId,
        machineId,
        type: 'SERVICE' as MachineMovementType,
        date,
        description: description || null,
        cost: totalCost,
        createdByUserId: session.userId,
      },
    });

    // Create spare parts
    if (spareParts.length > 0) {
      await tx.machineMovementSparePart.createMany({
        data: spareParts.map((p) => ({
          movementId: movement.id,
          name: p.name,
          quantity: p.quantity,
          cost: p.cost,
        })),
      });
    }

    // Create worker assignments
    if (workers.length > 0) {
      await tx.machineMovementWorker.createMany({
        data: workers.map((w) => ({
          movementId: movement.id,
          workerId: w.workerId,
          cost: w.cost,
        })),
      });
    }

    // Update machine: reset service counters and add cost
    await tx.machine.update({
      where: { id: machineId },
      data: {
        lastServiceAt: date,
        lastServiceHourMeter: machine.hourMeter,
        totalCost: machine.totalCost + totalCost,
      },
    });
  });

  revalidatePath('/dashboard/maquinaria');
  revalidatePath(`/dashboard/maquinaria/${machineId}`);
}

/* ────────────────────────────────────────────────────────
 * REGISTER MAINTENANCE (minor - does NOT reset service)
 * ──────────────────────────────────────────────────────── */

export async function registerMaintenanceAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const machineId = String(formData.get('machineId') || '').trim();
  const dateRaw = String(formData.get('date') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const cost = Number(formData.get('cost') || 0);
  const sparePartsJson = String(formData.get('spareParts') || '[]');
  const workersJson = String(formData.get('workers') || '[]');

  if (!machineId) throw new Error('Máquina inválida.');
  if (!description) throw new Error('La descripción del mantenimiento es obligatoria.');

  const machine = await prisma.machine.findFirst({
    where: { id: machineId, tenantId: session.tenantId },
    select: { id: true, totalCost: true },
  });
  if (!machine) throw new Error('La máquina no existe en el tenant activo.');

  let spareParts: SparePartInput[] = [];
  let workers: WorkerInput[] = [];
  try { spareParts = JSON.parse(sparePartsJson) as SparePartInput[]; } catch { /* ignore */ }
  try { workers = JSON.parse(workersJson) as WorkerInput[]; } catch { /* ignore */ }

  const date = dateRaw ? new Date(dateRaw) : new Date();
  const totalSparePartsCost = spareParts.reduce((acc, p) => acc + p.cost * p.quantity, 0);
  const totalWorkerCost = workers.reduce((acc, w) => acc + w.cost, 0);
  const totalCost = cost + totalSparePartsCost + totalWorkerCost;

  await prisma.$transaction(async (tx) => {
    const movement = await tx.machineMovement.create({
      data: {
        tenantId: session.tenantId,
        machineId,
        type: 'MAINTENANCE' as MachineMovementType,
        date,
        description: description || null,
        cost: totalCost,
        createdByUserId: session.userId,
      },
    });

    if (spareParts.length > 0) {
      await tx.machineMovementSparePart.createMany({
        data: spareParts.map((p) => ({
          movementId: movement.id,
          name: p.name,
          quantity: p.quantity,
          cost: p.cost,
        })),
      });
    }

    if (workers.length > 0) {
      await tx.machineMovementWorker.createMany({
        data: workers.map((w) => ({
          movementId: movement.id,
          workerId: w.workerId,
          cost: w.cost,
        })),
      });
    }

    // Only update totalCost, do NOT reset service counters
    await tx.machine.update({
      where: { id: machineId },
      data: {
        totalCost: machine.totalCost + totalCost,
      },
    });
  });

  revalidatePath('/dashboard/maquinaria');
  revalidatePath(`/dashboard/maquinaria/${machineId}`);
}
