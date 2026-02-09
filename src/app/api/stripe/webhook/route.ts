import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

/**
 * Stripe webhook handler.
 *
 * Currently handles:
 *  - checkout.session.completed  (logs successful payments)
 *  - customer.subscription.deleted (logs cancellations)
 *
 * Account creation still happens on the success-page redirect; the webhook
 * serves as an auditable backup and can be extended for lifecycle events
 * (renewals, failed payments, cancellations, etc.).
 */
export async function POST(request: Request) {
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
    console.error('⚠️  Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(
        `✅ Checkout completed – session: ${session.id}, customer: ${session.customer}, email: ${session.customer_email}`
      );
      // Future: if the user never returned to the success page you can
      // trigger account creation here using session.metadata.
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(
        `🔄 Subscription updated – id: ${subscription.id}, status: ${subscription.status}`
      );
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(
        `❌ Subscription cancelled – id: ${subscription.id}`
      );
      // Future: disable optional modules for the tenant.
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(
        `⚠️  Payment failed – invoice: ${invoice.id}, customer: ${invoice.customer}`
      );
      // Future: notify the tenant admin about the failed payment.
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
