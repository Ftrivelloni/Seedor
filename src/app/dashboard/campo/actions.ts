'use server';

import { revalidatePath } from 'next/cache';
import type { TaskStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { createInventoryMovement } from '@/lib/domain/inventory';

const allowedTaskStatuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'LATE'];

export async function createLotAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const fieldId = String(formData.get('fieldId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const areaHectares = Number(formData.get('areaHectares') || 0);
  const productionType = String(formData.get('productionType') || '').trim();
  const plantedFruitsDescription = String(formData.get('plantedFruitsDescription') || '').trim();

  if (!fieldId || !name || !productionType || areaHectares <= 0) {
    throw new Error('Completa los datos obligatorios del lote.');
  }

  const field = await prisma.field.findFirst({
    where: {
      id: fieldId,
      tenantId: session.tenantId,
    },
    select: { id: true },
  });

  if (!field) {
    throw new Error('Campo inválido para el tenant actual.');
  }

  await prisma.lot.create({
    data: {
      tenantId: session.tenantId,
      fieldId,
      name,
      areaHectares,
      productionType,
      plantedFruitsDescription: plantedFruitsDescription || null,
    },
  });

  revalidatePath('/dashboard/campo');
}

export async function createTaskAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const description = String(formData.get('description') || '').trim();
  const taskType = String(formData.get('taskType') || '').trim();
  const startDateRaw = String(formData.get('startDate') || '').trim();
  const dueDateRaw = String(formData.get('dueDate') || '').trim();
  const costValueRaw = Number(formData.get('costValue') || 0);
  const costUnit = String(formData.get('costUnit') || '').trim();
  const isComposite = String(formData.get('isComposite') || 'false') === 'true';

  const lotIds = formData
    .getAll('lotIds')
    .map((entry) => String(entry))
    .filter(Boolean);

  const workerIds = formData
    .getAll('workerIds')
    .map((entry) => String(entry))
    .filter(Boolean);

  if (!description || !taskType || !startDateRaw || !dueDateRaw || lotIds.length === 0) {
    throw new Error('Completa los datos obligatorios de la tarea.');
  }

  const startDate = new Date(startDateRaw);
  const dueDate = new Date(dueDateRaw);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(dueDate.getTime())) {
    throw new Error('Las fechas de la tarea son inválidas.');
  }

  if (dueDate < startDate) {
    throw new Error('La fecha límite no puede ser anterior a la fecha de inicio.');
  }

  const usageItemIds = formData.getAll('usageItemId').map((entry) => String(entry));
  const usageWarehouseIds = formData
    .getAll('usageWarehouseId')
    .map((entry) => String(entry));
  const usageQuantities = formData
    .getAll('usageQuantity')
    .map((entry) => Number(entry));
  const usageUnits = formData.getAll('usageUnit').map((entry) => String(entry));

  const usages = usageItemIds
    .map((itemId, index) => ({
      itemId,
      warehouseId: usageWarehouseIds[index] || '',
      quantity: usageQuantities[index] || 0,
      unit: usageUnits[index] || '',
    }))
    .filter((usage) => usage.itemId && usage.warehouseId && usage.quantity > 0 && usage.unit);

  await prisma.$transaction(async (tx) => {
    const lots = await tx.lot.findMany({
      where: {
        tenantId: session.tenantId,
        id: {
          in: lotIds,
        },
      },
      select: { id: true },
    });

    if (lots.length !== lotIds.length) {
      throw new Error('Uno o más lotes no pertenecen al tenant activo.');
    }

    const workers = workerIds.length
      ? await tx.worker.findMany({
          where: {
            tenantId: session.tenantId,
            id: {
              in: workerIds,
            },
          },
          select: { id: true },
        })
      : [];

    if (workers.length !== workerIds.length) {
      throw new Error('Uno o más trabajadores no pertenecen al tenant activo.');
    }

    const task = await tx.task.create({
      data: {
        tenantId: session.tenantId,
        description,
        taskType,
        status: 'PENDING',
        startDate,
        dueDate,
        costValue: costValueRaw > 0 ? costValueRaw : null,
        costUnit: costUnit || null,
        isComposite,
        createdById: session.userId,
      },
    });

    await tx.taskLot.createMany({
      data: lotIds.map((lotId) => ({ taskId: task.id, lotId })),
    });

    if (workerIds.length > 0) {
      await tx.taskAssignment.createMany({
        data: workerIds.map((workerId) => ({ taskId: task.id, workerId })),
      });
    }

    if (usages.length > 0) {
      for (const usage of usages) {
        const movement = await createInventoryMovement(
          {
            tenantId: session.tenantId,
            type: 'CONSUMPTION',
            itemId: usage.itemId,
            quantity: usage.quantity,
            sourceWarehouseId: usage.warehouseId,
            referenceTaskId: task.id,
            notes: `Consumo automático por tarea ${task.description}`,
            createdByUserId: session.userId,
          },
          tx
        );

        await tx.taskInventoryUsage.create({
          data: {
            taskId: task.id,
            inventoryItemId: usage.itemId,
            warehouseId: usage.warehouseId,
            quantity: usage.quantity,
            unit: usage.unit,
            movementId: movement.id,
          },
        });
      }
    }

    await tx.lot.updateMany({
      where: {
        id: {
          in: lotIds,
        },
      },
      data: {
        lastTaskAt: new Date(),
      },
    });
  });

  revalidatePath('/dashboard/campo');
  revalidatePath('/dashboard/inventario');
  revalidatePath('/dashboard');
}

export async function createHarvestRecordAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const lotId = String(formData.get('lotId') || '').trim();
  const cropType = String(formData.get('cropType') || '').trim();
  const kilos = Number(formData.get('kilos') || 0);
  const harvestDateRaw = String(formData.get('harvestDate') || '').trim();

  if (!lotId || !cropType || kilos <= 0) {
    throw new Error('Completa los datos obligatorios de cosecha.');
  }

  const lot = await prisma.lot.findFirst({
    where: {
      id: lotId,
      tenantId: session.tenantId,
    },
    select: { id: true },
  });

  if (!lot) {
    throw new Error('El lote no pertenece al tenant activo.');
  }

  const harvestDate = harvestDateRaw ? new Date(harvestDateRaw) : new Date();

  await prisma.harvestRecord.create({
    data: {
      tenantId: session.tenantId,
      lotId,
      cropType,
      kilos,
      harvestDate,
    },
  });

  revalidatePath('/dashboard/campo');
  revalidatePath('/dashboard');
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  if (!allowedTaskStatuses.includes(status)) {
    throw new Error('Estado de tarea inválido.');
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      tenantId: session.tenantId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!task) {
    throw new Error('Tarea no encontrada.');
  }

  await prisma.task.update({
    where: { id: task.id },
    data: {
      status,
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
  });

  revalidatePath('/dashboard/campo');
  revalidatePath('/dashboard');
}
