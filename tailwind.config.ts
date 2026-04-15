import type { Config } from 'tailwindcss';

/**
 * Tailwind 설정 — 콘란 브랜드 테마 토큰
 *
 * 토큰 실제 값은 src/styles/tokens.css 의 CSS 변수로 정의.
 * JS/HTML에서는 Tailwind 클래스(bg-conran-accent 등)로 사용.
 * 디자인 시스템 변경 시 tokens.css만 수정하면 전역 반영.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        conran: {
          black: 'var(--conran-black)',
          ink: 'var(--conran-ink)',
          off: 'var(--conran-off)',
          cream: 'var(--conran-cream)',
          accent: 'var(--conran-accent)',
          gold: 'var(--conran-gold)',
          line: 'var(--conran-line)',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Noto Sans KR"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        kern: '0.22em',
      },
      animation: {
        'fade-in': 'fadeIn 0.55s ease both',
        'slide-up': 'slideUp 0.35s cubic-bezier(.2,.8,.2,1)',
        pulse: 'pulse 2.4s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
