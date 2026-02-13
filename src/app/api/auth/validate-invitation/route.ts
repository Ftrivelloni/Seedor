import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado.' },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: { select: { name: true } },
        inviter: { select: { firstName: true, lastName: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada.' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PENDING') {
      const message =
        invitation.status === 'ACCEPTED'
          ? 'Esta invitación ya fue aceptada.'
          : invitation.status === 'REVOKED'
            ? 'Esta invitación fue cancelada por el administrador.'
            : 'Esta invitación ha expirado.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
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
        { error: 'Ya existe una cuenta con este email. Iniciá sesión.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      email: invitation.email,
      role: invitation.role,
      tenantName: invitation.tenant.name,
      inviterName: `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    return NextResponse.json(
      { error: 'No se pudo validar la invitación.' },
      { status: 500 }
    );
  }
}
