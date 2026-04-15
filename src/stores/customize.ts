import { signal, computed } from '@preact/signals';
import type { Category, Product } from '../data/schemas';
import { productById, roomsetById, roomsets } from '../data/loader';
import { track } from '../analytics/gtag';

/**
 * Customize slot state — one product per category.
 * null = slot empty. Reset on scene enter or explicit call.
 */
export type Slots = Record<Category, string | null>;

const EMPTY_SLOTS: Slots = {
  sofa: null,
  table: null,
  light: null,
  rug: null,
  object: null,
};

export const slots = signal<Slots>({ ...EMPTY_SLOTS });
export const selectedCategory = signal<Category>('sofa');
/** Which roomset (panorama + hotspot set) is currently shown in the Customize stage. */
export const activeRoomsetId = signal<string | null>(null);

/** Lazily choose a default when data becomes available. */
export const activeRoomset = computed(() => {
  if (activeRoomsetId.value) {
    const r = roomsetById(activeRoomsetId.value);
    if (r) return r;
  }
  return roomsets.value[0] ?? null;
});

export function setActiveRoomset(id: string): void {
  if (activeRoomsetId.value === id) return;
  activeRoomsetId.value = id;
  track('roomset_stage_switch', { roomset_id: id });
}

/** Time-of-day variant id ('day' | 'sunset' | 'night' ...). */
export const activeVariantId = signal<string>('day');

export const activeVariant = computed(() => {
  const room = activeRoomset.value;
  if (!room?.panorama?.variants?.length) return null;
  return (
    room.panorama.variants.find((v) => v.id === activeVariantId.value) ??
    room.panorama.variants[0]
  );
});

export function setActiveVariant(id: string): void {
  if (activeVariantId.value === id) return;
  activeVariantId.value = id;
  track('variant_switch', { variant_id: id, roomset_id: activeRoomsetId.value ?? '' });
}

export const selectedProducts = computed<Product[]>(() =>
  (Object.values(slots.value).filter(Boolean) as string[])
    .map(productById)
    .filter((p): p is Product => !!p),
);

export const customizeTotal = computed<number>(() =>
  selectedProducts.value.reduce((sum, p) => sum + p.price, 0),
);

export const dominantStyle = computed<string>(() => {
  const counts: Record<string, number> = {};
  for (const p of selectedProducts.value) {
    counts[p.style] = (counts[p.style] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? 'minimal';
});

export function setSlot(cat: Category, pid: string | null): void {
  slots.value = { ...slots.value, [cat]: pid };
  if (pid) track('slot_swap', { category: cat, product_id: pid });
}

export function toggleSlot(pid: string): void {
  const p = productById(pid);
  if (!p) return;
  const current = slots.value[p.cat];
  setSlot(p.cat, current === pid ? null : pid);
}

export function resetSlots(): void {
  slots.value = { ...EMPTY_SLOTS };
}

/**
 * Seed slots + stage from a roomset.
 * Legacy signature (productIds only) still accepted for back-compat.
 */
export function seedFromRoomset(arg: string | string[], productIds?: string[]): void {
  let pids: string[];
  if (Array.isArray(arg)) {
    pids = arg;
  } else {
    setActiveRoomset(arg);
    const r = roomsetById(arg);
    pids = productIds ?? r?.products ?? [];
  }
  const next: Slots = { ...EMPTY_SLOTS };
  for (const pid of pids) {
    const p = productById(pid);
    if (p && !next[p.cat]) next[p.cat] = pid;
  }
  slots.value = next;
}
