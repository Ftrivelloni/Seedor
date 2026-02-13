import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken } from '@/lib/auth/session-token';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants';

interface AcceptInvitationRequest {
  token?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AcceptInvitationRequest;

    const token = body.token?.trim();
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const phone = body.phone?.trim() || '';
    const password = body.password?.trim();

    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben completarse.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada.' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue utilizada o fue revocada.' },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        { error: 'Esta invitación ha expirado. Solicitá una nueva al administrador.' },
        { status: 400 }
      );
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email.' },
        { status: 409 }
      );
    }

    // Create the user and membership in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: invitation.email,
          phone,
          role: invitation.role,
          status: 'ACTIVE',
          invitedById: invitation.invitedBy,
          passwordHash: hashPassword(password),
        },
      });

      await tx.tenantUserMembership.create({
        data: {
          tenantId: invitation.tenantId,
          userId: newUser.id,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return newUser;
    });

    // Create session token so user is automatically logged in
    const sessionToken = createSessionToken({
      userId: user.id,
      tenantId: invitation.tenantId,
      role: user.role,
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastAccessAt: new Date() },
    });

    const response = NextResponse.json({
      ok: true,
      tenantName: invitation.tenant.name,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'No se pudo completar el registro. Intentá de nuevo.' },
      { status: 500 }
    );
  }
}
