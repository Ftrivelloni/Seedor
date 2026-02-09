import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

const MODULE_NAMES: Record<string, string> = {
  MACHINERY: 'Módulo Maquinaria',
  PACKAGING: 'Módulo Empaque',
  SALES: 'Módulo Ventas',
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  MACHINERY: 'Seguimiento de equipos y mantenimiento',
  PACKAGING: 'Control de líneas de empaque y producción',
  SALES: 'Gestión de clientes y pedidos',
};

const VALID_OPTIONAL_MODULES = ['MACHINERY', 'PACKAGING', 'SALES'];
const PRICE_PER_MODULE_CENTS = 2000; // USD $20.00

interface CreateCheckoutRequest {
  email?: string;
  companyName?: string;
  selectedModules?: string[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCheckoutRequest;
    const { email, companyName, selectedModules } = body;

    if (!email || !companyName || !selectedModules?.length) {
      return NextResponse.json(
        { error: 'Se requieren email, nombre de empresa y módulos seleccionados.' },
        { status: 400 }
      );
    }

    // Validate that all selected modules are valid optional modules
    const validModules = selectedModules.filter((m) =>
      VALID_OPTIONAL_MODULES.includes(m)
    );

    if (validModules.length === 0) {
      return NextResponse.json(
        { error: 'No se seleccionaron módulos opcionales válidos.' },
        { status: 400 }
      );
    }

    // Build line items — one per selected optional module (subscription)
    const lineItems = validModules.map((moduleKey) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: MODULE_NAMES[moduleKey] || `Módulo ${moduleKey}`,
          description:
            MODULE_DESCRIPTIONS[moduleKey] ||
            `Suscripción mensual - Seedor ${moduleKey}`,
        },
        unit_amount: PRICE_PER_MODULE_CENTS,
        recurring: {
          interval: 'month' as const,
        },
      },
      quantity: 1,
    }));

    // Derive origin from the incoming request
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      metadata: {
        companyName,
        email,
        selectedModules: JSON.stringify(validModules),
        source: 'seedor_registration',
      },
      subscription_data: {
        metadata: {
          companyName,
          email,
          selectedModules: JSON.stringify(validModules),
        },
      },
      success_url: `${origin}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register/select-plan`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'No se pudo crear la sesión de pago.' },
      { status: 500 }
    );
  }
}
