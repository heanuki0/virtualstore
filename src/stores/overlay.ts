import { signal } from '@preact/signals';
import { productById } from '../data/loader';
import { track } from '../analytics/gtag';

/**
 * Product detail overlay — single global modal shared across all scenes.
 * Opened by:
 *  - Hotspot click in Customize
 *  - Product card click in RoomsetDetail
 *  - AI card tap in AIAssistant
 *  - Cart item inspection (future)
 */
export const overlayProductId = signal<string | null>(null);

export function openProduct(pid: string, source: string = 'unknown'): void {
  const p = productById(pid);
  if (!p) return;
  overlayProductId.value = pid;
  track('product_view', { product_id: pid, price: p.price, source });
}

export function closeProduct(): void {
  overlayProductId.value = null;
}
