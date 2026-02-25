import { prisma } from '@/lib/prisma';
import type { ModuleKey } from '@prisma/client';

// ── Pricing Constants ──
const BASE_PRICE_USD = 200;
const MODULE_PRICE_USD = 20;

/** Modules that are NOT included in the base plan — each adds $20 USD/month. */
const OPTIONAL_MODULES: ModuleKey[] = ['PACKAGING', 'MACHINERY', 'SALES'];

export async function calculateSubscriptionPrice(tenantId: string) {
  // Only count optional modules — base modules (DASHBOARD, USERS, FIELD,
  // INVENTORY, WORKERS) are already included in the $200 USD base price.
  const enabledModules = await prisma.tenantModuleSetting.findMany({
    where: {
      tenantId,
      enabled: true,
      module: { in: OPTIONAL_MODULES },
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
