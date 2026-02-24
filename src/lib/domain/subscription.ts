import { prisma } from '@/lib/prisma';

// ── Pricing Constants ──
const BASE_PRICE_USD = 200;
const MODULE_PRICE_USD = 20;

/**
 * Calculates the monthly subscription price for a tenant.
 *
 * Formula: $200 USD base + ($20 USD × enabled modules)
 *
 * @param tenantId - The tenant to calculate pricing for
 * @returns Object with pricing breakdown and total
 */
export async function calculateSubscriptionPrice(tenantId: string) {
  const enabledModules = await prisma.tenantModuleSetting.findMany({
    where: {
      tenantId,
      enabled: true,
    },
    select: {
      module: true,
    },
  });

  const enabledCount = enabledModules.length;
  const modulesTotal = MODULE_PRICE_USD * enabledCount;
  const totalUsd = BASE_PRICE_USD + modulesTotal;

  return {
    basePriceUsd: BASE_PRICE_USD,
    modulePriceUsd: MODULE_PRICE_USD,
    enabledModuleCount: enabledCount,
    enabledModules: enabledModules.map((m) => m.module),
    modulesTotalUsd: modulesTotal,
    totalUsd,
  };
}

/**
 * Converts a USD amount to ARS using the provided exchange rate.
 *
 * @param amountUsd - Amount in USD
 * @param exchangeRate - Current USD → ARS rate
 * @returns Amount in ARS (rounded to 2 decimals)
 */
export function convertUsdToArs(amountUsd: number, exchangeRate: number): number {
  return Math.round(amountUsd * exchangeRate * 100) / 100;
}

export type SubscriptionPricing = Awaited<ReturnType<typeof calculateSubscriptionPrice>>;
