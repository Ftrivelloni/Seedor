/**
 * Unit tests for Trabajadores actions (createWorkerAction, registerPaymentAction).
 * Tests validate input validation, P2002 constraint handling, and edge cases.
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

// ── Mock Prisma ──
const mockWorkerCreate = vi.fn();
const mockWorkerFindFirst = vi.fn();
const mockWorkerUpdate = vi.fn();
const mockTaskAssignmentFindFirst = vi.fn();
const mockTaskWorkLogCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
    prisma: {
        worker: {
            create: (...args: unknown[]) => mockWorkerCreate(...args),
            findFirst: (...args: unknown[]) => mockWorkerFindFirst(...args),
            update: (...args: unknown[]) => mockWorkerUpdate(...args),
        },
        taskAssignment: {
            findFirst: (...args: unknown[]) => mockTaskAssignmentFindFirst(...args),
        },
        $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
            const tx = {
                taskWorkLog: { create: mockTaskWorkLogCreate },
                worker: { update: mockWorkerUpdate },
            };
            return fn(tx);
        }),
    },
}));

import { Prisma } from '@prisma/client';
import { createWorkerAction, registerPaymentAction } from '@/app/dashboard/trabajadores/actions';

// ── Helpers ──
function makeFormData(entries: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(entries)) {
        fd.set(key, value);
    }
    return fd;
}

const validWorkerData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '12345678',
    phone: '+5491112345678',
    email: '',
    paymentType: 'HOURLY',
    functionType: 'Tractorista',
    hourlyRate: '500',
    taskRate: '0',
    fixedSalary: '0',
};

// ══════════════ createWorkerAction ══════════════

describe('createWorkerAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWorkerCreate.mockResolvedValue({ id: 'worker-1' });
    });

    it('throws when firstName is empty', async () => {
        const fd = makeFormData({ ...validWorkerData, firstName: '' });
        await expect(createWorkerAction(fd)).rejects.toThrow('Completa todos los campos obligatorios');
    });

    it('throws when lastName is empty', async () => {
        const fd = makeFormData({ ...validWorkerData, lastName: '' });
        await expect(createWorkerAction(fd)).rejects.toThrow('Completa todos los campos obligatorios');
    });

    it('throws when dni is empty', async () => {
        const fd = makeFormData({ ...validWorkerData, dni: '' });
        await expect(createWorkerAction(fd)).rejects.toThrow('Completa todos los campos obligatorios');
    });

    it('throws when phone is empty', async () => {
        const fd = makeFormData({ ...validWorkerData, phone: '' });
        await expect(createWorkerAction(fd)).rejects.toThrow('Completa todos los campos obligatorios');
    });

    it('throws when functionType is empty', async () => {
        const fd = makeFormData({ ...validWorkerData, functionType: '' });
        await expect(createWorkerAction(fd)).rejects.toThrow('Completa todos los campos obligatorios');
    });

    it('throws when firstName exceeds 100 characters', async () => {
        const fd = makeFormData({ ...validWorkerData, firstName: 'A'.repeat(101) });
        await expect(createWorkerAction(fd)).rejects.toThrow('no pueden superar los 100 caracteres');
    });

    it('throws when lastName exceeds 100 characters', async () => {
        const fd = makeFormData({ ...validWorkerData, lastName: 'B'.repeat(101) });
        await expect(createWorkerAction(fd)).rejects.toThrow('no pueden superar los 100 caracteres');
    });

    it('throws when dni exceeds 20 characters', async () => {
        const fd = makeFormData({ ...validWorkerData, dni: '1'.repeat(21) });
        await expect(createWorkerAction(fd)).rejects.toThrow('DNI no puede superar los 20 caracteres');
    });

    it('throws when paymentType is invalid', async () => {
        const fd = makeFormData({ ...validWorkerData, paymentType: 'INVALID' });
        await expect(createWorkerAction(fd)).rejects.toThrow('Tipo de pago inválido');
    });

    it('throws when hourlyRate is negative for HOURLY type', async () => {
        const fd = makeFormData({ ...validWorkerData, paymentType: 'HOURLY', hourlyRate: '-100' });
        await expect(createWorkerAction(fd)).rejects.toThrow('valor por hora debe ser un número válido');
    });

    it('throws when taskRate is negative for PER_TASK type', async () => {
        const fd = makeFormData({ ...validWorkerData, paymentType: 'PER_TASK', taskRate: '-50' });
        await expect(createWorkerAction(fd)).rejects.toThrow('valor por tarea debe ser un número válido');
    });

    it('throws when fixedSalary is negative for FIXED_SALARY type', async () => {
        const fd = makeFormData({ ...validWorkerData, paymentType: 'FIXED_SALARY', fixedSalary: '-1000' });
        await expect(createWorkerAction(fd)).rejects.toThrow('sueldo fijo debe ser un número válido');
    });

    it('throws friendly message on duplicate DNI (P2002)', async () => {
        const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: '5.0.0',
            meta: { target: ['tenantId', 'dni'] },
        });
        mockWorkerCreate.mockRejectedValue(p2002);

        const fd = makeFormData(validWorkerData);
        await expect(createWorkerAction(fd)).rejects.toThrow('Ya existe un trabajador con ese DNI.');
    });

    it('succeeds with valid inputs', async () => {
        const fd = makeFormData(validWorkerData);
        await expect(createWorkerAction(fd)).resolves.toBeUndefined();
        expect(mockWorkerCreate).toHaveBeenCalledOnce();
    });

    it('allows 0 rate for HOURLY type', async () => {
        const fd = makeFormData({ ...validWorkerData, paymentType: 'HOURLY', hourlyRate: '0' });
        await expect(createWorkerAction(fd)).resolves.toBeUndefined();
    });
});

// ══════════════ registerPaymentAction ══════════════

describe('registerPaymentAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWorkerFindFirst.mockResolvedValue({ id: 'worker-1' });
        mockTaskAssignmentFindFirst.mockResolvedValue({ taskId: 'task-1' });
        mockWorkerUpdate.mockResolvedValue({});
        mockTaskWorkLogCreate.mockResolvedValue({});
    });

    it('throws when workerId is missing', async () => {
        const fd = makeFormData({ workerId: '', amount: '100', paymentStatus: 'PAID' });
        await expect(registerPaymentAction(fd)).rejects.toThrow('Debe indicar un trabajador y un monto válido');
    });

    it('throws when amount is 0', async () => {
        const fd = makeFormData({ workerId: 'worker-1', amount: '0', paymentStatus: 'PAID' });
        await expect(registerPaymentAction(fd)).rejects.toThrow('Debe indicar un trabajador y un monto válido');
    });

    it('throws when amount is negative', async () => {
        const fd = makeFormData({ workerId: 'worker-1', amount: '-50', paymentStatus: 'PAID' });
        await expect(registerPaymentAction(fd)).rejects.toThrow('Debe indicar un trabajador y un monto válido');
    });

    it('throws when amount is NaN', async () => {
        const fd = makeFormData({ workerId: 'worker-1', amount: 'abc', paymentStatus: 'PAID' });
        await expect(registerPaymentAction(fd)).rejects.toThrow('Debe indicar un trabajador y un monto válido');
    });

    it('throws when worker is not found', async () => {
        mockWorkerFindFirst.mockResolvedValue(null);
        const fd = makeFormData({ workerId: 'nonexistent', amount: '100', paymentStatus: 'PAID' });
        await expect(registerPaymentAction(fd)).rejects.toThrow('Trabajador no encontrado en el tenant activo');
    });

    it('throws for invalid payment status', async () => {
        const fd = makeFormData({ workerId: 'worker-1', amount: '100', paymentStatus: 'INVALID' });
        await expect(registerPaymentAction(fd)).rejects.toThrow('Estado de pago inválido');
    });

    it('succeeds with valid inputs', async () => {
        const fd = makeFormData({ workerId: 'worker-1', amount: '1500', paymentStatus: 'PAID' });
        await expect(registerPaymentAction(fd)).resolves.toBeUndefined();
    });
});
