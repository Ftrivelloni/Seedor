const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares/oficial';

/** Fallback rate if the API is unreachable (updated 2026-02-23) */
const FALLBACK_RATE = 1200;

/** Cache duration in ms (5 minutes) */
const CACHE_DURATION_MS = 5 * 60 * 1000;

let cachedRate: { value: number; fetchedAt: number } | null = null;

/**
 * Fetches the official USD → ARS exchange rate from dolarapi.com.
 * Caches the result for 5 minutes. Falls back to a hardcoded rate on failure.
 *
 * @returns The sell price (venta) of the official dollar in ARS
 */
export async function getUsdToArsRate(): Promise<number> {
  // Return cached value if fresh
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_DURATION_MS) {
    return cachedRate.value;
  }

  try {
    const response = await fetch(DOLAR_API_URL, {
      next: { revalidate: 300 }, // 5 min ISR cache for Next.js
    });

    if (!response.ok) {
      console.warn(`[ExchangeRate] API responded ${response.status}, using fallback rate.`);
      return FALLBACK_RATE;
    }

    const data = (await response.json()) as { venta: number; compra: number };
    const rate = data.venta;

    if (typeof rate !== 'number' || rate <= 0) {
      console.warn('[ExchangeRate] Invalid rate from API, using fallback.');
      return FALLBACK_RATE;
    }

    cachedRate = { value: rate, fetchedAt: Date.now() };
    return rate;
  } catch (err) {
    console.warn('[ExchangeRate] Failed to fetch rate, using fallback:', err);
    return FALLBACK_RATE;
  }
}
