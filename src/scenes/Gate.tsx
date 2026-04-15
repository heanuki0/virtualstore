import { goScene } from '../stores/scene';

/**
 * Scene B — Gate
 * 커스터마이즈 ↔ 전시형 두 갈래 진입. PDF p.1, p.5 대응.
 */
export function Gate() {
  return (
    <section class="max-w-6xl mx-auto px-8 py-16 animate-fade-in">
      <header class="text-center mb-14">
        <div class="text-[11px] tracking-kern text-conran-accent font-bold mb-3.5">
          CHOOSE YOUR EXPERIENCE
        </div>
        <h2 class="serif text-4xl md:text-5xl font-bold mb-3.5">어떻게 둘러보시겠어요?</h2>
        <p class="text-[15px] text-gray-600 leading-relaxed max-w-xl mx-auto">
          콘란 경의 하우스는 두 가지 방식으로 경험할 수 있습니다. 직접 공간을 꾸며보거나,
          큐레이션된 룸셋을 탐색해 보세요.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GateCard
          tag="① 컨설팅 제안형"
          title="Customize Your Room"
          sub="기본 룸에 가구·조명·소품을 자유롭게 배치"
          bullets={[
            '5개 카테고리(소파·테이블·조명·러그·소품)의 콘란 아이템을 실시간 교체',
            '총 예산과 포함 상품이 실시간으로 집계',
            '마음에 드는 조합은 장바구니에 담아 롯데백화점몰에서 구매',
          ]}
          bg="radial-gradient(ellipse at 70% 30%, rgba(200,90,42,.28) 0%, transparent 55%), linear-gradient(135deg, #2d4157 0%, #8b9dac 50%, #e8d5b7 100%)"
          onClick={() => goScene('customize')}
          ctaLabel="시작하기"
        />
        <GateCard
          tag="② 전시형"
          title="Curated Roomsets"
          sub="4~6개 컨셉 룸셋 · 예산과 스타일로 탐색"
          bullets={[
            '콘란 디자이너가 제안하는 라이프스타일 컨셉',
            '스타일(모던·클래식·미드센추리·미니멀)과 금액대별 필터',
            '각 룸셋의 구성 상품을 한 번에 주문하거나, 낱개로 선택 가능',
          ]}
          bg="radial-gradient(ellipse at 30% 30%, rgba(184,147,90,.35) 0%, transparent 55%), linear-gradient(135deg, #5c3d2e 0%, #a47551 55%, #e9d4b8 100%)"
          onClick={() => goScene('gallery')}
          ctaLabel="룸셋 둘러보기"
        />
      </div>
    </section>
  );
}

interface CardProps {
  tag: string;
  title: string;
  sub: string;
  bullets: string[];
  bg: string;
  onClick: () => void;
  ctaLabel: string;
}

function GateCard({ tag, title, sub, bullets, bg, onClick, ctaLabel }: CardProps) {
  return (
    <button
      class="group bg-white border border-conran-cream rounded-sm overflow-hidden text-left transition-transform hover:-translate-y-1.5 hover:shadow-2xl"
      onClick={onClick}
    >
      <div class="relative h-80" style={{ background: bg }}>
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div class="absolute top-4 left-4 bg-black/70 text-conran-off text-[10px] tracking-kern font-bold px-3 py-1.5 rounded-sm">
          {tag}
        </div>
        <div class="absolute bottom-5 left-6 right-6 text-white">
          <h3 class="serif text-3xl font-bold mb-1.5">{title}</h3>
          <p class="text-sm text-white/85">{sub}</p>
        </div>
      </div>
      <div class="p-6 pt-5">
        <ul class="flex flex-col gap-2.5">
          {bullets.map((b) => (
            <li key={b} class="text-sm text-gray-700 pl-4 relative leading-snug">
              <span class="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-conran-accent" />
              {b}
            </li>
          ))}
        </ul>
        <div class="mt-5 pt-4 border-t border-conran-cream flex justify-between items-center text-xs font-bold tracking-wider text-conran-accent">
          <span>{ctaLabel}</span>
          <span class="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </button>
  );
}
