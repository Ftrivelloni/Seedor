import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/index';
import { getSubscriptionWithItems, findSubscriptionItemByPriceId } from '@/lib/stripe/helpers';
import { getModulePriceId, isOptionalModule, getModuleKeyByPriceId } from '@/lib/stripe/config';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';

/**
 * POST /api/stripe/subscription/add-module
 *
 * Agrega un módulo opcional a la suscripción existente de la empresa.
 *
 * NO crea una nueva suscripción. Agrega un subscription item a la existente.
 * Usa proration_behavior: 'create_prorations' para cobrar proporcional.
 *
 * Body esperado:
 *   {
 *     moduleKey: string;  // Ej: "MACHINERY", "PACKAGING", "SALES"
 *   }
 *
 * Requiere: usuario ADMIN autenticado.
 */

interface AddModuleRequest {
  moduleKey?: string;
}

export async function POST(request: Request) {
  try {
    // Solo admins pueden modificar la suscripción
    const session = await requireRole(['ADMIN']);

    const body = (await request.json()) as AddModuleRequest;
    const { moduleKey } = body;

    // ─── Validación ───────────────────────────────────────
    if (!moduleKey || !isOptionalModule(moduleKey)) {
      return NextResponse.json(
        { error: 'Módulo inválido. Módulos disponibles: MACHINERY, PACKAGING, SALES.' },
        { status: 400 }
      );
    }

    // ─── Obtener tenant con datos de Stripe ───────────────
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

    if (tenant.subscriptionStatus !== 'ACTIVE' && tenant.subscriptionStatus !== 'TRIALING') {
      return NextResponse.json(
        { error: 'La suscripción no está activa. No se pueden agregar módulos.' },
        { status: 400 }
      );
    }

    // ─── Determinar intervalo y priceId ───────────────────
    const interval = tenant.planInterval === 'ANNUAL' ? 'annual' : 'monthly';
    const priceId = await getModulePriceId(moduleKey, interval);

    // ─── Verificar que el módulo no esté ya suscrito ──────
    const subscription = await getSubscriptionWithItems(tenant.stripeSubscriptionId);
    const existingItem = findSubscriptionItemByPriceId(subscription, priceId);

    if (existingItem) {
      return NextResponse.json(
        { error: `El módulo ${moduleKey} ya está activo en la suscripción.` },
        { status: 409 }
      );
    }

    // ─── Agregar el subscription item ─────────────────────
    // create_prorations: Stripe generará un invoice prorrateado
    // automáticamente. El cliente paga la diferencia del periodo actual.
    const newItem = await stripe.subscriptionItems.create({
      subscription: tenant.stripeSubscriptionId,
      price: priceId,
      quantity: 1,
      proration_behavior: 'create_prorations',
      metadata: {
        module: moduleKey,
        tenantId: session.tenantId,
      },
    });

    // ─── Actualizar DB (activación optimista) ─────────────
    // La fuente de verdad final es el webhook, pero actualizamos
    // de forma optimista para UX inmediata.
    const moduleKeyEnum = await getModuleKeyByPriceId(priceId);
    if (moduleKeyEnum) {
      await prisma.tenantModuleSetting.upsert({
        where: {
          tenantId_module: {
            tenantId: session.tenantId,
            module: moduleKeyEnum,
          },
        },
        update: {
          enabled: true,
          stripePriceId: priceId,
          stripeSubscriptionItemId: newItem.id,
        },
        create: {
          tenantId: session.tenantId,
          module: moduleKeyEnum,
          enabled: true,
          stripePriceId: priceId,
          stripeSubscriptionItemId: newItem.id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      subscriptionItemId: newItem.id,
      module: moduleKey,
      message: `Módulo ${moduleKey} agregado exitosamente.`,
    });
  } catch (error) {
    console.error('[Stripe Add Module] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      { error: `No se pudo agregar el módulo: ${message}` },
      { status: 500 }
    );
  }
}
