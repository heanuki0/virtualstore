import { useEffect, useState } from 'preact/hooks';
import { effect } from '@preact/signals';
import { products, roomsets } from '../data/loader';
import {
  activeRoomset,
  activeRoomsetId,
  activeVariant,
  activeVariantId,
  customizeTotal,
  dominantStyle,
  selectedCategory,
  selectedProducts,
  setActiveRoomset,
  setActiveVariant,
  setSlot,
  slots,
  toggleSlot,
} from '../stores/customize';
import { addToCart } from '../stores/cart';
import { MarzipanoView } from '../viewer/Marzipano';
import { openProduct } from '../stores/overlay';
import type { Category, Hotspot, Product } from '../data/schemas';

const CATEGORIES: Array<{ key: Category; label: string; icon: string }> = [
  { key: 'sofa', label: '소파', icon: '🛋️' },
  { key: 'table', label: '테이블', icon: '🪵' },
  { key: 'light', label: '조명', icon: '💡' },
  { key: 'rug', label: '러그', icon: '🟫' },
  { key: 'object', label: '소품', icon: '🏺' },
];

const STAGE_TINTS: Record<string, string> = {
  modern: 'linear-gradient(180deg,#eaeef2 0%,#c5cfd8 55%,#8a9aa8 100%)',
  classic: 'linear-gradient(180deg,#f2ead9 0%,#d8c098 55%,#9c7348 100%)',
  'mid-century': 'linear-gradient(180deg,#f5e3c9 0%,#e2ad78 55%,#a56633 100%)',
  minimal: 'linear-gradient(180deg,#f7f3eb 0%,#e5ddc8 55%,#c8bda0 100%)',
};

const won = (n: number) => '₩ ' + n.toLocaleString('ko-KR');

/**
 * Scene C — Customize
 * 5 카테고리 가구 교체 + 가격 합산 + Marzipano 파노라마 배경 + 핫스팟.
 *
 * 파노라마 연결 정책:
 *  - 첫 룸셋(R01)을 기본 스테이지로 사용.
 *  - Roomset.panorama 가 있으면 <MarzipanoView>, 없으면 SVG 폴백.
 *  - 핫스팟 클릭 → 해당 카테고리 패널로 포커스 이동.
 */
export function Customize() {
  useEffect(() => {
    if (Object.values(slots.value).every((v) => !v)) {
      setSlot('sofa', 'P01');
      setSlot('light', 'P13');
      setSlot('rug', 'P19');
    }
  }, []);

  // Explicit signal subscription bridge — some Preact/Signals toolchains
  // don't auto-track reads across computed chains; force a re-render when the
  // active variant/roomset changes so Marzipano `key` updates and remounts.
  const [, forceTick] = useState(0);
  useEffect(
    () =>
      effect(() => {
        const r = activeRoomsetId.value;
        const v = activeVariantId.value;
        // eslint-disable-next-line no-console
        console.log('[Customize/effect] room=' + r + ' variant=' + v);
        forceTick((t) => (t + 1) | 0);
      }),
    [],
  );
  // eslint-disable-next-line no-console
  console.log('[Customize/render] variantId=' + activeVariantId.value + ' equirect=' + (activeVariant.value && activeVariant.value.equirect));

  // Explicit subscriptions — ensure this component re-renders when signals change.
  const variantId = activeVariantId.value;
  const variant = activeVariant.value;
  const stageRoom = activeRoomset.value;
  const hasPanorama = !!stageRoom?.panorama;

  const filteredProducts = products.value.filter((p) => p.cat === selectedCategory.value);
  const onBuyAll = () => {
    for (const p of selectedProducts.value) addToCart(p.id);
  };
  const onHotspotClick = (h: Hotspot) => {
    selectedCategory.value = h.category;
    // Prefer showing the product detail so user can review before placing.
    // "이 방에 배치하기" CTA within the overlay commits to the slot.
    openProduct(h.defaultProduct, 'hotspot');
  };

  return (
    <section class="grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-[calc(100vh-114px)] animate-fade-in">
      <div
        class="relative overflow-hidden"
        style={{ background: STAGE_TINTS[dominantStyle.value] ?? STAGE_TINTS.minimal }}
      >
        <RoomsetPicker />
        <VariantToggle />
        {hasPanorama && stageRoom ? (
          <MarzipanoView
            key={`${stageRoom.id}:${variantId}`}
            room={stageRoom}
            equirectOverride={variant?.equirect}
            onHotspotClick={onHotspotClick}
          />
        ) : (
          <svg
            class="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1600 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f7f0e0" />
                <stop offset="100%" stop-color="#e2d6be" />
              </linearGradient>
              <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#d8c5a0" />
                <stop offset="100%" stop-color="#a88a5e" />
              </linearGradient>
            </defs>
            <rect width="1600" height="640" fill="url(#wall)" />
            <rect y="640" width="1600" height="360" fill="url(#floor)" />
            <rect x="1100" y="120" width="360" height="400" fill="#1a1815" opacity=".35" />
            <rect x="1110" y="130" width="340" height="380" fill="#cfe0ea" opacity=".75" />
          </svg>
        )}

        <aside class="absolute top-6 right-6 z-10 bg-black/80 backdrop-blur text-conran-off px-5 py-4 rounded-sm border border-white/15 min-w-[260px]">
          <div class="text-[10px] tracking-kern text-conran-gold font-bold">YOUR ROOM TOTAL</div>
          <div class="serif text-3xl font-bold my-1.5">{won(customizeTotal.value)}</div>
          <div class="text-[11px] text-gray-400 mb-3.5">
            {selectedProducts.value.length > 0
              ? `아이템 ${selectedProducts.value.length}개 선택됨`
              : '아이템 0개 · 빈 공간입니다'}
          </div>
          <button
            class="w-full py-3 bg-conran-accent text-white border-0 rounded-sm text-xs font-bold tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={selectedProducts.value.length === 0}
            onClick={onBuyAll}
          >
            전체 장바구니 담기
          </button>
        </aside>

        <div class="absolute left-6 bottom-6 right-6 flex gap-2.5 z-10 flex-wrap">
          {CATEGORIES.map((c) => {
            const pid = slots.value[c.key];
            const p = pid ? products.value.find((x) => x.id === pid) : undefined;
            return (
              <button
                key={c.key}
                class={`flex-1 min-w-[130px] max-w-[180px] bg-black/75 backdrop-blur border rounded-sm p-3 text-conran-off flex items-center gap-2.5 transition hover:border-conran-accent ${
                  p ? 'border-white/20' : 'border-white/10 opacity-60'
                }`}
                onClick={() => (selectedCategory.value = c.key)}
              >
                <span class="text-xl flex-shrink-0">{c.icon}</span>
                <div class="flex-1 min-w-0 text-left">
                  <div class="text-[9px] tracking-kern text-conran-gold font-bold uppercase">
                    {c.label}
                  </div>
                  <div class="text-xs truncate font-medium">{p?.name ?? '미선택'}</div>
                  <div class="text-[10px] text-gray-400">{p ? won(p.price) : '—'}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <aside class="bg-white border-l border-conran-cream flex flex-col">
        <div class="px-7 pt-6 pb-4 border-b border-conran-cream">
          <h3 class="serif text-xl m-0 mb-1">가구 고르기</h3>
          <p class="text-xs text-gray-600 m-0">
            카테고리를 선택하고 아이템을 클릭하면 공간에 배치됩니다.
          </p>
        </div>
        <div class="flex gap-1 p-3 border-b border-conran-cream flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              class={`px-3.5 py-2 rounded-sm text-xs font-semibold transition ${
                selectedCategory.value === c.key
                  ? 'bg-conran-black text-white'
                  : 'bg-[#f5efe3] text-gray-600 hover:bg-[#ebe3d2]'
              }`}
              onClick={() => (selectedCategory.value = c.key)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          {filteredProducts.map((p) => (
            <ItemRow
              key={p.id}
              p={p}
              selected={slots.value[p.cat] === p.id}
              onClick={() => toggleSlot(p.id)}
            />
          ))}
        </div>
        <div class="px-5 py-3.5 border-t border-conran-cream text-[11px] text-gray-500 text-center">
          클릭으로 교체 · 같은 아이템 재클릭 시 해제
        </div>
      </aside>
    </section>
  );
}

function VariantToggle() {
  const room = activeRoomset.value;
  const variants = room?.panorama?.variants ?? [];
  if (variants.length < 2) return null;
  return (
    <div class="absolute top-6 right-[304px] z-10 flex items-center gap-1 bg-black/75 backdrop-blur border border-white/20 rounded-full p-1">
      {variants.map((v) => {
        const active = v.id === activeVariantId.value;
        return (
          <button
            key={v.id}
            class={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              active
                ? 'bg-conran-accent text-white'
                : 'text-conran-off hover:bg-white/10'
            }`}
            onClick={() => setActiveVariant(v.id)}
            aria-pressed={active}
            aria-label={`${v.label} 분위기`}
          >
            <span>{v.icon ?? ''}</span>
            <span>{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function RoomsetPicker() {
  const [open, setOpen] = useState(false);
  const current = activeRoomset.value;
  const list = roomsets.value;
  if (!current) return null;
  return (
    <div class="absolute top-6 left-6 z-10">
      <button
        class="flex items-center gap-3 bg-black/75 backdrop-blur border border-white/20 rounded-sm px-3.5 py-2.5 text-conran-off hover:border-conran-accent transition"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="룸셋 전환"
      >
        <span class="text-[10px] tracking-kern text-conran-gold font-bold uppercase">
          Current Stage
        </span>
        <span class="text-sm font-semibold">{current.name}</span>
        <span class={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div class="mt-2 bg-black/85 backdrop-blur border border-white/15 rounded-sm overflow-hidden min-w-[280px] shadow-2xl">
          {list.map((r) => {
            const active = r.id === current.id;
            return (
              <button
                key={r.id}
                class={`w-full flex gap-3 p-2.5 items-center text-left border-b border-white/5 transition ${
                  active ? 'bg-conran-accent/20' : 'hover:bg-white/10'
                }`}
                onClick={() => {
                  setActiveRoomset(r.id);
                  setOpen(false);
                }}
              >
                <img
                  src={r.hero}
                  alt={r.name}
                  class="w-[72px] h-[44px] object-cover rounded-sm bg-gray-800 flex-shrink-0"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.visibility = 'hidden';
                  }}
                />
                <div class="flex-1 min-w-0">
                  <div class="text-[10px] tracking-wider text-conran-gold font-bold uppercase">
                    {r.concept}
                  </div>
                  <div class="text-sm text-conran-off font-semibold truncate">{r.name}</div>
                  <div class="text-[10px] text-gray-400">{r.priceTag}</div>
                </div>
                {active && <span class="text-conran-accent text-xs">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ItemRow({ p, selected, onClick }: { p: Product; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      class={`w-full flex gap-3 p-3 rounded-sm border transition mb-2 text-left ${
        selected
          ? 'border-conran-accent bg-[#fbf7ed]'
          : 'border-transparent hover:border-conran-accent hover:bg-[#fbf7ed]'
      }`}
    >
      <img
        src={p.img}
        alt={p.name}
        class="w-[72px] h-[72px] object-cover rounded-sm bg-gray-200 flex-shrink-0"
        onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
      />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] tracking-wider text-gray-400 uppercase mb-1">
          {p.style.replace('-', ' ')}
        </div>
        <div class="text-[13px] font-semibold text-conran-ink leading-tight mb-1">{p.name}</div>
        <div class="text-[13px] font-bold text-conran-accent">{won(p.price)}</div>
      </div>
    </button>
  );
}
