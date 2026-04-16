import { signal } from '@preact/signals';
import { scenarios, products } from '../data/loader';
import { track } from '../analytics/gtag';
import type { AIScenario, Product } from '../data/schemas';

export interface AIMessage {
  id: number;
  role: 'bot' | 'user' | 'typing';
  text?: string;
  cards?: string[]; // product ids
  roomset?: string; // roomset id
}

export const aiOpen = signal<boolean>(false);
export const aiMessages = signal<AIMessage[]>([]);
let messageCounter = 0;

function push(msg: Omit<AIMessage, 'id'>): void {
  aiMessages.value = [...aiMessages.value, { id: ++messageCounter, ...msg }];
}

function removeTyping(): void {
  aiMessages.value = aiMessages.value.filter((m) => m.role !== 'typing');
}

export function openAI(): void {
  if (aiOpen.value) return;
  aiOpen.value = true;
  track('ai_open');
  if (aiMessages.value.length === 0) {
    push({
      role: 'bot',
      text: '안녕하세요, 콘란샵 AI 어시스턴트입니다. ✨ 콘란 경의 하우스에서 도움이 필요하신 게 있으신가요?',
    });
  }
}

export function closeAI(): void {
  aiOpen.value = false;
}

export function toggleAI(): void {
  if (aiOpen.value) closeAI();
  else openAI();
}

function matchScenario(query: string): AIScenario | null {
  const trimmed = query.trim();
  const exact = scenarios.value.find((s) => s.trigger === trimmed);
  if (exact) return exact;

  // Keyword fallback → map to the most relevant preset
  const kw = trimmed.toLowerCase();
  if (/선물|gift|5만|10만|20만/.test(kw)) {
    return scenarios.value.find((s) => s.trigger.includes('선물')) ?? null;
  }
  if (/신혼|거실|리빙|livingroom|living room/.test(kw)) {
    return scenarios.value.find((s) => s.trigger.includes('거실')) ?? null;
  }
  if (/홈오피스|서재|데스크|home office|오피스|워크/.test(kw)) {
    return scenarios.value.find((s) => s.trigger.includes('홈 오피스')) ?? null;
  }
  if (/베스트|인기|스테디|TOP|top/.test(kw)) {
    return scenarios.value.find((s) => s.trigger.includes('베스트')) ?? null;
  }
  return null;
}

/**
 * Context-aware product recommendations (spec v2 p.13 "AI 어드바이저").
 * Extracts category/style/price intent from free-text and returns top-matching products.
 */
function contextRecommend(query: string): { products: string[]; reason: string } | null {
  const kw = query.toLowerCase();
  const all = products.value;
  if (all.length === 0) return null;

  // Category keywords
  const catMap: Record<string, string[]> = {
    sofa: ['소파', '의자', '체어', '라운지', 'sofa', 'chair'],
    table: ['테이블', '데스크', '책상', '콘솔', 'table', 'desk'],
    light: ['조명', '램프', '펜던트', 'light', 'lamp'],
    rug: ['러그', '카펫', 'rug', 'carpet'],
    object: ['오브제', '소품', '화병', '캔들', '스피커', 'vase'],
  };
  const matchedCats: string[] = [];
  for (const [cat, kws] of Object.entries(catMap)) {
    if (kws.some((w) => kw.includes(w))) matchedCats.push(cat);
  }

  // Style keywords
  const styleMap: Record<string, string[]> = {
    modern: ['모던', '미니멀', 'modern', 'minimal'],
    classic: ['클래식', '전통', 'classic', 'traditional'],
    'mid-century': ['미드', '북유럽', '스칸디', 'mid', 'scandinavian'],
  };
  let matchedStyle: string | null = null;
  for (const [style, kws] of Object.entries(styleMap)) {
    if (kws.some((w) => kw.includes(w))) {
      matchedStyle = style;
      break;
    }
  }

  // Price intent (extract 만/원 numbers)
  const priceMatch = kw.match(/(\d+)\s*만/);
  let maxPrice: number | null = null;
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[1], 10) * 10000;
  } else if (/저렴|싼|가성비|budget/.test(kw)) {
    maxPrice = 500000;
  } else if (/럭셔리|프리미엄|고급|luxury|premium/.test(kw)) {
    maxPrice = null;
  }

  // Filter
  let filtered: Product[] = [...all];
  if (matchedCats.length) filtered = filtered.filter((p) => matchedCats.includes(p.cat));
  if (matchedStyle) filtered = filtered.filter((p) => p.style === matchedStyle);
  if (maxPrice) filtered = filtered.filter((p) => p.price <= maxPrice!);

  if (filtered.length === 0) return null;

  // Sort: cheapest first if price intent, otherwise by price descending (luxury bias)
  filtered.sort((a, b) => (priceMatch ? a.price - b.price : b.price - a.price));
  const top = filtered.slice(0, 3).map((p) => p.id);

  // Build reason string
  const reasons: string[] = [];
  if (matchedCats.length) reasons.push(`**${matchedCats.join(', ')}** 카테고리`);
  if (matchedStyle) reasons.push(`**${matchedStyle}** 스타일`);
  if (maxPrice) reasons.push(`**${(maxPrice / 10000).toLocaleString()}만원 이하**`);
  const reason =
    reasons.length > 0
      ? `${reasons.join(' · ')} 조건에 맞는 콘란샵 시그니처 상품을 ${top.length}가지 추천드려요.`
      : `콘란샵 스테디셀러 중 ${top.length}가지를 추천드려요.`;

  return { products: top, reason };
}

function genericReply(query: string): string {
  if (/안녕|하이|반가|hi|hello/i.test(query))
    return '반갑습니다! 아래 자주 묻는 질문을 선택하시거나, 원하시는 스타일/예산을 자유롭게 말씀해 주세요.';
  if (/가격|price|얼마/.test(query))
    return '예산을 알려주시면 그 범위 안에서 최적 조합을 추천드릴게요. 예: "300만원 이하 거실 구성"';
  if (/배송|설치/.test(query))
    return '롯데백화점 콘란은 전 상품 무료 배송이며, 대형 가구는 전문 기사가 방문 설치해 드립니다.';
  if (/소재|재질|원목|가죽|패브릭/.test(query))
    return '콘란샵 시그니처는 이탈리아산 풀그레인 가죽, 오크/월넛 원목, 덴마크 울 패브릭 등 장인 소재만 엄선합니다.';
  return '원하시는 공간(거실/홈오피스), 스타일(모던/미드센추리/클래식/미니멀), 예산을 알려주시면 콘란 큐레이터가 시그니처 상품을 추천해 드릴게요.';
}

/**
 * Always-available quick-access recommendations — shown as a permanent
 * "스테디셀러 TOP 5" pill strip at the top of the assistant.
 */
export function steadyBestsellers(): string[] {
  const all = products.value;
  if (all.length === 0) return [];
  // Heuristic: highest price = most curated / iconic. Cap at 5.
  return [...all]
    .sort((a, b) => b.price - a.price)
    .slice(0, 5)
    .map((p) => p.id);
}

export function sendUserQuery(text: string): void {
  const clean = text.trim();
  if (!clean) return;
  push({ role: 'user', text: clean });
  track('ai_query', { trigger: clean });

  push({ role: 'typing' });
  const delay = 900 + Math.random() * 500;
  window.setTimeout(() => {
    removeTyping();
    const scenario = matchScenario(clean);
    if (scenario) {
      push({ role: 'bot', text: scenario.response });
      if (scenario.cards.length > 0 || scenario.roomset) {
        push({ role: 'bot', cards: scenario.cards, roomset: scenario.roomset });
      }
      return;
    }
    // Fallback: context-aware recommendation engine (AI 어드바이저)
    const rec = contextRecommend(clean);
    if (rec) {
      push({ role: 'bot', text: rec.reason });
      push({ role: 'bot', cards: rec.products });
      return;
    }
    push({ role: 'bot', text: genericReply(clean) });
  }, delay);
}

export function resetAI(): void {
  aiMessages.value = [];
  aiOpen.value = false;
}
