import { useEffect, useState } from 'preact/hooks';

/**
 * Cinematic scene-to-scene transition: two walnut doors part ways to reveal
 * the next scene's panorama. Purely presentational — the caller controls the
 * trigger (`active`) and handles routing after `onComplete`.
 *
 * Timeline (≈1.6 s total):
 *   0.00 s  doors closed, glow seam appears in the center
 *   0.10 s  background preview begins fading in behind the doors
 *   0.30 s  doors start parting (cubic-bezier ease-in-out)
 *   1.20 s  doors fully off-screen, background fully visible
 *   1.50 s  entire overlay fades out
 *   1.60 s  onComplete fires → caller routes to next scene
 */
export interface DoorTransitionProps {
  active: boolean;
  /** URL of the preview image shown behind the doors as they open. */
  previewUrl: string;
  onComplete?: () => void;
}

export function DoorTransition({ active, previewUrl, onComplete }: DoorTransitionProps) {
  const [phase, setPhase] = useState<'idle' | 'opening' | 'done'>('idle');

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return;
    }
    setPhase('idle');
    // next tick → add the "opening" class so CSS transition triggers
    const t1 = window.setTimeout(() => setPhase('opening'), 60);
    const t2 = window.setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 1600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [active, onComplete]);

  if (!active || phase === 'done') return null;

  const opening = phase === 'opening';

  return (
    <div
      class="door-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Preview image behind the doors */}
      <div
        class="door-bg"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('${previewUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: opening ? 1 : 0,
          transform: opening ? 'scale(1)' : 'scale(1.08)',
          transition: 'opacity 1.4s ease-out 0.1s, transform 1.6s ease-out',
          filter: 'brightness(0.85)',
        }}
      />

      {/* Left door */}
      <div
        class="door-leaf door-left"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '50%',
          transform: opening ? 'translateX(-102%)' : 'translateX(0)',
          transition: 'transform 1.2s cubic-bezier(0.65,0.02,0.25,1)',
          background: `
            linear-gradient(90deg, rgba(0,0,0,0.6) 0%, transparent 3%, transparent 97%, rgba(255,232,180,0.35) 100%),
            linear-gradient(180deg, #2a1e14 0%, #3e2a1c 20%, #4a3422 50%, #3e2a1c 80%, #22160c 100%),
            repeating-linear-gradient(180deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 7px)
          `,
          boxShadow: 'inset -4px 0 12px rgba(0,0,0,0.6)',
          willChange: 'transform',
        }}
      >
        <DoorPanel side="left" />
      </div>

      {/* Right door */}
      <div
        class="door-leaf door-right"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '50%',
          transform: opening ? 'translateX(102%)' : 'translateX(0)',
          transition: 'transform 1.2s cubic-bezier(0.65,0.02,0.25,1)',
          background: `
            linear-gradient(90deg, rgba(255,232,180,0.35) 0%, transparent 3%, transparent 97%, rgba(0,0,0,0.6) 100%),
            linear-gradient(180deg, #2a1e14 0%, #3e2a1c 20%, #4a3422 50%, #3e2a1c 80%, #22160c 100%),
            repeating-linear-gradient(180deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 7px)
          `,
          boxShadow: 'inset 4px 0 12px rgba(0,0,0,0.6)',
          willChange: 'transform',
        }}
      >
        <DoorPanel side="right" />
      </div>

      {/* Central seam glow — grows before the doors part */}
      <div
        class="door-seam"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: opening ? '30vw' : '6px',
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse at center,
            rgba(255,233,196,0.95) 0%,
            rgba(255,210,150,0.55) 25%,
            rgba(255,180,90,0.15) 55%,
            transparent 80%)`,
          filter: 'blur(10px)',
          transition: 'width 1.2s cubic-bezier(0.65,0.02,0.25,1), opacity 0.6s ease-out 0.8s',
          opacity: opening ? 0 : 1,
          mixBlendMode: 'screen',
        }}
      />

      {/* Final overlay fade (hands off to the Gate scene cleanly) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#000',
          opacity: opening ? 0 : 0.2,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function DoorPanel({ side }: { side: 'left' | 'right' }) {
  const handleRight = side === 'left' ? '12px' : 'auto';
  const handleLeft = side === 'right' ? '12px' : 'auto';
  return (
    <>
      {/* Rectangular inner frame */}
      <div
        style={{
          position: 'absolute',
          inset: '48px 60px',
          border: '1px solid rgba(184,147,90,0.28)',
          boxShadow: 'inset 0 0 2px rgba(184,147,90,0.18), inset 0 1px 0 rgba(255,232,180,0.08)',
        }}
      />
      {/* Inset decorative panels (upper + lower) */}
      <div
        style={{
          position: 'absolute',
          top: '88px',
          bottom: '52%',
          left: '96px',
          right: '96px',
          border: '1px solid rgba(184,147,90,0.35)',
          background:
            'linear-gradient(180deg, rgba(255,232,180,0.06) 0%, rgba(0,0,0,0.12) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '52%',
          bottom: '88px',
          left: '96px',
          right: '96px',
          border: '1px solid rgba(184,147,90,0.35)',
          background:
            'linear-gradient(180deg, rgba(255,232,180,0.06) 0%, rgba(0,0,0,0.12) 100%)',
        }}
      />
      {/* Brass handle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: handleRight,
          left: handleLeft,
          width: '14px',
          height: '68px',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(180deg, #d8b472 0%, #a8844a 50%, #7a5a28 100%)',
          borderRadius: '4px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,245,210,0.6)',
        }}
      />
    </>
  );
}
