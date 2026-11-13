/**
 * Meta Pixel, loaded only after the visitor allows it in the cookie banner (same approach as
 * pfmitra.co.in). Sends no names, numbers or emails. NEXT_PUBLIC_META_PIXEL_ID overrides the ID;
 * set it to "off" to switch the Pixel and banner off.
 */
const DEFAULT_PIXEL = '1677610107402565';
const envPixel = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '').trim();
export const META_PIXEL_ID = envPixel === 'off' ? '' : envPixel || DEFAULT_PIXEL;

const CONSENT_KEY = 'bp.cookieConsent';
export type CookieChoice = 'granted' | 'denied';

export function cookieChoice(): CookieChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setCookieChoice(c: CookieChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, c);
  } catch {
    /* blocked storage: the choice applies to this page only */
  }
  if (c === 'granted') loadPixel(true);
}

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let loaded = false;

/** Meta's standard loader + PageView, only with an ID and the visitor's permission. */
export function loadPixel(force = false) {
  if (loaded || !META_PIXEL_ID || typeof window === 'undefined') return;
  if (!force && cookieChoice() !== 'granted') return;
  loaded = true;
  const f = function (...args: unknown[]) {
    if (f.callMethod) f.callMethod(...args);
    else f.queue!.push(args);
  } as Fbq;
  f.push = f;
  f.loaded = true;
  f.version = '2.0';
  f.queue = [];
  window.fbq = f;
  window._fbq = f;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  f('init', META_PIXEL_ID);
  f('track', 'PageView');
}

/** Standard events only; never pass personal details here. */
export function track(event: 'Lead' | 'ViewContent', params?: { content_name?: string }, eventID?: string) {
  if (!loaded || !window.fbq) return;
  if (eventID) window.fbq('track', event, params ?? {}, { eventID });
  else window.fbq('track', event, params ?? {});
}
