import { z } from 'zod';

/**
 * Conran × Lotte Web Virtual Store — data schemas
 * All public/data/*.json files are parsed through these schemas.
 * Any CI change must pass `pnpm validate` (scripts/validate-data.ts).
 */

export const Category = z.enum(['sofa', 'table', 'light', 'rug', 'object']);
export type Category = z.infer<typeof Category>;

export const Style = z.enum(['modern', 'classic', 'mid-century', 'minimal']);
export type Style = z.infer<typeof Style>;

export const Product = z.object({
  id: z.string().regex(/^P\d{2,3}$/, 'Product id must match P\\d{2,3}'),
  name: z.string().min(1),
  cat: Category,
  style: Style,
  price: z.number().int().positive(),
  desc: z.string(),
  img: z.string(),
  lotteUrl: z.string().url().or(z.string().startsWith('/')),
});
export type Product = z.infer<typeof Product>;

export const Hotspot = z.object({
  id: z.string().regex(/^H\d{2,3}$/),
  yaw: z.number().min(-180).max(180),
  pitch: z.number().min(-90).max(90),
  category: Category,
  defaultProduct: z.string().regex(/^P\d{2,3}$/),
  swappable: z.boolean().default(true),
});
export type Hotspot = z.infer<typeof Hotspot>;

export const Roomset = z.object({
  id: z.string().regex(/^R\d{2}$/),
  name: z.string().min(1),
  concept: z.string().min(1),
  style: Style,
  priceMin: z.number().int().nonnegative(),
  priceTag: z.string(),
  hero: z.string(),
  panorama: z
    .object({
      // Default/fallback equirectangular image
      equirect: z.string().optional(),
      // Cube-tiled multi-resolution (marzipano-tool output)
      base: z.string().optional(),
      levels: z.array(z.number().int().positive()).default([]),
      previewUrl: z.string().optional(),
      // Time-of-day / mood variants. First entry is the default when no variant chosen.
      variants: z
        .array(
          z.object({
            id: z.string(), // 'day' | 'sunset' | 'night' etc.
            label: z.string(), // UI-facing Korean label
            icon: z.string().optional(), // emoji or single char for toggle
            equirect: z.string(),
          }),
        )
        .default([]),
    })
    .refine((v) => !!v.equirect || (!!v.base && v.levels.length > 0) || v.variants.length > 0, {
      message: 'panorama requires equirect OR (base + levels) OR variants',
    })
    .optional(),
  hotspots: z.array(Hotspot).default([]),
  products: z.array(z.string().regex(/^P\d{2,3}$/)).min(1),
  desc: z.string(),
  aiHints: z.array(z.string()).default([]),
});
export type Roomset = z.infer<typeof Roomset>;

export const AIScenario = z.object({
  trigger: z.string().min(1),
  response: z.string().min(1),
  cards: z.array(z.string().regex(/^P\d{2,3}$/)).max(6).default([]),
  roomset: z
    .string()
    .regex(/^R\d{2}$/)
    .optional(),
});
export type AIScenario = z.infer<typeof AIScenario>;

/** Dataset root file shapes */
export const ProductsFile = z.object({ products: z.array(Product) });
export const RoomsetsFile = z.object({ roomsets: z.array(Roomset) });
export const AIFile = z.object({ scenarios: z.array(AIScenario) });

/** Cross-file integrity check. Call after all three files parsed. */
export function assertIntegrity(
  products: Product[],
  roomsets: Roomset[],
  scenarios: AIScenario[],
): void {
  const pids = new Set(products.map((p) => p.id));
  for (const r of roomsets) {
    for (const pid of r.products) {
      if (!pids.has(pid)) throw new Error(`Roomset ${r.id} references missing product ${pid}`);
    }
    for (const h of r.hotspots) {
      if (!pids.has(h.defaultProduct))
        throw new Error(`Hotspot ${h.id} in ${r.id} missing product ${h.defaultProduct}`);
    }
  }
  const rids = new Set(roomsets.map((r) => r.id));
  for (const s of scenarios) {
    for (const pid of s.cards) {
      if (!pids.has(pid)) throw new Error(`AI scenario "${s.trigger}" missing product ${pid}`);
    }
    if (s.roomset && !rids.has(s.roomset))
      throw new Error(`AI scenario "${s.trigger}" missing roomset ${s.roomset}`);
  }
}
