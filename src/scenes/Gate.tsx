import { useEffect, useRef } from 'preact/hooks';
import { goScene } from '../stores/scene';
import { seedFromRoomset, setActiveRoomset } from '../stores/customize';
import { openAI } from '../stores/ai';
import { track } from '../analytics/gtag';

/**
 * Scene B — Gate (Entry Hall)
 *
 * Coca-Cola popup style 360° lobby:
 *  - CENTER: Concierge desk with human NPC (click → AI chat)
 *  - LEFT:   Glass storefront showing living room (click → Customize R01)
 *  - RIGHT:  Glass storefront showing study (click → Customize R02)
 *
 * Hotspots are large rectangular frames matching the storefront openings,
 * not small circular pins.
 */

interface Spot {
  id: 'ai' | 'living' | 'study';
  yaw: number;
  pitch: number;
  /** Width/height of the hotspot frame in CSS px */
  w: number;
  h: number;
  title: string;
  sub: string;
  icon: string;
  accent: string;
  /** Border glow color */
  glow: string;
}

const SPOTS: Spot[] = [
  {
    id: 'ai',
    yaw: 0,
    pitch: -2,
    w: 160,
    h: 100,
    icon: '💬',
    title: 'AI 컨시어지',
    sub: 'CONRAN CONCIERGE',
    accent: 'var(--conran-accent)',
    glow: 'rgba(200,90,42,.4)',
  },
  {
    id: 'living',
    yaw: -38,
    pitch: -4,
    w: 200,
    h: 180,
    icon: '→',
    title: '거실 타입',
    sub: 'LIVING ROOM',
    accent: 'rgba(90,122,191,.85)',
    glow: 'rgba(90,122,191,.3)',
  },
  {
    id: 'study',
    yaw: 38,
    pitch: -4,
    w: 200,
    h: 180,
    icon: '→',
    title: '서재 타입',
    sub: 'STUDY',
    accent: 'rgba(139,90,60,.85)',
    glow: 'rgba(139,90,60,.3)',
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
        { yaw: 0, pitch: (-2 * Math.PI) / 180, fov: (Math.PI * 95) / 180 },
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
        <div class="bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-16 pb-6 px-8 text-center text-conran-off">
          <h2 class="serif text-2xl md:text-3xl font-bold mb-1.5">
            콘란 하우스에 오신 것을 환영합니다
          </h2>
          <p class="text-xs text-white/60 max-w-lg mx-auto mb-3">
            좌우 쇼룸을 클릭해 공간에 입장하거나, 중앙 컨시어지에게 상담을 요청하세요.
          </p>
          <button
            onClick={() => goScene('gallery')}
            class="pointer-events-auto text-xs tracking-kern text-white/60 hover:text-conran-accent underline transition"
          >
            전시형 컬렉션 바로가기 →
          </button>
        </div>
      </div>

      {/* Drag hint */}
      <div class="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-[10px] tracking-kern text-white/40 uppercase pointer-events-none">
        Drag to look around
      </div>
    </section>
  );
}

/* ─── Hotspot element factory ─── */

function makeSpotEl(s: Spot): HTMLDivElement {
  const el = document.createElement('div');
  el.className = `conran-gate-spot conran-gate-spot--${s.id}`;
  el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);cursor:pointer;';

  if (s.id === 'ai') {
    // Center concierge: compact rounded label
    el.innerHTML = `
      <div class="gate-spot-ai" style="
        display:flex;flex-direction:column;align-items:center;gap:6px;
      ">
        <div style="
          width:64px;height:64px;border-radius:50%;
          background:${s.accent};
          border:3px solid rgba(255,255,255,.9);
          box-shadow:0 8px 30px rgba(0,0,0,.5), 0 0 0 8px ${s.glow};
          display:flex;align-items:center;justify-content:center;
          font-size:26px;
          animation:gatePulse 2.4s ease-in-out infinite;
        ">${s.icon}</div>
        <div style="
          padding:5px 16px;
          background:rgba(10,10,10,.88);
          border:1px solid rgba(255,255,255,.15);
          border-radius:3px;
          text-align:center;white-space:nowrap;
          pointer-events:none;
        ">
          <div style="font-size:13px;font-weight:700;color:#fff;letter-spacing:.02em;">${s.title}</div>
          <div style="font-size:9px;letter-spacing:.25em;color:#b8935a;margin-top:1px;text-transform:uppercase;">${s.sub}</div>
        </div>
      </div>
      ${PULSE_STYLE}
    `;
  } else {
    // Left/right storefront: large transparent frame overlay
    el.innerHTML = `
      <div class="gate-spot-room" style="
        width:${s.w}px;height:${s.h}px;
        border:2px solid rgba(255,255,255,.25);
        border-radius:6px;
        background:rgba(255,255,255,.04);
        backdrop-filter:blur(1px);
        display:flex;flex-direction:column;
        align-items:center;justify-content:flex-end;
        padding:12px 16px;
        transition:all .35s ease;
        box-shadow:0 0 0 0 ${s.glow};
      ">
        <div style="
          padding:6px 20px;
          background:rgba(10,10,10,.82);
          border:1px solid rgba(255,255,255,.12);
          border-radius:3px;
          text-align:center;white-space:nowrap;
        ">
          <div style="font-size:13px;font-weight:700;color:#fff;letter-spacing:.03em;">${s.title}</div>
          <div style="font-size:9px;letter-spacing:.3em;color:#b8935a;margin-top:2px;text-transform:uppercase;">${s.sub}</div>
        </div>
        <div style="
          margin-top:6px;font-size:10px;color:rgba(255,255,255,.5);
          letter-spacing:.15em;text-transform:uppercase;
        ">입장하기 ${s.icon}</div>
      </div>
      <style>
        .gate-spot-room:hover {
          border-color: rgba(255,255,255,.55) !important;
          background: rgba(255,255,255,.10) !important;
          box-shadow: 0 0 40px 8px ${s.glow}, inset 0 0 20px rgba(255,255,255,.05) !important;
          transform: scale(1.02);
        }
      </style>
    `;
  }
  return el;
}

const PULSE_STYLE = `
  <style>
    @keyframes gatePulse {
      0%,100% { transform:scale(1); filter:brightness(1); }
      50% { transform:scale(1.06); filter:brightness(1.12); }
    }
  </style>
`;
