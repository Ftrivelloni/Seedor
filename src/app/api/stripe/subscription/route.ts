import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/index';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/auth/auth';
import { getModuleKeyByPriceId, isBasePriceId } from '@/lib/stripe/config';

/**
 * GET /api/stripe/subscription
 *
 * Retorna el estado actual de la suscripción del tenant autenticado.
 *
 * Incluye:
 *   - Estado de la suscripción
 *   - Módulos activos (desde DB, sincronizados por webhook)
 *   - Datos del subscription de Stripe (periodo, cancel_at, etc.)
 *
 * La DB es la fuente de verdad para el frontend.
 * El webhook mantiene la DB sincronizada con Stripe.
 */
export async function GET() {
  try {
    const session = await requireAuthSession();

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        planInterval: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        moduleSettings: {
          select: {
            module: true,
            enabled: true,
            stripePriceId: true,
          },
          orderBy: { module: 'asc' },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Empresa no encontrada.' },
        { status: 404 }
      );
    }

    // Opcionalmente, enriquecer con datos en tiempo real de Stripe
    let stripeDetails = null;

    if (tenant.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          tenant.stripeSubscriptionId,
          { expand: ['items.data.price', 'latest_invoice'] }
        );

        stripeDetails = {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          cancelAt: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000)
            : null,
          items: await Promise.all(subscription.items.data.map(async (item) => {
            const priceId = item.price.id;
            return {
              id: item.id,
              priceId,
              isBasePack: await isBasePriceId(priceId),
              moduleKey: await getModuleKeyByPriceId(priceId),
              amount: item.price.unit_amount,
              currency: item.price.currency,
              interval: item.price.recurring?.interval,
            };
          })),
        };
      } catch (err) {
        // Si falla la consulta a Stripe, retornamos solo datos de DB
        console.error('[Subscription] Error fetching Stripe details:', err);
      }
    }

    return NextResponse.json({
      subscription: {
        status: tenant.subscriptionStatus,
        planInterval: tenant.planInterval,
        currentPeriodEnd: tenant.currentPeriodEnd,
        cancelAtPeriodEnd: tenant.cancelAtPeriodEnd,
      },
      modules: tenant.moduleSettings.map((m) => ({
        module: m.module,
        enabled: m.enabled,
        hasPriceAttached: !!m.stripePriceId,
      })),
      stripe: stripeDetails,
    });
  } catch (error) {
    console.error('[Subscription Status] Error:', error);

    return NextResponse.json(
      { error: 'No se pudo obtener el estado de la suscripción.' },
      { status: 500 }
    );
  }
}
