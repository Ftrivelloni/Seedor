/* ── Serialized types for Maquinaria client components ── */

export type ServiceStatus = 'NORMAL' | 'SERVICE_SOON' | 'SERVICE_OVERDUE';

export interface SerializedMachine {
  id: string;
  name: string;
  description: string | null;
  type: string;
  location: string | null;
  imageUrl: string | null;
  acquisitionDate: string | null; // ISO string
  hourMeter: number;
  totalCost: number;
  serviceIntervalHours: number | null;
  serviceIntervalDays: number | null;
  lastServiceAt: string | null; // ISO string
  lastServiceHourMeter: number;
  active: boolean;
  createdAt: string; // ISO string

  /* computed */
  serviceStatus: ServiceStatus;
  hoursSinceLastService: number;
  daysSinceLastService: number;
  antiquityYears: number;
}

export interface SerializedMovementWorker {
  workerId: string;
  workerName: string;
  cost: number;
}

export interface SerializedMovementSparePart {
  id: string;
  name: string;
  quantity: number;
  cost: number;
}

export interface SerializedInventoryUsage {
  id: string;
  itemName: string;
  itemUnit: string;
  warehouseName: string;
  quantity: number;
}

export interface SerializedMachineMovement {
  id: string;
  type: string; // USE | SERVICE | MAINTENANCE
  date: string; // ISO string
  description: string | null;
  hoursUsed: number | null;
  cost: number;
  notes: string | null;
  createdByName: string | null;
  workers: SerializedMovementWorker[];
  spareParts: SerializedMovementSparePart[];
  inventoryUsages: SerializedInventoryUsage[];
}

/* ── Helpers ── */

export const movementTypeLabels: Record<string, { label: string; color: string }> = {
  USE: { label: 'Uso', color: 'bg-blue-100 text-blue-700' },
  SERVICE: { label: 'Service', color: 'bg-green-100 text-green-700' },
  MAINTENANCE: { label: 'Mantenimiento', color: 'bg-orange-100 text-orange-700' },
};

export const serviceStatusConfig: Record<ServiceStatus, { label: string; color: string; badgeClass: string }> = {
  NORMAL: { label: 'Normal', color: 'text-green-600', badgeClass: 'bg-green-100 text-green-700' },
  SERVICE_SOON: { label: 'Próximo', color: 'text-yellow-600', badgeClass: 'bg-amber-100 text-amber-700' },
  SERVICE_OVERDUE: { label: 'Atrasado', color: 'text-red-600', badgeClass: 'bg-red-100 text-red-700' },
};

/**
 * Compute the service status of a machine.
 * SERVICE_OVERDUE if hours or days exceed the interval.
 * SERVICE_SOON if hours or days exceed 80% of the interval.
 * NORMAL otherwise.
 */
export function computeServiceStatus(
  hourMeter: number,
  lastServiceHourMeter: number,
  lastServiceAt: string | null,
  serviceIntervalHours: number | null,
  serviceIntervalDays: number | null,
): ServiceStatus {
  if (!serviceIntervalHours && !serviceIntervalDays) return 'NORMAL';

  const hoursSince = hourMeter - lastServiceHourMeter;
  const daysSince = lastServiceAt
    ? Math.floor((Date.now() - new Date(lastServiceAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Check overdue
  if (serviceIntervalHours && hoursSince >= serviceIntervalHours) return 'SERVICE_OVERDUE';
  if (serviceIntervalDays && daysSince >= serviceIntervalDays) return 'SERVICE_OVERDUE';

  // Check approaching (80% threshold)
  if (serviceIntervalHours && hoursSince >= serviceIntervalHours * 0.8) return 'SERVICE_SOON';
  if (serviceIntervalDays && daysSince >= serviceIntervalDays * 0.8) return 'SERVICE_SOON';

  return 'NORMAL';
}

export function formatCurrency(n: number): string {
  return `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
