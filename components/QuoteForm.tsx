'use client';

import { useEffect, useRef, useState } from 'react';
import { BUSINESS_TYPES, captureUtm, NEEDS, submitLead, validPhone } from '@/lib/leads';
import { track } from '@/lib/pixel';

function Chips({ name, label, options, value, onChange }: { name: string; label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{label} <span className="text-[#B42318]">*</span></legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o;
          return (
            <label
              key={o}
              className={`inline-flex h-11 cursor-pointer items-center rounded-full border-[1.5px] px-4 text-[15px] font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                on ? 'border-ink bg-ink text-white' : 'border-[#d6d0c5] bg-white'
              }`}
            >
              <input type="radio" name={name} value={o} checked={on} onChange={() => onChange(o)} className="sr-only" />
              {o}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function QuoteForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [need, setNeed] = useState('');
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot: people never see or fill this
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    captureUtm();
  }, []);

  useEffect(() => {
    if (!done || !doneRef.current) return;
    doneRef.current.scrollIntoView({ block: 'center' });
    doneRef.current.focus({ preventScroll: true });
  }, [done]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (!validPhone(phone)) return setError('Please enter a valid 10-digit mobile number.');
    if (!businessType) return setError('Please choose your business type.');
    if (!need) return setError('Please choose what you need.');
    if (!agree) return setError('Please accept the Terms and Privacy policy.');
    if (website) return setDone(true); // bot
    setBusy(true);
    try {
      const id = await submitLead({ source: 'website-quote', name, phone, businessType, need, message });
      track('Lead', { content_name: 'website-quote' }, id);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send right now. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="flex flex-col items-center gap-3 py-8 text-center outline-none">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F6EC] text-[#1E7B3E]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
        </span>
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">Thanks! We&apos;ll call you within 24 hours.</h2>
        <p className="max-w-sm text-[15px] text-muted">We&apos;ll understand your business on a free call and send you a clear quote. No payment needed now.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-describedby={error ? 'q-error' : undefined}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-name" className="text-sm font-semibold">Name <span className="text-[#B42318]">*</span></label>
        <input id="q-name" autoComplete="name" className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-phone" className="text-sm font-semibold">Mobile / WhatsApp number <span className="text-[#B42318]">*</span></label>
        <div className="flex">
          <span className="flex h-[3.25rem] items-center rounded-l-[0.875rem] border-[1.5px] border-r-0 border-[#d6d0c5] bg-stone px-3 text-[15px] font-semibold">+91</span>
          <input
            id="q-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10-digit number"
            maxLength={14}
            className="field rounded-l-none"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d +]/g, ''))}
          />
        </div>
      </div>

      <Chips name="businessType" label="Business type" options={BUSINESS_TYPES} value={businessType} onChange={setBusinessType} />
      <Chips name="need" label="What do you need?" options={NEEDS} value={need} onChange={setNeed} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-msg" className="text-sm font-semibold">Anything else? <span className="font-normal text-muted">(optional)</span></label>
        <textarea id="q-msg" rows={3} maxLength={1000} className="field" placeholder="e.g. I have a clothing shop in Jayanagar and want customers to WhatsApp me" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-normal text-muted">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-ink" />
        <span>
          I agree to the <a href="/terms/" target="_blank" className="font-semibold text-ink underline">Terms</a> and{' '}
          <a href="/privacy/" target="_blank" className="font-semibold text-ink underline">Privacy policy</a>.
        </span>
      </label>

      {error && <p id="q-error" role="alert" className="text-sm font-semibold text-[#B42318]">{error}</p>}
      <button type="submit" disabled={busy} className="h-14 rounded-full bg-brand text-[17px] font-bold text-ink shadow-[0_10px_24px_-12px_rgba(249,161,27,0.9)] hover:bg-[#f7931e] disabled:opacity-60">
        {busy ? 'Sending…' : 'Get my free quote'}
      </button>
      <p className="text-center text-[13px] text-muted">No payment now · We call you within 24 hours</p>
    </form>
  );
}
