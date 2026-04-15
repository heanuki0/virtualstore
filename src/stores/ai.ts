import { signal } from '@preact/signals';
import { scenarios } from '../data/loader';
import { track } from '../analytics/gtag';
import type { AIScenario } from '../data/schemas';

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
  if (/선물|gift|5만/.test(kw)) {
    return scenarios.value.find((s) => s.trigger.includes('선물')) ?? null;
  }
  if (/신혼|거실|리빙/.test(kw)) {
    return scenarios.value.find((s) => s.trigger.includes('신혼')) ?? null;
  }
  if (/미드|midcentury|mid-century|센추리/.test(kw)) {
    return scenarios.value.find((s) => s.trigger.includes('미드센추리')) ?? null;
  }
  if (/베스트|인기|TOP|top/.test(kw)) {
    return scenarios.value.find((s) => s.trigger.includes('베스트')) ?? null;
  }
  return null;
}

function genericReply(query: string): string {
  if (/안녕|하이|반가|hi|hello/i.test(query))
    return '반갑습니다! 아래 자주 묻는 질문을 선택하시거나, 원하시는 스타일/예산을 자유롭게 말씀해 주세요.';
  if (/가격|price|얼마/.test(query))
    return '예산을 알려주시면 그 범위 안에서 최적 조합을 추천드릴게요. 예: "300만원 이하 거실 구성"';
  if (/배송|설치/.test(query))
    return '롯데백화점 콘란은 전 상품 무료 배송이며, 대형 가구는 전문 기사가 방문 설치해 드립니다.';
  return '아직 해당 질문에 대한 답변은 준비 중이에요. 아래 "자주 묻는 질문"을 먼저 활용해 보시거나, 원하시는 스타일과 예산을 알려주세요.';
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
    } else {
      push({ role: 'bot', text: genericReply(clean) });
    }
  }, delay);
}

export function resetAI(): void {
  aiMessages.value = [];
  aiOpen.value = false;
}
