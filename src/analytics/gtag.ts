/**
 * GA4 wrapper. Safe to call before gtag loads (no-op until ready).
 * Event schema is defined in the tech spec §8-6.
 */

let ready = false;

export function initAnalytics(): void {
  const id = import.meta.env.VITE_GA4_ID;
  if (!id) {
    // eslint-disable-next-line no-console
    console.info('[analytics] VITE_GA4_ID not set — events will be logged only.');
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: true });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  ready = true;
}

export function track(event: string, params?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[track]', event, params ?? {});
  }
  if (!ready || !window.gtag) return;
  window.gtag('event', event, params ?? {});
}
