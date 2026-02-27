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
        locale: true,
        dateFormat: true,
        darkMode: true,
        emailNotifications: true,
        whatsappNotifications: true,
        dailySummary: true,
      },
    }),
    prisma.tenant.findUniqueOrThrow({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        cuit: true,
        legalName: true,
        companyPhone: true,
        companyAddress: true,
        subscriptionStatus: true,
        planInterval: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        mpPreapprovalId: true,
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
    locale: user.locale,
    dateFormat: user.dateFormat,
    darkMode: user.darkMode,
    emailNotifications: user.emailNotifications,
    whatsappNotifications: user.whatsappNotifications,
    dailySummary: user.dailySummary,
  };

  const serializedTenant: SerializedTenant = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    cuit: tenant.cuit,
    legalName: tenant.legalName,
    companyPhone: tenant.companyPhone,
    companyAddress: tenant.companyAddress,
    subscriptionStatus: tenant.subscriptionStatus,
    planInterval: tenant.planInterval,
    currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: tenant.cancelAtPeriodEnd,
    mpPreapprovalId: tenant.mpPreapprovalId,
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
