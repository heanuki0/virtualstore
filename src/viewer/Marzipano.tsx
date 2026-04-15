import { useEffect, useRef, useState } from 'preact/hooks';
import { effect } from '@preact/signals';
import { activeVariant } from '../stores/customize';
import type { Hotspot, Roomset } from '../data/schemas';

/**
 * Marzipano 파노라마 뷰어 래퍼
 *
 * 지원 입력 포맷(Roomset.panorama):
 *  1. `equirect` — 단일 equirectangular 이미지 URL (개발/플레이스홀더)
 *  2. `base` + `levels` — marzipano-tool이 생성한 cube 타일 (프로덕션)
 *
 * 핫스팟:
 *  - yaw/pitch(도 단위)를 라디안으로 변환하여 DOM hotspot으로 부착
 *  - onHotspotClick 콜백으로 상위에서 slot swap / product overlay 연결
 *
 * 렌더 특이사항:
 *  - Marzipano는 UMD/CommonJS 빌드라 `import()` 후 default 또는 namespace
 *    어느 쪽으로 해도 Viewer/ImageUrlSource 등이 노출됨.
 *  - 씬 전환/언마운트 시 viewer.destroy()로 GL context 확실히 정리.
 */
export interface MarzipanoViewProps {
  room: Roomset;
  /** Optional explicit equirect URL override (variant selection). Falls back to room.panorama.equirect. */
  equirectOverride?: string;
  onHotspotClick?: (h: Hotspot) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  sofa: '소파',
  table: '테이블',
  light: '조명',
  rug: '러그',
  object: '소품',
};

export function MarzipanoView({ room, equirectOverride, onHotspotClick }: MarzipanoViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onClickRef = useRef(onHotspotClick);
  onClickRef.current = onHotspotClick;

  // Subscribe to the global variant signal via explicit `effect`. This works
  // regardless of whether the surrounding component auto-subscribes, so time
  // -of-day switches reliably trigger the viewer to re-initialise.
  const [subscribedVariantUrl, setSubscribedVariantUrl] = useState<string | undefined>(
    () => activeVariant.value?.equirect,
  );
  useEffect(
    () =>
      effect(() => {
        setSubscribedVariantUrl(activeVariant.value?.equirect);
      }),
    [],
  );

  const effectiveEquirect = equirectOverride ?? subscribedVariantUrl ?? room.panorama?.equirect;

  useEffect(() => {
    if (!ref.current || !room.panorama) return;
    let cancelled = false;
    let viewer: { destroy(): void } | null = null;

    (async () => {
      // Marzipano ships CJS without .d.ts; `@ts-ignore` keeps strict mode happy.
      // Actual type surface lives in src/vite-env.d.ts `declare module 'marzipano'`.
      // @ts-ignore — no types
      const mod = await import('marzipano');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Marzipano: any = (mod as any).default ?? mod;
      if (cancelled || !ref.current) return;

      const pano = room.panorama!;
      const v = new Marzipano.Viewer(ref.current, {
        controls: { mouseViewMode: 'drag' },
      });
      viewer = v;

      // Prefer explicit override, then subscribed signal, then default equirect, then cube tiles.
      const equirectUrl = effectiveEquirect;
      const source = equirectUrl
        ? Marzipano.ImageUrlSource.fromString(equirectUrl)
        : Marzipano.ImageUrlSource.fromString(
            `${pano.base}{z}/{f}/{y}_{x}.jpg`,
            pano.previewUrl ? { cubeMapPreviewUrl: pano.previewUrl } : {},
          );

      const geometry = equirectUrl
        ? new Marzipano.EquirectGeometry([{ width: 4096 }])
        : new Marzipano.CubeGeometry(pano.levels.map((size) => ({ tileSize: 512, size })));

      const limiter = Marzipano.RectilinearView.limit.traditional(
        4096,
        (Math.PI * 110) / 180,
      );
      // 초기 뷰: 핫스팟들의 무게중심이 화면 중앙에 오도록 계산.
      // 파노라마가 없거나 핫스팟이 비면 정면(0,0)에서 시작.
      const hs = room.hotspots;
      const avgYaw = hs.length
        ? hs.reduce((s, h) => s + h.yaw, 0) / hs.length
        : 0;
      const avgPitch = hs.length
        ? hs.reduce((s, h) => s + h.pitch, 0) / hs.length
        : 0;
      const view = new Marzipano.RectilinearView(
        {
          yaw: (avgYaw * Math.PI) / 180,
          pitch: (avgPitch * Math.PI) / 180,
          fov: (Math.PI * 100) / 180,
        },
        limiter,
      );

      const scene = v.createScene({
        source,
        geometry,
        view,
        pinFirstLevel: true,
      } as Record<string, unknown>);

      for (const h of room.hotspots) {
        const el = createHotspotEl(h);
        el.addEventListener('click', () => onClickRef.current?.(h));
        scene.hotspotContainer().createHotspot(el, {
          yaw: (h.yaw * Math.PI) / 180,
          pitch: (h.pitch * Math.PI) / 180,
        });
      }

      scene.switchTo();
    })().catch((e) => {
      // eslint-disable-next-line no-console
      console.error('[Marzipano] init failed', e);
    });

    return () => {
      cancelled = true;
      viewer?.destroy();
    };
  }, [room.id, effectiveEquirect]);

  return <div ref={ref} class="absolute inset-0 bg-conran-black" aria-label={`${room.name} 파노라마 뷰`} />;
}

function createHotspotEl(h: Hotspot): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'hotspot-pin';
  el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);cursor:pointer;';
  el.innerHTML = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:rgba(200,90,42,0.92);
        border:3px solid #fff;
        box-shadow:0 6px 20px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        animation:hotspotPulse 2s ease-in-out infinite;
      ">
        <div style="width:8px;height:8px;border-radius:50%;background:#fff;"></div>
      </div>
      <div style="
        margin-top:6px;padding:3px 10px;
        background:rgba(10,10,10,0.85);color:#fff;
        font-size:11px;font-weight:600;letter-spacing:0.05em;
        border-radius:2px;white-space:nowrap;
        pointer-events:none;
      ">${CATEGORY_LABELS[h.category] ?? h.category}</div>
    </div>
    <style>
      @keyframes hotspotPulse {
        0%,100% { transform:scale(1); box-shadow:0 6px 20px rgba(0,0,0,0.5),0 0 0 0 rgba(200,90,42,0.5); }
        50% { transform:scale(1.06); box-shadow:0 6px 20px rgba(0,0,0,0.5),0 0 0 12px rgba(200,90,42,0); }
      }
    </style>
  `;
  return el;
}
