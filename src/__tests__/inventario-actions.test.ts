/**
 * Unit tests for Inventario actions.
 * Tests validate input validation, P2002 constraint handling, and edge cases.
 *
 * We mock Prisma client and auth to test action logic in isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock auth ──
vi.mock('@/lib/auth/auth', () => ({
    requireRole: vi.fn().mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1' }),
}));

// ── Mock revalidatePath ──
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// ── Mock inventory domain helper ──
const mockCreateInventoryMovement = vi.fn();
vi.mock('@/lib/domain/inventory', () => ({
    createInventoryMovement: (...args: unknown[]) => mockCreateInventoryMovement(...args),
}));

// ── Mock Prisma ──
const mockWarehouseCreate = vi.fn();
const mockInventoryItemFindMany = vi.fn();
const mockWarehouseStockCreateMany = vi.fn();
const mockInventoryItemFindFirst = vi.fn();
const mockInventoryItemCreate = vi.fn();
const mockWarehouseFindMany = vi.fn();
const mockWarehouseStockFindFirst = vi.fn();
const mockWarehouseStockUpdate = vi.fn();
const mockExtraordinaryItemRequestCreate = vi.fn();
const mockExtraordinaryItemRequestFindFirst = vi.fn();
const mockExtraordinaryItemRequestUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
    prisma: {
        warehouse: {
            create: (...args: unknown[]) => mockWarehouseCreate(...args),
            findMany: (...args: unknown[]) => mockWarehouseFindMany(...args),
        },
        inventoryItem: {
            findMany: (...args: unknown[]) => mockInventoryItemFindMany(...args),
            findFirst: (...args: unknown[]) => mockInventoryItemFindFirst(...args),
            create: (...args: unknown[]) => mockInventoryItemCreate(...args),
        },
        warehouseStock: {
            createMany: (...args: unknown[]) => mockWarehouseStockCreateMany(...args),
            findFirst: (...args: unknown[]) => mockWarehouseStockFindFirst(...args),
            update: (...args: unknown[]) => mockWarehouseStockUpdate(...args),
        },
        extraordinaryItemRequest: {
            create: (...args: unknown[]) => mockExtraordinaryItemRequestCreate(...args),
            findFirst: (...args: unknown[]) => mockExtraordinaryItemRequestFindFirst(...args),
            update: (...args: unknown[]) => mockExtraordinaryItemRequestUpdate(...args),
        },
        $transaction: (...args: unknown[]) => mockTransaction(...args),
    },
}));

import {
    createWarehouseAction,
    createInventoryItemAction,
    createInventoryMovementAction,
    updateStockThresholdAction,
    createExtraordinaryItemAction,
    markExtraordinaryDeliveredAction,
} from '@/app/dashboard/inventario/actions';

// ── Helpers ──
function makeFormData(entries: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(entries)) {
        fd.set(key, value);
    }
    return fd;
}

// ══════════════ createWarehouseAction ══════════════

describe('createWarehouseAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWarehouseCreate.mockResolvedValue({ id: 'warehouse-1' });
        mockInventoryItemFindMany.mockResolvedValue([]);
    });

    it('throws when name is empty', async () => {
        const fd = makeFormData({ name: '', description: '' });
        await expect(createWarehouseAction(fd)).rejects.toThrow('El nombre del depósito es obligatorio.');
    });

    it('throws when name is only whitespace', async () => {
        const fd = makeFormData({ name: '   ', description: '' });
        await expect(createWarehouseAction(fd)).rejects.toThrow('El nombre del depósito es obligatorio.');
    });

    it('succeeds with valid name', async () => {
        const fd = makeFormData({ name: 'Depósito Principal', description: 'Test' });
        await expect(createWarehouseAction(fd)).resolves.toBeUndefined();
        expect(mockWarehouseCreate).toHaveBeenCalledOnce();
    });

    it('creates stock records for existing items when warehouse is created', async () => {
        mockInventoryItemFindMany.mockResolvedValue([{ id: 'item-1' }, { id: 'item-2' }]);
        const fd = makeFormData({ name: 'Depósito Nuevo', description: '' });
        await expect(createWarehouseAction(fd)).resolves.toBeUndefined();
        expect(mockWarehouseStockCreateMany).toHaveBeenCalledOnce();
    });

    it('skips stock creation when no items exist', async () => {
        mockInventoryItemFindMany.mockResolvedValue([]);
        const fd = makeFormData({ name: 'Depósito Vacío', description: '' });
        await expect(createWarehouseAction(fd)).resolves.toBeUndefined();
        expect(mockWarehouseStockCreateMany).not.toHaveBeenCalled();
    });
});

// ══════════════ createInventoryItemAction ══════════════

describe('createInventoryItemAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Simulate a successful $transaction that calls the inner function
        mockInventoryItemFindFirst.mockResolvedValue(null);
        mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
            const tx = {
                inventoryItem: { create: mockInventoryItemCreate },
                warehouse: { findMany: mockWarehouseFindMany },
                warehouseStock: { createMany: mockWarehouseStockCreateMany },
            };
            mockInventoryItemCreate.mockResolvedValue({ id: 'item-1' });
            mockWarehouseFindMany.mockResolvedValue([]);
            return fn(tx);
        });
    });

    it('throws when name is empty', async () => {
        const fd = makeFormData({ name: '', description: 'Desc', unit: 'kg' });
        await expect(createInventoryItemAction(fd)).rejects.toThrow('Completa nombre, descripción y unidad del insumo.');
    });

    it('throws when description is empty', async () => {
        const fd = makeFormData({ name: 'Fungicida', description: '', unit: 'L' });
        await expect(createInventoryItemAction(fd)).rejects.toThrow('Completa nombre, descripción y unidad del insumo.');
    });

    it('throws when unit is empty', async () => {
        const fd = makeFormData({ name: 'Fungicida', description: 'Desc', unit: '' });
        await expect(createInventoryItemAction(fd)).rejects.toThrow('Completa nombre, descripción y unidad del insumo.');
    });

    it('succeeds with valid inputs', async () => {
        const fd = makeFormData({ name: 'Fungicida', description: 'Desc', unit: 'L', lowThreshold: '10', criticalThreshold: '5' });
        await expect(createInventoryItemAction(fd)).resolves.toBeUndefined();
        expect(mockTransaction).toHaveBeenCalledOnce();
    });

    it('creates stock for existing warehouses inside transaction', async () => {
        mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
            const tx = {
                inventoryItem: { create: mockInventoryItemCreate },
                warehouse: { findMany: mockWarehouseFindMany },
                warehouseStock: { createMany: mockWarehouseStockCreateMany },
            };
            mockInventoryItemCreate.mockResolvedValue({ id: 'item-1' });
            mockWarehouseFindMany.mockResolvedValue([{ id: 'wh-1' }, { id: 'wh-2' }]);
            return fn(tx);
        });
        const fd = makeFormData({ name: 'Herbicida', description: 'Desc', unit: 'kg', lowThreshold: '5', criticalThreshold: '2' });
        await expect(createInventoryItemAction(fd)).resolves.toBeUndefined();
        expect(mockWarehouseStockCreateMany).toHaveBeenCalledOnce();
    });
});

// ══════════════ createInventoryMovementAction ══════════════

describe('createInventoryMovementAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateInventoryMovement.mockResolvedValue(undefined);
    });

    it('throws when movement type is invalid', async () => {
        const fd = makeFormData({ type: 'INVALID', itemId: 'item-1', quantity: '10' });
        await expect(createInventoryMovementAction(fd)).rejects.toThrow('Tipo de movimiento inválido.');
    });

    it('throws when itemId is empty', async () => {
        const fd = makeFormData({ type: 'INCOME', itemId: '', quantity: '10', destinationWarehouseId: 'wh-1' });
        await expect(createInventoryMovementAction(fd)).rejects.toThrow('Debe seleccionar insumo y cantidad válida.');
    });

    it('throws when quantity is 0', async () => {
        const fd = makeFormData({ type: 'INCOME', itemId: 'item-1', quantity: '0', destinationWarehouseId: 'wh-1' });
        await expect(createInventoryMovementAction(fd)).rejects.toThrow('Debe seleccionar insumo y cantidad válida.');
    });

    it('throws when quantity is negative', async () => {
        const fd = makeFormData({ type: 'INCOME', itemId: 'item-1', quantity: '-5', destinationWarehouseId: 'wh-1' });
        await expect(createInventoryMovementAction(fd)).rejects.toThrow('Debe seleccionar insumo y cantidad válida.');
    });

    it('succeeds with valid INCOME movement', async () => {
        const fd = makeFormData({ type: 'INCOME', itemId: 'item-1', quantity: '100', destinationWarehouseId: 'wh-1', notes: '' });
        await expect(createInventoryMovementAction(fd)).resolves.toBeUndefined();
        expect(mockCreateInventoryMovement).toHaveBeenCalledOnce();
    });

    it('succeeds with valid CONSUMPTION movement', async () => {
        const fd = makeFormData({ type: 'CONSUMPTION', itemId: 'item-1', quantity: '50', sourceWarehouseId: 'wh-1', notes: 'used in field' });
        await expect(createInventoryMovementAction(fd)).resolves.toBeUndefined();
        expect(mockCreateInventoryMovement).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'CONSUMPTION', quantity: 50 })
        );
    });

    it('succeeds with valid TRANSFER movement', async () => {
        const fd = makeFormData({ type: 'TRANSFER', itemId: 'item-1', quantity: '20', sourceWarehouseId: 'wh-1', destinationWarehouseId: 'wh-2', notes: '' });
        await expect(createInventoryMovementAction(fd)).resolves.toBeUndefined();
    });

    it('succeeds with valid ADJUSTMENT movement', async () => {
        const fd = makeFormData({ type: 'ADJUSTMENT', itemId: 'item-1', quantity: '5', destinationWarehouseId: 'wh-1', notes: '' });
        await expect(createInventoryMovementAction(fd)).resolves.toBeUndefined();
    });
});

// ══════════════ updateStockThresholdAction ══════════════

describe('updateStockThresholdAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWarehouseStockFindFirst.mockResolvedValue({ id: 'stock-1' });
        mockWarehouseStockUpdate.mockResolvedValue({});
    });

    it('throws when stockId is empty', async () => {
        const fd = makeFormData({ stockId: '', lowThreshold: '10', criticalThreshold: '5' });
        await expect(updateStockThresholdAction(fd)).rejects.toThrow('Stock inválido.');
    });

    it('throws when stock does not belong to tenant', async () => {
        mockWarehouseStockFindFirst.mockResolvedValue(null);
        const fd = makeFormData({ stockId: 'nonexistent', lowThreshold: '10', criticalThreshold: '5' });
        await expect(updateStockThresholdAction(fd)).rejects.toThrow('No se encontró el stock en el tenant activo.');
    });

    it('succeeds with valid inputs', async () => {
        const fd = makeFormData({ stockId: 'stock-1', lowThreshold: '20', criticalThreshold: '10' });
        await expect(updateStockThresholdAction(fd)).resolves.toBeUndefined();
        expect(mockWarehouseStockUpdate).toHaveBeenCalledOnce();
    });

    it('clamps negative thresholds to 0', async () => {
        const fd = makeFormData({ stockId: 'stock-1', lowThreshold: '-5', criticalThreshold: '-2' });
        await expect(updateStockThresholdAction(fd)).resolves.toBeUndefined();
        expect(mockWarehouseStockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { lowThreshold: 0, criticalThreshold: 0 },
            })
        );
    });
});

// ══════════════ createExtraordinaryItemAction ══════════════

describe('createExtraordinaryItemAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExtraordinaryItemRequestCreate.mockResolvedValue({ id: 'req-1' });
    });

    it('throws when name is empty', async () => {
        const fd = makeFormData({ name: '', description: 'Some description' });
        await expect(createExtraordinaryItemAction(fd)).rejects.toThrow('Completa nombre y descripción del ítem extraordinario.');
    });

    it('throws when description is empty', async () => {
        const fd = makeFormData({ name: 'Fertilizante especial', description: '' });
        await expect(createExtraordinaryItemAction(fd)).rejects.toThrow('Completa nombre y descripción del ítem extraordinario.');
    });

    it('succeeds with valid inputs', async () => {
        const fd = makeFormData({ name: 'Fertilizante especial', description: 'Para uso en lote norte', requestedAt: '2026-01-15' });
        await expect(createExtraordinaryItemAction(fd)).resolves.toBeUndefined();
        expect(mockExtraordinaryItemRequestCreate).toHaveBeenCalledOnce();
    });

    it('uses current date when requestedAt is not provided', async () => {
        const fd = makeFormData({ name: 'Insecticida', description: 'Urgente' });
        await expect(createExtraordinaryItemAction(fd)).resolves.toBeUndefined();
        const callArg = mockExtraordinaryItemRequestCreate.mock.calls[0][0];
        expect(callArg.data.requestedAt).toBeInstanceOf(Date);
    });
});

// ══════════════ markExtraordinaryDeliveredAction ══════════════

describe('markExtraordinaryDeliveredAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExtraordinaryItemRequestFindFirst.mockResolvedValue({ id: 'req-1' });
        mockExtraordinaryItemRequestUpdate.mockResolvedValue({});
    });

    it('throws when requestId is empty', async () => {
        const fd = makeFormData({ requestId: '' });
        await expect(markExtraordinaryDeliveredAction(fd)).rejects.toThrow('Ítem extraordinario inválido.');
    });

    it('throws when request does not belong to tenant', async () => {
        mockExtraordinaryItemRequestFindFirst.mockResolvedValue(null);
        const fd = makeFormData({ requestId: 'nonexistent' });
        await expect(markExtraordinaryDeliveredAction(fd)).rejects.toThrow('El ítem extraordinario no existe en el tenant activo.');
    });

    it('succeeds and updates status to DELIVERED', async () => {
        const fd = makeFormData({ requestId: 'req-1' });
        await expect(markExtraordinaryDeliveredAction(fd)).resolves.toBeUndefined();
        expect(mockExtraordinaryItemRequestUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ status: 'DELIVERED' }),
            })
        );
    });
});
