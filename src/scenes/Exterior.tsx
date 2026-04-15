import { goScene } from '../stores/scene';

/**
 * Scene A — Exterior
 * 콘란 경의 하우스 진입. PDF p.1, p.5 대응.
 * TODO(Phase 1-W2): AI 생성 파노라마 미리보기 정지 이미지로 교체.
 */
export function Exterior() {
  return (
    <section class="relative min-h-screen bg-conran-black text-conran-off overflow-hidden animate-fade-in">
      <div
        class="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(184,147,90,.18) 0%, transparent 55%),' +
            'radial-gradient(ellipse at 80% 90%, rgba(200,90,42,.12) 0%, transparent 55%),' +
            'linear-gradient(180deg, #12100e 0%, #1e1a15 55%, #0a0908 100%)',
        }}
      />
      <div class="relative z-10 min-h-screen flex flex-col justify-center items-center px-8 py-20 text-center">
        <div class="text-[11px] tracking-[0.3em] text-conran-gold mb-6">
          SIR TERENCE CONRAN&apos;S HOUSE · LOTTE DEPARTMENT STORE
        </div>
        <h1 class="serif text-6xl md:text-8xl font-bold leading-tight mb-6 max-w-5xl">
          콘란 경이<br />
          당신을 <em class="italic text-conran-gold">초대합니다</em>
        </h1>
        <p class="text-sm md:text-lg text-[#d0c8b8] max-w-xl leading-relaxed mb-12">
          런던의 오후, 테렌스 콘란의 하우스 문이 열립니다.<br />
          1953년부터 이어진 영국 모던 디자인의 기품을, 가상 공간에서 거닐어 보세요.
        </p>
        <div class="flex gap-3 flex-wrap justify-center">
          <button
            class="btn-accent px-10 py-4 text-sm font-semibold tracking-wider uppercase rounded-sm"
            onClick={() => goScene('gate')}
          >
            입장하기 · ENTER HOUSE
          </button>
          <button
            class="btn-ghost px-10 py-4 text-sm font-semibold tracking-wider uppercase rounded-sm"
            onClick={() => goScene('gallery')}
          >
            전시형 바로가기 · SKIP
          </button>
        </div>
      </div>
    </section>
  );
}
