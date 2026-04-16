import { useEffect, useRef, useState } from 'preact/hooks';
import {
  aiMessages,
  aiOpen,
  closeAI,
  openAI,
  sendUserQuery,
  toggleAI,
  type AIMessage,
} from '../stores/ai';
import { scenarios, productById, roomsetById } from '../data/loader';
import { openProduct } from '../stores/overlay';
import { goScene } from '../stores/scene';

const won = (n: number) => '₩ ' + n.toLocaleString('ko-KR');

/**
 * AI Assistant — global floating chatbot.
 * Mounted once in <App />. Visible on every scene.
 */
export function AIAssistant() {
  return (
    <>
      <FloatingButton />
      {aiOpen.value && <Panel />}
    </>
  );
}

function FloatingButton() {
  if (aiOpen.value) return null;
  return (
    <button
      class="fixed right-7 bottom-7 z-[60] w-16 h-16 rounded-full text-white text-2xl flex items-center justify-center shadow-2xl transition hover:scale-110 animate-pulse"
      style={{
        background: 'linear-gradient(135deg, var(--conran-accent), #a8471f)',
        boxShadow:
          '0 12px 40px -8px rgba(200,90,42,.7), 0 0 0 6px rgba(200,90,42,.15)',
      }}
      onClick={openAI}
      aria-label="AI 어시스턴트 열기"
    >
      ✨
    </button>
  );
}

function Panel() {
  return (
    <div class="fixed right-7 bottom-7 z-[61] w-[400px] max-w-[calc(100vw-56px)] h-[560px] max-h-[calc(100vh-80px)] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-conran-cream animate-slide-up">
      <Header />
      <Body />
      <QuickChips />
      <InputBar />
    </div>
  );
}

function Header() {
  return (
    <header class="px-5 py-4 bg-conran-black text-conran-off flex justify-between items-center">
      <div>
        <h3 class="serif text-lg font-bold m-0 flex items-center gap-2">✨ 콘란 AI 어시스턴트</h3>
        <div class="text-[10px] tracking-kern text-conran-gold uppercase mt-0.5">
          CURATED FOR YOU
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:bg-white/15"
          onClick={closeAI}
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </header>
  );
}

function Body() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [aiMessages.value.length]);

  return (
    <div
      ref={ref}
      class="flex-1 overflow-y-auto p-5 flex flex-col gap-3"
      style={{ background: '#faf7f0' }}
    >
      {aiMessages.value.map((m) => (
        <MessageBubble key={m.id} msg={m} />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: AIMessage }) {
  if (msg.role === 'typing') {
    return (
      <div class="self-start inline-flex items-center gap-1.5 bg-white border border-conran-cream rounded-[14px] rounded-bl-[4px] px-4 py-3 text-gray-500 text-xs">
        답변을 생성하고 있어요
        <span class="inline-flex gap-1">
          <Dot delay={0} />
          <Dot delay={0.15} />
          <Dot delay={0.3} />
        </span>
      </div>
    );
  }
  if (msg.cards !== undefined || msg.roomset) {
    return <CardList cards={msg.cards ?? []} roomset={msg.roomset} />;
  }
  if (msg.role === 'user') {
    return (
      <div class="self-end max-w-[82%] bg-conran-black text-white rounded-[14px] rounded-br-[4px] px-4 py-3 text-sm leading-relaxed">
        {msg.text}
      </div>
    );
  }
  return (
    <div class="self-start max-w-[82%] bg-white text-conran-ink border border-conran-cream rounded-[14px] rounded-bl-[4px] px-4 py-3 text-sm leading-relaxed">
      {msg.text}
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      class="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block"
      style={{
        animation: 'aiDot 1.2s infinite',
        animationDelay: `${delay}s`,
      }}
    />
  );
}

function CardList({ cards, roomset }: { cards: string[]; roomset?: string }) {
  const r = roomset ? roomsetById(roomset) : undefined;
  return (
    <div class="self-start max-w-full w-full">
      <style>{`
        @keyframes aiDot { 0%,60%,100% { transform:translateY(0); opacity:.4; } 30% { transform:translateY(-4px); opacity:1; } }
      `}</style>
      <div class="grid grid-cols-2 gap-2">
        {r && (
          <button
            class="col-span-2 bg-white border border-conran-cream rounded overflow-hidden text-left transition hover:border-conran-accent hover:-translate-y-0.5"
            onClick={() => {
              closeAI();
              window.setTimeout(() => goScene(`roomset/${r.id}` as const), 200);
            }}
          >
            <img
              src={r.hero}
              alt={r.name}
              referrerPolicy="no-referrer"
              class="w-full aspect-[16/9] object-cover bg-gray-200"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.style.visibility = 'hidden';
              }}
            />
            <div class="px-2.5 py-2">
              <div class="text-[11px] font-semibold leading-tight mb-1">[룸셋] {r.name}</div>
              <div class="text-[11px] font-bold text-conran-accent">{r.priceTag}</div>
            </div>
          </button>
        )}
        {cards.map((pid) => {
          const p = productById(pid);
          if (!p) return null;
          return (
            <button
              key={pid}
              class="bg-white border border-conran-cream rounded overflow-hidden text-left transition hover:border-conran-accent hover:-translate-y-0.5"
              onClick={() => {
                closeAI();
                window.setTimeout(() => openProduct(pid, 'ai_card'), 200);
              }}
            >
              <img
                src={p.img}
                alt={p.name}
                referrerPolicy="no-referrer"
                class="w-full aspect-square object-cover bg-gray-200"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.visibility = 'hidden';
                }}
              />
              <div class="px-2.5 py-2">
                <div class="text-[11px] font-semibold leading-tight mb-1 line-clamp-2 min-h-[28px]">
                  {p.name}
                </div>
                <div class="text-[11px] font-bold text-conran-accent">{won(p.price)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuickChips() {
  return (
    <div class="flex flex-col gap-2 px-4 py-3.5 bg-white border-t border-conran-cream">
      <span class="text-[10px] tracking-kern text-gray-500 font-bold uppercase">
        자주 묻는 질문
      </span>
      {scenarios.value.map((s) => (
        <button
          key={s.trigger}
          class="bg-[#f5efe3] border-0 px-3 py-2 rounded-full text-xs text-left text-gray-700 hover:bg-[#ebe3d2] hover:text-conran-accent transition"
          onClick={() => sendUserQuery(s.trigger)}
        >
          💬 {s.trigger}
        </button>
      ))}
    </div>
  );
}

function InputBar() {
  const [text, setText] = useState('');
  const onSend = () => {
    if (!text.trim()) return;
    sendUserQuery(text);
    setText('');
  };
  return (
    <div class="flex gap-2 px-4 py-3 border-t border-conran-cream bg-white">
      <input
        class="flex-1 px-3.5 py-2.5 border border-conran-cream rounded-full text-sm outline-none focus:border-conran-accent"
        placeholder="메시지를 입력하세요"
        value={text}
        onInput={(e) => setText((e.currentTarget as HTMLInputElement).value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') onSend();
        }}
      />
      <button
        class="bg-conran-accent text-white border-0 rounded-full px-4 text-sm font-bold hover:brightness-90 transition"
        onClick={onSend}
      >
        전송
      </button>
    </div>
  );
}

// Suppress unused warnings if toggleAI is imported elsewhere
void toggleAI;
