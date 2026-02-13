import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/auth';

export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return NextResponse.json({
    userId: session.userId,
    tenantId: session.tenantId,
    role: session.role,
    firstName: session.firstName,
    lastName: session.lastName,
    email: session.email,
  });
}
