import type { NextRequest } from 'next/server';
import type { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants';
import { verifySessionToken } from '@/lib/auth/session-token';

export interface ApiAuthSession {
  userId: string;
  tenantId: string;
  role: UserRole;
}

export async function getApiAuthSession(request: NextRequest): Promise<ApiAuthSession | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
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
  };
}

export function hasRequiredRole(session: ApiAuthSession, roles: UserRole[]): boolean {
  return roles.includes(session.role);
}
