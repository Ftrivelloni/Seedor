import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { WorkersPageClient } from './WorkersPageClient';
import type { SerializedWorker } from './types';

export default async function TrabajadoresPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const workers = await prisma.worker.findMany({
    where: { tenantId: session.tenantId },
    include: {
      taskAssignments: {
        include: {
          task: { select: { status: true } },
        },
      },
      workLogs: {
        select: {
          hoursWorked: true,
          paymentAmount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedWorkers: SerializedWorker[] = workers.map((w) => {
    const completedTasks = w.taskAssignments.filter(
      (a) => a.task.status === 'COMPLETED'
    ).length;

    const pendingTasks = w.taskAssignments.filter((a) =>
      ['PENDING', 'IN_PROGRESS', 'LATE'].includes(a.task.status)
    ).length;

    const totalHours = w.workLogs.reduce((acc, log) => acc + (log.hoursWorked ?? 0), 0);
    const totalPayments = w.workLogs.reduce((acc, log) => acc + (log.paymentAmount ?? 0), 0);

    return {
      id: w.id,
      firstName: w.firstName,
      lastName: w.lastName,
      dni: w.dni,
      phone: w.phone,
      email: w.email,
      paymentType: w.paymentType,
      functionType: w.functionType,
      hourlyRate: w.hourlyRate,
      taskRate: w.taskRate,
      fixedSalary: w.fixedSalary,
      paymentStatus: w.paymentStatus,
      active: w.active,
      createdAt: w.createdAt.toISOString(),
      completedTasks,
      pendingTasks,
      totalHours,
      totalPayments,
    };
  });

  return <WorkersPageClient workers={serializedWorkers} />;
}
