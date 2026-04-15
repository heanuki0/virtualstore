/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA4_ID: string;
  readonly VITE_LOTTE_BASE: string;
  readonly VITE_LOTTE_CONRAN_CATEGORY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Marzipano has no official TypeScript types. Declare the pieces we use.
declare module 'marzipano' {
  export class Viewer {
    constructor(element: HTMLElement, opts?: Record<string, unknown>);
    createScene(opts: Record<string, unknown>): Scene;
    destroy(): void;
  }
  export class Scene {
    switchTo(): void;
    hotspotContainer(): HotspotContainer;
  }
  export class HotspotContainer {
    createHotspot(element: HTMLElement, coords: { yaw: number; pitch: number }): unknown;
  }
  export class ImageUrlSource {
    static fromString(url: string, opts?: Record<string, unknown>): ImageUrlSource;
  }
  export class CubeGeometry {
    constructor(levels: Array<{ tileSize: number; size: number }>);
  }
  export class EquirectGeometry {
    constructor(levels: Array<{ width: number }>);
  }
  export class RectilinearView {
    constructor(params?: Record<string, number>, limiter?: unknown);
  }
  export namespace RectilinearView {
    namespace limit {
      function traditional(maxResolution: number, maxVFov: number): unknown;
    }
  }
}

// Minimal gtag typing
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export {};
