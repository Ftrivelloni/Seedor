import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthSession, hasRequiredRole } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { mpPreApproval } from '@/lib/mercadopago';

/**
 * POST /api/subscriptions/cancel
 *
 * Cancels the current Mercado Pago subscription for the tenant.
 * Sets cancelAtPeriodEnd = true and updates the MP preapproval status to "cancelled".
 *
 * Body (JSON):
 *   - tenantId?: string  (optional — defaults to session's tenantId)
 *
 * Only ADMIN users can cancel subscriptions.
 */
export async function POST(request: NextRequest) {
  // ── 1. Auth ──
  const session = await getApiAuthSession(request);
  if (!session || !hasRequiredRole(session, ['ADMIN'])) {
    return NextResponse.json(
      { error: 'No autorizado. Solo el administrador puede cancelar suscripciones.' },
      { status: 401 }
    );
  }

  // ── 2. Get tenant ──
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true,
      subscriptionStatus: true,
      mpPreapprovalId: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado.' }, { status: 404 });
  }

  if (tenant.subscriptionStatus !== 'ACTIVE' && tenant.subscriptionStatus !== 'TRIALING') {
    return NextResponse.json(
      { error: 'No hay una suscripción activa para cancelar.' },
      { status: 409 }
    );
  }

  if (tenant.cancelAtPeriodEnd) {
    return NextResponse.json(
      { error: 'La suscripción ya está marcada para cancelar al fin del período.' },
      { status: 409 }
    );
  }

  if (!tenant.mpPreapprovalId) {
    return NextResponse.json(
      { error: 'No se encontró la suscripción en Mercado Pago.' },
      { status: 400 }
    );
  }

  try {
    // ── 3. Cancel in Mercado Pago ──
    await mpPreApproval.update({
      id: tenant.mpPreapprovalId,
      body: {
        status: 'cancelled',
      },
    });

    // ── 4. Update tenant ──
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[MP Cancel Subscription Error]', JSON.stringify(err, null, 2));

    let message = 'Error desconocido al cancelar la suscripción.';
    if (err instanceof Error) {
      message = err.message;
    } else if (err && typeof err === 'object') {
      const mpErr = err as { message?: string };
      if (mpErr.message) message = mpErr.message;
    }

    return NextResponse.json(
      { error: `Error al cancelar en Mercado Pago: ${message}` },
      { status: 500 }
    );
  }
}
