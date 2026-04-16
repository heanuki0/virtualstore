import { useEffect, useRef, useState } from 'preact/hooks';
import type { Roomset } from '../data/schemas';

/**
 * Styling Shot Gallery (spec v2 p.12)
 *
 * Horizontal carousel of 5-7 lookbook thumbnails below the Customize stage.
 * Click a shot to expand as a fullscreen mood preview. Left/right arrow
 * buttons + wheel/drag scroll for browsing.
 */
export function StylingShotCarousel({ room }: { room: Roomset }) {
  const shots = room.stylingShots ?? [];
  const [active, setActive] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (shots.length === 0) return null;

  const activeShot = shots.find((s) => s.id === active);

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // ESC closes the expanded preview
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <>
      <section class="bg-conran-ink/95 border-t border-white/10 px-6 py-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-[10px] tracking-kern text-conran-gold font-bold uppercase mb-0.5">
              Styling Shot Gallery
            </div>
            <div class="text-xs text-white/70">
              {room.name}의 다양한 무드와 스타일링을 확인하세요
            </div>
          </div>
          <div class="hidden md:flex items-center gap-1.5">
            <button
              class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center transition"
              onClick={() => scrollBy(-320)}
              aria-label="이전"
            >
              ‹
            </button>
            <button
              class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center transition"
              onClick={() => scrollBy(320)}
              aria-label="다음"
            >
              ›
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          class="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'thin' }}
        >
          {shots.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              class="group relative flex-shrink-0 w-[200px] md:w-[240px] snap-start overflow-hidden rounded-sm border border-white/10 hover:border-conran-accent transition bg-black"
              aria-label={s.label}
            >
              <div
                class="w-full aspect-[16/10] bg-cover bg-center transition group-hover:scale-[1.03]"
                style={{ backgroundImage: `url('${s.image}')` }}
              />
              <div class="absolute inset-x-0 bottom-0 px-3 py-1.5 bg-gradient-to-t from-black/85 to-transparent text-white">
                <div class="text-[11px] font-semibold tracking-wide">{s.label}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Fullscreen expanded preview */}
      {activeShot && (
        <div
          class="fixed inset-0 z-[var(--z-overlay)] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeShot.label}
        >
          <button
            class="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/95 text-gray-800 text-lg flex items-center justify-center hover:bg-white z-10"
            onClick={() => setActive(null)}
            aria-label="닫기"
          >
            ✕
          </button>
          <div class="max-w-6xl w-full">
            <img
              src={activeShot.image}
              alt={activeShot.label}
              class="w-full h-auto rounded-sm shadow-2xl"
            />
            <div class="mt-4 text-center">
              <div class="text-[10px] tracking-kern text-conran-gold font-bold uppercase mb-1">
                Styling Shot · {room.name}
              </div>
              <div class="serif text-xl text-white">{activeShot.label}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
