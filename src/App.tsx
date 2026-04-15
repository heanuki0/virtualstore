import { useEffect } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { currentScene, goScene } from './stores/scene';
import { loadAllData, dataReady } from './data/loader';
import { HUD } from './components/HUD';
import { Breadcrumb } from './components/Breadcrumb';
import { ProductOverlay } from './components/ProductOverlay';
import { AIAssistant } from './components/AIAssistant';
import { Exterior } from './scenes/Exterior';
import { Gate } from './scenes/Gate';
import { Customize } from './scenes/Customize';
import { Gallery } from './scenes/Gallery';
import { RoomsetDetail } from './scenes/RoomsetDetail';

/**
 * Root component — loads static data once, then routes scenes via signal.
 * URL hash sync (#/customize) is optional Phase 1 enhancement.
 */
export function App() {
  const error = useSignal<string | null>(null);

  useEffect(() => {
    loadAllData().catch((e) => {
      // eslint-disable-next-line no-console
      console.error('[App] data load failed', e);
      error.value = String(e?.message ?? e);
    });
  }, []);

  useEffect(() => {
    // hash router: #/customize → scene 'customize'
    const sync = () => {
      const hash = location.hash.replace(/^#\//, '') || 'exterior';
      goScene(hash as never);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  if (error.value) {
    return (
      <div class="p-12 text-center">
        <h1 class="serif text-3xl mb-4">데이터 로드 실패</h1>
        <pre class="text-sm text-red-700 bg-red-50 p-4 rounded">{error.value}</pre>
      </div>
    );
  }

  if (!dataReady.value) {
    return (
      <div class="min-h-screen flex items-center justify-center text-conran-ink">
        <div class="text-sm tracking-[0.25em] uppercase text-conran-gold">Loading…</div>
      </div>
    );
  }

  const scene = currentScene.value;
  return (
    <>
      <HUD />
      <Breadcrumb />
      <main class="pt-[114px]">
        {scene === 'exterior' && <Exterior />}
        {scene === 'gate' && <Gate />}
        {scene === 'customize' && <Customize />}
        {scene === 'gallery' && <Gallery />}
        {scene.startsWith('roomset/') && <RoomsetDetail id={scene.slice('roomset/'.length)} />}
      </main>
      <ProductOverlay />
      <AIAssistant />
    </>
  );
}
