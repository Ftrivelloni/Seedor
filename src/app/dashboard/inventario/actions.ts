'use server';

import type { InventoryMovementType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { createInventoryMovement } from '@/lib/domain/inventory';

const allowedMovementTypes: InventoryMovementType[] = [
  'INCOME',
  'TRANSFER',
  'CONSUMPTION',
  'ADJUSTMENT',
];

async function generateItemCode(tenantId: string) {
  const lastItem = await prisma.inventoryItem.findFirst({
    where: {
      tenantId,
      code: {
        startsWith: 'INS-',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      code: true,
    },
  });

  const current = Number(lastItem?.code.replace('INS-', '') || 0);
  return `INS-${String(current + 1).padStart(4, '0')}`;
}

export async function createWarehouseAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();

  if (!name) {
    throw new Error('El nombre del depósito es obligatorio.');
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      tenantId: session.tenantId,
      name,
      description: description || null,
    },
  });

  const items = await prisma.inventoryItem.findMany({
    where: {
      tenantId: session.tenantId,
    },
    select: {
      id: true,
    },
  });

  if (items.length > 0) {
    await prisma.warehouseStock.createMany({
      data: items.map((item) => ({
        warehouseId: warehouse.id,
        itemId: item.id,
        quantity: 0,
        lowThreshold: 0,
        criticalThreshold: 0,
      })),
    });
  }

  revalidatePath('/dashboard/inventario');
}

export async function createInventoryItemAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const unit = String(formData.get('unit') || '').trim();
  const lowThreshold = Number(formData.get('lowThreshold') || 0);
  const criticalThreshold = Number(formData.get('criticalThreshold') || 0);

  if (!name || !description || !unit) {
    throw new Error('Completa nombre, descripción y unidad del insumo.');
  }

  const safeLowThreshold = lowThreshold > 0 ? lowThreshold : 0;
  const safeCriticalThreshold = criticalThreshold > 0 ? criticalThreshold : 0;

  const code = await generateItemCode(session.tenantId);

  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.create({
      data: {
        tenantId: session.tenantId,
        code,
        name,
        description,
        unit,
      },
    });

    const warehouses = await tx.warehouse.findMany({
      where: {
        tenantId: session.tenantId,
      },
      select: {
        id: true,
      },
    });

    if (warehouses.length > 0) {
      await tx.warehouseStock.createMany({
        data: warehouses.map((warehouse) => ({
          warehouseId: warehouse.id,
          itemId: item.id,
          quantity: 0,
          lowThreshold: safeLowThreshold,
          criticalThreshold: safeCriticalThreshold,
        })),
      });
    }
  });

  revalidatePath('/dashboard/inventario');
}

export async function createInventoryMovementAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const type = String(formData.get('type') || '') as InventoryMovementType;
  const itemId = String(formData.get('itemId') || '').trim();
  const quantity = Number(formData.get('quantity') || 0);
  const sourceWarehouseId = String(formData.get('sourceWarehouseId') || '').trim();
  const destinationWarehouseId = String(formData.get('destinationWarehouseId') || '').trim();
  const notes = String(formData.get('notes') || '').trim();

  if (!allowedMovementTypes.includes(type)) {
    throw new Error('Tipo de movimiento inválido.');
  }

  if (!itemId || quantity <= 0) {
    throw new Error('Debe seleccionar insumo y cantidad válida.');
  }

  await createInventoryMovement({
    tenantId: session.tenantId,
    type,
    itemId,
    quantity,
    sourceWarehouseId: sourceWarehouseId || null,
    destinationWarehouseId: destinationWarehouseId || null,
    notes: notes || null,
    createdByUserId: session.userId,
  });

  revalidatePath('/dashboard/inventario');
  revalidatePath('/dashboard');
}

export async function updateStockThresholdAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const stockId = String(formData.get('stockId') || '').trim();
  const lowThreshold = Number(formData.get('lowThreshold') || 0);
  const criticalThreshold = Number(formData.get('criticalThreshold') || 0);

  if (!stockId) {
    throw new Error('Stock inválido.');
  }

  const stock = await prisma.warehouseStock.findFirst({
    where: {
      id: stockId,
      warehouse: {
        tenantId: session.tenantId,
      },
    },
    select: { id: true },
  });

  if (!stock) {
    throw new Error('No se encontró el stock en el tenant activo.');
  }

  await prisma.warehouseStock.update({
    where: { id: stockId },
    data: {
      lowThreshold: lowThreshold > 0 ? lowThreshold : 0,
      criticalThreshold: criticalThreshold > 0 ? criticalThreshold : 0,
    },
  });

  revalidatePath('/dashboard/inventario');
}

export async function createExtraordinaryItemAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const requestedAtRaw = String(formData.get('requestedAt') || '').trim();

  if (!name || !description) {
    throw new Error('Completa nombre y descripción del ítem extraordinario.');
  }

  const requestedAt = requestedAtRaw ? new Date(requestedAtRaw) : new Date();

  await prisma.extraordinaryItemRequest.create({
    data: {
      tenantId: session.tenantId,
      name,
      description,
      requestedByUserId: session.userId,
      requestedAt,
      status: 'PENDING',
    },
  });

  revalidatePath('/dashboard/inventario');
}

export async function markExtraordinaryDeliveredAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const requestId = String(formData.get('requestId') || '').trim();

  if (!requestId) {
    throw new Error('Ítem extraordinario inválido.');
  }

  const request = await prisma.extraordinaryItemRequest.findFirst({
    where: {
      id: requestId,
      tenantId: session.tenantId,
    },
    select: { id: true },
  });

  if (!request) {
    throw new Error('El ítem extraordinario no existe en el tenant activo.');
  }

  await prisma.extraordinaryItemRequest.update({
    where: {
      id: request.id,
    },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
    },
  });

  revalidatePath('/dashboard/inventario');
}
