import { cartCount } from '../stores/cart';
import { goScene } from '../stores/scene';
import { openCartCategoryPage } from '../commerce/lotteHandOff';
import { cartIds } from '../stores/cart';

/**
 * Top navigation bar — matches spec d.pdf p.9:
 *   [Conran logo] THE CONRAN SHOP VIRTUAL STORE .......... [Q] [≡]
 */
export function HUD() {
  const onCart = () => {
    if (cartIds.value.length === 0) return;
    openCartCategoryPage(cartIds.value);
  };
  return (
    <header class="fixed top-0 inset-x-0 z-[var(--z-hud)] flex justify-between items-center px-6 py-3 bg-white/95 backdrop-blur-md text-conran-ink border-b border-gray-200">
      {/* Left: Conran logo + home link */}
      <button
        class="flex items-center gap-3 cursor-pointer"
        onClick={() => goScene('gate')}
        aria-label="홈으로"
      >
        <div
          class="w-10 h-10 rounded-sm flex items-center justify-center text-white text-[11px] font-bold tracking-tight leading-tight"
          style={{ background: '#1a3a5c' }}
        >
          <div class="text-center">
            <div style={{ fontSize: '6px', letterSpacing: '0.05em' }}>CONRAN</div>
            <div style={{ fontSize: '6px', letterSpacing: '0.05em' }}>Shop</div>
          </div>
        </div>
      </button>

      {/* Center: title */}
      <div class="hidden md:block text-sm font-semibold tracking-[0.15em] text-gray-700 uppercase">
        THE <strong class="font-bold text-conran-ink">CONRAN</strong> SHOP VIRTUAL STORE
      </div>

      {/* Right: search + menu + cart */}
      <div class="flex items-center gap-2">
        <button
          class="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          onClick={() => goScene('gallery')}
          aria-label="갤러리"
          title="전시형 컬렉션"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button
          class="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          onClick={onCart}
          aria-label={`장바구니 ${cartCount.value}개`}
          title="장바구니"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {cartCount.value > 0 && (
            <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-conran-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
              {cartCount.value}
            </span>
          )}
        </button>
        <button
          class="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          aria-label="메뉴"
          title="메뉴"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
