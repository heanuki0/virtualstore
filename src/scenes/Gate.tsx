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

      {/* Top center "CONRAN HOUSE" signage (DOM overlay — DALL·E can't render text reliably) */}
      <ConranHouseSignage />

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

      {/* Floor brass emblem (DOM overlay) */}
      <FloorEmblem />

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

/* ─── Top arch signage "CONRAN HOUSE" ─── */

function ConranHouseSignage() {
  return (
    <div
      class="absolute top-[6%] left-1/2 -translate-x-1/2 z-10 pointer-events-none"
      style={{ width: 'min(560px, 55vw)' }}
      aria-hidden="true"
    >
      {/* SVG textPath arch — follows the top curve of the lobby archway */}
      <svg viewBox="0 0 560 120" class="w-full h-auto overflow-visible">
        <defs>
          <path
            id="conran-arch-path"
            d="M 30 100 Q 280 -20 530 100"
            fill="none"
          />
        </defs>
        <text
          fill="#d6b17a"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '0.35em',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))',
          }}
        >
          <textPath href="#conran-arch-path" startOffset="50%" textAnchor="middle">
            CONRAN HOUSE
          </textPath>
        </text>
      </svg>
      <div
        class="text-center mt-1 text-[10px] tracking-[0.5em] uppercase"
        style={{ color: '#d6b17a', opacity: 0.8 }}
      >
        The Conran Shop · Gangnam
      </div>
    </div>
  );
}

/* ─── Floor brass emblem ─── */

function FloorEmblem() {
  return (
    <div
      class="absolute left-1/2 -translate-x-1/2 bottom-[18%] z-[5] pointer-events-none"
      style={{ width: '180px', height: '90px', perspective: '400px' }}
      aria-hidden="true"
    >
      {/* Perspective-transformed brass ring + TCS monogram */}
      <div
        style={{
          transform: 'rotateX(75deg) scale(1, 0.45)',
          transformOrigin: 'center bottom',
          width: '100%',
          height: '100%',
        }}
      >
        <svg viewBox="0 0 200 200" class="w-full h-full">
          <defs>
            <radialGradient id="brass-ring" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="rgba(184,147,90,0)" />
              <stop offset="85%" stopColor="rgba(214,177,122,0.35)" />
              <stop offset="100%" stopColor="rgba(184,147,90,0.8)" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="85" fill="none" stroke="url(#brass-ring)" strokeWidth="3" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(214,177,122,0.25)" strokeWidth="1" />
          <text
            x="100"
            y="112"
            textAnchor="middle"
            fill="#d6b17a"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              opacity: 0.7,
            }}
          >
            TCS
          </text>
        </svg>
      </div>
    </div>
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
