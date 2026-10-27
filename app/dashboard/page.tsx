'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell, { useClientProfile } from '@/components/AppShell';
import { ArrowRight } from '@/components/Icons';
import { listMyRequests, QUOTE_VISIBLE, respondToQuote, type ServiceRequest } from '@/lib/data';
import { INDUSTRIES, SERVICES, STATUS_FLOW, statusLabel, statusStep, statusTone } from '@/lib/catalog';
import { fmtDate, fmtDateTime, inr } from '@/lib/format';
import PayPanel from '@/components/PayPanel';
import { getSettings, type BusinessSettings } from '@/lib/settings';

const svcName = (id: string) => SERVICES.find((s) => s.id === id)?.t ?? id;
const indName = (id: string) => INDUSTRIES.find((s) => s.id === id)?.t ?? id;

export default function DashboardPage() {
  const { user, profile, ready } = useClientProfile();
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  const load = () => {
    if (!user) {
      setRequests([]);
      return;
    }
    listMyRequests(user.uid)
      .then(setRequests)
      .catch(() => setError('Could not load your requests. Please refresh the page.'));
  };

  useEffect(() => {
    if (ready && user) getSettings().then(setSettings).catch(() => setSettings(null));
  }, [ready, user]);

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  return (
    <AppShell>
      {!ready ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-4xl font-bold tracking-[-0.02em]">Hi {profile?.name?.split(' ')[0] ?? 'there'}</h1>
              <p className="text-muted">{profile?.company ? `${profile.company} · ` : ''}Your requests, quotes and project status.</p>
            </div>
            <Link href="/get-started/" className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-bold text-ink">
              New request <ArrowRight size={16} />
            </Link>
          </div>

          {error && <p role="alert" className="font-medium text-[#B42318]">{error}</p>}

          {requests === null ? (
            <p className="text-muted">Loading your requests…</p>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-[28px] border border-sand bg-white p-8">
              <h2 className="font-display text-2xl font-bold">No requests yet</h2>
              <p className="max-w-[520px] text-muted">
                Tell us what you need and book a free call. Your custom quote will appear here after the call.
              </p>
              <Link href="/get-started/" className="inline-flex h-12 items-center rounded-full bg-ink px-6 font-semibold text-white">
                Start your first request
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {requests.map((r) => (
                <RequestCard key={r.id} r={r} onChange={load} settings={settings} />
              ))}
            </ul>
          )}
        </div>
      )}
    </AppShell>
  );
}

function RequestCard({ r, onChange, settings }: { r: ServiceRequest; onChange: () => void; settings: BusinessSettings | null }) {
  const idx = statusStep(r.status);
  const showQuote = !!r.quote && QUOTE_VISIBLE.includes(r.status) && !!r.quote.sentAt;
  const total = r.quote?.total ?? 0;
  const updates = [...(r.updates ?? [])].sort((a, b) => (b.at?.toMillis?.() ?? 0) - (a.at?.toMillis?.() ?? 0));
  const [showAll, setShowAll] = useState(false);
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function respond(decision: 'accepted' | 'changes_requested') {
    setMsg('');
    if (decision === 'changes_requested' && !note.trim()) return setMsg('Tell us what you would like changed.');
    setBusy(true);
    try {
      await respondToQuote(r.id, decision, note);
      onChange();
    } catch {
      setMsg('Could not send your response. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-5 rounded-[28px] border border-sand bg-white p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-display text-xl font-bold">{r.services.map(svcName).join(', ')}</span>
          <span className="text-sm text-muted">
            {indName(r.industry)} · {r.businessType}
            {r.createdAt ? ` · Sent ${fmtDate(r.createdAt)}` : ''}
          </span>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusTone(r.status)}`}>{statusLabel(r.status)}</span>
      </div>

      {r.status !== 'cancelled' && (
        <ol aria-label="Progress" className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {STATUS_FLOW.map((s, i) => (
            <li key={s.id} className="flex flex-col gap-1.5">
              <span className={`h-1.5 rounded-full ${i <= idx ? 'bg-brand' : 'bg-stone'}`} />
              <span className={`text-xs ${i <= idx ? 'font-semibold text-ink' : 'text-muted'}`}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {r.call?.dateLabel && (
        <p className="text-sm text-muted">
          Discovery call: <span className="font-semibold text-ink">{r.call.dateLabel}, {r.call.slot}</span> ({r.call.mode})
        </p>
      )}

      {updates.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-cream p-4">
          <span className="text-sm font-semibold">Updates from Big Payrolls</span>
          <ol className="flex flex-col gap-2.5">
            {(showAll ? updates : updates.slice(0, 3)).map((u, i) => (
              <li key={i} className="flex flex-col gap-0.5 border-l-2 border-brand pl-3 text-sm">
                <span className="text-xs text-muted">{fmtDateTime(u.at)}</span>
                <span>{u.text}</span>
              </li>
            ))}
          </ol>
          {updates.length > 3 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="self-start text-sm font-semibold underline underline-offset-2">
              {showAll ? 'Show less' : `Show all ${updates.length} updates`}
            </button>
          )}
        </div>
      )}

      {showQuote && r.quote && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sand p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-lg font-bold">Your quote</span>
            {r.quote.sentAt && <span className="text-xs text-muted">Sent {fmtDate(r.quote.sentAt)}</span>}
          </div>
          {r.quote.items.map((it, i) => (
            <div key={i} className="flex justify-between gap-4 text-sm">
              <span>{it.label}</span>
              <span>{inr(it.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-sand pt-3 font-bold">
            <span>Total</span>
            <span>{inr(total)}</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <span>
              Advance ({r.quote.advancePercent}%): <strong className="text-ink">{inr((total * r.quote.advancePercent) / 100)}</strong>
            </span>
            {r.quote.timeline && (
              <span>
                Timeline: <strong className="text-ink">{r.quote.timeline}</strong>
              </span>
            )}
          </div>
          {r.quote.notes && <p className="whitespace-pre-line rounded-xl bg-cream p-3 text-sm">{r.quote.notes}</p>}

          {r.status === 'quote_sent' && (
            <div className="flex flex-col gap-3 border-t border-sand pt-4">
              {asking && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`chg-${r.id}`} className="label">What would you like changed?</label>
                  <textarea id={`chg-${r.id}`} rows={3} className="field resize-y text-[15px]" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              )}
              {msg && <p role="alert" className="text-sm font-medium text-[#B42318]">{msg}</p>}
              <div className="flex flex-wrap gap-2">
                {!asking ? (
                  <>
                    <button type="button" disabled={busy} onClick={() => respond('accepted')} className="h-11 rounded-full bg-brand px-6 font-bold text-ink disabled:opacity-60">
                      {busy ? 'Sending…' : 'Accept quote'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => setAsking(true)} className="h-11 rounded-full border border-sand bg-white px-5 font-semibold">
                      Ask for changes
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" disabled={busy} onClick={() => respond('changes_requested')} className="h-11 rounded-full bg-ink px-6 font-semibold text-white disabled:opacity-60">
                      {busy ? 'Sending…' : 'Send request'}
                    </button>
                    <button type="button" onClick={() => setAsking(false)} className="h-11 rounded-full px-4 font-semibold text-muted">
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {r.status === 'changes_requested' && (
            <p className="rounded-xl bg-[#FFF1F2] p-3 text-sm">We have your change request and will send a revised quote soon.</p>
          )}

        </div>
      )}

      {['quote_accepted', 'advance_paid', 'in_progress', 'live', 'completed'].includes(r.status) && (
        <PayPanel r={r} settings={settings} onChange={onChange} />
      )}
    </li>
  );
}
