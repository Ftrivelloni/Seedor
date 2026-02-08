'use server';

import { revalidatePath } from 'next/cache';
import type { WorkerPaymentStatus, WorkerPaymentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';

const allowedPaymentTypes: WorkerPaymentType[] = ['HOURLY', 'PER_TASK', 'FIXED_SALARY'];
const allowedPaymentStatuses: WorkerPaymentStatus[] = ['PENDING', 'PARTIAL', 'PAID'];

export async function createWorkerAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const dni = String(formData.get('dni') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const emailRaw = String(formData.get('email') || '').trim();
  const paymentType = String(formData.get('paymentType') || 'HOURLY') as WorkerPaymentType;
  const functionType = String(formData.get('functionType') || '').trim();
  const hourlyRate = Number(formData.get('hourlyRate') || 0);
  const taskRate = Number(formData.get('taskRate') || 0);
  const fixedSalary = Number(formData.get('fixedSalary') || 0);

  if (!firstName || !lastName || !dni || !phone || !functionType) {
    throw new Error('Completa todos los campos obligatorios del trabajador.');
  }

  if (!allowedPaymentTypes.includes(paymentType)) {
    throw new Error('Tipo de pago inválido.');
  }

  await prisma.worker.create({
    data: {
      tenantId: session.tenantId,
      firstName,
      lastName,
      dni,
      phone,
      email: emailRaw || null,
      paymentType,
      functionType,
      hourlyRate: paymentType === 'HOURLY' ? hourlyRate : null,
      taskRate: paymentType === 'PER_TASK' ? taskRate : null,
      fixedSalary: paymentType === 'FIXED_SALARY' ? fixedSalary : null,
      paymentStatus: 'PENDING',
    },
  });

  revalidatePath('/dashboard/trabajadores');
}

export async function updateWorkerPaymentStatusAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const workerId = String(formData.get('workerId') || '');
  const paymentStatus = String(formData.get('paymentStatus') || '') as WorkerPaymentStatus;

  if (!workerId || !allowedPaymentStatuses.includes(paymentStatus)) {
    throw new Error('Estado de pago inválido.');
  }

  const worker = await prisma.worker.findFirst({
    where: {
      id: workerId,
      tenantId: session.tenantId,
    },
    select: { id: true },
  });

  if (!worker) {
    throw new Error('Trabajador no encontrado en el tenant activo.');
  }

  await prisma.worker.update({
    where: { id: workerId },
    data: { paymentStatus },
  });

  revalidatePath('/dashboard/trabajadores');
}

export async function updateWorkerActiveStatusAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const workerId = String(formData.get('workerId') || '');
  const active = String(formData.get('active') || 'true') === 'true';

  if (!workerId) {
    throw new Error('Trabajador inválido.');
  }

  const worker = await prisma.worker.findFirst({
    where: {
      id: workerId,
      tenantId: session.tenantId,
    },
    select: { id: true },
  });

  if (!worker) {
    throw new Error('Trabajador no encontrado en el tenant activo.');
  }

  await prisma.worker.update({
    where: { id: workerId },
    data: { active },
  });

  revalidatePath('/dashboard/trabajadores');
}

export async function registerPaymentAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const workerId = String(formData.get('workerId') || '').trim();
  const amount = Number(formData.get('amount') || 0);
  const hoursWorked = Number(formData.get('hoursWorked') || 0);
  const paymentStatus = String(
    formData.get('paymentStatus') || 'PAID'
  ) as WorkerPaymentStatus;

  if (!workerId || amount <= 0) {
    throw new Error('Debe indicar un trabajador y un monto válido.');
  }

  const worker = await prisma.worker.findFirst({
    where: { id: workerId, tenantId: session.tenantId },
    select: { id: true },
  });

  if (!worker) {
    throw new Error('Trabajador no encontrado en el tenant activo.');
  }

  if (!allowedPaymentStatuses.includes(paymentStatus)) {
    throw new Error('Estado de pago inválido.');
  }

  // find a task to associate with (the most recent assigned task)
  const latestAssignment = await prisma.taskAssignment.findFirst({
    where: { workerId },
    orderBy: { createdAt: 'desc' },
    select: { taskId: true },
  });

  await prisma.$transaction(async (tx) => {
    // Only create a work-log entry if there is an assigned task (taskId is required by FK)
    if (latestAssignment?.taskId) {
      await tx.taskWorkLog.create({
        data: {
          taskId: latestAssignment.taskId,
          workerId,
          hoursWorked: hoursWorked > 0 ? hoursWorked : null,
          paymentAmount: amount,
          paymentStatus,
        },
      });
    }

    await tx.worker.update({
      where: { id: workerId },
      data: { paymentStatus },
    });
  });

  revalidatePath('/dashboard/trabajadores');
}
