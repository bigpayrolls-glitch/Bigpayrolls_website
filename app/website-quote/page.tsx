import type { Metadata } from 'next';
import CookieBanner from '@/components/CookieBanner';
import QuoteForm from '@/components/QuoteForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Business website from ₹6,999 – ready in 7 days',
  description: 'Get a mobile-friendly business website from Big Payrolls, ready in 7 days. Free discovery call and a clear quote. Shops, restaurants, clinics, startups and services.',
  alternates: { canonical: '/website-quote/' },
  openGraph: {
    title: 'Business website from ₹6,999 – ready in 7 days',
    description: 'Free discovery call. Clear quote. Pay and track online.',
    url: 'https://bigpayrolls.com/website-quote/',
    images: ['/logo-stacked.png'],
  },
};

const STEPS = [
  { t: 'Tell us', d: 'What your business does and what you need.' },
  { t: 'Free call', d: 'We understand your needs on a quick call.' },
  { t: 'Quote', d: 'A clear price and timeline. No surprises.' },
  { t: 'Pay & track', d: 'Pay the advance online and follow progress.' },
];

const POINTS = ['Looks great on mobile', 'WhatsApp button and Google Maps', 'Help with domain and hosting'];

/** Simple drawn previews (no image downloads) so the page stays fast on mobile data. */
function Sample({ kind }: { kind: 'shop' | 'restaurant' | 'clinic' }) {
  const theme = {
    shop: { label: 'Clothing shop', bar: '#1F3A5F', accent: '#F4B740', tiles: ['#F6D9C4', '#CFE3F2', '#E8DDF6'] },
    restaurant: { label: 'Restaurant', bar: '#7A2E12', accent: '#F9A11B', tiles: ['#F7E1C6', '#F3CFA6', '#EAD7BE'] },
    clinic: { label: 'Clinic', bar: '#0B6673', accent: '#37B6A5', tiles: ['#D9F0EE', '#E4EEF8', '#E6F4E1'] },
  }[kind];
  return (
    <figure className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-2xl border border-sand bg-white shadow-[0_12px_30px_-20px_rgba(60,30,0,0.35)]" aria-hidden="true">
        <div className="flex items-center gap-1 bg-stone px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-[#e9a49b]" /><span className="h-2 w-2 rounded-full bg-[#ecd08f]" /><span className="h-2 w-2 rounded-full bg-[#a9d6a5]" />
        </div>
        <div className="flex items-center justify-between px-3 py-2.5" style={{ background: theme.bar }}>
          <span className="h-2.5 w-16 rounded-full bg-white/80" />
          <span className="h-5 w-12 rounded-full" style={{ background: theme.accent }} />
        </div>
        <div className="flex flex-col gap-2 p-3">
          <span className="h-3 w-3/4 rounded-full bg-ink/80" />
          <span className="h-2 w-1/2 rounded-full bg-ink/25" />
          <div className="mt-1 grid grid-cols-3 gap-1.5">
            {theme.tiles.map((c) => <span key={c} className="h-12 rounded-lg" style={{ background: c }} />)}
          </div>
          <span className="mt-1 h-6 w-28 rounded-full bg-[#25D366]/90" />
        </div>
      </div>
      <figcaption className="text-center text-[13px] font-semibold text-muted">{theme.label}</figcaption>
    </figure>
  );
}

export default function WebsiteQuotePage() {
  const wa = site.whatsapp.replace(/\D/g, '');
  return (
    <>
      <CookieBanner />
      <header className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 pt-4 sm:px-6">
        <a href="/" aria-label="Big Payrolls home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal-sm.webp" alt="Big Payrolls Solution Private Limited" width={180} height={40} className="h-9 w-auto sm:h-10" />
        </a>
        {wa && (
          <a href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}?text=${encodeURIComponent('Hi, I want a quote for a business website')}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border-[1.5px] border-[#d6d0c5] bg-white px-3.5 text-sm font-semibold">
            WhatsApp us
          </a>
        )}
      </header>

      <main className="mx-auto grid max-w-[1100px] gap-8 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[1fr_440px] lg:items-start lg:gap-12 lg:pt-12">
        <section className="flex flex-col gap-3.5 sm:gap-5">
          <span className="self-start rounded-full bg-peach px-3 py-1 text-[13px] font-semibold text-brand-dark">Website building by Big Payrolls</span>
          <h1 className="font-display text-[30px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Business website from <span className="text-brand-dark">₹6,999</span> – ready in 7 days.
          </h1>
          <p className="text-lg font-semibold">Free discovery call.</p>
          <ul className="flex flex-col gap-1.5 text-[15px]">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink text-white">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
                </span>
                {p}
              </li>
            ))}
          </ul>

          <ol className="mt-2 hidden gap-2.5 rounded-3xl bg-ink p-4 text-white lg:grid">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#FDB813] to-[#F7931E] font-display text-sm font-bold text-ink">{i + 1}</span>
                <span className="flex flex-col gap-0.5"><span className="text-[15px] font-semibold">{s.t}</span><span className="text-[13px] text-white/65">{s.d}</span></span>
              </li>
            ))}
          </ol>
        </section>

        <section id="quote" aria-labelledby="quote-title" className="relative rounded-[28px] border border-sand bg-white p-5 shadow-[0_2px_6px_rgba(60,30,0,0.05),0_30px_60px_-30px_rgba(120,60,0,0.25)] sm:p-7">
          <h2 id="quote-title" className="mb-4 font-display text-2xl font-bold tracking-[-0.02em]">Get your free quote</h2>
          <QuoteForm />
        </section>

        <section aria-labelledby="how-title" className="lg:hidden">
          <h2 id="how-title" className="mb-3 font-display text-xl font-bold">How it works</h2>
          <ol className="grid gap-2.5 rounded-3xl bg-ink p-4 text-white">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#FDB813] to-[#F7931E] font-display text-sm font-bold text-ink">{i + 1}</span>
                <span className="flex flex-col gap-0.5"><span className="text-[15px] font-semibold">{s.t}</span><span className="text-[13px] text-white/65">{s.d}</span></span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="samples-title" className="lg:col-span-2">
          <h2 id="samples-title" className="mb-1 font-display text-xl font-bold sm:text-2xl">Websites made for your kind of business</h2>
          <p className="mb-4 text-[15px] text-muted">Sample layouts. Yours is designed around your business, photos and colours.</p>
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            <Sample kind="shop" />
            <Sample kind="restaurant" />
            <Sample kind="clinic" />
          </div>
          <a href="#quote" className="mt-6 flex h-13 items-center justify-center rounded-full bg-ink py-3.5 text-base font-semibold text-white sm:mx-auto sm:w-80">Get my free quote</a>
        </section>
      </main>

      <footer className="border-t border-sand px-4 py-6 text-center text-[13px] text-muted">
        <p>{site.legalName} · CIN {site.cin}</p>
        <p className="mt-1"><a href="/terms/" className="underline">Terms</a> · <a href="/privacy/" className="underline">Privacy</a> · <a href="/refund/" className="underline">Refunds</a></p>
      </footer>
    </>
  );
}
