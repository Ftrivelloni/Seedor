import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/index';
import { findOrCreateCustomer } from '@/lib/stripe/helpers';
import {
  getBasePriceId,
  getModulePriceId,
  isOptionalModule,
  type PlanInterval,
} from '@/lib/stripe/config';

/**
 * POST /api/stripe/create-checkout
 *
 * Crea una Checkout Session de Stripe en modo "subscription".
 *
 * Flujo:
 *   1. Valida los datos de entrada.
 *   2. Crea o reutiliza un Customer en Stripe (por email).
 *   3. Arma los line_items: pack base (obligatorio) + módulos opcionales.
 *   4. Crea la session con metadata de trazabilidad.
 *   5. Retorna la URL de checkout.
 *
 * FUENTE DE VERDAD: La activación real de la cuenta y módulos ocurre en el
 * webhook (checkout.session.completed / invoice.payment_succeeded), NO aquí.
 * Este endpoint solo crea la intención de pago.
 *
 * Body esperado:
 *   {
 *     email: string;
 *     companyName: string;
 *     companyId?: string;          // Si la empresa ya existe en la DB
 *     interval?: "monthly" | "annual";
 *     selectedModules?: string[];   // Ej: ["MACHINERY", "PACKAGING"]
 *   }
 */

interface CreateCheckoutRequest {
  email?: string;
  companyName?: string;
  companyId?: string;
  interval?: PlanInterval;
  selectedModules?: string[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCheckoutRequest;
    const {
      email,
      companyName,
      companyId,
      interval = 'monthly',
      selectedModules = [],
    } = body;

    // ─── Validación ───────────────────────────────────────
    if (!email || !companyName) {
      return NextResponse.json(
        { error: 'Se requieren email y nombre de empresa.' },
        { status: 400 }
      );
    }

    if (interval !== 'monthly' && interval !== 'annual') {
      return NextResponse.json(
        { error: 'El intervalo debe ser "monthly" o "annual".' },
        { status: 400 }
      );
    }

    // Filtrar solo módulos opcionales válidos
    const validModules = selectedModules.filter(isOptionalModule);

    // ─── Customer: crear o reutilizar ─────────────────────
    // NO usar customer_email en la session: si ya existe el Customer,
    // se asocia directamente. Esto evita crear duplicados.
    const customer = await findOrCreateCustomer({
      email,
      name: companyName,
      metadata: {
        companyName,
        ...(companyId ? { companyId } : {}),
        source: 'seedor_checkout',
      },
    });

    // ─── Line Items ───────────────────────────────────────
    // SIEMPRE incluir el pack base. Es obligatorio.
    const lineItems: { price: string; quantity: number }[] = [
      {
        price: getBasePriceId(interval),
        quantity: 1,
      },
    ];

    // Agregar módulos opcionales seleccionados
    for (const moduleKey of validModules) {
      lineItems.push({
        price: getModulePriceId(moduleKey, interval),
        quantity: 1,
      });
    }

    // ─── Metadata ─────────────────────────────────────────
    // Se guarda en session Y en subscription_data para que la
    // suscripción herede la metadata tras el checkout.
    const metadata = {
      companyName,
      email,
      interval,
      selectedModules: JSON.stringify(validModules),
      source: 'seedor_checkout',
      ...(companyId ? { companyId } : {}),
    };

    // ─── Crear Checkout Session ───────────────────────────
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: lineItems,
      metadata,
      subscription_data: {
        metadata, // La suscripción hereda la metadata
      },
      allow_promotion_codes: true,
      payment_method_collection: 'always',
      // URLs de retorno
      success_url: `${origin}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register/select-plan`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      { error: `No se pudo crear la sesión de pago: ${message}` },
      { status: 500 }
    );
  }
}
