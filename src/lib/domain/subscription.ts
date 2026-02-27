import { prisma } from '@/lib/prisma';
import type { ModuleKey, PlanInterval } from '@prisma/client';

// ── Pricing Constants ──
export const BASE_PRICE_MONTHLY_USD = 200;
export const MODULE_PRICE_MONTHLY_USD = 20;
export const MODULE_PRICE_YEARLY_USD = 15; // $15/month when billed annually ($180/year per module)

/** Modules that are NOT included in the base plan. */
export const OPTIONAL_MODULES: ModuleKey[] = ['PACKAGING', 'MACHINERY', 'SALES'];

/**
 * Calculates the subscription price for a given tenant.
 *
 * @param tenantId - The tenant to calculate for.
 * @param planInterval - 'MONTHLY' or 'YEARLY'. If omitted, reads from the Tenant record.
 *
 * Monthly: $200 base + $20/module/month
 * Yearly:  $200/month ($2,400/year) + $15/module/month ($180/year per module)
 *          → Savings: $5/module/month ($60/year per module)
 */
export async function calculateSubscriptionPrice(
  tenantId: string,
  planInterval?: PlanInterval,
) {
  // Resolve the plan interval — use the DB value if not provided.
  let resolvedInterval: PlanInterval = planInterval ?? 'MONTHLY';

  if (!planInterval) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { planInterval: true },
    });
    if (tenant) resolvedInterval = tenant.planInterval;
  }

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
  const isYearly = resolvedInterval === 'ANNUAL';

  // Monthly unit prices
  const modulePricePerMonth = isYearly ? MODULE_PRICE_YEARLY_USD : MODULE_PRICE_MONTHLY_USD;
  const basePricePerMonth = BASE_PRICE_MONTHLY_USD;

  // Monthly totals
  const modulesTotalPerMonth = modulePricePerMonth * enabledCount;
  const totalPerMonth = basePricePerMonth + modulesTotalPerMonth;

  // Period totals (what the user actually pays per billing cycle)
  const multiplier = isYearly ? 12 : 1;
  const totalUsd = totalPerMonth * multiplier;
  const baseTotalUsd = basePricePerMonth * multiplier;
  const modulesTotalUsd = modulesTotalPerMonth * multiplier;

  // Savings vs. monthly (only meaningful for yearly)
  const monthlyCostIfMonthly = BASE_PRICE_MONTHLY_USD + MODULE_PRICE_MONTHLY_USD * enabledCount;
  const yearlyEquivalentOfMonthly = monthlyCostIfMonthly * 12;
  const yearlySavingsUsd = isYearly ? yearlyEquivalentOfMonthly - totalUsd : 0;
  const monthlySavingsPerModule = isYearly
    ? MODULE_PRICE_MONTHLY_USD - MODULE_PRICE_YEARLY_USD
    : 0;

  return {
    planInterval: resolvedInterval,
    // Per-month unit prices
    basePricePerMonth,
    modulePricePerMonth,
    // Legacy aliases (backward-compatible)
    basePriceUsd: baseTotalUsd,
    modulePriceUsd: modulePricePerMonth,
    // Module info
    enabledModuleCount: enabledCount,
    enabledModules: enabledModules.map((m) => m.module),
    // Period totals
    modulesTotalUsd,
    totalUsd,
    // Monthly equivalent (for display: "USD $X/mes")
    totalPerMonth,
    // Savings
    yearlySavingsUsd,
    monthlySavingsPerModule,
  };
}

/**
 * Calculates subscription price for a static module count (used during
 * registration before the tenant exists in the DB).
 */
export function calculateStaticPrice(
  optionalModuleCount: number,
  planInterval: PlanInterval,
) {
  const isYearly = planInterval === 'ANNUAL';
  const modulePricePerMonth = isYearly ? MODULE_PRICE_YEARLY_USD : MODULE_PRICE_MONTHLY_USD;
  const basePricePerMonth = BASE_PRICE_MONTHLY_USD;

  const modulesTotalPerMonth = modulePricePerMonth * optionalModuleCount;
  const totalPerMonth = basePricePerMonth + modulesTotalPerMonth;

  const multiplier = isYearly ? 12 : 1;
  const totalUsd = totalPerMonth * multiplier;

  const monthlyCostIfMonthly = BASE_PRICE_MONTHLY_USD + MODULE_PRICE_MONTHLY_USD * optionalModuleCount;
  const yearlyEquivalentOfMonthly = monthlyCostIfMonthly * 12;
  const yearlySavingsUsd = isYearly ? yearlyEquivalentOfMonthly - totalUsd : 0;

  return {
    planInterval,
    basePricePerMonth,
    modulePricePerMonth,
    totalPerMonth,
    totalUsd,
    yearlySavingsUsd,
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
