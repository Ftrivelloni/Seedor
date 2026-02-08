'use server';

import { revalidatePath } from 'next/cache';
import type { TaskStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { createInventoryMovement } from '@/lib/domain/inventory';

const allowedTaskStatuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'LATE'];

/* ══════════════ Field CRUD ══════════════ */

export async function createFieldAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const name = String(formData.get('name') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const description = String(formData.get('description') || '').trim();

  if (!name) {
    throw new Error('El nombre del campo es obligatorio.');
  }

  await prisma.field.create({
    data: {
      tenantId: session.tenantId,
      name,
      location: location || null,
      description: description || null,
    },
  });

  revalidatePath('/dashboard/campo');
}

export async function deleteFieldAction(fieldId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const field = await prisma.field.findFirst({
    where: { id: fieldId, tenantId: session.tenantId },
    select: { id: true },
  });

  if (!field) throw new Error('Campo no encontrado.');

  await prisma.field.delete({ where: { id: field.id } });
  revalidatePath('/dashboard/campo');
}

/* ══════════════ Lot CRUD ══════════════ */

export async function createLotAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const fieldId = String(formData.get('fieldId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const areaHectares = Number(formData.get('areaHectares') || 0);
  const productionType = String(formData.get('productionType') || '').trim();
  const plantedFruitsDescription = String(formData.get('plantedFruitsDescription') || '').trim();
  const cropTypeIds = formData.getAll('cropTypeIds').map((v) => String(v)).filter(Boolean);

  if (!fieldId || !name || !productionType || areaHectares <= 0) {
    throw new Error('Completa los datos obligatorios del lote.');
  }

  const field = await prisma.field.findFirst({
    where: { id: fieldId, tenantId: session.tenantId },
    select: { id: true },
  });

  if (!field) {
    throw new Error('Campo inválido para el tenant actual.');
  }

  const lot = await prisma.lot.create({
    data: {
      tenantId: session.tenantId,
      fieldId,
      name,
      areaHectares,
      productionType,
      plantedFruitsDescription: plantedFruitsDescription || null,
    },
  });

  // Create LotCrop relations
  if (cropTypeIds.length > 0) {
    await prisma.lotCrop.createMany({
      data: cropTypeIds.map((cropTypeId) => ({
        lotId: lot.id,
        cropTypeId,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath('/dashboard/campo');
  revalidatePath(`/dashboard/campo/${fieldId}`);
}

export async function deleteLotAction(lotId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const lot = await prisma.lot.findFirst({
    where: { id: lotId, tenantId: session.tenantId },
    select: { id: true, fieldId: true },
  });

  if (!lot) throw new Error('Lote no encontrado.');

  await prisma.lot.delete({ where: { id: lot.id } });
  revalidatePath('/dashboard/campo');
  revalidatePath(`/dashboard/campo/${lot.fieldId}`);
}

/* ══════════════ Task CRUD ══════════════ */

/**
 * Creates ONE independent Task record PER selected lot.
 * Each task is fully independent (own status, own lifecycle).
 */
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
  const usageWarehouseIds = formData.getAll('usageWarehouseId').map((entry) => String(entry));
  const usageQuantities = formData.getAll('usageQuantity').map((entry) => Number(entry));
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
      where: { tenantId: session.tenantId, id: { in: lotIds } },
      select: { id: true, fieldId: true },
    });

    if (lots.length !== lotIds.length) {
      throw new Error('Uno o más lotes no pertenecen al tenant activo.');
    }

    const workers = workerIds.length
      ? await tx.worker.findMany({
          where: { tenantId: session.tenantId, id: { in: workerIds } },
          select: { id: true },
        })
      : [];

    if (workers.length !== workerIds.length) {
      throw new Error('Uno o más trabajadores no pertenecen al tenant activo.');
    }

    // Create one independent task per lot
    for (const lotId of lotIds) {
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
          lotLinks: { create: { lotId } },
        },
      });

      if (workerIds.length > 0) {
        await tx.taskAssignment.createMany({
          data: workerIds.map((workerId) => ({ taskId: task.id, workerId })),
        });
      }

      // Each lot-task gets its own inventory usage recording
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
    }

    await tx.lot.updateMany({
      where: { id: { in: lotIds } },
      data: { lastTaskAt: new Date() },
    });
  });

  revalidatePath('/dashboard/campo');
  revalidatePath('/dashboard/inventario');
  revalidatePath('/dashboard');
}

/**
 * Update an existing task's editable fields.
 */
export async function updateTaskAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const taskId = String(formData.get('taskId') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const taskType = String(formData.get('taskType') || '').trim();
  const costValueRaw = Number(formData.get('costValue') || 0);
  const costUnit = String(formData.get('costUnit') || '').trim();
  const startDateRaw = String(formData.get('startDate') || '').trim();
  const dueDateRaw = String(formData.get('dueDate') || '').trim();

  if (!taskId || !description || !taskType) {
    throw new Error('Datos incompletos para actualizar la tarea.');
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, tenantId: session.tenantId },
    select: { id: true, lotLinks: { select: { lot: { select: { fieldId: true } } } } },
  });

  if (!task) throw new Error('Tarea no encontrada.');

  const startDate = startDateRaw ? new Date(startDateRaw) : undefined;
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : undefined;

  await prisma.task.update({
    where: { id: task.id },
    data: {
      description,
      taskType,
      costValue: costValueRaw > 0 ? costValueRaw : null,
      costUnit: costUnit || null,
      ...(startDate && !Number.isNaN(startDate.getTime()) ? { startDate } : {}),
      ...(dueDate && !Number.isNaN(dueDate.getTime()) ? { dueDate } : {}),
    },
  });

  revalidatePath('/dashboard/campo');
  revalidatePath('/dashboard');
}

/**
 * Create a subtask under a parent task. Inherits lot and tenant from parent.
 */
export async function createSubtaskAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const parentTaskId = String(formData.get('parentTaskId') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const taskType = String(formData.get('taskType') || '').trim();
  const dueDateRaw = String(formData.get('dueDate') || '').trim();
  const costValueRaw = Number(formData.get('costValue') || 0);
  const costUnit = String(formData.get('costUnit') || '').trim();

  if (!parentTaskId || !description) {
    throw new Error('Completa los datos obligatorios de la subtarea.');
  }

  const parent = await prisma.task.findFirst({
    where: { id: parentTaskId, tenantId: session.tenantId },
    include: { lotLinks: { select: { lotId: true } } },
  });

  if (!parent) throw new Error('Tarea padre no encontrada.');

  const dueDate = dueDateRaw ? new Date(dueDateRaw) : parent.dueDate;

  await prisma.$transaction(async (tx) => {
    // Mark parent as composite if it isn't already
    if (!parent.isComposite) {
      await tx.task.update({
        where: { id: parent.id },
        data: { isComposite: true },
      });
    }

    const subtask = await tx.task.create({
      data: {
        tenantId: session.tenantId,
        parentTaskId: parent.id,
        description,
        taskType: taskType || parent.taskType,
        status: 'PENDING',
        startDate: new Date(),
        dueDate,
        costValue: costValueRaw > 0 ? costValueRaw : null,
        costUnit: costUnit || null,
        isComposite: false,
        createdById: session.userId,
      },
    });

    // Link subtask to the same lots as the parent
    if (parent.lotLinks.length > 0) {
      await tx.taskLot.createMany({
        data: parent.lotLinks.map((link) => ({
          taskId: subtask.id,
          lotId: link.lotId,
        })),
      });
    }
  });

  revalidatePath('/dashboard/campo');
  revalidatePath('/dashboard');
}

/**
 * Quick inline subtask creation from Kanban card (description only).
 */
export async function createInlineSubtaskAction(parentTaskId: string, description: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  if (!parentTaskId || !description.trim()) {
    throw new Error('Descripción requerida.');
  }

  const parent = await prisma.task.findFirst({
    where: { id: parentTaskId, tenantId: session.tenantId },
    include: { lotLinks: { select: { lotId: true } } },
  });

  if (!parent) throw new Error('Tarea padre no encontrada.');

  await prisma.$transaction(async (tx) => {
    if (!parent.isComposite) {
      await tx.task.update({
        where: { id: parent.id },
        data: { isComposite: true },
      });
    }

    const subtask = await tx.task.create({
      data: {
        tenantId: session.tenantId,
        parentTaskId: parent.id,
        description: description.trim(),
        taskType: parent.taskType,
        status: 'PENDING',
        startDate: new Date(),
        dueDate: parent.dueDate,
        isComposite: false,
        createdById: session.userId,
      },
    });

    if (parent.lotLinks.length > 0) {
      await tx.taskLot.createMany({
        data: parent.lotLinks.map((link) => ({
          taskId: subtask.id,
          lotId: link.lotId,
        })),
      });
    }
  });

  revalidatePath('/dashboard/campo');
  revalidatePath('/dashboard');
}

/**
 * Toggle subtask status between PENDING and COMPLETED.
 */
export async function toggleSubtaskStatusAction(subtaskId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const subtask = await prisma.task.findFirst({
    where: { id: subtaskId, tenantId: session.tenantId, parentTaskId: { not: null } },
    select: { id: true, status: true },
  });

  if (!subtask) throw new Error('Subtarea no encontrada.');

  const newStatus = subtask.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

  await prisma.task.update({
    where: { id: subtask.id },
    data: {
      status: newStatus,
      completedAt: newStatus === 'COMPLETED' ? new Date() : null,
    },
  });

  revalidatePath('/dashboard/campo');
  revalidatePath('/dashboard');
}

/* ══════════════ Task Status ══════════════ */

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  if (!allowedTaskStatuses.includes(status)) {
    throw new Error('Estado de tarea inválido.');
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, tenantId: session.tenantId },
    select: { id: true, status: true },
  });

  if (!task) throw new Error('Tarea no encontrada.');

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

/* ══════════════ HarvestRecord ══════════════ */

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
    where: { id: lotId, tenantId: session.tenantId },
    select: { id: true, fieldId: true },
  });

  if (!lot) throw new Error('El lote no pertenece al tenant activo.');

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
  revalidatePath(`/dashboard/campo/${lot.fieldId}`);
  revalidatePath(`/dashboard/campo/${lot.fieldId}/${lotId}`);
  revalidatePath('/dashboard');
}

export async function deleteHarvestRecordAction(harvestId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const harvest = await prisma.harvestRecord.findFirst({
    where: { id: harvestId, tenantId: session.tenantId },
    include: { lot: { select: { fieldId: true } } },
  });

  if (!harvest) throw new Error('Registro de cosecha no encontrado.');

  await prisma.harvestRecord.delete({ where: { id: harvest.id } });
  revalidatePath('/dashboard/campo');
  revalidatePath(`/dashboard/campo/${harvest.lot.fieldId}`);
  revalidatePath(`/dashboard/campo/${harvest.lot.fieldId}/${harvest.lotId}`);
}

/* ══════════════ TaskType CRUD ══════════════ */

export async function createTaskTypeAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const name = String(formData.get('name') || '').trim();
  const color = String(formData.get('color') || '#6B7280').trim();

  if (!name) throw new Error('El nombre del tipo de tarea es obligatorio.');

  await prisma.taskType.create({
    data: {
      tenantId: session.tenantId,
      name,
      color,
    },
  });

  revalidatePath('/dashboard/campo');
}

export async function deleteTaskTypeAction(taskTypeId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const tt = await prisma.taskType.findFirst({
    where: { id: taskTypeId, tenantId: session.tenantId },
  });

  if (!tt) throw new Error('Tipo de tarea no encontrado.');

  await prisma.taskType.delete({ where: { id: tt.id } });
  revalidatePath('/dashboard/campo');
}

/* ══════════════ CropType CRUD ══════════════ */

export async function createCropTypeAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const name = String(formData.get('name') || '').trim();
  const color = String(formData.get('color') || '#16a34a').trim();

  if (!name) throw new Error('El nombre del tipo de cultivo es obligatorio.');

  await prisma.cropType.create({
    data: {
      tenantId: session.tenantId,
      name,
      color,
    },
  });

  revalidatePath('/dashboard/campo');
}

export async function deleteCropTypeAction(cropTypeId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const ct = await prisma.cropType.findFirst({
    where: { id: cropTypeId, tenantId: session.tenantId },
  });

  if (!ct) throw new Error('Tipo de cultivo no encontrado.');

  await prisma.cropType.delete({ where: { id: ct.id } });
  revalidatePath('/dashboard/campo');
}

/* ══════════════ Lot Crop Management ══════════════ */

export async function updateLotCropsAction(lotId: string, cropTypeIds: string[]) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const lot = await prisma.lot.findFirst({
    where: { id: lotId, tenantId: session.tenantId },
    select: { id: true, fieldId: true },
  });

  if (!lot) throw new Error('Lote no encontrado.');

  await prisma.$transaction(async (tx) => {
    // Remove all existing crops for this lot
    await tx.lotCrop.deleteMany({ where: { lotId } });

    // Add new crops
    if (cropTypeIds.length > 0) {
      await tx.lotCrop.createMany({
        data: cropTypeIds.map((cropTypeId) => ({
          lotId,
          cropTypeId,
        })),
      });
    }
  });

  revalidatePath('/dashboard/campo');
  revalidatePath(`/dashboard/campo/${lot.fieldId}`);
  revalidatePath(`/dashboard/campo/${lot.fieldId}/${lotId}`);
}
