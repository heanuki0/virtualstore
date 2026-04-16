import { cartCount } from '../stores/cart';
import { goScene } from '../stores/scene';
import { openCartCategoryPage } from '../commerce/lotteHandOff';
import { cartIds } from '../stores/cart';

export function HUD() {
  const onCart = () => {
    if (cartIds.value.length === 0) return;
    openCartCategoryPage(cartIds.value);
  };
  return (
    <header class="fixed top-0 inset-x-0 z-[var(--z-hud)] flex justify-between items-center px-8 py-4 bg-black/70 backdrop-blur-md text-conran-off border-b border-white/10">
      <button
        class="flex items-center gap-3 cursor-pointer"
        onClick={() => goScene('exterior')}
        aria-label="홈으로"
      >
        <div class="text-left">
          <div class="text-[11px] text-conran-gold font-bold tracking-kern">
            LOTTE DEPARTMENT STORE
          </div>
          <div class="serif text-2xl font-bold leading-none mt-0.5">The Conran Shop</div>
          <div class="text-[10px] text-gray-400 tracking-kern mt-1">WEB VIRTUAL STORE</div>
        </div>
      </button>
      <div class="flex items-center gap-2">
        <button
          class="px-4 py-2 rounded-full border border-white/20 text-sm hover:bg-white/10"
          onClick={() => goScene('gallery')}
        >
          홈
        </button>
        <button
          class="px-4 py-2 rounded-full border border-white/20 text-sm hover:bg-white/10 flex items-center gap-2"
          onClick={onCart}
          aria-label={`장바구니 ${cartCount.value}개`}
        >
          <span>장바구니</span>
          <span class="min-w-[22px] h-[22px] rounded-full bg-conran-accent text-white text-xs font-bold flex items-center justify-center px-1.5">
            {cartCount.value}
          </span>
        </button>
      </div>
    </header>
  );
}
