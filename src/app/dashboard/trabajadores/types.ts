/* ── Serialized types for Trabajadores client components ── */

export interface SerializedWorker {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string | null;
  paymentType: string; // HOURLY | PER_TASK | FIXED_SALARY
  functionType: string;
  hourlyRate: number | null;
  taskRate: number | null;
  fixedSalary: number | null;
  paymentStatus: string; // PENDING | PARTIAL | PAID
  active: boolean;
  createdAt: string;

  /* computed stats */
  completedTasks: number;
  pendingTasks: number;
  totalHours: number;
  totalPayments: number;
}

export const paymentTypeLabels: Record<string, string> = {
  HOURLY: 'Por hora',
  PER_TASK: 'Por tarea',
  FIXED_SALARY: 'Sueldo fijo',
};

export const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Al día',
};

export const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIAL: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-700',
};

export const paymentTypeBadgeColors: Record<string, string> = {
  HOURLY: 'bg-blue-100 text-blue-700',
  PER_TASK: 'bg-purple-100 text-purple-700',
  FIXED_SALARY: 'bg-teal-100 text-teal-700',
};

export function getPaymentValue(worker: SerializedWorker): string {
  if (worker.paymentType === 'HOURLY') {
    return `$ ${Number(worker.hourlyRate ?? 0).toLocaleString('es-AR')}/h`;
  }
  if (worker.paymentType === 'PER_TASK') {
    return `$ ${Number(worker.taskRate ?? 0).toLocaleString('es-AR')}/tarea`;
  }
  return `$ ${Number(worker.fixedSalary ?? 0).toLocaleString('es-AR')}/mes`;
}

export function getWorkerInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
