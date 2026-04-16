import { useEffect, useState } from 'preact/hooks';
import { closeProduct, overlayProductId } from '../stores/overlay';
import { productById, roomsets } from '../data/loader';
import { cartIds, toggleCart } from '../stores/cart';
import { setSlot } from '../stores/customize';
import { openAI, sendUserQuery } from '../stores/ai';
import { openProductPage } from '../commerce/lotteHandOff';
import { track } from '../analytics/gtag';
import { currentScene, goScene } from '../stores/scene';
import type { Category, Roomset } from '../data/schemas';

const CAT_LABEL: Record<Category, string> = {
  sofa: '소파',
  table: '테이블',
  light: '조명',
  rug: '러그',
  object: '소품',
};

const won = (n: number) => '₩ ' + n.toLocaleString('ko-KR');

const BASE = import.meta.env.BASE_URL;

type Tab = 'image' | '3d' | 'room';

/**
 * Global product detail overlay with Digital Twin tabs:
 *   [이미지] / [3D 돌려보기] / [예상 인테리어 보기]
 *
 * 3D tab uses Google's <model-viewer> custom element loaded via CDN in index.html.
 * Falls back to "3D 모델 준비중" when product.model is undefined.
 */
export function ProductOverlay() {
  const pid = overlayProductId.value;
  const [tab, setTab] = useState<Tab>('image');

  // Reset tab whenever a new product opens
  useEffect(() => {
    setTab('image');
  }, [pid]);

  // Lock body scroll + ESC to close
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

  // Rooms that feature this product (for 예상 인테리어 탭)
  const featuredRooms: Roomset[] = roomsets.value.filter((r) =>
    r.products.includes(p.id),
  );

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

      <div class="bg-white max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-sm grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px] shadow-2xl">
        {/* LEFT — media viewer with tabs */}
        <div class="relative bg-gray-100 min-h-[280px] md:min-h-[500px] flex flex-col">
          <TabBar current={tab} onChange={setTab} has3D={!!p.model} />
          <div class="flex-1 relative">
            {tab === 'image' && (
              <div
                class="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${p.img}')`, backgroundColor: '#f5f2ec' }}
              />
            )}
            {tab === '3d' && <ThreeDView model={p.model} />}
            {tab === 'room' && <RoomInterior rooms={featuredRooms} productImg={p.img} />}
          </div>
        </div>

        {/* RIGHT — metadata + actions */}
        <div class="p-8">
          <div class="text-[11px] tracking-kern text-conran-accent font-bold uppercase mb-2">
            {CAT_LABEL[p.cat]} · {p.style.replace('-', ' ')}
          </div>
          <h2 class="serif text-2xl md:text-3xl font-bold mb-2 leading-tight">{p.name}</h2>
          <div class="text-xs text-gray-500 mb-4">The Conran Shop · 롯데백화점</div>
          <p class="text-sm text-gray-700 leading-relaxed mb-5">{p.desc}</p>
          <div class="serif text-3xl font-bold mb-1">{won(p.price)}</div>
          <div class="text-[11px] text-gray-500 mb-5">롯데백화점 콘란 온라인 전용가 · 무료 배송</div>

          <div class="flex gap-2 flex-wrap mb-2">
            <button
              class="flex-[2] min-w-[180px] py-3 bg-conran-accent text-white border-0 rounded-sm text-xs font-bold tracking-wider uppercase hover:brightness-90 transition"
              onClick={onBuy}
            >
              롯데백화점몰에서 구매하기
            </button>
            <button
              class="flex-1 min-w-[100px] py-3 bg-transparent text-conran-black border border-conran-black rounded-sm text-xs font-bold tracking-wider uppercase hover:bg-conran-black hover:text-white transition"
              onClick={onCart}
            >
              {inCart ? '✓ 담김' : '장바구니'}
            </button>
          </div>

          {showPlaceInRoom && (
            <button
              class="w-full py-2.5 mb-2 bg-conran-ink text-white rounded-sm text-xs font-semibold tracking-wider uppercase hover:bg-conran-accent transition"
              onClick={onPlaceInRoom}
            >
              이 방에 배치하기
            </button>
          )}

          <button
            class="w-full py-2.5 bg-transparent text-gray-600 border border-dashed border-gray-300 rounded-sm text-xs hover:text-conran-black hover:border-conran-black transition"
            onClick={onAsk}
          >
            ✨ 이 상품에 대해 AI에게 물어보기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab bar ─── */

function TabBar({ current, onChange, has3D }: { current: Tab; onChange: (t: Tab) => void; has3D: boolean }) {
  const tabs: Array<{ id: Tab; label: string; disabled?: boolean }> = [
    { id: 'image', label: '이미지' },
    { id: '3d', label: '3D 돌려보기', disabled: !has3D },
    { id: 'room', label: '예상 인테리어' },
  ];
  return (
    <div class="flex gap-0 bg-conran-ink border-b border-white/10">
      {tabs.map((t) => (
        <button
          key={t.id}
          disabled={t.disabled}
          onClick={() => onChange(t.id)}
          class={`flex-1 py-3 text-[11px] font-semibold tracking-wider uppercase transition ${
            current === t.id
              ? 'bg-conran-accent text-white'
              : t.disabled
              ? 'text-white/30 cursor-not-allowed'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          {t.label}
          {t.disabled && <span class="ml-1 text-[9px]">(준비중)</span>}
        </button>
      ))}
    </div>
  );
}

/* ─── 3D viewer (Google model-viewer) ─── */

function ThreeDView({ model }: { model?: string }) {
  if (!model) {
    return (
      <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-[#f5f2ec]">
        3D 모델 준비중입니다.
      </div>
    );
  }
  const src = model.startsWith('/') ? `${BASE}${model.slice(1)}` : model;
  // Render <model-viewer> via dangerouslySetInnerHTML to bypass Preact's
  // strict JSX typing for this custom element.
  return (
    <div
      class="absolute inset-0"
      style={{ background: 'radial-gradient(ellipse at center, #fafafa 0%, #e8e4dc 100%)' }}
      dangerouslySetInnerHTML={{
        __html: `<model-viewer
          src="${src}"
          alt="3D product view"
          camera-controls
          auto-rotate
          auto-rotate-delay="1500"
          rotation-per-second="18deg"
          exposure="1.0"
          shadow-intensity="0.8"
          shadow-softness="0.7"
          environment-image="neutral"
          style="width:100%;height:100%;background:transparent;--poster-color:transparent;"
        ></model-viewer>`,
      }}
    />
  );
}

/* ─── Room interior preview tab ─── */

function RoomInterior({ rooms, productImg }: { rooms: Roomset[]; productImg: string }) {
  if (rooms.length === 0) {
    return (
      <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-[#f5f2ec] px-6 text-center">
        이 상품이 배치된 룸셋이 아직 없습니다.
      </div>
    );
  }
  return (
    <div class="absolute inset-0 overflow-y-auto p-5 bg-[#fbf8f1]">
      <div class="text-[10px] tracking-kern text-conran-accent font-bold uppercase mb-2">
        예상 인테리어 · Featured In
      </div>
      <div class="text-xs text-gray-600 mb-4">
        이 상품이 포함된 컨셉 룸셋을 미리 보고, 클릭해서 해당 공간으로 이동하세요.
      </div>
      <div class="grid grid-cols-1 gap-3">
        {rooms.map((r) => (
          <button
            key={r.id}
            class="group relative block w-full overflow-hidden rounded-sm border border-conran-cream bg-white text-left hover:border-conran-accent transition"
            onClick={() => {
              closeProduct();
              window.setTimeout(() => goScene('customize'), 120);
              // Also switch the active roomset in the store
              import('../stores/customize').then(({ setActiveRoomset, seedFromRoomset }) => {
                setActiveRoomset(r.id);
                seedFromRoomset(r.id);
              });
            }}
          >
            <div
              class="w-full aspect-[16/9] bg-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url('${r.hero}')` }}
            />
            {/* Floating product thumbnail to hint "이 상품이 여기 있어요" */}
            <div
              class="absolute top-2.5 right-2.5 w-14 h-14 rounded-sm border-2 border-white shadow-lg bg-white bg-cover bg-center"
              style={{ backgroundImage: `url('${productImg}')` }}
              aria-hidden="true"
            />
            <div class="p-3">
              <div class="text-[10px] text-conran-gold font-bold uppercase tracking-wider mb-0.5">
                {r.concept}
              </div>
              <div class="serif text-base font-bold text-conran-ink">{r.name}</div>
              <div class="text-[11px] text-gray-500 mt-1">{r.priceTag}</div>
            </div>
            <div class="absolute inset-x-0 bottom-0 py-2 px-3 bg-gradient-to-t from-conran-ink/80 to-transparent text-white text-[10px] opacity-0 group-hover:opacity-100 transition text-right">
              이 공간에서 보기 →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
