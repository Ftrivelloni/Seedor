import { Prisma, type InventoryMovementType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface CreateInventoryMovementInput {
  tenantId: string;
  type: InventoryMovementType;
  itemId: string;
  quantity: number;
  sourceWarehouseId?: string | null;
  destinationWarehouseId?: string | null;
  referenceTaskId?: string | null;
  notes?: string | null;
  createdByUserId?: string | null;
}

type InventoryTransaction = Prisma.TransactionClient;

async function ensureStockRow(
  tx: InventoryTransaction,
  warehouseId: string,
  itemId: string
) {
  return tx.warehouseStock.upsert({
    where: {
      warehouseId_itemId: {
        warehouseId,
        itemId,
      },
    },
    create: {
      warehouseId,
      itemId,
      quantity: 0,
      lowThreshold: 0,
      criticalThreshold: 0,
    },
    update: {},
  });
}

async function createInventoryMovementInTransaction(
  tx: InventoryTransaction,
  input: CreateInventoryMovementInput
) {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a cero.');
  }

  const item = await tx.inventoryItem.findFirst({
    where: {
      id: input.itemId,
      tenantId: input.tenantId,
    },
    select: { id: true },
  });

  if (!item) {
    throw new Error('El insumo no existe en el tenant activo.');
  }

  const getWarehouse = async (warehouseId: string | null | undefined) => {
    if (!warehouseId) {
      return null;
    }

    const warehouse = await tx.warehouse.findFirst({
      where: {
        id: warehouseId,
        tenantId: input.tenantId,
      },
      select: { id: true },
    });

    if (!warehouse) {
      throw new Error('El depósito seleccionado no existe en el tenant activo.');
    }

    return warehouse;
  };

  const sourceWarehouse = await getWarehouse(input.sourceWarehouseId);
  const destinationWarehouse = await getWarehouse(input.destinationWarehouseId);

  if (input.type === 'INCOME') {
    if (!destinationWarehouse) {
      throw new Error('Debe seleccionar un depósito de destino para ingresos.');
    }

    await ensureStockRow(tx, destinationWarehouse.id, input.itemId);
    await tx.warehouseStock.update({
      where: {
        warehouseId_itemId: {
          warehouseId: destinationWarehouse.id,
          itemId: input.itemId,
        },
      },
      data: {
        quantity: { increment: input.quantity },
      },
    });
  }

  if (input.type === 'CONSUMPTION') {
    if (!sourceWarehouse) {
      throw new Error('Debe seleccionar un depósito de origen para consumos.');
    }

    const sourceStock = await ensureStockRow(tx, sourceWarehouse.id, input.itemId);
    if (sourceStock.quantity < input.quantity) {
      throw new Error('No hay stock suficiente para registrar el consumo.');
    }

    await tx.warehouseStock.update({
      where: {
        warehouseId_itemId: {
          warehouseId: sourceWarehouse.id,
          itemId: input.itemId,
        },
      },
      data: {
        quantity: { decrement: input.quantity },
      },
    });
  }

  if (input.type === 'TRANSFER') {
    if (!sourceWarehouse || !destinationWarehouse) {
      throw new Error('Debe seleccionar depósito de origen y destino para traslados.');
    }

    if (sourceWarehouse.id === destinationWarehouse.id) {
      throw new Error('El depósito de origen y destino no puede ser el mismo.');
    }

    const sourceStock = await ensureStockRow(tx, sourceWarehouse.id, input.itemId);
    if (sourceStock.quantity < input.quantity) {
      throw new Error('No hay stock suficiente para el traslado.');
    }

    await ensureStockRow(tx, destinationWarehouse.id, input.itemId);

    await tx.warehouseStock.update({
      where: {
        warehouseId_itemId: {
          warehouseId: sourceWarehouse.id,
          itemId: input.itemId,
        },
      },
      data: {
        quantity: { decrement: input.quantity },
      },
    });

    await tx.warehouseStock.update({
      where: {
        warehouseId_itemId: {
          warehouseId: destinationWarehouse.id,
          itemId: input.itemId,
        },
      },
      data: {
        quantity: { increment: input.quantity },
      },
    });
  }

  if (input.type === 'ADJUSTMENT') {
    if (!sourceWarehouse && !destinationWarehouse) {
      throw new Error('Debe indicar un depósito para ajustar stock.');
    }

    if (sourceWarehouse) {
      const sourceStock = await ensureStockRow(tx, sourceWarehouse.id, input.itemId);
      if (sourceStock.quantity < input.quantity) {
        throw new Error('No hay stock suficiente para el ajuste negativo.');
      }

      await tx.warehouseStock.update({
        where: {
          warehouseId_itemId: {
            warehouseId: sourceWarehouse.id,
            itemId: input.itemId,
          },
        },
        data: {
          quantity: { decrement: input.quantity },
        },
      });
    }

    if (destinationWarehouse) {
      await ensureStockRow(tx, destinationWarehouse.id, input.itemId);
      await tx.warehouseStock.update({
        where: {
          warehouseId_itemId: {
            warehouseId: destinationWarehouse.id,
            itemId: input.itemId,
          },
        },
        data: {
          quantity: { increment: input.quantity },
        },
      });
    }
  }

  return tx.inventoryMovement.create({
    data: {
      tenantId: input.tenantId,
      type: input.type,
      itemId: input.itemId,
      quantity: input.quantity,
      sourceWarehouseId: sourceWarehouse?.id,
      destinationWarehouseId: destinationWarehouse?.id,
      referenceTaskId: input.referenceTaskId || null,
      notes: input.notes || null,
      createdByUserId: input.createdByUserId || null,
    },
  });
}

export async function createInventoryMovement(
  input: CreateInventoryMovementInput,
  tx?: InventoryTransaction
) {
  if (tx) {
    return createInventoryMovementInTransaction(tx, input);
  }

  return prisma.$transaction((transaction) =>
    createInventoryMovementInTransaction(transaction, input)
  );
}

export function resolveStockAlertLevel(quantity: number, lowThreshold: number, criticalThreshold: number) {
  if (quantity <= 0) {
    return 'SIN_STOCK';
  }

  if (quantity <= criticalThreshold) {
    return 'CRITICO';
  }

  if (quantity <= lowThreshold) {
    return 'BAJO';
  }

  return 'OK';
}
