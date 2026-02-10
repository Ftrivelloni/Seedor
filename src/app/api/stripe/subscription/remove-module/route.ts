import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/index';
import { getSubscriptionWithItems } from '@/lib/stripe/helpers';
import { getModulePriceId, isOptionalModule, getModuleKeyByPriceId, isBasePriceId } from '@/lib/stripe/config';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';

/**
 * POST /api/stripe/subscription/remove-module
 *
 * Quita un módulo opcional de la suscripción existente.
 *
 * Elimina el subscription item correspondiente y genera prorrateo
 * a favor del cliente (crédito por el tiempo no usado).
 *
 * PROTECCIÓN: No permite eliminar el pack base, solo módulos opcionales.
 *
 * Body esperado:
 *   {
 *     moduleKey: string;  // Ej: "MACHINERY", "PACKAGING", "SALES"
 *   }
 *
 * Requiere: usuario ADMIN autenticado.
 */

interface RemoveModuleRequest {
  moduleKey?: string;
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN']);

    const body = (await request.json()) as RemoveModuleRequest;
    const { moduleKey } = body;

    // ─── Validación ───────────────────────────────────────
    if (!moduleKey || !isOptionalModule(moduleKey)) {
      return NextResponse.json(
        { error: 'Módulo inválido. Solo se pueden quitar: MACHINERY, PACKAGING, SALES.' },
        { status: 400 }
      );
    }

    // ─── Obtener tenant ───────────────────────────────────
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        stripeSubscriptionId: true,
        planInterval: true,
        subscriptionStatus: true,
      },
    });

    if (!tenant?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'La empresa no tiene una suscripción activa.' },
        { status: 400 }
      );
    }

    // ─── Buscar el subscription item del módulo ───────────
    const subscription = await getSubscriptionWithItems(tenant.stripeSubscriptionId);

    // Buscar por priceId del módulo en el intervalo actual
    const interval = tenant.planInterval === 'ANNUAL' ? 'annual' : 'monthly';
    const priceId = getModulePriceId(moduleKey, interval);

    const targetItem = subscription.items.data.find(
      (item) => item.price.id === priceId
    );

    if (!targetItem) {
      return NextResponse.json(
        { error: `El módulo ${moduleKey} no está activo en la suscripción.` },
        { status: 404 }
      );
    }

    // ─── Protección: no permitir eliminar el pack base ────
    if (isBasePriceId(targetItem.price.id)) {
      return NextResponse.json(
        { error: 'No se puede eliminar el pack base de la suscripción.' },
        { status: 400 }
      );
    }

    // ─── Eliminar el subscription item ────────────────────
    // proration_behavior: 'create_prorations' genera un crédito
    // proporcional al tiempo restante del periodo.
    await stripe.subscriptionItems.del(targetItem.id, {
      proration_behavior: 'create_prorations',
    });

    // ─── Actualizar DB (desactivación optimista) ──────────
    const moduleKeyEnum = getModuleKeyByPriceId(priceId);
    if (moduleKeyEnum) {
      await prisma.tenantModuleSetting.updateMany({
        where: {
          tenantId: session.tenantId,
          module: moduleKeyEnum,
        },
        data: {
          enabled: false,
          stripeSubscriptionItemId: null,
          stripePriceId: null,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      module: moduleKey,
      message: `Módulo ${moduleKey} removido. Se aplicará un crédito proporcional.`,
    });
  } catch (error) {
    console.error('[Stripe Remove Module] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      { error: `No se pudo quitar el módulo: ${message}` },
      { status: 500 }
    );
  }
}
