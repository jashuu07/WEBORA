import { createContext, useContext } from 'react';
import { STOCK_IMAGES, type StockImage } from '@/lib/media/stock';

/**
 * The stock image library, as seen by the editor.
 *
 * The catalogue itself lives in `lib/media/stock.ts` (pure data). The editor
 * page resolves which of those files actually exist on disk and provides the
 * filtered list here, so the picker never renders a dead thumbnail.
 */

export const StockLibraryContext = createContext<StockImage[]>(STOCK_IMAGES);

export function useStockLibrary(): StockImage[] {
  return useContext(StockLibraryContext);
}

/** Kept for callers that want the raw catalogue (labels, industries). */
export { STOCK_IMAGES as SAMPLE_IMAGES };
export type { StockImage };
