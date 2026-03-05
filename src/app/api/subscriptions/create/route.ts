import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthSession, hasRequiredRole } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { mpPreApproval } from '@/lib/mercadopago';
import { calculateSubscriptionPrice, convertUsdToArs } from '@/lib/domain/subscription';
import { getUsdToArsRate } from '@/lib/utils/exchange-rate';

/**
 * POST /api/subscriptions/create
 *
 * Creates a Mercado Pago recurring subscription (preapproval) for the
 * authenticated tenant. Pricing is calculated dynamically based on the
 * tenant's enabled modules and plan interval (MONTHLY or ANNUAL).
 *
 * Body (JSON):
 *   - payerEmail: string        (email of the person paying)
 *   - exchangeRate?: number     (USD → ARS rate, fetched automatically if omitted)
 *   - backUrl?: string          (optional, redirect URL after MP payment)
 *   - planInterval?: string     ('MONTHLY' | 'ANNUAL', defaults to tenant's stored interval)
 *
 * Flow:
 *   1. Authenticate → only ADMIN can create subscriptions
 *   2. Calculate price based on plan interval
 *   3. Convert to ARS using the exchange rate
 *   4. Create a preapproval (subscription) with redirect flow
 *   5. Save MP ID on the Tenant record
 *   6. Return the init_point URL for the user to complete payment
 */
export async function POST(request: NextRequest) {
  // ── 1. Auth ──
  const session = await getApiAuthSession(request);
  if (!session || !hasRequiredRole(session, ['ADMIN'])) {
    return NextResponse.json(
      { error: 'No autorizado. Solo el administrador puede crear suscripciones.' },
      { status: 401 }
    );
  }

  // ── 2. Parse body ──
  let body: { payerEmail?: string; exchangeRate?: number; backUrl?: string; planInterval?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la solicitud no es JSON válido.' },
      { status: 400 }
    );
  }

  const { payerEmail, exchangeRate, backUrl, planInterval } = body;

  if (!payerEmail || typeof payerEmail !== 'string') {
    return NextResponse.json(
      { error: 'El email del pagador es obligatorio.' },
      { status: 400 }
    );
  }

  // Fetch exchange rate if not provided
  let resolvedRate = exchangeRate;
  if (!resolvedRate || typeof resolvedRate !== 'number' || resolvedRate <= 0) {
    resolvedRate = await getUsdToArsRate();
  }

  // ── 3. Check if tenant already has an active subscription ──
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true,
      name: true,
      subscriptionStatus: true,
      mpPreapprovalId: true,
      mpPreapprovalPlanId: true,
      planInterval: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado.' }, { status: 404 });
  }

  if (tenant.subscriptionStatus === 'ACTIVE') {
    return NextResponse.json(
      { error: 'Ya tenés una suscripción activa. Cancelala primero para crear una nueva.' },
      { status: 409 }
    );
  }

  // ── 4. Calculate price (respecting plan interval) ──
  // Resolve plan interval: request body > tenant DB > default MONTHLY
  const resolvedPlanInterval =
    planInterval === 'ANNUAL' ? 'ANNUAL' as const
    : planInterval === 'MONTHLY' ? 'MONTHLY' as const
    : tenant.planInterval;

  const pricing = await calculateSubscriptionPrice(session.tenantId, resolvedPlanInterval);

  // For MP, we always charge monthly. Annual plans charge a higher monthly
  // amount that includes the 12-month commitment at the discounted rate.
  // This gives the best UX with MP's auto recurring model.
  const monthlyChargeUsd = pricing.totalPerMonth;
  const totalArs = convertUsdToArs(monthlyChargeUsd, resolvedRate);

  // ⚠️ AUDIT LOG: PRUEBA DE PRODUCCIÓN
  console.log(`🔔 PRUEBA DE PRODUCCIÓN: Iniciando suscripción real por un monto simbólico de ${totalArs.toFixed(2)} ARS (${monthlyChargeUsd} USD × ${resolvedRate.toFixed(2)} tasa)`);

  if (totalArs <= 0) {
    return NextResponse.json(
      { error: 'El monto calculado no es válido. Verificá la tasa de cambio.' },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seedor.com.ar';
  const resolvedBackUrl = backUrl
    ? `${appUrl}${backUrl.startsWith('/') ? backUrl : `/${backUrl}`}`
    : `${appUrl}/dashboard/configuracion?subscription=result`;

  try {
    // ── 5. Create Preapproval (Subscription) — redirect flow ──
    // For init_point redirect flow, create preapproval directly with auto_recurring.
    // Do NOT use preapproval_plan_id — that flow requires card_token_id for immediate charge.
    //
    // Both MONTHLY and ANNUAL plans charge monthly in MP to respect the $2M ARS limit.
    // Annual plans: frequency=12 months (12 monthly charges with annual pricing discount)
    // Monthly plans: frequency=1 month  (charged monthly)
    // The monthly amount already reflects the annual discount ($15/module vs $20/module).
    const isYearly = resolvedPlanInterval === 'ANNUAL';
    const mpFrequency = isYearly ? 12 : 1;
    const mpTransactionAmount = totalArs; // Always charge monthly amount

    const preapproval = await mpPreApproval.create({
      body: {
        payer_email: payerEmail,
        reason: `Suscripción Seedor ${isYearly ? 'Anual' : 'Mensual'} - ${tenant.name}`,
        external_reference: tenant.id,
        auto_recurring: {
          frequency: mpFrequency,
          frequency_type: 'months',
          transaction_amount: mpTransactionAmount,
          currency_id: 'ARS',
        },
        back_url: resolvedBackUrl,
      },
    });

    // ── 6. Update Tenant with MP IDs and plan interval ──
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        mpPreapprovalId: preapproval.id,
        mpPayerEmail: payerEmail,
        subscriptionStatus: 'TRIALING',
        planInterval: resolvedPlanInterval,
      },
    });

    // ── 7. Return the init_point for the user to complete ──
    return NextResponse.json({
      success: true,
      subscriptionId: preapproval.id,
      initPoint: preapproval.init_point,
      pricing: {
        planInterval: resolvedPlanInterval,
        totalUsd: pricing.totalUsd,
        totalPerMonth: pricing.totalPerMonth,
        totalArs: mpTransactionAmount,
        enabledModules: pricing.enabledModuleCount,
        yearlySavingsUsd: pricing.yearlySavingsUsd,
        breakdown: {
          baseUsd: pricing.basePriceUsd,
          modulesUsd: pricing.modulesTotalUsd,
        },
      },
    });
  } catch (err: unknown) {
    console.error('[MP Subscription Error]', JSON.stringify(err, null, 2));

    // The MP SDK throws plain objects { message, status } instead of Error instances
    let message = 'Error desconocido al crear la suscripción.';
    let statusCode = 500;

    if (err instanceof Error) {
      message = err.message;
    } else if (err && typeof err === 'object') {
      const mpErr = err as { message?: string; status?: number };
      if (mpErr.message) message = mpErr.message;
      if (mpErr.status) statusCode = mpErr.status;
    }

    return NextResponse.json(
      { error: `Error al crear la suscripción en Mercado Pago: ${message}` },
      { status: statusCode },
    );
  }
}
