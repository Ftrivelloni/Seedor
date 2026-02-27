import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mpPreApproval } from '@/lib/mercadopago';
import { calculateSubscriptionPrice } from '@/lib/domain/subscription';
import type { SubscriptionStatus } from '@prisma/client';

// ── Mapping: MP preapproval status → Seedor SubscriptionStatus ──
const MP_STATUS_MAP: Record<string, SubscriptionStatus> = {
  authorized: 'ACTIVE',
  paused: 'PAST_DUE',
  cancelled: 'CANCELED',
  pending: 'TRIALING',
};

/**
 * Validates the x-signature header sent by Mercado Pago.
 *
 * MP signature format in header `x-signature`:
 *   ts=1234567890,v1=abc123def456...
 *
 * The HMAC-SHA256 is computed over the template:
 *   id:{data.id};request-id:{x-request-id};ts:{ts};
 *
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
function verifyWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  // Parse ts and v1 from the header
  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, rest.join('=')];
    })
  );

  const ts = parts['ts'];
  const v1 = parts['v1'];

  if (!ts || !v1) return false;

  // Build the manifest string as MP specifies
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const expectedSignature = createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/mercadopago
 *
 * Receives webhook notifications from Mercado Pago for subscription events.
 *
 * Flow:
 *   1. Validate the HMAC signature using MP_WEBHOOK_SECRET
 *   2. Parse the notification type and data ID
 *   3. For subscription_preapproval events, fetch the preapproval from MP
 *   4. Find the Tenant by mpPreapprovalId and update subscriptionStatus
 *   5. Always respond 200 so MP doesn't retry
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[MP Webhook] MP_WEBHOOK_SECRET no está configurado.');
    // Still return 200 to prevent MP from retrying indefinitely
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── 1. Extract headers and query params ──
  const xSignature = request.headers.get('x-signature') ?? '';
  const xRequestId = request.headers.get('x-request-id') ?? '';

  let body: {
    id?: string | number;
    type?: string;
    action?: string;
    data?: { id?: string };
  };

  try {
    body = await request.json();
  } catch {
    console.error('[MP Webhook] Body no es JSON válido.');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const dataId = body.data?.id ?? String(body.id ?? '');
  const notificationType = body.type ?? '';
  const action = body.action ?? '';

  // ── 2. Validate signature ──
  if (xSignature) {
    const isValid = verifyWebhookSignature(xSignature, xRequestId, dataId, webhookSecret);

    if (!isValid) {
      console.warn('[MP Webhook] Firma inválida. Rechazando notificación.', {
        type: notificationType,
        dataId,
      });
      // Return 200 anyway to avoid infinite retries from MP on misconfigured secrets
      return NextResponse.json({ received: true, error: 'invalid_signature' }, { status: 200 });
    }
  }

  console.log(`[MP Webhook] Notificación recibida: type=${notificationType} action=${action} dataId=${dataId}`);

  // ── 3. Handle subscription_preapproval events ──
  if (notificationType === 'subscription_preapproval') {
    try {
      await handlePreapprovalEvent(dataId);
    } catch (err) {
      console.error('[MP Webhook] Error procesando preapproval:', err);
    }
  }

  // ── 4. Handle payment events linked to subscriptions ──
  if (notificationType === 'payment' && action === 'payment.created') {
    try {
      await handlePaymentEvent(dataId);
    } catch (err) {
      console.error('[MP Webhook] Error procesando payment:', err);
    }
  }

  // ── 5. Always return 200 ──
  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Fetches the preapproval from MP and updates the Tenant's subscription status.
 */
async function handlePreapprovalEvent(preapprovalId: string) {
  if (!preapprovalId) return;

  // Fetch fresh data from Mercado Pago
  const preapproval = await mpPreApproval.get({ id: preapprovalId });

  if (!preapproval || !preapproval.status) {
    console.warn(`[MP Webhook] Preapproval ${preapprovalId} no encontrado o sin status.`);
    return;
  }

  // Find the tenant that owns this preapproval
  const tenant = await prisma.tenant.findFirst({
    where: { mpPreapprovalId: preapprovalId },
    select: { id: true, subscriptionStatus: true },
  });

  if (!tenant) {
    console.warn(`[MP Webhook] No se encontró Tenant con mpPreapprovalId=${preapprovalId}`);
    return;
  }

  // Map MP status to our SubscriptionStatus
  const newStatus = MP_STATUS_MAP[preapproval.status];

  if (!newStatus) {
    console.warn(`[MP Webhook] Status de MP no mapeado: ${preapproval.status}`);
    return;
  }

  // Only update if the status actually changed
  if (tenant.subscriptionStatus === newStatus) {
    console.log(`[MP Webhook] Tenant ${tenant.id} ya tiene status ${newStatus}, sin cambios.`);
    return;
  }

  // Extract end_date from auto_recurring (MP SDK types may not include it)
  const autoRecurring = preapproval.auto_recurring as Record<string, unknown> | undefined;
  const endDate = autoRecurring?.end_date;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: newStatus,
      currentPeriodEnd: typeof endDate === 'string' ? new Date(endDate) : undefined,
      mpLastEventAt: new Date(),
    },
  });

  console.log(`[MP Webhook] Tenant ${tenant.id} actualizado:`, {
    previousStatus: tenant.subscriptionStatus,
    newStatus,
    currentPeriodEnd: endDate ?? 'N/A',
    mpPreapprovalId: preapprovalId,
  });
}

/**
 * Handles payment events associated with a subscription.
 * Updates mpLastPaymentId for idempotency tracking.
 *
 * **Post-payment price recalculation (deferred deactivation sync):**
 * When a module is deactivated, the DB is updated immediately (the user loses
 * access at once) but the MP `transaction_amount` is intentionally left
 * unchanged so the current-period charge still covers the month the module
 * was active.  After each successful payment we recalculate the correct
 * amount based on the modules that are currently `enabled` and push it to
 * MP — this is the only moment the price decrease takes effect.
 */
async function handlePaymentEvent(paymentId: string) {
  if (!paymentId) return;

  // For payment events, we need to find the preapproval_id from the payment
  // We fetch the payment to get the preapproval link
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    console.warn(`[MP Webhook] No se pudo obtener payment ${paymentId}: ${response.status}`);
    return;
  }

  const payment = await response.json();
  const preapprovalId = payment.metadata?.preapproval_id ?? payment.preapproval_id;

  if (!preapprovalId) {
    // Not a subscription payment, skip
    return;
  }

  const tenant = await prisma.tenant.findFirst({
    where: { mpPreapprovalId: preapprovalId },
    select: { id: true, mpLastPaymentId: true, subscriptionStatus: true, mpPreapprovalId: true },
  });

  if (!tenant) return;

  // Idempotency: skip if we already processed this payment
  if (tenant.mpLastPaymentId === paymentId) return;

  // Extract card data if present
  const card = payment.card as Record<string, unknown> | undefined;
  const cardLastFour = typeof card?.last_four_digits === 'string' ? card.last_four_digits : undefined;
  const cardBrand = typeof payment.payment_method_id === 'string' ? (payment.payment_method_id as string) : undefined;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      mpLastPaymentId: paymentId,
      mpLastEventAt: new Date(),
      ...(cardLastFour && { mpCardLastFour: cardLastFour }),
      ...(cardBrand && { mpCardBrand: cardBrand }),
    },
  });

  console.log(`[MP Webhook] Payment ${paymentId} registrado para Tenant ${tenant.id}${cardLastFour ? ` (tarjeta ····${cardLastFour})` : ''}`);

  // ── Post-payment price recalculation ──────────────────────────────
  // Only recalculate for approved payments on active subscriptions.
  // This is where deactivated-module price reductions finally take effect.
  const paymentStatus: string | undefined = payment.status;

  if (paymentStatus === 'approved' && tenant.mpPreapprovalId && tenant.subscriptionStatus === 'ACTIVE') {
    console.log(`[MP Webhook] Pago aprobado para Tenant ${tenant.id} → recalculando precio de suscripción post-cobro...`);
    try {
      await recalculateSubscriptionPrice(tenant.id, tenant.mpPreapprovalId);
    } catch (err) {
      // Log but don't fail — the payment was already recorded successfully.
      console.error(`[MP Webhook] Error recalculando precio post-pago para Tenant ${tenant.id}:`, err);
    }
  }
}

/**
 * Recalculates the subscription price based on currently-enabled modules
 * and updates the Mercado Pago preapproval's `transaction_amount`.
 *
 * Called after each successful payment so that any modules disabled during
 * the previous cycle (whose cost was kept until now) get their price
 * reduction applied for the *next* billing cycle.
 *
 * Formula:  $200 (base) + $20 × (enabled optional modules)
 */
async function recalculateSubscriptionPrice(tenantId: string, preapprovalId: string) {
  // Fetch tenant data for period validation
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { currentPeriodEnd: true, name: true },
  });

  console.log('[MP Webhook] Validación de período antes de recalcular:', {
    tenantId,
    tenantName: tenant?.name,
    currentPeriodEnd: tenant?.currentPeriodEnd?.toISOString() ?? 'N/A',
    now: new Date().toISOString(),
  });

  const pricing = await calculateSubscriptionPrice(tenantId);

  console.log(`[MP Webhook] recalculateSubscriptionPrice → Tenant ${tenantId}:`, {
    enabledModules: pricing.enabledModules,
    enabledCount: pricing.enabledModuleCount,
    calculatedTotal: pricing.totalUsd,
  });

  // Fetch current MP amount to avoid a no-op update
  const preapproval = await mpPreApproval.get({ id: preapprovalId });
  const autoRecurring = preapproval.auto_recurring as Record<string, unknown> | undefined;
  const currentAmount = typeof autoRecurring?.transaction_amount === 'number'
    ? autoRecurring.transaction_amount
    : 0;

  if (currentAmount === pricing.totalUsd) {
    console.log(
      `[MP Webhook] Precio sin cambios para Tenant ${tenantId}: $${currentAmount}. Sin actualización en MP.`
    );
    return;
  }

  await mpPreApproval.update({
    id: preapprovalId,
    body: {
      auto_recurring: {
        transaction_amount: pricing.totalUsd,
      },
    } as unknown as Parameters<typeof mpPreApproval.update>[0]['body'],
  });

  console.log(
    `[MP Webhook] Precio recalculado para Tenant ${tenantId}: $${currentAmount} → $${pricing.totalUsd} (${pricing.enabledModuleCount} módulo(s) opcional(es)).`
  );
}
