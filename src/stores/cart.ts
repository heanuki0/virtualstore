import { signal, computed } from '@preact/signals';
import { productById } from '../data/loader';
import { track } from '../analytics/gtag';
import type { Product } from '../data/schemas';

const LS_KEY = 'conran.cart.v1';

function readLS(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function writeLS(ids: string[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    // ignore (private mode / quota)
  }
}

export const cartIds = signal<string[]>(readLS());

export const cartItems = computed<Product[]>(() =>
  cartIds.value.map(productById).filter((p): p is Product => !!p),
);

export const cartTotal = computed<number>(() =>
  cartItems.value.reduce((sum, p) => sum + p.price, 0),
);

export const cartCount = computed<number>(() => cartIds.value.length);

export function addToCart(pid: string): void {
  if (cartIds.value.includes(pid)) return;
  cartIds.value = [...cartIds.value, pid];
  writeLS(cartIds.value);
  track('cart_add', { product_id: pid });
}

export function removeFromCart(pid: string): void {
  cartIds.value = cartIds.value.filter((x) => x !== pid);
  writeLS(cartIds.value);
  track('cart_remove', { product_id: pid });
}

export function toggleCart(pid: string): void {
  if (cartIds.value.includes(pid)) removeFromCart(pid);
  else addToCart(pid);
}

export function clearCart(): void {
  cartIds.value = [];
  writeLS([]);
}
