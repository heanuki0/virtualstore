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
  /** Active waypoint id. `null`/undefined = main view (panorama.equirect or variant). */
  activeWaypointId?: string | null;
  onHotspotClick?: (h: Hotspot) => void;
  /** Called when a waypoint pin is clicked (to switch camera position). */
  onWaypointClick?: (waypointId: string) => void;
  /** Called to return to main view from a waypoint (e.g. back button). */
  onReturnMain?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  sofa: '소파',
  table: '테이블',
  light: '조명',
  rug: '러그',
  object: '소품',
};

export function MarzipanoView({
  room,
  equirectOverride,
  activeWaypointId,
  onHotspotClick,
  onWaypointClick,
  onReturnMain,
}: MarzipanoViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onClickRef = useRef(onHotspotClick);
  onClickRef.current = onHotspotClick;
  const onWpClickRef = useRef(onWaypointClick);
  onWpClickRef.current = onWaypointClick;

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

  // Waypoint wins over variant override when active (close-up shot), otherwise
  // the variant (day/sunset/night) decides the main-view image.
  const waypoint = activeWaypointId
    ? room.waypoints?.find((w) => w.id === activeWaypointId)
    : undefined;
  const effectiveEquirect = waypoint
    ? waypoint.equirect
    : equirectOverride ?? subscribedVariantUrl ?? room.panorama?.equirect;

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

      // Only show furniture hotspots on main view.
      // In waypoint close-ups we still show them — they're often more accessible there.
      for (const h of room.hotspots) {
        const el = createHotspotEl(h);
        el.addEventListener('click', () => onClickRef.current?.(h));
        scene.hotspotContainer().createHotspot(el, {
          yaw: (h.yaw * Math.PI) / 180,
          pitch: (h.pitch * Math.PI) / 180,
        });
      }

      // Waypoint pins (only on main view, not when inside a waypoint)
      if (!activeWaypointId) {
        for (const w of room.waypoints ?? []) {
          const el = createWaypointEl(w.label);
          el.addEventListener('click', () => onWpClickRef.current?.(w.id));
          scene.hotspotContainer().createHotspot(el, {
            yaw: (w.yaw * Math.PI) / 180,
            pitch: (w.pitch * Math.PI) / 180,
          });
        }
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
  }, [room.id, effectiveEquirect, activeWaypointId]);

  return (
    <div class="absolute inset-0">
      <div
        ref={ref}
        class="absolute inset-0 bg-conran-black"
        aria-label={`${room.name} 파노라마 뷰`}
      />
      {activeWaypointId && onReturnMain && (
        <button
          onClick={onReturnMain}
          class="absolute top-6 right-6 z-20 px-4 py-2 rounded-sm text-xs font-semibold tracking-wider uppercase text-white hover:bg-conran-accent transition"
          style={{
            background: 'rgba(10,9,8,0.85)',
            border: '1px solid rgba(184,147,90,0.5)',
            backdropFilter: 'blur(6px)',
          }}
        >
          ← 전체 뷰로 돌아가기
        </button>
      )}
    </div>
  );
}

function createWaypointEl(label: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'waypoint-pin';
  el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);cursor:pointer;';
  el.innerHTML = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:44px;height:44px;border-radius:50%;
        background:rgba(90,122,191,0.88);
        border:3px solid #fff;
        box-shadow:0 6px 22px rgba(0,0,0,0.55);
        display:flex;align-items:center;justify-content:center;
        animation:wpPulse 2.4s ease-in-out infinite;
        font-size:20px;
      ">👁</div>
      <div style="
        margin-top:8px;padding:4px 12px;
        background:rgba(10,10,10,0.88);color:#fff;
        font-size:11px;font-weight:600;letter-spacing:0.04em;
        border-radius:2px;white-space:nowrap;
        border:1px solid rgba(184,147,90,0.45);
        pointer-events:none;
      ">${label}</div>
    </div>
    <style>
      @keyframes wpPulse {
        0%,100% { transform:scale(1); box-shadow:0 6px 22px rgba(0,0,0,0.55),0 0 0 0 rgba(90,122,191,0.5); }
        50%     { transform:scale(1.08); box-shadow:0 6px 22px rgba(0,0,0,0.55),0 0 0 14px rgba(90,122,191,0); }
      }
    </style>
  `;
  return el;
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
