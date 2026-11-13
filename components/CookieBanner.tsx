'use client';

import { useEffect, useState } from 'react';
import { cookieChoice, loadPixel, META_PIXEL_ID, setCookieChoice } from '@/lib/pixel';

/** Asks once before the Meta Pixel loads. With an earlier "Allow", the Pixel (PageView) loads straight away. */
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    const c = cookieChoice();
    if (c === 'granted') loadPixel();
    else if (!c) setShow(true);
  }, []);

  if (!show) return null;
  const decide = (c: 'granted' | 'denied') => {
    setCookieChoice(c);
    setShow(false);
  };
  return (
    <div role="region" aria-label="Cookie choice" className="border-b border-sand bg-white px-4 py-2 text-[13px] text-muted">
      <div className="mx-auto flex max-w-[1100px] items-center gap-2">
        <p className="min-w-0 flex-1 leading-5">
          We use a Meta cookie to see which of our ads helped you find us.{' '}
          <a href="/privacy/#cookies" className="font-semibold text-ink underline">Learn more</a>
        </p>
        <button type="button" onClick={() => decide('granted')} className="h-8 shrink-0 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white">
          Allow
        </button>
        <button type="button" onClick={() => decide('denied')} className="h-8 shrink-0 rounded-full px-2 text-[13px] font-semibold text-muted hover:bg-stone">
          No thanks
        </button>
      </div>
    </div>
  );
}
