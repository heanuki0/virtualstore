import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'node:path';

/**
 * Vite 설정
 * - Preact + TSX
 * - 경로 별칭 @/* → src/*
 * - COOP/COEP 헤더 (SharedArrayBuffer 활성화 대비)
 * - Marzipano를 별도 청크로 분리 (initial bundle 경량 유지)
 */
export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: {
          marzipano: ['marzipano'],
          preact: ['preact', '@preact/signals'],
        },
      },
    },
  },
});
