/**
 * Stripe Helper Functions
 * ========================
 *
 * Funciones utilitarias para operaciones comunes con la API de Stripe.
 * Centraliza la lógica de Customer lookup/create y subscription queries.
 */

import type Stripe from 'stripe';
import { stripe } from './index';

/**
 * Busca un Customer existente por email, o crea uno nuevo.
 * Si ya existe un Customer con ese email en Stripe, lo reutiliza.
 *
 * IMPORTANTE: Siempre pasar metadata relevante (companyId, tenantId)
 * para poder trazar en el Dashboard.
 */
export async function findOrCreateCustomer(params: {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const { email, name, metadata } = params;

  // Buscar Customer existente por email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];

    // Actualizar metadata si se proporcionó nueva
    if (metadata) {
      return stripe.customers.update(customer.id, {
        metadata: { ...customer.metadata, ...metadata },
      });
    }

    return customer;
  }

  // Crear nuevo Customer
  return stripe.customers.create({
    email,
    name,
    metadata: metadata || {},
  });
}

/**
 * Obtiene la suscripción activa de un Customer expandiendo los items.
 * Retorna null si no tiene suscripción activa.
 */
export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
    expand: ['data.items.data.price'],
  });

  return subscriptions.data[0] || null;
}

/**
 * Obtiene una suscripción por ID con items expandidos.
 */
export async function getSubscriptionWithItems(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });
}

/**
 * Busca un subscription item específico dentro de una suscripción
 * por su Price ID.
 */
export function findSubscriptionItemByPriceId(
  subscription: Stripe.Subscription,
  priceId: string
): Stripe.SubscriptionItem | undefined {
  return subscription.items.data.find(
    (item) => item.price.id === priceId
  );
}
