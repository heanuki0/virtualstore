import type { Product } from '../data/schemas';
import { track } from '../analytics/gtag';

/**
 * Commerce hand-off — Phase 1 uses plain outbound links.
 * Phase 2 will extend this module with a signed bridge URL once
 * Lotte Dept. store finalises the deep link spec (see spec §11 item 1).
 */

export function openProductPage(p: Product, source: string): void {
  track('commerce_outbound', { product_id: p.id, price: p.price, source });
  window.open(p.lotteUrl, '_blank', 'noopener,noreferrer');
}

export function openCartCategoryPage(productIds: string[]): void {
  const categoryUrl =
    import.meta.env.VITE_LOTTE_CONRAN_CATEGORY ??
    'https://www.lotteshopping.com/category/conran';
  track('commerce_outbound_cart', { count: productIds.length });
  window.open(categoryUrl, '_blank', 'noopener,noreferrer');
}
