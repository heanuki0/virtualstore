import { useEffect, useRef } from 'preact/hooks';
import { goScene } from '../stores/scene';
import { seedFromRoomset, setActiveRoomset } from '../stores/customize';
import { openAI } from '../stores/ai';
import { track } from '../analytics/gtag';

/**
 * Scene B — Gate (Entry Hall)
 *
 * Reworked as a 360° Marzipano panorama of a Conran-style lobby, mirroring the
 * Elypecs/Coca-Cola hub layout:
 *  - CENTER: AI assistant desk (click → open chat)
 *  - LEFT:   living room archway (click → Customize, active roomset = R01)
 *  - RIGHT:  study archway       (click → Customize, active roomset = R02)
 *
 * PDF p.1 intent ("① 컨설팅 제안형 ② 전시형") is preserved via the fallback
 * "전시형 바로가기" link at the bottom.
 */

interface Spot {
  id: 'ai' | 'living' | 'study';
  yaw: number;
  pitch: number;
  icon: string;
  title: string;
  sub: string;
  accent: string;
}

const SPOTS: Spot[] = [
  {
    id: 'ai',
    yaw: 0,
    pitch: -4,
    icon: '✨',
    title: 'AI 어시스턴트',
    sub: '무엇이든 물어보세요',
    accent: 'var(--conran-accent)',
  },
  {
    id: 'living',
    yaw: -42,
    pitch: -2,
    icon: '🛋️',
    title: '거실 타입',
    sub: 'Modern Sanctuary',
    accent: '#5a7abf',
  },
  {
    id: 'study',
    yaw: 42,
    pitch: -2,
    icon: '📚',
    title: '서재 타입',
    sub: 'Classic English',
    accent: '#8b5a3c',
  },
];

function onSpotClick(id: Spot['id']): void {
  track('gate_hotspot', { hotspot_id: id });
  if (id === 'ai') {
    openAI();
    return;
  }
  const roomsetId = id === 'living' ? 'R01' : 'R02';
  setActiveRoomset(roomsetId);
  seedFromRoomset(roomsetId);
  goScene('customize');
}

export function Gate() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let viewer: { destroy(): void } | null = null;
    let cancelled = false;

    (async () => {
      // @ts-ignore — marzipano ships no types
      const mod = await import('marzipano');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const M: any = (mod as any).default ?? mod;
      if (cancelled || !ref.current) return;

      const v = M.Viewer
        ? new M.Viewer(ref.current, { controls: { mouseViewMode: 'drag' } })
        : null;
      if (!v) return;
      viewer = v;

      const source = M.ImageUrlSource.fromString(`${import.meta.env.BASE_URL}panos/HALL/equirect.webp`);
      const geometry = new M.EquirectGeometry([{ width: 4096 }]);
      const limiter = M.RectilinearView.limit.traditional(4096, (Math.PI * 110) / 180);
      const view = new M.RectilinearView(
        { yaw: 0, pitch: (-4 * Math.PI) / 180, fov: (Math.PI * 95) / 180 },
        limiter,
      );
      const scene = v.createScene({ source, geometry, view, pinFirstLevel: true });

      for (const s of SPOTS) {
        const el = makeSpotEl(s);
        el.addEventListener('click', () => onSpotClick(s.id));
        scene.hotspotContainer().createHotspot(el, {
          yaw: (s.yaw * Math.PI) / 180,
          pitch: (s.pitch * Math.PI) / 180,
        });
      }
      scene.switchTo();
    })().catch((e) => {
      // eslint-disable-next-line no-console
      console.error('[Gate] viewer init failed', e);
    });

    return () => {
      cancelled = true;
      viewer?.destroy();
    };
  }, []);

  return (
    <section class="relative min-h-[calc(100vh-114px)] bg-conran-black">
      <div ref={ref} class="absolute inset-0" aria-label="콘란 경 하우스 입구 홀 파노라마" />

      {/* Bottom guidance overlay */}
      <div class="absolute bottom-0 inset-x-0 z-10 pointer-events-none">
        <div class="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 pb-8 px-8 text-center text-conran-off">
          <div class="text-[11px] tracking-kern text-conran-accent font-bold mb-2">
            ENTER THE HOUSE
          </div>
          <h2 class="serif text-3xl md:text-4xl font-bold mb-2">콘란 경 하우스 · 입구 홀</h2>
          <p class="text-sm text-white/70 max-w-xl mx-auto mb-4">
            드래그해서 360° 둘러보거나, 핀을 클릭해 공간으로 입장하세요.
            <br class="hidden md:inline" />
            중앙은 AI 컨시어지 · 왼쪽은 거실 타입 · 오른쪽은 서재 타입입니다.
          </p>
          <button
            onClick={() => goScene('gallery')}
            class="pointer-events-auto text-xs tracking-kern text-white/70 hover:text-conran-accent underline"
          >
            전시형 컬렉션 바로가기 →
          </button>
        </div>
      </div>

      {/* Drag hint (auto-fades on first interaction — omitted for simplicity) */}
      <div class="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-[10px] tracking-kern text-white/50 uppercase pointer-events-none">
        Drag to look around
      </div>
    </section>
  );
}

function makeSpotEl(s: Spot): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'conran-gate-pin';
  el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);cursor:pointer;';
  const size = s.id === 'ai' ? 72 : 60;
  const ring = s.id === 'ai' ? 'rgba(200,90,42,.35)' : 'rgba(255,255,255,.25)';
  el.innerHTML = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${s.accent};
        border:3px solid #fff;
        box-shadow:0 10px 28px rgba(0,0,0,0.55), 0 0 0 8px ${ring};
        display:flex;align-items:center;justify-content:center;
        font-size:${size === 72 ? 30 : 24}px;
        animation:gatePulse 2.2s ease-in-out infinite;
      ">${s.icon}</div>
      <div style="
        margin-top:10px;
        padding:6px 14px;
        background:rgba(10,10,10,0.85);
        color:#fff;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:3px;
        white-space:nowrap;
        text-align:center;
        pointer-events:none;
      ">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.02em;">${s.title}</div>
        <div style="font-size:10px;letter-spacing:0.2em;color:#b8935a;margin-top:2px;text-transform:uppercase;">${s.sub}</div>
      </div>
    </div>
    <style>
      @keyframes gatePulse {
        0%,100% { transform:scale(1); filter:brightness(1); }
        50% { transform:scale(1.05); filter:brightness(1.15); }
      }
    </style>
  `;
  return el;
}
