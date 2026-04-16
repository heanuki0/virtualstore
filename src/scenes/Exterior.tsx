import { useState } from 'preact/hooks';
import { goScene } from '../stores/scene';
import { DoorTransition } from '../components/DoorTransition';

const BASE = import.meta.env.BASE_URL;

/**
 * Scene A — Exterior
 * 콘란 경의 런던 타운하우스 외관. 리서치 기반 조지안 건축 + 골든아워 분위기.
 * "입장하기" → DoorTransition → Gate(입구 홀 360° 파노라마)
 */
export function Exterior() {
  const [entering, setEntering] = useState(false);

  const enterHouse = () => {
    if (entering) return;
    setEntering(true);
    const pre = new Image();
    pre.src = `${BASE}panos/HALL/preview.jpg`;
  };

  return (
    <section class="relative min-h-screen bg-conran-black text-conran-off overflow-hidden">
      {/* Building exterior background image */}
      <div
        class="absolute inset-0 animate-fade-in"
        style={{
          backgroundImage: `url('${BASE}images/exterior.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      />

      {/* Dark gradient overlay for text readability */}
      <div
        class="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,9,8,.3) 0%, rgba(10,9,8,.15) 40%, rgba(10,9,8,.5) 75%, rgba(10,9,8,.85) 100%)',
        }}
      />

      {/* Content */}
      <div class="relative z-10 min-h-screen flex flex-col justify-end items-center px-8 pb-20 pt-40 text-center">
        <div class="text-[11px] tracking-[0.3em] text-conran-gold mb-4 uppercase">
          Sir Terence Conran&apos;s House · Lotte Department Store
        </div>
        <h1 class="serif text-5xl md:text-7xl font-bold leading-tight mb-4 max-w-4xl">
          콘란 경이<br />
          당신을 <em class="italic text-conran-gold">초대합니다</em>
        </h1>
        <p class="text-sm md:text-base text-[#d0c8b8] max-w-lg leading-relaxed mb-10">
          런던의 오후, 테렌스 콘란의 하우스 문이 열립니다.<br />
          1953년부터 이어진 영국 모던 디자인의 기품을 거닐어 보세요.
        </p>
        <div class="flex gap-3 flex-wrap justify-center">
          <button
            class="btn-accent px-10 py-4 text-sm font-semibold tracking-wider uppercase rounded-sm disabled:opacity-60"
            onClick={enterHouse}
            disabled={entering}
          >
            {entering ? '문이 열리는 중…' : '입장하기 · Enter House'}
          </button>
          <button
            class="btn-ghost px-10 py-4 text-sm font-semibold tracking-wider uppercase rounded-sm"
            onClick={() => goScene('gallery')}
            disabled={entering}
          >
            전시형 바로가기 · Skip
          </button>
        </div>
      </div>

      <DoorTransition
        active={entering}
        previewUrl={`${BASE}panos/HALL/preview.jpg`}
        onComplete={() => goScene('gate')}
      />
    </section>
  );
}
