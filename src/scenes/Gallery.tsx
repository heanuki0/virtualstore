import { signal } from '@preact/signals';
import { roomsets } from '../data/loader';
import { goScene } from '../stores/scene';
import type { Style } from '../data/schemas';

const STYLES: Array<{ key: 'all' | Style; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'modern', label: '모던' },
  { key: 'classic', label: '클래식' },
  { key: 'mid-century', label: '미드센추리' },
  { key: 'minimal', label: '미니멀' },
];

const PRICE_BUCKETS: Array<{ key: string; label: string; min?: number; max?: number }> = [
  { key: 'all', label: '전체' },
  { key: 'low', label: '300만원 이하', max: 3_000_000 },
  { key: 'mid', label: '300~1,000만원', min: 3_000_000, max: 10_000_000 },
  { key: 'high', label: '1,000만원 이상', min: 10_000_000 },
];

const styleFilter = signal<'all' | Style>('all');
const priceFilter = signal<string>('all');

/**
 * Scene D — Gallery
 * 컨셉 룸셋 그리드 + 스타일/금액 필터. PDF p.1 ②, p.2 ②.
 */
export function Gallery() {
  const bucket = PRICE_BUCKETS.find((b) => b.key === priceFilter.value);
  const list = roomsets.value.filter((r) => {
    if (styleFilter.value !== 'all' && r.style !== styleFilter.value) return false;
    if (bucket?.max !== undefined && r.priceMin > bucket.max) return false;
    if (bucket?.min !== undefined && r.priceMin < bucket.min) return false;
    return true;
  });

  return (
    <section class="max-w-7xl mx-auto px-8 py-12 animate-fade-in">
      <header class="mb-9">
        <div class="text-[11px] tracking-kern text-conran-accent font-bold mb-2.5">
          CURATED ROOMSETS
        </div>
        <h2 class="serif text-4xl md:text-5xl font-bold mb-1.5">컨셉별 룸셋</h2>
        <p class="text-sm text-gray-600 max-w-xl leading-relaxed">
          콘란 디자이너들이 직접 제안하는 라이프스타일 컨셉. 스타일과 예산으로 좁혀 보세요.
        </p>
      </header>

      <div class="flex gap-6 mb-7 pb-5 border-b border-conran-cream flex-wrap">
        <FilterGroup label="Style">
          {STYLES.map((s) => (
            <Chip
              key={s.key}
              active={styleFilter.value === s.key}
              onClick={() => (styleFilter.value = s.key)}
            >
              {s.label}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label="Price">
          {PRICE_BUCKETS.map((b) => (
            <Chip
              key={b.key}
              active={priceFilter.value === b.key}
              onClick={() => (priceFilter.value = b.key)}
            >
              {b.label}
            </Chip>
          ))}
        </FilterGroup>
      </div>

      {list.length === 0 ? (
        <div class="text-center py-16 text-gray-500 text-sm">
          조건에 맞는 룸셋이 없어요. 필터를 넓혀보세요.
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((r) => (
            <button
              key={r.id}
              class="bg-white border border-conran-cream rounded-sm overflow-hidden text-left transition hover:-translate-y-1 hover:shadow-2xl"
              onClick={() => goScene(`roomset/${r.id}` as const)}
            >
              <div
                class="h-56 bg-cover bg-center relative"
                style={{ backgroundImage: `url('${r.hero}')` }}
              >
                <div class="absolute top-3 left-3 bg-white/95 text-conran-black text-[10px] tracking-widest px-2.5 py-1 font-bold rounded-sm">
                  {STYLES.find((s) => s.key === r.style)?.label ?? r.style}
                </div>
                <div class="absolute bottom-3 right-3 bg-conran-black text-white text-[11px] px-2.5 py-1 font-bold rounded-sm">
                  {r.priceTag}
                </div>
              </div>
              <div class="p-5">
                <div class="text-[10px] tracking-widest text-conran-accent font-bold mb-1.5">
                  {r.concept.toUpperCase()}
                </div>
                <h3 class="serif text-xl font-bold mb-2">{r.name}</h3>
                <p class="text-[13px] text-gray-600 leading-snug mb-3 min-h-[42px]">{r.desc}</p>
                <div class="flex justify-between pt-3 border-t border-[#f0e8da] text-[11px] text-gray-500">
                  <span>구성 상품</span>
                  <strong class="text-conran-black">{r.products.length}개</strong>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterGroup({ label, children }: { label: string; children: preact.ComponentChildren }) {
  return (
    <div class="flex items-center gap-2.5 flex-wrap">
      <span class="text-[10px] tracking-kern text-gray-500 font-bold uppercase">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: preact.ComponentChildren;
}) {
  return (
    <button
      class={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
        active ? 'bg-conran-black text-white' : 'bg-[#f5efe3] text-gray-600 hover:bg-[#ebe3d2]'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
