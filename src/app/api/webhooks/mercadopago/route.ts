import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mpPreApproval } from '@/lib/mercadopago';
import { calculateSubscriptionPrice } from '@/lib/domain/subscription';
import type { SubscriptionStatus } from '@prisma/client';

// ── Mapping: MP preapproval status → Seedor SubscriptionStatus ──
// Simplified model: Only ACTIVE and PAST_DUE
// Cancelled subscriptions mark tenant for deletion at period end
const MP_STATUS_MAP: Record<string, SubscriptionStatus | 'CANCEL_AT_PERIOD_END'> = {
  authorized: 'ACTIVE',
  paused: 'PAST_DUE',
  cancelled: 'CANCEL_AT_PERIOD_END', // Mark for deletion at end of period
  pending: 'ACTIVE', // Treat pending as active initially
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
 * 
 * New logic (No account without payment):
 * - authorized → ACTIVE
 * - paused → PAST_DUE (recurring payment failed)
 * - cancelled → DELETE tenant and all associated data (cascade)
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
    select: { id: true, subscriptionStatus: true, name: true },
  });

  if (!tenant) {
    console.warn(`[MP Webhook] No se encontró Tenant con mpPreapprovalId=${preapprovalId}`);
    return;
  }

  // Map MP status to our action
  const action = MP_STATUS_MAP[preapproval.status];

  if (!action) {
    console.warn(`[MP Webhook] Status de MP no mapeado: ${preapproval.status}`);
    return;
  }

  // ── Handle cancellation: mark for deletion at period end ──
  if (action === 'CANCEL_AT_PERIOD_END') {
    console.log(`[MP Webhook] Suscripción cancelada. Marcando Tenant ${tenant.id} (${tenant.name}) para eliminación al fin del período.`);
    
    try {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { cancelAtPeriodEnd: true },
      });
      
      console.log(`[MP Webhook] ✓ Tenant ${tenant.id} marcado para cancelación al fin del período.`);
    } catch (updateErr) {
      console.error(`[MP Webhook] Error marcando Tenant ${tenant.id} para cancelación:`, updateErr);
    }
    
    return;
  }

  // ── Handle status updates (ACTIVE or PAST_DUE) ──
  // Extract end_date from auto_recurring
  const autoRecurring = preapproval.auto_recurring as Record<string, unknown> | undefined;
  const endDate = autoRecurring?.end_date;

  // Prepare update data
  const updateData: {
    subscriptionStatus: typeof action;
    currentPeriodEnd?: Date;
    mpLastEventAt: Date;
    cancelAtPeriodEnd?: boolean;
  } = {
    subscriptionStatus: action,
    currentPeriodEnd: typeof endDate === 'string' ? new Date(endDate) : undefined,
    mpLastEventAt: new Date(),
  };

  // If the subscription becomes ACTIVE and was marked for cancellation,
  // clear the cancellation flag (this means a reactivation was confirmed)
  if (action === 'ACTIVE' && tenant.cancelAtPeriodEnd) {
    updateData.cancelAtPeriodEnd = false;
    console.log(`[MP Webhook] Suscripción reactivada confirmada para Tenant ${tenant.id}. Limpiando cancelAtPeriodEnd.`);
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: updateData,
  });

  console.log(`[MP Webhook] Tenant ${tenant.id} status actualizado a ${action}`);
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

  // ── Post-payment price recalculation ──────────────────────────────
  // Only recalculate for approved payments on active subscriptions.
  // This is where deactivated-module price reductions finally take effect.
  const paymentStatus: string | undefined = payment.status;

  if (paymentStatus === 'approved' && tenant.mpPreapprovalId && tenant.subscriptionStatus === 'ACTIVE') {
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
 * and the tenant's plan interval, then updates the Mercado Pago preapproval's
 * `transaction_amount`.
 *
 * Called after each successful payment so that any modules disabled during
 * the previous cycle (whose cost was kept until now) get their price
 * reduction applied for the *next* billing cycle.
 *
 * Both MONTHLY and ANNUAL plans charge the monthly amount to respect MP's limit.
 * Annual plans charge 12 times (frequency=12 months) at the discounted rate.
 *
 * Monthly formula: $200 (base) + $20 × (enabled optional modules)
 * Annual formula:  $200 (base) + $15 × (enabled modules) → charged monthly for 12 months
 */
async function recalculateSubscriptionPrice(tenantId: string, preapprovalId: string) {
  const pricing = await calculateSubscriptionPrice(tenantId);

  // Always charge the monthly amount to respect MP's $2M ARS limit.
  // Annual plans use frequency=12 to indicate 12 monthly charges.
  const desiredAmount = pricing.totalPerMonth;

  // Fetch current MP amount to avoid a no-op update
  const preapproval = await mpPreApproval.get({ id: preapprovalId });
  const autoRecurring = preapproval.auto_recurring as Record<string, unknown> | undefined;
  const currentAmount = typeof autoRecurring?.transaction_amount === 'number'
    ? autoRecurring.transaction_amount
    : 0;

  if (currentAmount === desiredAmount) {
    return;
  }

  await mpPreApproval.update({
    id: preapprovalId,
    body: {
      auto_recurring: {
        transaction_amount: desiredAmount,
      },
    } as unknown as Parameters<typeof mpPreApproval.update>[0]['body'],
  });
}
