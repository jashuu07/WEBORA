import { existsSync } from 'node:fs';
import path from 'node:path';
import { STOCK_IMAGES, industryStockImages, type StockImage } from './stock';

/**
 * Server-side view of the stock library.
 *
 * A generated website must never reference an image file that is not on disk,
 * and the editor's image picker must never show a broken thumbnail. Both read
 * this module, which filters the catalogue against `public/`.
 *
 * Server-only by design: `node:fs` lives here rather than in `stock.ts` so the
 * pure catalogue stays importable from client components.
 */

const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Checking a couple of dozen paths is cheap, but the result is cached for the
// life of the process to keep generation snappy. `revalidateStock()` exists so a
// long-running server can refresh after images are added (e.g. a deploy).
let cache: { at: number; available: Set<string> } | null = null;
const TTL_MS = 30_000;

function available(): Set<string> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.available;
  const set = new Set<string>();
  for (const image of STOCK_IMAGES) {
    try {
      if (existsSync(path.join(PUBLIC_DIR, image.url.replace(/^\//, '')))) set.add(image.url);
    } catch {
      // A read failure must not break generation — treat the file as missing.
    }
  }
  cache = { at: now, available: set };
  return set;
}

/** The stock library limited to files that actually exist. */
export function listStockImages(): StockImage[] {
  const set = available();
  return STOCK_IMAGES.filter((image) => set.has(image.url));
}

/** Industry imagery with any missing file removed; falls back to whatever exists. */
export function existingIndustryImages(industry: string): string[] {
  const set = available();
  const wanted = industryStockImages(industry);
  const present = wanted.filter((url) => set.has(url));
  if (present.length) return present;

  const fallback = STOCK_IMAGES.filter((image) => set.has(image.url)).map((image) => image.url);
  return fallback.length ? [fallback[0]] : [];
}

export function revalidateStock() {
  cache = null;
}
