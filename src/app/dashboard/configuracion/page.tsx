import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/auth/auth';
import { stripe } from '@/lib/stripe';
import { ConfiguracionPageClient } from './ConfiguracionPageClient';
import type {
  SerializedUserProfile,
  SerializedTenantConfig,
  SerializedModuleSetting,
  StripeSubscriptionInfo,
} from './types';

export default async function ConfiguracionPage() {
  const session = await requireAuthSession();

  // Obtener datos del usuario
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      locale: true,
      dateFormat: true,
      darkMode: true,
      emailNotifications: true,
      whatsappNotifications: true,
      dailySummary: true,
    },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const userProfile: SerializedUserProfile = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    locale: user.locale,
    dateFormat: user.dateFormat,
    darkMode: user.darkMode,
    emailNotifications: user.emailNotifications,
    whatsappNotifications: user.whatsappNotifications,
    dailySummary: user.dailySummary,
  };

  // Obtener datos del tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true,
      name: true,
      legalName: true,
      cuit: true,
      companyPhone: true,
      companyAddress: true,
      subscriptionStatus: true,
      planInterval: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!tenant) {
    throw new Error('Tenant no encontrado');
  }

  const tenantConfig: SerializedTenantConfig = {
    id: tenant.id,
    name: tenant.name,
    legalName: tenant.legalName,
    cuit: tenant.cuit,
    companyPhone: tenant.companyPhone,
    companyAddress: tenant.companyAddress,
    subscriptionStatus: tenant.subscriptionStatus,
    planInterval: tenant.planInterval,
    currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: tenant.cancelAtPeriodEnd,
  };

  // Obtener información de suscripción de Stripe
  let stripeInfo: StripeSubscriptionInfo | null = null;
  if (tenant.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId, {
        expand: ['default_payment_method'],
      });

      const paymentMethod =
        subscription.default_payment_method &&
        typeof subscription.default_payment_method === 'object'
          ? subscription.default_payment_method
          : null;

      stripeInfo = {
        status: tenant.subscriptionStatus,
        planName: subscription.items.data[0]?.plan.nickname || 'Standard',
        planInterval: tenant.planInterval,
        currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: tenant.cancelAtPeriodEnd,
        paymentMethod:
          paymentMethod && paymentMethod.type === 'card' && paymentMethod.card
            ? {
                last4: paymentMethod.card.last4,
                brand: paymentMethod.card.brand,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year,
              }
            : null,
      };
    } catch (error) {
      console.error('Error fetching Stripe subscription:', error);
    }
  }

  // Obtener configuración de módulos
  const moduleSettings = await prisma.tenantModuleSetting.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { module: 'asc' },
  });

  // Los módulos opcionales son MACHINERY, PACKAGING, SALES
  const optionalModules = ['MACHINERY', 'PACKAGING', 'SALES'];

  const serializedModules: SerializedModuleSetting[] = moduleSettings.map((m) => ({
    module: m.module,
    enabled: m.enabled,
    isOptional: optionalModules.includes(m.module),
  }));

  return (
    <ConfiguracionPageClient
      userProfile={userProfile}
      tenantConfig={tenantConfig}
      stripeInfo={stripeInfo}
      moduleSettings={serializedModules}
    />
  );
}
