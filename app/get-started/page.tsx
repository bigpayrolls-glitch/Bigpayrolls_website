'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell, { useClientProfile } from '@/components/AppShell';
import { Check } from '@/components/Icons';
import { createRequest } from '@/lib/data';
import {
  BUDGETS,
  CALL_MODES,
  CALL_SLOTS,
  COMMON_FEATURES,
  INDUSTRIES,
  INDUSTRY_FEATURES,
  SERVICES,
  TIMELINES,
  TYPES,
  nextCallDays,
} from '@/lib/catalog';

const STEPS = ['Service', 'Industry', 'Business type', 'Features', 'Your details', 'Book a call'];

type Details = { name: string; business: string; phone: string; email: string; city: string; website: string; notes: string };

export default function GetStartedPage() {
  const { user, profile, ready } = useClientProfile();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<string[]>([]);
  const [industry, setIndustry] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [d, setD] = useState<Details>({ name: '', business: '', phone: '', email: '', city: '', website: '', notes: '' });
  const [budget, setBudget] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string | null>(null);
  const [date, setDate] = useState<{ iso: string; label: string } | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [mode, setMode] = useState(CALL_MODES[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const days = useMemo(() => nextCallDays(), []);

  // Prefill contact details from the client's profile
  useEffect(() => {
    if (!profile) return;
    setD((x) => ({
      ...x,
      name: x.name || profile.name || '',
      business: x.business || profile.company || '',
      phone: x.phone || profile.phone || '',
      email: x.email || profile.email || '',
    }));
  }, [profile]);

  const featureList = industry ? [...(INDUSTRY_FEATURES[industry] ?? []), ...COMMON_FEATURES] : COMMON_FEATURES;
  const industryObj = INDUSTRIES.find((i) => i.id === industry);
  const toggle = (xs: string[], v: string) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]);
  const go = (n: number) => {
    setError('');
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function next() {
    setError('');
    if (step === 1 && !services.length) return setError('Pick at least one service to continue.');
    if (step === 2 && !industry) return setError('Pick your industry to continue.');
    if (step === 3 && !type) return setError('Pick your business type to continue.');
    if (step === 5) {
      if (!d.name.trim() || !d.business.trim()) return setError('Enter your name and business name.');
      const digits = d.phone.replace(/\D/g, '');
      if (digits.length < 10 || !/^[6-9]\d{9}$/.test(digits.slice(-10))) return setError('Enter a valid 10-digit mobile number.');
    }
    if (step === 6) {
      if (!date || !slot) return setError('Pick a day and a time for the call.');
      if (!user) return setError('Please sign in again to send your request.');
      setSaving(true);
      try {
        await createRequest(user.uid, {
          services,
          industry: industry!,
          businessType: type!,
          features,
          details: { ...d, phone: d.phone.replace(/\D/g, '').slice(-10), name: d.name.trim(), business: d.business.trim() },
          budget,
          timeline,
          call: { date: date.iso, dateLabel: date.label, slot, mode },
        });
        setDone(true);
      } catch {
        setError('Could not send your request. Please check your internet and try again.');
      } finally {
        setSaving(false);
      }
      return;
    }
    go(step + 1);
  }

  const card = (on: boolean) =>
    `flex min-h-[72px] flex-col items-start gap-1 rounded-2xl border-[1.5px] px-4 py-3.5 text-left transition-colors ${
      on ? 'border-ink bg-[#FFF4E0]' : 'border-[#d6d0c5] bg-white hover:border-[#b8ad9c]'
    }`;
  const pill = (on: boolean) =>
    `min-h-11 rounded-full border-[1.5px] px-4 text-sm font-medium ${on ? 'border-ink bg-ink text-white' : 'border-[#d6d0c5] bg-white hover:border-[#b8ad9c]'}`;
  const field = (k: keyof Details) => ({
    value: d[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value }),
  });

  const summary = [
    { k: 'Services', v: SERVICES.filter((s) => services.includes(s.id)).map((s) => s.t).join(', ') },
    { k: 'Industry', v: industryObj?.t },
    { k: 'Business type', v: type },
    { k: 'Features', v: features.join(', ') },
    { k: 'Budget and timeline', v: [budget, timeline].filter(Boolean).join(' · ') },
    { k: 'Call', v: date && slot ? `${date.label}, ${slot} · ${mode}` : '' },
  ];

  if (!ready) {
    return (
      <AppShell>
        <p className="text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-4xl font-bold tracking-[-0.02em]">Tell us what you need</h1>
          <p className="text-muted">A few quick questions, then we call you and send a custom quote. No fixed packages.</p>
        </div>

        {!done && (
          <ol aria-label="Steps" className="flex flex-wrap gap-2">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const cur = n === step;
              const past = n < step;
              return (
                <li
                  key={label}
                  aria-current={cur ? 'step' : undefined}
                  className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[13px] ${
                    cur ? 'border-ink bg-white font-semibold' : 'border-transparent'
                  } ${cur || past ? 'text-ink' : 'text-muted'}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      cur || past ? 'bg-brand text-ink' : 'bg-stone text-muted'
                    }`}
                  >
                    {past ? <Check size={13} /> : n}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>
        )}

        <div className="flex flex-wrap items-start gap-6">
          <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-[28px] border border-sand bg-white p-6 sm:p-8">
            {done ? (
              <div className="flex flex-col items-start gap-4 py-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F6EC] text-[#16803C]">
                  <Check size={28} />
                </span>
                <h2 className="font-display text-3xl font-bold">Request received</h2>
                <p className="max-w-[560px] leading-relaxed text-muted">
                  We will call you on <strong className="text-ink">{date?.label}</strong> at <strong className="text-ink">{slot}</strong> ({mode}).
                  After the call, your custom quote will appear in your dashboard.
                </p>
                <Link href="/dashboard/" className="inline-flex h-12 items-center rounded-full bg-ink px-6 font-semibold text-white">
                  Go to dashboard
                </Link>
              </div>
            ) : (
              <>
                {step === 1 && (
                  <Step title="What service are you looking for?" sub="Pick one or more.">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {SERVICES.map((s) => (
                        <button key={s.id} type="button" aria-pressed={services.includes(s.id)} onClick={() => setServices(toggle(services, s.id))} className={card(services.includes(s.id))}>
                          <span className="text-[15px] font-semibold">{s.t}</span>
                          <span className="text-[13px] text-muted">{s.d}</span>
                        </button>
                      ))}
                    </div>
                  </Step>
                )}

                {step === 2 && (
                  <Step title="Which industry is your business in?" sub="This helps us suggest the right features.">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {INDUSTRIES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          aria-pressed={industry === s.id}
                          onClick={() => {
                            if (industry !== s.id) {
                              setIndustry(s.id);
                              setType(null);
                              setFeatures([]);
                            }
                          }}
                          className={card(industry === s.id)}
                        >
                          <span className="text-[15px] font-semibold">{s.t}</span>
                          <span className="text-[13px] text-muted">{s.d}</span>
                        </button>
                      ))}
                    </div>
                  </Step>
                )}

                {step === 3 && (
                  <Step title={`What type of ${industryObj?.t.toLowerCase() ?? ''} business?`} sub="Pick the closest match.">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(TYPES[industry ?? ''] ?? []).map((t) => (
                        <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={card(type === t)}>
                          <span className="text-[15px] font-semibold">{t}</span>
                        </button>
                      ))}
                    </div>
                  </Step>
                )}

                {step === 4 && (
                  <Step title="Which features do you want?" sub={`Suggested for ${type ?? 'your business'}. Not sure? Skip, we will discuss on the call.`}>
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {featureList.map((f) => {
                        const on = features.includes(f);
                        return (
                          <button
                            key={f}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setFeatures(toggle(features, f))}
                            className={`flex min-h-12 items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left text-sm ${
                              on ? 'border-ink bg-[#FFF4E0]' : 'border-[#d6d0c5] bg-white'
                            }`}
                          >
                            <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-[1.5px] ${on ? 'border-ink bg-ink text-white' : 'border-[#9aa0a6]'}`}>
                              {on && <Check size={12} />}
                            </span>
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  </Step>
                )}

                {step === 5 && (
                  <Step title="Your details" sub="So we can prepare before the call.">
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <Field id="f-name" label="Your name *" {...field('name')} />
                      <Field id="f-biz" label="Business name *" {...field('business')} />
                      <Field id="f-phone" label="Phone / WhatsApp *" type="tel" {...field('phone')} />
                      <Field id="f-email" label="Email" type="email" {...field('email')} />
                      <Field id="f-city" label="City" {...field('city')} />
                      <Field id="f-site" label="Current website (if any)" {...field('website')} />
                    </div>
                    <Choice label="Approximate budget" options={BUDGETS} value={budget} onPick={setBudget} pill={pill} />
                    <Choice label="When do you need it?" options={TIMELINES} value={timeline} onPick={setTimeline} pill={pill} />
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="f-notes" className="label">Anything else we should know?</label>
                      <textarea id="f-notes" rows={3} className="field resize-y" {...field('notes')} />
                    </div>
                  </Step>
                )}

                {step === 6 && (
                  <Step title="Book a free discovery call" sub="About 20 minutes. We understand your needs, then send your quote.">
                    <fieldset className="flex flex-col">
                      <legend className="label mb-2">Pick a day</legend>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        {days.map((x) => (
                          <button key={x.iso} type="button" aria-pressed={date?.iso === x.iso} onClick={() => setDate(x)} className={pill(date?.iso === x.iso)}>
                            {x.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <Choice label="Pick a time (IST)" options={CALL_SLOTS} value={slot} onPick={setSlot} pill={pill} />
                    <Choice label="How should we call?" options={CALL_MODES} value={mode} onPick={(v) => setMode(v)} pill={pill} />
                  </Step>
                )}

                {error && <p role="alert" className="text-sm font-medium text-[#B42318]">{error}</p>}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone pt-4">
                  <div>
                    {step > 1 && (
                      <button type="button" onClick={() => go(step - 1)} className="h-11 rounded-full border-[1.5px] border-[#d6d0c5] bg-white px-5 font-semibold">
                        Back
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={next} disabled={saving} className="h-12 rounded-full bg-ink px-7 font-semibold text-white disabled:opacity-60">
                    {saving ? 'Sending…' : step === 4 && !features.length ? 'Skip for now' : step === 6 ? 'Book my call' : 'Next'}
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-3.5 rounded-[28px] border border-sand bg-white p-6">
            <h2 className="font-display text-lg font-bold">Your request</h2>
            {summary.map((row) => (
              <div key={row.k} className="flex flex-col gap-0.5 border-b border-stone pb-3">
                <span className="text-xs font-semibold text-muted">{row.k}</span>
                <span className="text-sm leading-normal">{row.v || '—'}</span>
              </div>
            ))}
            <p className="text-[13px] leading-normal text-muted">No prices yet. We quote after the call, based on exactly what you need.</p>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted">{sub}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} type={type} className="field" value={value} onChange={onChange} />
    </div>
  );
}

function Choice({
  label,
  options,
  value,
  onPick,
  pill,
}: {
  label: string;
  options: string[];
  value: string | null;
  onPick: (v: string) => void;
  pill: (on: boolean) => string;
}) {
  return (
    <fieldset className="flex flex-col">
      <legend className="label mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value === o} onClick={() => onPick(o)} className={pill(value === o)}>
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
