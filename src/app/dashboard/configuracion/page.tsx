import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/auth/auth';
import { calculateSubscriptionPrice } from '@/lib/domain/subscription';
import { ConfiguracionPageClient } from './ConfiguracionPageClient';
import type { SerializedUser, SerializedTenant, SerializedModuleSetting, SubscriptionPricingInfo } from './types';

export default async function ConfiguracionPage() {
  const session = await requireAuthSession();
  const isAdmin = session.role === 'ADMIN';

  const [user, tenant, moduleSettings, pricing] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        language: true,
        dateFormat: true,
        darkMode: true,
        notifyEmail: true,
        notifyWhatsApp: true,
      },
    }),
    prisma.tenant.findUniqueOrThrow({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        cuit: true,
        phone: true,
        fiscalAddress: true,
        subscriptionStatus: true,
        planInterval: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        mpPayerEmail: true,
        mpCardLastFour: true,
        mpCardBrand: true,
      },
    }),
    prisma.tenantModuleSetting.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, module: true, enabled: true },
      orderBy: { module: 'asc' },
    }),
    calculateSubscriptionPrice(session.tenantId),
  ]);

  const serializedUser: SerializedUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    language: user.language,
    dateFormat: user.dateFormat,
    darkMode: user.darkMode,
    notifyEmail: user.notifyEmail,
    notifyWhatsApp: user.notifyWhatsApp,
  };

  const serializedTenant: SerializedTenant = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    cuit: tenant.cuit,
    phone: tenant.phone,
    fiscalAddress: tenant.fiscalAddress,
    subscriptionStatus: tenant.subscriptionStatus,
    planInterval: tenant.planInterval,
    currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: tenant.cancelAtPeriodEnd,
    mpPayerEmail: tenant.mpPayerEmail,
    mpCardLastFour: tenant.mpCardLastFour,
    mpCardBrand: tenant.mpCardBrand,
  };

  const serializedModules: SerializedModuleSetting[] = moduleSettings.map((m) => ({
    id: m.id,
    module: m.module,
    enabled: m.enabled,
  }));

  const pricingInfo: SubscriptionPricingInfo = {
    basePriceUsd: pricing.basePriceUsd,
    modulePriceUsd: pricing.modulePriceUsd,
    enabledModuleCount: pricing.enabledModuleCount,
    enabledModules: pricing.enabledModules,
    modulesTotalUsd: pricing.modulesTotalUsd,
    totalUsd: pricing.totalUsd,
  };

  return (
    <ConfiguracionPageClient
      user={serializedUser}
      tenant={serializedTenant}
      moduleSettings={serializedModules}
      pricing={pricingInfo}
      isAdmin={isAdmin}
    />
  );
}
