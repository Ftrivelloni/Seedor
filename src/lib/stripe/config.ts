/**
 * Stripe Subscription Configuration
 * ===================================
 *
 * Los Prices están creados en el Dashboard de Stripe.
 * Cada Product tiene metadata con key "module" indicando a qué módulo
 * corresponde. Ej: module=BASE, module=MACHINERY, module=PACKAGING, module=SALES
 *
 * Este módulo resuelve Price IDs dinámicamente desde la API de Stripe
 * usando la metadata de los Products. No requiere env vars por módulo.
 *
 * Variables de entorno requeridas:
 *   STRIPE_SECRET_KEY         → API key de Stripe
 *   STRIPE_WEBHOOK_SECRET     → Secret para verificar webhooks
 *
 * Metadata esperada en cada Product de Stripe:
 *   module = "BASE" | "MACHINERY" | "PACKAGING" | "SALES"
 *
 * Cada Product puede tener múltiples Prices (mensual, anual).
 * Se identifica el intervalo por price.recurring.interval.
 */

import type { ModuleKey } from '@prisma/client';
import { stripe } from './index';

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

// ─── Tipos ────────────────────────────────────────────────
export type PlanInterval = 'monthly' | 'annual';

// ─── Cache en memoria ─────────────────────────────────────
// Estructura: { "BASE": { "monthly": "price_xxx", "annual": "price_yyy" }, ... }
type PriceCache = Record<string, { monthly: string; annual: string }>;

let cachedPrices: PriceCache | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Fetches all active Prices from Stripe, groups them by Product metadata.module
 * and price.recurring.interval. Results are cached in memory for 5 minutes.
 *
 * Expected Product metadata: { module: "BASE" | "MACHINERY" | "PACKAGING" | "SALES" }
 * Expected Price recurring.interval: "month" | "year"
 */
async function loadPricesFromStripe(): Promise<PriceCache> {
  const now = Date.now();

  // Retornar cache si es válido
  if (cachedPrices && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedPrices;
  }

  console.log('[Stripe Config] Cargando precios desde Stripe API...');

  const prices: PriceCache = {};

  // Obtener todos los Prices activos con su Product expandido
  const allPrices = await stripe.prices.list({
    active: true,
    expand: ['data.product'],
    limit: 100,
  });

  for (const price of allPrices.data) {
    // Solo considerar precios recurrentes
    if (price.type !== 'recurring' || !price.recurring) continue;

    // Obtener el Product (expandido)
    const product = price.product;
    if (!product || typeof product === 'string') continue;
    if ('deleted' in product && product.deleted) continue;
    if (!('active' in product) || !product.active) continue;

    // Leer metadata.module del Product
    const moduleKey = ('metadata' in product ? product.metadata?.module ?? '' : '').toUpperCase();
    if (!moduleKey) continue;

    // Mapear el intervalo de Stripe a nuestro tipo
    const stripeInterval = price.recurring.interval; // "month" | "year"
    const interval: PlanInterval | null =
      stripeInterval === 'month' ? 'monthly' :
      stripeInterval === 'year' ? 'annual' :
      null;

    if (!interval) continue;

    // Inicializar si no existe
    if (!prices[moduleKey]) {
      prices[moduleKey] = { monthly: '', annual: '' };
    }

    prices[moduleKey][interval] = price.id;
  }

  // Validar que encontramos el pack base
  if (!prices['BASE']?.monthly && !prices['BASE']?.annual) {
    console.warn(
      '[Stripe Config] No se encontró Product con metadata module=BASE. ' +
      'Asegurate de que exista un Product en Stripe con metadata: { module: "BASE" }'
    );
  }

  cachedPrices = prices;
  cacheTimestamp = now;

  console.log(
    '[Stripe Config] Precios cargados:',
    Object.entries(prices).map(([k, v]) => `${k}: monthly=${v.monthly ? '✓' : '✗'} annual=${v.annual ? '✓' : '✗'}`).join(', ')
  );

  return prices;
}

/**
 * Invalida el cache para forzar recarga en la próxima llamada.
 */
export function invalidatePriceCache(): void {
  cachedPrices = null;
  cacheTimestamp = 0;
}

/**
 * Obtiene el Price ID del pack base según el intervalo.
 */
export async function getBasePriceId(interval: PlanInterval): Promise<string> {
  const prices = await loadPricesFromStripe();
  const priceId = prices['BASE']?.[interval];

  if (!priceId) {
    throw new Error(
      `No se encontró un Price para el pack base (${interval}). ` +
      `Asegurate de tener un Product en Stripe con metadata: { module: "BASE" } ` +
      `y un Price recurrente ${interval === 'monthly' ? 'mensual' : 'anual'} activo.`
    );
  }

  return priceId;
}

/**
 * Obtiene el Price ID de un módulo opcional según el intervalo.
 */
export async function getModulePriceId(moduleKey: string, interval: PlanInterval): Promise<string> {
  const prices = await loadPricesFromStripe();
  const priceId = prices[moduleKey.toUpperCase()]?.[interval];

  if (!priceId) {
    throw new Error(
      `No se encontró un Price para el módulo ${moduleKey} (${interval}). ` +
      `Asegurate de tener un Product en Stripe con metadata: { module: "${moduleKey.toUpperCase()}" } ` +
      `y un Price recurrente ${interval === 'monthly' ? 'mensual' : 'anual'} activo.`
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
export async function getAllModulePriceIds(interval: PlanInterval): Promise<Map<string, ModuleKey>> {
  const prices = await loadPricesFromStripe();
  const map = new Map<string, ModuleKey>();

  for (const mod of OPTIONAL_MODULES) {
    const priceId = prices[mod]?.[interval];
    if (priceId) {
      map.set(priceId, mod);
    }
  }

  return map;
}

/**
 * Dado un Price ID, devuelve el ModuleKey correspondiente (o null).
 * Busca en ambos intervalos.
 */
export async function getModuleKeyByPriceId(priceId: string): Promise<ModuleKey | null> {
  const prices = await loadPricesFromStripe();

  for (const [modKey, modPrices] of Object.entries(prices)) {
    if (modPrices.monthly === priceId || modPrices.annual === priceId) {
      // Verificar que es un ModuleKey válido (no "BASE")
      if (OPTIONAL_MODULES.includes(modKey as ModuleKey)) {
        return modKey as ModuleKey;
      }
    }
  }

  return null;
}

/**
 * Determina si un Price ID corresponde al pack base.
 */
export async function isBasePriceId(priceId: string): Promise<boolean> {
  const prices = await loadPricesFromStripe();
  return (
    priceId === prices['BASE']?.monthly ||
    priceId === prices['BASE']?.annual
  );
}

