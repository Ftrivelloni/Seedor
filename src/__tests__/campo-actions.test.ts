/**
 * Unit tests for Campo actions (createFieldAction, createLotAction).
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

// ── Mock inventory helper ──
vi.mock('@/lib/domain/inventory', () => ({
    createInventoryMovement: vi.fn(),
}));

// ── Mock Prisma ──
const mockFieldCreate = vi.fn();
const mockFieldFindFirst = vi.fn();
const mockLotCreate = vi.fn();
const mockLotCropCreateMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
    prisma: {
        field: { create: (...args: unknown[]) => mockFieldCreate(...args), findFirst: (...args: unknown[]) => mockFieldFindFirst(...args) },
        lot: { create: (...args: unknown[]) => mockLotCreate(...args) },
        lotCrop: { createMany: (...args: unknown[]) => mockLotCropCreateMany(...args) },
    },
}));

// We also need Prisma error class for P2002 testing
import { Prisma } from '@prisma/client';

// ── Import actions AFTER mocks are set up ──
import { createFieldAction, createLotAction } from '@/app/dashboard/campo/actions';

// ── Helpers ──
function makeFormData(entries: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(entries)) {
        fd.set(key, value);
    }
    return fd;
}

// ══════════════ createFieldAction ══════════════

describe('createFieldAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFieldCreate.mockResolvedValue({ id: 'field-1' });
    });

    it('throws when name is empty', async () => {
        const fd = makeFormData({ name: '', location: '', description: '' });
        await expect(createFieldAction(fd)).rejects.toThrow('El nombre del campo es obligatorio.');
    });

    it('throws when name is only whitespace', async () => {
        const fd = makeFormData({ name: '   ', location: '', description: '' });
        await expect(createFieldAction(fd)).rejects.toThrow('El nombre del campo es obligatorio.');
    });

    it('throws when name exceeds 100 characters', async () => {
        const fd = makeFormData({ name: 'A'.repeat(101), location: '', description: '' });
        await expect(createFieldAction(fd)).rejects.toThrow('no puede superar los 100 caracteres');
    });

    it('throws when location exceeds 500 characters', async () => {
        const fd = makeFormData({ name: 'Campo Ok', location: 'L'.repeat(501), description: '' });
        await expect(createFieldAction(fd)).rejects.toThrow('ubicación no puede superar los 500 caracteres');
    });

    it('throws when description exceeds 500 characters', async () => {
        const fd = makeFormData({ name: 'Campo Ok', location: '', description: 'D'.repeat(501) });
        await expect(createFieldAction(fd)).rejects.toThrow('descripción no puede superar los 500 caracteres');
    });

    it('throws friendly message on duplicate name (P2002)', async () => {
        const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: '5.0.0',
            meta: { target: ['tenantId', 'name'] },
        });
        mockFieldCreate.mockRejectedValue(p2002);

        const fd = makeFormData({ name: 'Campo Norte', location: '', description: '' });
        await expect(createFieldAction(fd)).rejects.toThrow('Ya existe un campo con ese nombre.');
    });

    it('succeeds with valid inputs', async () => {
        const fd = makeFormData({ name: 'Campo Nuevo', location: 'Ruta 40', description: 'Test' });
        await expect(createFieldAction(fd)).resolves.toBeUndefined();
        expect(mockFieldCreate).toHaveBeenCalledOnce();
    });

    it('allows max-length name (exactly 100 chars)', async () => {
        const fd = makeFormData({ name: 'A'.repeat(100), location: '', description: '' });
        await expect(createFieldAction(fd)).resolves.toBeUndefined();
    });
});

// ══════════════ createLotAction ══════════════

describe('createLotAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFieldFindFirst.mockResolvedValue({ id: 'field-1' });
        mockLotCreate.mockResolvedValue({ id: 'lot-1' });
        mockLotCropCreateMany.mockResolvedValue({ count: 0 });
    });

    it('throws when required fields are missing', async () => {
        const fd = makeFormData({ fieldId: '', name: '', areaHectares: '10', productionType: 'Limones' });
        await expect(createLotAction(fd)).rejects.toThrow('Completa los datos obligatorios del lote.');
    });

    it('throws when name exceeds 100 characters', async () => {
        const fd = makeFormData({
            fieldId: 'field-1', name: 'L'.repeat(101), areaHectares: '10', productionType: 'Limones',
        });
        await expect(createLotAction(fd)).rejects.toThrow('nombre del lote no puede superar los 100 caracteres');
    });

    it('throws when areaHectares is 0', async () => {
        const fd = makeFormData({
            fieldId: 'field-1', name: 'Lote A', areaHectares: '0', productionType: 'Limones',
        });
        await expect(createLotAction(fd)).rejects.toThrow('superficie debe ser un número mayor a 0');
    });

    it('throws when areaHectares is negative', async () => {
        const fd = makeFormData({
            fieldId: 'field-1', name: 'Lote A', areaHectares: '-5', productionType: 'Limones',
        });
        await expect(createLotAction(fd)).rejects.toThrow('superficie debe ser un número mayor a 0');
    });

    it('throws when areaHectares is NaN', async () => {
        const fd = makeFormData({
            fieldId: 'field-1', name: 'Lote A', areaHectares: 'abc', productionType: 'Limones',
        });
        await expect(createLotAction(fd)).rejects.toThrow('superficie debe ser un número mayor a 0');
    });

    it('throws when field does not exist', async () => {
        mockFieldFindFirst.mockResolvedValue(null);
        const fd = makeFormData({
            fieldId: 'nonexistent', name: 'Lote A', areaHectares: '10', productionType: 'Limones',
        });
        await expect(createLotAction(fd)).rejects.toThrow('Campo inválido para el tenant actual.');
    });

    it('throws friendly message on duplicate lot name (P2002)', async () => {
        const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: '5.0.0',
            meta: { target: ['fieldId', 'name'] },
        });
        mockLotCreate.mockRejectedValue(p2002);

        const fd = makeFormData({
            fieldId: 'field-1', name: 'Lote A', areaHectares: '10', productionType: 'Limones',
        });
        await expect(createLotAction(fd)).rejects.toThrow('Ya existe un lote con ese nombre en este campo.');
    });

    it('succeeds with valid inputs', async () => {
        const fd = makeFormData({
            fieldId: 'field-1', name: 'Lote Nuevo', areaHectares: '25.5', productionType: 'Limones',
        });
        await expect(createLotAction(fd)).resolves.toBeUndefined();
        expect(mockLotCreate).toHaveBeenCalledOnce();
    });
});
