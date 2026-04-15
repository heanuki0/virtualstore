import { productById, roomsetById } from '../data/loader';
import { goScene } from '../stores/scene';
import { addToCart } from '../stores/cart';
import { seedFromRoomset } from '../stores/customize';
import { openProduct } from '../stores/overlay';
import { track } from '../analytics/gtag';
import type { Product } from '../data/schemas';

const won = (n: number) => '₩ ' + n.toLocaleString('ko-KR');

/**
 * Scene E — Roomset detail
 * 선택된 룸셋의 상세 · 포함 상품 · 일괄 담기 · 커스터마이즈 이관.
 */
export function RoomsetDetail({ id }: { id: string }) {
  const r = roomsetById(id);
  if (!r) {
    return (
      <section class="max-w-4xl mx-auto px-8 py-16 animate-fade-in">
        <p class="text-gray-600">존재하지 않는 룸셋입니다.</p>
        <button class="mt-4 text-conran-accent underline" onClick={() => goScene('gallery')}>
          갤러리로 돌아가기
        </button>
      </section>
    );
  }

  const items = r.products.map(productById).filter((p): p is Product => !!p);
  const total = items.reduce((s, p) => s + p.price, 0);

  const onBuyAll = () => {
    for (const p of items) addToCart(p.id);
    track('roomset_buy_all', { roomset_id: r.id, count: items.length });
  };

  const onCustomize = () => {
    seedFromRoomset(r.id);
    goScene('customize');
  };

  return (
    <section class="max-w-7xl mx-auto px-8 py-12 animate-fade-in">
      <button
        class="inline-flex items-center gap-2 mb-6 text-sm text-gray-600 font-semibold px-3 py-1.5 rounded-sm hover:bg-[#f0e8da]"
        onClick={() => goScene('gallery')}
      >
        ← 룸셋 목록으로
      </button>

      <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-9">
        <div
          class="aspect-[16/11] bg-cover bg-center rounded-sm relative overflow-hidden"
          style={{ backgroundImage: `url('${r.hero}')` }}
        >
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div class="absolute bottom-6 left-6 text-white z-10">
            <div class="text-[10px] tracking-[0.3em] text-conran-gold font-bold mb-2">
              {r.concept.toUpperCase()}
            </div>
            <h2 class="serif text-4xl font-bold m-0">{r.name}</h2>
          </div>
        </div>

        <aside>
          <div class="text-[11px] tracking-kern text-conran-accent font-bold mb-2">
            {r.concept.toUpperCase()}
          </div>
          <h3 class="serif text-2xl font-bold mb-2">{r.name}</h3>
          <p class="text-sm text-gray-700 leading-relaxed mb-6">{r.desc}</p>
          <div class="flex justify-between items-center py-4 border-y border-conran-cream mb-6">
            <span class="text-[10px] tracking-wider text-gray-500 font-bold uppercase">
              Total Estimate
            </span>
            <span class="serif text-2xl font-bold text-conran-black">{won(total)}</span>
          </div>
          <button
            class="w-full py-3.5 bg-conran-black text-white border-0 rounded-sm text-xs font-bold tracking-wider uppercase mb-2.5 hover:bg-conran-accent transition"
            onClick={onBuyAll}
          >
            룸셋 전체 장바구니 담기
          </button>
          <button
            class="w-full py-3.5 bg-transparent text-conran-black border border-conran-black rounded-sm text-xs font-bold tracking-wider uppercase hover:bg-conran-black hover:text-white transition"
            onClick={onCustomize}
          >
            이 룸셋 커스터마이즈하기
          </button>
        </aside>
      </div>

      <section class="mt-12">
        <h3 class="serif text-2xl font-bold mb-5">포함 상품</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((p) => (
            <button
              key={p.id}
              class="bg-white border border-conran-cream rounded-sm overflow-hidden transition hover:-translate-y-1 hover:shadow-xl text-left"
              onClick={() => openProduct(p.id, 'roomset_detail')}
            >
              <img
                src={p.img}
                alt={p.name}
                class="w-full aspect-square object-cover bg-gray-200"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
              />
              <div class="p-3.5">
                <div class="text-xs font-semibold text-conran-ink leading-tight mb-1.5 line-clamp-2 min-h-[32px]">
                  {p.name}
                </div>
                <div class="text-[13px] font-bold text-conran-accent">{won(p.price)}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
