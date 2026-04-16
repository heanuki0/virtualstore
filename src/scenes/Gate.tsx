import { goScene } from '../stores/scene';
import { seedFromRoomset, setActiveRoomset } from '../stores/customize';
import { openAI } from '../stores/ai';
import { track } from '../analytics/gtag';

/**
 * Scene B — Gate (Entry Lobby)
 *
 * Phase 7 v2 redesign: flat 2D illustration + UI overlay (no 360° drag).
 * Background is `/images/lobby.jpg` (DALL·E 3 generated).
 *
 * Three click zones, absolutely positioned on the background:
 *  - Left archway (CONSULT)   → Customize (R01)
 *  - Center desk (AI)          → open AI chat
 *  - Right archway (EXHIBITION) → Customize (R02)
 *
 * Bottom right has a secondary "전시형 바로가기" link to the Gallery scene.
 */

const BASE = import.meta.env.BASE_URL;

type ZoneId = 'consult' | 'ai' | 'exhibition';

function onZoneClick(id: ZoneId): void {
  track('gate_hotspot', { hotspot_id: id });
  if (id === 'ai') {
    openAI();
    return;
  }
  const roomsetId = id === 'consult' ? 'R01' : 'R02';
  setActiveRoomset(roomsetId);
  seedFromRoomset(roomsetId);
  goScene('customize');
}

export function Gate() {
  return (
    <section class="relative min-h-[calc(100vh-132px)] bg-conran-black overflow-hidden">
      {/* 2D lobby illustration background */}
      <div
        class="absolute inset-0 animate-fade-in"
        style={{
          backgroundImage: `url('${BASE}images/lobby.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Soft dark overlay for legibility */}
      <div
        class="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,9,8,0.25) 0%, rgba(10,9,8,0) 35%, rgba(10,9,8,0.55) 85%, rgba(10,9,8,0.85) 100%)',
        }}
      />

      {/* Clickable zones — positioned in % so they scale with viewport */}
      <ZoneButton
        position="left"
        korLabel="상담 공간"
        engLabel="CONSULT"
        onClick={() => onZoneClick('consult')}
      />
      <ZoneButton
        position="right"
        korLabel="전시형 쇼룸"
        engLabel="EXHIBITION"
        onClick={() => onZoneClick('exhibition')}
      />
      <AIZone onClick={() => onZoneClick('ai')} />

      {/* Bottom guidance + shortcut to Gallery */}
      <div class="absolute bottom-0 inset-x-0 z-10 pointer-events-none">
        <div class="px-8 pb-8 pt-4 text-center text-conran-off">
          <h2 class="serif text-xl md:text-2xl font-bold mb-1">
            콘란 하우스에 오신 것을 환영합니다
          </h2>
          <p class="text-xs text-white/60 max-w-lg mx-auto mb-3">
            좌측 CONSULT는 거실 타입, 우측 EXHIBITION은 홈 오피스 타입으로 입장합니다.
            <br />
            중앙 안내 데스크에서는 AI 컨시어지가 도와드립니다.
          </p>
          <button
            onClick={() => goScene('gallery')}
            class="pointer-events-auto text-xs tracking-kern text-white/70 hover:text-conran-accent underline transition"
          >
            전시형 컬렉션 바로가기 →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Left/right archway zones ─── */

function ZoneButton({
  position,
  korLabel,
  engLabel,
  onClick,
}: {
  position: 'left' | 'right';
  korLabel: string;
  engLabel: string;
  onClick: () => void;
}) {
  const side = position === 'left' ? 'left-[4%] md:left-[8%]' : 'right-[4%] md:right-[8%]';
  return (
    <button
      onClick={onClick}
      class={`absolute ${side} top-[28%] w-[26%] md:w-[22%] h-[44%] z-10 group cursor-pointer transition`}
      style={{
        borderRadius: '6px',
      }}
      aria-label={`${korLabel} · ${engLabel} 입장`}
    >
      {/* invisible hit area, hover state applies subtle glow */}
      <div
        class="absolute inset-0 transition"
        style={{
          background: 'rgba(255,255,255,0)',
          border: '2px solid transparent',
          borderRadius: '6px',
        }}
      />
      <style>{`
        button[aria-label="${korLabel} · ${engLabel} 입장"]:hover > div:first-child {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(184,147,90,0.45) !important;
          box-shadow: 0 0 40px 10px rgba(184,147,90,0.15);
        }
        button[aria-label="${korLabel} · ${engLabel} 입장"]:hover .zone-label {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
      {/* Label — visible always, more prominent on hover */}
      <div
        class="zone-label absolute left-1/2 -translate-x-1/2 bottom-4 px-4 py-2 rounded-sm text-center whitespace-nowrap transition"
        style={{
          background: 'rgba(10,9,8,0.82)',
          border: '1px solid rgba(184,147,90,0.55)',
          backdropFilter: 'blur(4px)',
          opacity: 0.85,
        }}
      >
        <div class="text-[9px] tracking-[0.28em] text-conran-gold font-bold uppercase">
          {engLabel}
        </div>
        <div class="serif text-sm font-bold text-white mt-0.5">{korLabel}</div>
      </div>
    </button>
  );
}

/* ─── Center AI concierge zone ─── */

function AIZone({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      class="absolute left-1/2 -translate-x-1/2 top-[42%] z-10 flex flex-col items-center gap-2"
      aria-label="AI 컨시어지에게 상담 요청"
    >
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-xl transition hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, var(--conran-accent), #a8471f)',
          border: '3px solid rgba(255,255,255,0.9)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.55), 0 0 0 8px rgba(200,90,42,0.2)',
          animation: 'aiPulse 2.4s ease-in-out infinite',
        }}
      >
        💬
      </div>
      <div
        class="px-3.5 py-1.5 rounded-sm whitespace-nowrap"
        style={{
          background: 'rgba(10,9,8,0.88)',
          border: '1px solid rgba(184,147,90,0.4)',
        }}
      >
        <div class="text-[9px] tracking-[0.25em] text-conran-gold font-bold uppercase">
          Conran Concierge
        </div>
        <div class="text-[11px] text-white font-semibold text-center mt-0.5">AI 어시스턴트</div>
      </div>
      <style>{`
        @keyframes aiPulse {
          0%,100% { transform:scale(1); filter:brightness(1); }
          50%     { transform:scale(1.05); filter:brightness(1.1); }
        }
      `}</style>
    </button>
  );
}
