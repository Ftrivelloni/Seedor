'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { resend, EMAIL_FROM } from '@/lib/resend';
import {
  buildInvitationEmailHtml,
  buildInvitationEmailText,
} from '@/lib/email/invitation-email';

const allowedRoles: UserRole[] = ['ADMIN', 'SUPERVISOR'];
const allowedStatuses: UserStatus[] = ['INVITED', 'ACTIVE', 'INACTIVE'];

const INVITATION_EXPIRY_DAYS = 7;

export type ActionResult = { success: true } | { success: false; error: string };

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export async function inviteUserAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole(['ADMIN']);

    const email = String(formData.get('email') || '').trim().toLowerCase();
    const phone = String(formData.get('phone') || '').trim();
    const role = String(formData.get('role') || 'SUPERVISOR') as UserRole;

    if (!email) {
      return { success: false, error: 'El email es obligatorio para invitar un usuario.' };
    }

    if (!allowedRoles.includes(role)) {
      return { success: false, error: 'Rol inválido.' };
    }

    // Check if user already exists in the tenant
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { memberships: true },
    });

    if (existing?.memberships?.tenantId === session.tenantId) {
      return { success: false, error: 'Este usuario ya pertenece a tu organización.' };
    }

    if (existing) {
      return { success: false, error: 'Ya existe un usuario con ese email.' };
    }

    // Check for pending invitation to the same email in this tenant
    const pendingInvitation = await prisma.invitation.findFirst({
      where: {
        tenantId: session.tenantId,
        email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvitation) {
      return { success: false, error: 'Ya existe una invitación pendiente para este email.' };
    }

    // Get tenant and inviter info for the email
    const [tenant, inviter] = await Promise.all([
      prisma.tenant.findUniqueOrThrow({
        where: { id: session.tenantId },
        select: { name: true },
      }),
      prisma.user.findUniqueOrThrow({
        where: { id: session.userId },
        select: { firstName: true, lastName: true },
      }),
    ]);

    // Create invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.invitation.create({
      data: {
        tenantId: session.tenantId,
        email,
        role,
        token,
        expiresAt,
        invitedBy: session.userId,
      },
    });

    // Build accept URL
    const baseUrl = getBaseUrl();
    const acceptUrl = `${baseUrl}/accept-invitation?token=${token}`;
    const inviterName = `${inviter.firstName} ${inviter.lastName}`;

    // Send invitation email via Resend
    const emailParams = {
      inviteeName: email.split('@')[0],
      inviterName,
      tenantName: tenant.name,
      role: role as 'ADMIN' | 'SUPERVISOR',
      acceptUrl,
      expiresInDays: INVITATION_EXPIRY_DAYS,
    };

    try {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `${inviterName} te invitó a ${tenant.name} en Seedor`,
        html: buildInvitationEmailHtml(emailParams),
        text: buildInvitationEmailText(emailParams),
      });

      if (error) {
        console.error('Resend API error:', JSON.stringify(error));
        // Invitation was created — don't fail, just warn
        revalidatePath('/dashboard/usuarios');
        return {
          success: false,
          error: `La invitación fue creada pero no se pudo enviar el email: ${error.message}. El usuario puede ser re-invitado.`,
        };
      }
    } catch (emailErr) {
      console.error('Resend send exception:', emailErr);
      revalidatePath('/dashboard/usuarios');
      return {
        success: false,
        error: 'La invitación fue creada pero hubo un error al enviar el email. Podés reenviar la invitación.',
      };
    }

    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (err) {
    console.error('inviteUserAction unexpected error:', err);
    return { success: false, error: 'Error inesperado al crear la invitación.' };
  }
}

export async function resendInvitationAction(invitationId: string): Promise<ActionResult> {
  try {
    const session = await requireRole(['ADMIN']);

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        tenantId: session.tenantId,
        status: 'PENDING',
      },
      include: {
        tenant: { select: { name: true } },
        inviter: { select: { firstName: true, lastName: true } },
      },
    });

    if (!invitation) {
      return { success: false, error: 'No se encontró la invitación o ya fue aceptada.' };
    }

    // Refresh the expiration
    const newToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { token: newToken, expiresAt },
    });

    const baseUrl = getBaseUrl();
    const acceptUrl = `${baseUrl}/accept-invitation?token=${newToken}`;
    const inviterName = `${invitation.inviter.firstName} ${invitation.inviter.lastName}`;

    const emailParams = {
      inviteeName: invitation.email.split('@')[0],
      inviterName,
      tenantName: invitation.tenant.name,
      role: invitation.role as 'ADMIN' | 'SUPERVISOR',
      acceptUrl,
      expiresInDays: INVITATION_EXPIRY_DAYS,
    };

    try {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: invitation.email,
        subject: `${inviterName} te invitó a ${invitation.tenant.name} en Seedor`,
        html: buildInvitationEmailHtml(emailParams),
        text: buildInvitationEmailText(emailParams),
      });

      if (error) {
        console.error('Resend API error on resend:', JSON.stringify(error));
        revalidatePath('/dashboard/usuarios');
        return { success: false, error: `No se pudo enviar el email: ${error.message}` };
      }
    } catch (emailErr) {
      console.error('Resend send exception on resend:', emailErr);
      revalidatePath('/dashboard/usuarios');
      return { success: false, error: 'Error al enviar el email de invitación.' };
    }

    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (err) {
    console.error('resendInvitationAction unexpected error:', err);
    return { success: false, error: 'Error inesperado al reenviar la invitación.' };
  }
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  try {
    const session = await requireRole(['ADMIN']);

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        tenantId: session.tenantId,
        status: 'PENDING',
      },
    });

    if (!invitation) {
      return { success: false, error: 'No se encontró la invitación.' };
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (err) {
    console.error('revokeInvitationAction unexpected error:', err);
    return { success: false, error: 'Error inesperado al revocar la invitación.' };
  }
}

export async function updateUserRoleAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole(['ADMIN']);

    const userId = String(formData.get('userId') || '');
    const role = String(formData.get('role') || '') as UserRole;

    if (!userId || !allowedRoles.includes(role)) {
      return { success: false, error: 'Datos inválidos para actualizar rol.' };
    }

    const membership = await prisma.tenantUserMembership.findFirst({
      where: {
        tenantId: session.tenantId,
        userId,
      },
      select: { id: true },
    });

    if (!membership) {
      return { success: false, error: 'El usuario no pertenece al tenant activo.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (err) {
    console.error('updateUserRoleAction unexpected error:', err);
    return { success: false, error: 'Error inesperado al actualizar el rol.' };
  }
}

export async function updateUserStatusAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole(['ADMIN']);

    const userId = String(formData.get('userId') || '');
    const status = String(formData.get('status') || '') as UserStatus;

    if (!userId || !allowedStatuses.includes(status)) {
      return { success: false, error: 'Datos inválidos para actualizar estado.' };
    }

    const membership = await prisma.tenantUserMembership.findFirst({
      where: {
        tenantId: session.tenantId,
        userId,
      },
      select: { id: true },
    });

    if (!membership) {
      return { success: false, error: 'El usuario no pertenece al tenant activo.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (err) {
    console.error('updateUserStatusAction unexpected error:', err);
    return { success: false, error: 'Error inesperado al actualizar el estado.' };
  }
}
