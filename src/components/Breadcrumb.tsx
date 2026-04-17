import { currentScene, sceneLabel } from '../stores/scene';
import { activeRoomset } from '../stores/customize';
import { roomsetById } from '../data/loader';

export function Breadcrumb() {
  const scene = currentScene.value;
  const label = sceneLabel(scene);

  // Surface the current roomset name so users know which stage they're in.
  let suffix: string | null = null;
  if (scene === 'customize') suffix = activeRoomset.value?.name ?? null;
  else if (scene.startsWith('roomset/'))
    suffix = roomsetById(scene.slice('roomset/'.length))?.name ?? null;

  return (
    <nav
      class="fixed top-[58px] inset-x-0 z-[var(--z-breadcrumb)] px-6 py-2 bg-gray-50/95 backdrop-blur-md text-gray-500 text-xs tracking-wide border-b border-gray-200"
      aria-label="navigation path"
    >
      <span>롯데백화점몰</span>
      <span class="mx-2.5 text-gray-600">›</span>
      <span>콘란</span>
      <span class="mx-2.5 text-gray-600">›</span>
      <span>콘란 경 하우스</span>
      <span class="mx-2.5 text-gray-600">›</span>
      <span class="text-conran-off font-semibold">{label}</span>
      {suffix && (
        <>
          <span class="mx-2.5 text-gray-600">·</span>
          <span class="text-conran-gold font-semibold">{suffix}</span>
        </>
      )}
    </nav>
  );
}
