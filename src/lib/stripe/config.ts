/**
 * Stripe Subscription Configuration
 * ===================================
 *
 * Los Prices están creados en el Dashboard de Stripe.
 * Cada Price tiene metadata: { module: "inventario" | "maquinaria" | ... }
 *
 * Variables de entorno requeridas:
 *   STRIPE_PRICE_BASE_MONTHLY    → Price ID del pack base mensual
 *   STRIPE_PRICE_BASE_ANNUAL     → Price ID del pack base anual
 *
 * Los módulos opcionales se resuelven dinámicamente por metadata en Stripe,
 * pero se pueden mapear directamente por Price ID si se prefiere velocidad.
 *
 * IMPORTANTE: No hardcodear Price IDs en el código. Usar env vars.
 */

import type { ModuleKey } from '@prisma/client';

// ─── Pack Base (obligatorio) ──────────────────────────────
export const BASE_PACK_PRICES = {
  monthly: process.env.STRIPE_PRICE_BASE_MONTHLY!,
  annual: process.env.STRIPE_PRICE_BASE_ANNUAL!,
} as const;

// ─── Módulos obligatorios (incluidos en el pack base, sin costo extra) ───
export const MANDATORY_MODULES: ModuleKey[] = [
  'DASHBOARD',
  'USERS',
  'WORKERS',
  'FIELD',
  'INVENTORY',
  'SETTINGS',
];

// ─── Módulos opcionales (cada uno tiene su propio Price en Stripe) ───
export const OPTIONAL_MODULES: ModuleKey[] = [
  'MACHINERY',
  'PACKAGING',
  'SALES',
];

/**
 * Mapeo de ModuleKey → Price IDs de Stripe (mensual y anual).
 * Cada módulo opcional tiene su propio Price creado en el Dashboard.
 *
 * Variables de entorno:
 *   STRIPE_PRICE_MACHINERY_MONTHLY / STRIPE_PRICE_MACHINERY_ANNUAL
 *   STRIPE_PRICE_PACKAGING_MONTHLY / STRIPE_PRICE_PACKAGING_ANNUAL
 *   STRIPE_PRICE_SALES_MONTHLY    / STRIPE_PRICE_SALES_ANNUAL
 */
export const MODULE_PRICE_MAP: Record<string, { monthly: string; annual: string }> = {
  MACHINERY: {
    monthly: process.env.STRIPE_PRICE_MACHINERY_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_MACHINERY_ANNUAL || '',
  },
  PACKAGING: {
    monthly: process.env.STRIPE_PRICE_PACKAGING_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_PACKAGING_ANNUAL || '',
  },
  SALES: {
    monthly: process.env.STRIPE_PRICE_SALES_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_SALES_ANNUAL || '',
  },
};

// ─── Tipos ────────────────────────────────────────────────
export type PlanInterval = 'monthly' | 'annual';

/**
 * Obtiene el Price ID del pack base según el intervalo.
 */
export function getBasePriceId(interval: PlanInterval): string {
  const priceId = BASE_PACK_PRICES[interval];
  if (!priceId) {
    throw new Error(`Missing STRIPE_PRICE_BASE_${interval.toUpperCase()} env var`);
  }
  return priceId;
}

/**
 * Obtiene el Price ID de un módulo opcional según el intervalo.
 */
export function getModulePriceId(moduleKey: string, interval: PlanInterval): string {
  const entry = MODULE_PRICE_MAP[moduleKey];
  if (!entry) {
    throw new Error(`No Stripe price configured for module: ${moduleKey}`);
  }
  const priceId = entry[interval];
  if (!priceId) {
    throw new Error(
      `Missing STRIPE_PRICE_${moduleKey}_${interval.toUpperCase()} env var`
    );
  }
  return priceId;
}

/**
 * Valida que un módulo sea opcional (puede comprarse/quitarse).
 */
export function isOptionalModule(moduleKey: string): boolean {
  return OPTIONAL_MODULES.includes(moduleKey as ModuleKey);
}

/**
 * Devuelve todos los Price IDs conocidos de módulos opcionales para un intervalo.
 * Útil para buscar por priceId en subscription items.
 */
export function getAllModulePriceIds(interval: PlanInterval): Map<string, ModuleKey> {
  const map = new Map<string, ModuleKey>();
  for (const mod of OPTIONAL_MODULES) {
    const entry = MODULE_PRICE_MAP[mod];
    if (entry?.[interval]) {
      map.set(entry[interval], mod);
    }
  }
  return map;
}

/**
 * Dado un Price ID, devuelve el ModuleKey correspondiente (o null).
 * Busca en ambos intervalos.
 */
export function getModuleKeyByPriceId(priceId: string): ModuleKey | null {
  for (const [modKey, prices] of Object.entries(MODULE_PRICE_MAP)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return modKey as ModuleKey;
    }
  }
  return null;
}

/**
 * Determina si un Price ID corresponde al pack base.
 */
export function isBasePriceId(priceId: string): boolean {
  return (
    priceId === BASE_PACK_PRICES.monthly ||
    priceId === BASE_PACK_PRICES.annual
  );
}
