/**
 * Unit tests for Maquinaria actions.
 * Tests validate input validation, P2002 constraint handling, and happy paths.
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
  createInventoryMovement: vi.fn().mockResolvedValue({ id: 'inv-mov-1' }),
}));

// ── Mock Prisma ──
const mockMachineCreate = vi.fn();
const mockMachineFindFirst = vi.fn();
const mockMachineUpdate = vi.fn();
const mockMachineMovementCreate = vi.fn();
const mockMachineMovementWorkerCreateMany = vi.fn();
const mockMachineMovementSparePartCreateMany = vi.fn();
const mockMachineInventoryUsageCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    machine: {
      create: (...args: unknown[]) => mockMachineCreate(...args),
      findFirst: (...args: unknown[]) => mockMachineFindFirst(...args),
      update: (...args: unknown[]) => mockMachineUpdate(...args),
    },
    machineMovement: {
      create: (...args: unknown[]) => mockMachineMovementCreate(...args),
    },
    machineMovementWorker: {
      createMany: (...args: unknown[]) => mockMachineMovementWorkerCreateMany(...args),
    },
    machineMovementSparePart: {
      createMany: (...args: unknown[]) => mockMachineMovementSparePartCreateMany(...args),
    },
    machineInventoryUsage: {
      create: (...args: unknown[]) => mockMachineInventoryUsageCreate(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

import { Prisma } from '@prisma/client';

import {
  createMachineAction,
  registerUsageAction,
  registerServiceAction,
  registerMaintenanceAction,
} from '@/app/dashboard/maquinaria/actions';

// ── Helpers ──
function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

// ══════════════ createMachineAction ══════════════

describe('createMachineAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMachineCreate.mockResolvedValue({ id: 'machine-1' });
  });

  it('throws when name is empty', async () => {
    const fd = makeFormData({ name: '', type: 'Tractor' });
    await expect(createMachineAction(fd)).rejects.toThrow('El nombre de la máquina es obligatorio.');
  });

  it('throws when name is only whitespace', async () => {
    const fd = makeFormData({ name: '   ', type: 'Tractor' });
    await expect(createMachineAction(fd)).rejects.toThrow('El nombre de la máquina es obligatorio.');
  });

  it('throws when name exceeds 100 characters', async () => {
    const fd = makeFormData({ name: 'A'.repeat(101), type: 'Tractor' });
    await expect(createMachineAction(fd)).rejects.toThrow('no puede superar los 100 caracteres');
  });

  it('throws when type is empty', async () => {
    const fd = makeFormData({ name: 'Tractor John Deere', type: '' });
    await expect(createMachineAction(fd)).rejects.toThrow('El tipo de máquina es obligatorio.');
  });

  it('handles P2002 duplicate constraint', async () => {
    mockMachineCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2002', clientVersion: '' }),
    );
    const fd = makeFormData({ name: 'Tractor 1', type: 'Tractor' });
    await expect(createMachineAction(fd)).rejects.toThrow('Ya existe una máquina con ese nombre.');
  });

  it('creates machine with valid data', async () => {
    const fd = makeFormData({
      name: 'Cosechadora Case IH 7130',
      type: 'Cosechadora',
      location: 'Campo Norte',
      description: 'Cosechadora axial de alto rendimiento',
      hourMeter: '4520',
      serviceIntervalHours: '40',
      serviceIntervalDays: '14',
    });
    await createMachineAction(fd);
    expect(mockMachineCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Cosechadora Case IH 7130',
        type: 'Cosechadora',
        tenantId: 'tenant-1',
        hourMeter: 4520,
        serviceIntervalHours: 40,
        serviceIntervalDays: 14,
      }),
    });
  });
});

// ══════════════ registerUsageAction ══════════════

describe('registerUsageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMachineFindFirst.mockResolvedValue({ id: 'machine-1', hourMeter: 100, totalCost: 5000 });
    mockTransaction.mockImplementation(async (fn) => {
      const fakeTx = {
        machineMovement: { create: mockMachineMovementCreate.mockResolvedValue({ id: 'mov-1' }) },
        machineInventoryUsage: { create: mockMachineInventoryUsageCreate },
        machine: { update: mockMachineUpdate },
      };
      return fn(fakeTx);
    });
  });

  it('throws when machineId is empty', async () => {
    const fd = makeFormData({ machineId: '', hoursUsed: '8' });
    await expect(registerUsageAction(fd)).rejects.toThrow('Máquina inválida.');
  });

  it('throws when hours is zero or negative', async () => {
    const fd = makeFormData({ machineId: 'machine-1', hoursUsed: '0' });
    await expect(registerUsageAction(fd)).rejects.toThrow('Las horas de uso deben ser mayores a cero.');
  });

  it('throws when machine not found', async () => {
    mockMachineFindFirst.mockResolvedValue(null);
    const fd = makeFormData({ machineId: 'machine-999', hoursUsed: '8' });
    await expect(registerUsageAction(fd)).rejects.toThrow('La máquina no existe en el tenant activo.');
  });

  it('registers usage and updates hour meter', async () => {
    const fd = makeFormData({
      machineId: 'machine-1',
      hoursUsed: '8',
      date: '2026-01-24',
      description: 'Cosecha de soja en Lote B-1',
      inventoryUsages: '[]',
    });
    await registerUsageAction(fd);
    expect(mockMachineMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        machineId: 'machine-1',
        type: 'USE',
        hoursUsed: 8,
      }),
    });
    expect(mockMachineUpdate).toHaveBeenCalledWith({
      where: { id: 'machine-1' },
      data: { hourMeter: 108 },
    });
  });
});

// ══════════════ registerServiceAction ══════════════

describe('registerServiceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMachineFindFirst.mockResolvedValue({ id: 'machine-1', hourMeter: 200, totalCost: 5000 });
    mockTransaction.mockImplementation(async (fn) => {
      const fakeTx = {
        machineMovement: { create: mockMachineMovementCreate.mockResolvedValue({ id: 'mov-1' }) },
        machineMovementSparePart: { createMany: mockMachineMovementSparePartCreateMany },
        machineMovementWorker: { createMany: mockMachineMovementWorkerCreateMany },
        machine: { update: mockMachineUpdate },
      };
      return fn(fakeTx);
    });
  });

  it('throws when machineId is empty', async () => {
    const fd = makeFormData({ machineId: '' });
    await expect(registerServiceAction(fd)).rejects.toThrow('Máquina inválida.');
  });

  it('throws when cost is negative', async () => {
    const fd = makeFormData({ machineId: 'machine-1', cost: '-100' });
    await expect(registerServiceAction(fd)).rejects.toThrow('El costo no puede ser negativo.');
  });

  it('resets service counters on success', async () => {
    const fd = makeFormData({
      machineId: 'machine-1',
      cost: '1000',
      description: 'Service completo',
      spareParts: '[]',
      workers: '[]',
    });
    await registerServiceAction(fd);
    expect(mockMachineUpdate).toHaveBeenCalledWith({
      where: { id: 'machine-1' },
      data: expect.objectContaining({
        lastServiceHourMeter: 200,
        totalCost: 6000,
      }),
    });
  });
});

// ══════════════ registerMaintenanceAction ══════════════

describe('registerMaintenanceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMachineFindFirst.mockResolvedValue({ id: 'machine-1', totalCost: 5000 });
    mockTransaction.mockImplementation(async (fn) => {
      const fakeTx = {
        machineMovement: { create: mockMachineMovementCreate.mockResolvedValue({ id: 'mov-1' }) },
        machineMovementSparePart: { createMany: mockMachineMovementSparePartCreateMany },
        machineMovementWorker: { createMany: mockMachineMovementWorkerCreateMany },
        machine: { update: mockMachineUpdate },
      };
      return fn(fakeTx);
    });
  });

  it('throws when description is empty', async () => {
    const fd = makeFormData({ machineId: 'machine-1', description: '' });
    await expect(registerMaintenanceAction(fd)).rejects.toThrow(
      'La descripción del mantenimiento es obligatoria.',
    );
  });

  it('does NOT reset service counters on maintenance', async () => {
    const fd = makeFormData({
      machineId: 'machine-1',
      description: 'Cambio de rueda',
      cost: '500',
      spareParts: '[]',
      workers: '[]',
    });
    await registerMaintenanceAction(fd);
    expect(mockMachineUpdate).toHaveBeenCalledWith({
      where: { id: 'machine-1' },
      data: { totalCost: 5500 },
    });
    // Ensure lastServiceAt and lastServiceHourMeter are NOT updated
    const updateCall = mockMachineUpdate.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty('lastServiceAt');
    expect(updateCall.data).not.toHaveProperty('lastServiceHourMeter');
  });
});
