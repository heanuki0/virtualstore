import { useEffect } from 'preact/hooks';
import { closeProduct, overlayProductId } from '../stores/overlay';
import { productById } from '../data/loader';
import { cartIds, toggleCart } from '../stores/cart';
import { setSlot } from '../stores/customize';
import { openAI, sendUserQuery } from '../stores/ai';
import { openProductPage } from '../commerce/lotteHandOff';
import { track } from '../analytics/gtag';
import { currentScene } from '../stores/scene';
import type { Category } from '../data/schemas';

const CAT_LABEL: Record<Category, string> = {
  sofa: '소파',
  table: '테이블',
  light: '조명',
  rug: '러그',
  object: '소품',
};

const won = (n: number) => '₩ ' + n.toLocaleString('ko-KR');

/**
 * Global product detail overlay.
 * Mounted once in <App />; becomes visible when overlayProductId has a value.
 */
export function ProductOverlay() {
  const pid = overlayProductId.value;

  // Lock body scroll while open + ESC to close
  useEffect(() => {
    if (!pid) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProduct();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [pid]);

  if (!pid) return null;
  const p = productById(pid);
  if (!p) return null;

  const inCart = cartIds.value.includes(pid);
  const onCart = () => toggleCart(pid);
  const onBuy = () => openProductPage(p, 'product_overlay');
  const onAsk = () => {
    closeProduct();
    openAI();
    window.setTimeout(() => sendUserQuery(`${p.name}에 대해 자세히 알려주세요`), 200);
  };
  const onPlaceInRoom = () => {
    setSlot(p.cat, p.id);
    track('overlay_place_in_room', { product_id: p.id });
    closeProduct();
  };

  const showPlaceInRoom = currentScene.value === 'customize';

  return (
    <div
      class="fixed inset-0 z-[var(--z-overlay)] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={p.name}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeProduct();
      }}
    >
      <button
        class="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/95 text-gray-800 text-lg flex items-center justify-center hover:bg-white"
        onClick={closeProduct}
        aria-label="닫기"
      >
        ✕
      </button>

      <div class="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-sm grid grid-cols-1 md:grid-cols-2 shadow-2xl">
        <div
          class="bg-gray-200 bg-cover bg-center min-h-[260px] md:min-h-[420px]"
          style={{ backgroundImage: `url('${p.img}')` }}
        />
        <div class="p-10">
          <div class="text-[11px] tracking-kern text-conran-accent font-bold uppercase mb-2">
            {CAT_LABEL[p.cat]} · {p.style.replace('-', ' ')}
          </div>
          <h2 class="serif text-3xl font-bold mb-2.5 leading-tight">{p.name}</h2>
          <div class="text-xs text-gray-500 mb-5">The Conran Shop · 롯데백화점</div>
          <p class="text-sm text-gray-700 leading-relaxed mb-6">{p.desc}</p>
          <div class="serif text-4xl font-bold mb-2">{won(p.price)}</div>
          <div class="text-[11px] text-gray-500 mb-6">롯데백화점 콘란 온라인 전용가 · 무료 배송</div>

          <div class="flex gap-2.5 flex-wrap mb-2.5">
            <button
              class="flex-[2] min-w-[200px] py-3.5 bg-conran-accent text-white border-0 rounded-sm text-xs font-bold tracking-wider uppercase hover:brightness-90 transition"
              onClick={onBuy}
            >
              롯데백화점몰에서 구매하기
            </button>
            <button
              class="flex-1 min-w-[120px] py-3.5 bg-transparent text-conran-black border border-conran-black rounded-sm text-xs font-bold tracking-wider uppercase hover:bg-conran-black hover:text-white transition"
              onClick={onCart}
            >
              {inCart ? '✓ 담김' : '장바구니'}
            </button>
          </div>

          {showPlaceInRoom && (
            <button
              class="w-full py-3 mb-2.5 bg-conran-ink text-white rounded-sm text-xs font-semibold tracking-wider uppercase hover:bg-conran-accent transition"
              onClick={onPlaceInRoom}
            >
              이 방에 배치하기
            </button>
          )}

          <button
            class="w-full py-3 bg-transparent text-gray-600 border border-dashed border-gray-300 rounded-sm text-xs hover:text-conran-black hover:border-conran-black transition"
            onClick={onAsk}
          >
            ✨ 이 상품에 대해 AI에게 물어보기
          </button>
        </div>
      </div>
    </div>
  );
}
