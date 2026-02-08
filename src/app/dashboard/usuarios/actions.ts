'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { requireRole } from '@/lib/auth/auth';

const allowedRoles: UserRole[] = ['ADMIN', 'SUPERVISOR'];
const allowedStatuses: UserStatus[] = ['INVITED', 'ACTIVE', 'INACTIVE'];

export async function inviteUserAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const phone = String(formData.get('phone') || '').trim();
  const role = String(formData.get('role') || 'SUPERVISOR') as UserRole;

  if (!email) {
    throw new Error('El email es obligatorio para invitar un usuario.');
  }

  if (!allowedRoles.includes(role)) {
    throw new Error('Rol inválido.');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new Error('Ya existe un usuario con ese email.');
  }

  // Generate temporary name from email (part before @)
  const emailPrefix = email.split('@')[0];
  const firstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  const lastName = 'Invitado';

  const temporaryPassword = randomBytes(12).toString('hex');

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || '',
        role,
        status: 'INVITED',
        invitedById: session.userId,
        passwordHash: hashPassword(temporaryPassword),
      },
    });

    await tx.tenantUserMembership.create({
      data: {
        tenantId: session.tenantId,
        userId: user.id,
      },
    });
  });

  revalidatePath('/dashboard/usuarios');
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);

  const userId = String(formData.get('userId') || '');
  const role = String(formData.get('role') || '') as UserRole;

  if (!userId || !allowedRoles.includes(role)) {
    throw new Error('Datos inválidos para actualizar rol.');
  }

  const membership = await prisma.tenantUserMembership.findFirst({
    where: {
      tenantId: session.tenantId,
      userId,
    },
    select: { id: true },
  });

  if (!membership) {
    throw new Error('El usuario no pertenece al tenant activo.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath('/dashboard/usuarios');
}

export async function updateUserStatusAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);

  const userId = String(formData.get('userId') || '');
  const status = String(formData.get('status') || '') as UserStatus;

  if (!userId || !allowedStatuses.includes(status)) {
    throw new Error('Datos inválidos para actualizar estado.');
  }

  const membership = await prisma.tenantUserMembership.findFirst({
    where: {
      tenantId: session.tenantId,
      userId,
    },
    select: { id: true },
  });

  if (!membership) {
    throw new Error('El usuario no pertenece al tenant activo.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  revalidatePath('/dashboard/usuarios');
}
