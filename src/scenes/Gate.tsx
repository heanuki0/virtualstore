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
    w: 120,
    h: 80,
    icon: '💬',
    title: 'AI 컨시어지',
    sub: 'CONRAN CONCIERGE',
    accent: 'var(--conran-accent)',
    glow: 'rgba(200,90,42,.4)',
  },
  {
    id: 'living',
    yaw: -40,
    pitch: -6,
    w: 280,
    h: 300,
    icon: '→',
    title: '거실 타입',
    sub: 'LIVING ROOM',
    accent: 'rgba(255,255,255,.08)',
    glow: 'rgba(184,147,90,.25)',
  },
  {
    id: 'study',
    yaw: 40,
    pitch: -6,
    w: 280,
    h: 300,
    icon: '→',
    title: '서재 타입',
    sub: 'STUDY',
    accent: 'rgba(255,255,255,.08)',
    glow: 'rgba(184,147,90,.25)',
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
    <section class="relative min-h-[calc(100vh-132px)] bg-conran-black overflow-hidden">
      <div ref={ref} class="absolute inset-0" aria-label="콘란 경 하우스 입구 홀 파노라마" />

      {/* Top: CONRAN HOUSE arch title + drag hint */}
      <div class="absolute top-5 inset-x-0 z-10 flex flex-col items-center pointer-events-none">
        <div
          class="relative px-12 py-2 mb-1"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,9,8,0.85) 0%, rgba(10,9,8,0.5) 100%)',
            borderTop: '1px solid rgba(184,147,90,0.4)',
            borderBottom: '1px solid rgba(184,147,90,0.4)',
            borderRadius: '2px',
          }}
        >
          <div class="text-[9px] tracking-[0.45em] text-conran-gold font-bold uppercase text-center">
            The Conran Shop
          </div>
          <div class="serif text-xl md:text-2xl font-bold text-conran-off tracking-[0.12em] uppercase">
            Conran House
          </div>
        </div>
        <div class="text-[10px] tracking-kern text-white/40 uppercase">
          Drag to look around
        </div>
      </div>

      {/* Left zone label: CONSULT */}
      <ZoneLabel position="left" kor="상담 공간" eng="CONSULT" />

      {/* Right zone label: EXHIBITION */}
      <ZoneLabel position="right" kor="전시형 쇼룸" eng="EXHIBITION" />

      {/* AI robot character callout (bottom-left) */}
      <RobotCallout
        onClick={() => {
          track('gate_robot_click', { source: 'robot_callout' });
          openAI();
        }}
      />

      {/* Bottom guidance overlay */}
      <div class="absolute bottom-0 inset-x-0 z-10 pointer-events-none">
        <div class="bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-16 pb-6 px-8 text-center text-conran-off">
          <h2 class="serif text-xl md:text-2xl font-bold mb-1">
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
    </section>
  );
}

/* ─── Zone label (left: CONSULT / right: EXHIBITION) ─── */

function ZoneLabel({
  position,
  kor,
  eng,
}: {
  position: 'left' | 'right';
  kor: string;
  eng: string;
}) {
  const sideClass = position === 'left' ? 'left-6 md:left-10' : 'right-6 md:right-10';
  return (
    <div
      class={`absolute top-24 md:top-28 ${sideClass} z-10 pointer-events-none`}
      style={{
        background:
          'linear-gradient(135deg, rgba(10,9,8,0.9) 0%, rgba(30,25,20,0.7) 100%)',
        border: '1px solid rgba(184,147,90,0.45)',
        padding: '10px 18px',
        borderRadius: '2px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
      }}
    >
      <div class="text-[9px] tracking-[0.3em] text-conran-gold font-bold uppercase mb-0.5">
        {eng}
      </div>
      <div class="serif text-base font-bold text-conran-off">{kor}</div>
    </div>
  );
}

/* ─── AI robot callout (bottom corner) ─── */

function RobotCallout({ onClick }: { onClick: () => void }) {
  return (
    <div class="absolute bottom-28 left-5 md:left-10 z-10 flex items-end gap-2 pointer-events-none">
      <button
        class="pointer-events-auto relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-2xl transition hover:scale-110"
        onClick={onClick}
        style={{
          background: 'linear-gradient(135deg, #5a7abf 0%, #3a5a9f 100%)',
          border: '3px solid rgba(255,255,255,0.85)',
          boxShadow: '0 10px 32px rgba(0,0,0,0.6), 0 0 0 6px rgba(90,122,191,0.25)',
        }}
        aria-label="AI 어드바이저에게 물어보기"
      >
        <span
          style={{
            display: 'inline-block',
            animation: 'robotBob 3s ease-in-out infinite',
          }}
        >
          🤖
        </span>
      </button>
      <div
        class="relative mb-1 px-3 py-2 rounded-sm"
        style={{
          background: 'rgba(10,9,8,0.9)',
          border: '1px solid rgba(255,255,255,0.12)',
          maxWidth: '220px',
        }}
      >
        <div class="text-[9px] tracking-wider text-conran-gold font-bold uppercase mb-0.5">
          Click AI Advisor
        </div>
        <div class="text-[11px] text-white/85 leading-tight">
          원하는 공간의 핀을 클릭해서 둘러보세요
        </div>
        {/* Speech-bubble tail */}
        <div
          style={{
            position: 'absolute',
            left: '-6px',
            bottom: '12px',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '7px solid rgba(10,9,8,0.9)',
          }}
        />
      </div>
      <style>{`
        @keyframes robotBob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
      `}</style>
    </div>
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
    // Left/right storefront: completely invisible click area that sits over
    // the archway opening in the panorama. No UI at all — the scene itself
    // is the affordance (like Coca-Cola popup storefronts).
    // Hover: very subtle warm glow only. Cursor: pointer.
    const uid = `sf_${s.id}`;
    el.innerHTML = `
      <div id="${uid}" style="
        width:${s.w}px;height:${s.h}px;
        border:2px solid transparent;
        border-radius:8px;
        background:transparent;
        transition:all .4s ease;
      "></div>
      <style>
        #${uid}:hover {
          background: rgba(255,255,255,.07) !important;
          border-color: rgba(184,147,90,.3) !important;
          box-shadow: inset 0 0 80px rgba(184,147,90,.1), 0 0 40px rgba(184,147,90,.08) !important;
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
