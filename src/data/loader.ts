import { signal } from '@preact/signals';
import {
  AIFile,
  ProductsFile,
  RoomsetsFile,
  assertIntegrity,
  type AIScenario,
  type Product,
  type Roomset,
} from './schemas';

/**
 * Runtime data stores — populated once at app mount.
 * Components read these via signals; they're populated by loadAllData().
 */
export const products = signal<Product[]>([]);
export const roomsets = signal<Roomset[]>([]);
export const scenarios = signal<AIScenario[]>([]);
export const dataReady = signal<boolean>(false);

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}

export async function loadAllData(): Promise<void> {
  const [pRaw, rRaw, aRaw] = await Promise.all([
    fetchJson('/data/products.json'),
    fetchJson('/data/rooms.json'),
    fetchJson('/data/ai-scenarios.json'),
  ]);

  const p = ProductsFile.parse(pRaw).products;
  const r = RoomsetsFile.parse(rRaw).roomsets;
  const a = AIFile.parse(aRaw).scenarios;

  assertIntegrity(p, r, a);

  products.value = p;
  roomsets.value = r;
  scenarios.value = a;
  dataReady.value = true;
}

/** Lookup helpers — narrowed getters used by scenes/components. */
export function productById(id: string): Product | undefined {
  return products.value.find((p) => p.id === id);
}
export function roomsetById(id: string): Roomset | undefined {
  return roomsets.value.find((r) => r.id === id);
}
export function scenarioByTrigger(t: string): AIScenario | undefined {
  return scenarios.value.find((s) => s.trigger === t);
}
