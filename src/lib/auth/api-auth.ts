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
      memberships: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  // memberships is singular because userId is unique in TenantUserMembership
  const membership = user.memberships;
  if (!membership || membership.tenantId !== payload.tenantId) {
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
