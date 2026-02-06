import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants';
import { verifySessionToken } from '@/lib/auth/session-token';

export interface AuthSession {
  userId: string;
  tenantId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      memberships: {
        select: {
          tenantId: true,
        },
      },
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  const membership = user.memberships.find((entry) => entry.tenantId === payload.tenantId);
  if (!membership) {
    return null;
  }

  return {
    userId: user.id,
    tenantId: membership.tenantId,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export async function requireAuthSession(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuthSession();
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }
  return session;
}
