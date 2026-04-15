#!/usr/bin/env tsx
/**
 * CI data validation — runs before `pnpm build`.
 * Parses public/data/*.json against zod schemas and checks cross-file integrity.
 * Exits non-zero on any error so CI/pre-commit can block bad content.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { AIFile, ProductsFile, RoomsetsFile, assertIntegrity } from '../src/data/schemas';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadJson<T>(file: string): Promise<T> {
  const raw = await readFile(path.join(root, 'public/data', file), 'utf8');
  return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
  const [pRaw, rRaw, aRaw] = await Promise.all([
    loadJson('products.json'),
    loadJson('rooms.json'),
    loadJson('ai-scenarios.json'),
  ]);

  const products = ProductsFile.parse(pRaw).products;
  const roomsets = RoomsetsFile.parse(rRaw).roomsets;
  const scenarios = AIFile.parse(aRaw).scenarios;
  assertIntegrity(products, roomsets, scenarios);

  console.log(`✓ products  ${products.length}개`);
  console.log(`✓ roomsets  ${roomsets.length}개`);
  console.log(`✓ scenarios ${scenarios.length}개`);
  console.log('✓ cross-file integrity OK');
}

main().catch((e) => {
  console.error('\n✗ 데이터 검증 실패:');
  console.error(e);
  process.exit(1);
});
