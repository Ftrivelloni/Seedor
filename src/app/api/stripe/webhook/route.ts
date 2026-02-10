import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/index';
import { prisma } from '@/lib/prisma';
import {
  getModuleKeyByPriceId,
  isBasePriceId,
  MANDATORY_MODULES,
  OPTIONAL_MODULES,
} from '@/lib/stripe/config';
import type { ModuleKey, SubscriptionStatus } from '@prisma/client';

/**
 * POST /api/stripe/webhook
 *
 * Webhook handler seguro para eventos de Stripe.
 *
 * ════════════════════════════════════════════════════════════════
 *   REGLAS FUNDAMENTALES:
 * ════════════════════════════════════════════════════════════════
 *
 *   1. FUENTE DE VERDAD: invoice.payment_succeeded es el evento que
 *      activa la cuenta. checkout.session.completed vincula IDs.
 *
 *   2. IDEMPOTENCIA: Cada evento se registra en StripeEvent.
 *      Si ya fue procesado, se ignora (HTTP 200 para evitar retries).
 *
 *   3. STRIPE IDs como fuente de verdad: Nunca confiar en metadata
 *      para decidir si cobrar. Los IDs de Stripe (subscription.id,
 *      customer.id) son la referencia absoluta.
 *
 *   4. SIEMPRE retornar 200: Incluso en errores internos, loggear
 *      pero responder 200 para que Stripe no reintente infinitamente.
 *      Solo retornar 400 si la firma es inválida.
 *
 * ════════════════════════════════════════════════════════════════
 *   EVENTOS ESCUCHADOS:
 * ════════════════════════════════════════════════════════════════
 *
 *   - checkout.session.completed    → Vincula Stripe IDs al Tenant
 *   - customer.subscription.created → Registra nueva suscripción
 *   - customer.subscription.updated → Sync estado y módulos
 *   - customer.subscription.deleted → Desactiva cuenta
 *   - invoice.payment_succeeded     → Activa/renueva cuenta (FUENTE DE VERDAD)
 *   - invoice.payment_failed        → Marca como PAST_DUE
 *
 * ════════════════════════════════════════════════════════════════
 */

// Next.js App Router: desactivar body parsing para leer raw body
export const runtime = 'nodejs';

export async function POST(request: Request) {
  // ─── 1. Verificar firma ─────────────────────────────────
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Webhook] Firma inválida:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // ─── 2. Idempotencia: verificar si ya procesamos este evento ─
  const alreadyProcessed = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
  });

  if (alreadyProcessed) {
    // Ya procesado — retornar 200 sin hacer nada
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ─── 3. Procesar según tipo de evento ───────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Evento no manejado: ${event.type}`);
    }

    // ─── 4. Registrar evento como procesado (idempotencia) ─
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
      },
    });
  } catch (error) {
    // Loggear pero NO retornar error HTTP — evitar retries infinitos
    // de Stripe. El evento se puede reprocesar manualmente si falla.
    console.error(`[Webhook] Error procesando ${event.type}:`, error);

    // Igualmente registrar para no reprocesar un evento roto
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: `ERROR:${event.type}`,
      },
    }).catch(() => {
      // Si falla el registro de idempotencia, el evento se reintentará
      // lo cual está bien — preferimos reprocesar a perder eventos.
    });
  }

  return NextResponse.json({ received: true });
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * checkout.session.completed
 *
 * Se dispara cuando el cliente completa el checkout.
 * Vincula el stripeCustomerId y stripeSubscriptionId al Tenant.
 *
 * NOTA: NO activar la cuenta aquí. Esperar a invoice.payment_succeeded.
 * El checkout.completed solo confirma que el flujo terminó, pero el pago
 * podría no haberse cobrado aún (ej: trial, pagos asincrónicos).
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const metadata = session.metadata || {};

  console.log(`[Webhook] Checkout completado: session=${session.id}, customer=${customerId}`);

  if (!customerId || !subscriptionId) {
    console.warn('[Webhook] Checkout sin customer o subscription ID, ignorando.');
    return;
  }

  // Buscar tenant por stripeCustomerId o por companyId en metadata
  let tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { stripeCustomerId: customerId },
        ...(metadata.companyId ? [{ id: metadata.companyId }] : []),
      ],
    },
  });

  if (tenant) {
    // Actualizar con los IDs de Stripe
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        planInterval: metadata.interval === 'annual' ? 'ANNUAL' : 'MONTHLY',
      },
    });
  } else {
    // Si el tenant no existe aún (el registro crea el tenant después),
    // no hacemos nada. El register endpoint vinculará los IDs.
    console.log('[Webhook] Tenant no encontrado para checkout, será vinculado en registro.');
  }
}

/**
 * customer.subscription.created
 *
 * Se dispara cuando se crea una nueva suscripción.
 * Registra el subscription ID y sincroniza los módulos iniciales.
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`[Webhook] Suscripción creada: ${subscription.id}, status=${subscription.status}`);

  const tenant = await findTenantByStripeIds(subscription);
  if (!tenant) return;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: mapStripeStatus(subscription.status),
      currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000 || Date.now()),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Sincronizar módulos basándose en los subscription items
  await syncModulesFromSubscription(tenant.id, subscription);
}

/**
 * customer.subscription.updated
 *
 * Se dispara cuando cambia algo en la suscripción:
 *   - Se agrega/quita un item (módulo)
 *   - Cambia el estado (active → past_due, etc.)
 *   - Se cancela al final del periodo
 *
 * Este es el handler más importante para mantener la DB sincronizada.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`[Webhook] Suscripción actualizada: ${subscription.id}, status=${subscription.status}`);

  const tenant = await findTenantByStripeIds(subscription);
  if (!tenant) return;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: mapStripeStatus(subscription.status),
      currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000 || Date.now()),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Re-sincronizar módulos — es la fuente de verdad de qué items están activos
  await syncModulesFromSubscription(tenant.id, subscription);
}

/**
 * customer.subscription.deleted
 *
 * La suscripción fue cancelada de forma definitiva.
 * Desactivar todos los módulos opcionales. Los obligatorios quedan
 * en modo lectura (decisión de negocio).
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[Webhook] Suscripción eliminada: ${subscription.id}`);

  const tenant = await findTenantByStripeIds(subscription);
  if (!tenant) return;

  await prisma.$transaction([
    // Marcar suscripción como cancelada
    prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: 'CANCELED',
        cancelAtPeriodEnd: false,
      },
    }),
    // Desactivar TODOS los módulos opcionales
    prisma.tenantModuleSetting.updateMany({
      where: {
        tenantId: tenant.id,
        module: { in: OPTIONAL_MODULES },
      },
      data: {
        enabled: false,
        stripeSubscriptionItemId: null,
        stripePriceId: null,
      },
    }),
  ]);
}

/**
 * invoice.payment_succeeded
 *
 * ★ FUENTE DE VERDAD PARA ACTIVAR LA CUENTA ★
 *
 * Este evento confirma que el dinero fue cobrado exitosamente.
 *
 * Se usa para:
 *   - Activar la cuenta en el primer pago
 *   - Renovar la suscripción en pagos subsiguientes
 *   - Confirmar que módulos nuevos están pagados
 *
 * ¿Por qué NO usar checkout.session.completed?
 *   Porque checkout.completed se dispara antes de que el pago
 *   sea confirmado por el banco. invoice.payment_succeeded es
 *   la confirmación real del cobro.
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Stripe v20+: subscription ID está en parent.subscription_details
  const subscriptionId = extractSubscriptionId(invoice);
  if (!subscriptionId) {
    console.log('[Webhook] Invoice sin subscription, ignorando (one-time payment?).');
    return;
  }

  console.log(`[Webhook] Pago exitoso: invoice=${invoice.id}, subscription=${subscriptionId}`);

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscriptionId },
        { stripeCustomerId: invoice.customer as string },
      ],
    },
  });

  if (!tenant) {
    console.warn(`[Webhook] Tenant no encontrado para subscription=${subscriptionId}`);
    return;
  }

  // Obtener la suscripción completa para sincronizar
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: invoice.customer as string,
      subscriptionStatus: 'ACTIVE', // Pago confirmado = cuenta activa
      currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000 || Date.now()),
    },
  });

  // Sincronizar módulos con lo que realmente está pagado
  await syncModulesFromSubscription(tenant.id, subscription);
}

/**
 * invoice.payment_failed
 *
 * El pago falló (tarjeta rechazada, fondos insuficientes, etc.).
 * Stripe reintentará según la configuración de Smart Retries.
 *
 * Acciones:
 *   - Marcar como PAST_DUE (gracia antes de cancelar)
 *   - Opcionalmente: notificar al admin por email
 *   - NO desactivar módulos inmediatamente (Stripe reintentará)
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Stripe v20+: subscription ID está en parent.subscription_details
  const subscriptionId = extractSubscriptionId(invoice);
  if (!subscriptionId) return;

  console.warn(`[Webhook] Pago fallido: invoice=${invoice.id}, subscription=${subscriptionId}`);

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscriptionId },
        { stripeCustomerId: invoice.customer as string },
      ],
    },
  });

  if (!tenant) return;

  // Solo marcar como PAST_DUE, no desactivar aún
  // Stripe reintentará el cobro automáticamente.
  // Si todos los reintentos fallan, se dispara subscription.deleted.
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });

  // TODO: Enviar email de notificación al admin del tenant
  // await sendPaymentFailedEmail(tenant.id, invoice);
}

// ═══════════════════════════════════════════════════════════════
// HELPERS INTERNOS
// ═══════════════════════════════════════════════════════════════

/**
 * Busca el Tenant asociado a una suscripción de Stripe.
 * Busca por subscriptionId primero, luego por customerId.
 */
async function findTenantByStripeIds(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscription.id },
        { stripeCustomerId: customerId },
      ],
    },
  });

  if (!tenant) {
    console.warn(
      `[Webhook] Tenant no encontrado: subscription=${subscription.id}, customer=${customerId}`
    );
  }

  return tenant;
}

/**
 * Sincroniza los módulos activos del Tenant con los subscription items
 * reales de Stripe.
 *
 * LÓGICA:
 *   - Módulos obligatorios: siempre enabled (no dependen de Stripe items)
 *   - Módulos opcionales: enabled solo si hay un subscription item activo
 *
 * Esta función es la FUENTE DE VERDAD para qué módulos están activos.
 * Se llama desde múltiples event handlers para mantener consistencia.
 */
async function syncModulesFromSubscription(
  tenantId: string,
  subscription: Stripe.Subscription
) {
  // Mapear subscription items a módulos
  const activeModuleItems = new Map<ModuleKey, { priceId: string; itemId: string }>();

  for (const item of subscription.items.data) {
    const priceId = typeof item.price === 'string' ? item.price : item.price.id;

    // Ignorar el pack base
    if (isBasePriceId(priceId)) continue;

    const moduleKey = getModuleKeyByPriceId(priceId);
    if (moduleKey) {
      activeModuleItems.set(moduleKey, {
        priceId,
        itemId: item.id,
      });
    }
  }

  // Dentro de una transacción, actualizar todos los módulos
  await prisma.$transaction(async (tx) => {
    // 1. Asegurar que los módulos obligatorios existan y estén activos
    for (const mod of MANDATORY_MODULES) {
      await tx.tenantModuleSetting.upsert({
        where: { tenantId_module: { tenantId, module: mod } },
        update: { enabled: true },
        create: { tenantId, module: mod, enabled: true },
      });
    }

    // 2. Sincronizar módulos opcionales
    for (const mod of OPTIONAL_MODULES) {
      const stripeItem = activeModuleItems.get(mod);

      await tx.tenantModuleSetting.upsert({
        where: { tenantId_module: { tenantId, module: mod } },
        update: {
          enabled: !!stripeItem,
          stripePriceId: stripeItem?.priceId || null,
          stripeSubscriptionItemId: stripeItem?.itemId || null,
        },
        create: {
          tenantId,
          module: mod,
          enabled: !!stripeItem,
          stripePriceId: stripeItem?.priceId || null,
          stripeSubscriptionItemId: stripeItem?.itemId || null,
        },
      });
    }
  });

  console.log(
    `[Webhook] Módulos sincronizados para tenant=${tenantId}: ` +
    `activos=[${Array.from(activeModuleItems.keys()).join(', ')}]`
  );
}

/**
 * Extrae el subscription ID de un Invoice (Stripe v20+ compatible).
 * En v20+, el subscription está en parent.subscription_details.subscription.
 */
function extractSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

/**
 * Mapea el status de Stripe al enum SubscriptionStatus de Prisma.
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'UNPAID',
    incomplete: 'INACTIVE',
    incomplete_expired: 'CANCELED',
    paused: 'INACTIVE',
  };

  return statusMap[stripeStatus] || 'INACTIVE';
}
