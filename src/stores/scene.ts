import { signal } from '@preact/signals';
import { track } from '../analytics/gtag';

export type SceneId =
  | 'exterior'
  | 'gate'
  | 'customize'
  | 'gallery'
  | `roomset/${string}`; // parametric

export const currentScene = signal<SceneId>('gate');

const LABELS: Record<string, string> = {
  exterior: '외관',
  gate: '진입 선택',
  customize: '컨설팅 제안 (커스터마이즈)',
  gallery: '전시형 · 컨셉 룸셋',
  roomset: '룸셋 상세',
};

export function sceneLabel(id: SceneId): string {
  const [head] = id.split('/');
  return LABELS[head] ?? id;
}

export function goScene(id: SceneId): void {
  if (currentScene.value === id) return;
  currentScene.value = id;
  track('scene_view', { scene_id: id });
  // Keep hash in sync so back/forward works and links are shareable.
  const wanted = `#/${id}`;
  if (location.hash !== wanted) {
    history.pushState({ scene: id }, '', wanted);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
