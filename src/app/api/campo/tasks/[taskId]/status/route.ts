import { NextResponse } from 'next/server';
import type { TaskStatus } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthSession, hasRequiredRole } from '@/lib/auth/api-auth';

const allowedTaskStatuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'LATE'];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  const session = await getApiAuthSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  if (!hasRequiredRole(session, ['ADMIN', 'SUPERVISOR'])) {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  const { taskId } = await context.params;

  let status: TaskStatus;
  try {
    const body = (await request.json()) as { status?: TaskStatus };
    status = body.status || 'PENDING';
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  if (!allowedTaskStatuses.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      tenantId: session.tenantId,
    },
    select: { id: true },
  });

  if (!task) {
    return NextResponse.json({ error: 'Tarea no encontrada.' }, { status: 404 });
  }

  await prisma.task.update({
    where: { id: task.id },
    data: {
      status,
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true });
}
