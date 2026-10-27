'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell, { useClientProfile } from '@/components/AppShell';
import { ArrowRight } from '@/components/Icons';
import { listMyRequests, type ServiceRequest } from '@/lib/data';
import { INDUSTRIES, SERVICES, STATUS_FLOW, statusLabel } from '@/lib/catalog';

const svcName = (id: string) => SERVICES.find((s) => s.id === id)?.t ?? id;
const indName = (id: string) => INDUSTRIES.find((s) => s.id === id)?.t ?? id;
const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function DashboardPage() {
  const { user, profile, ready } = useClientProfile();
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setRequests([]);
      return;
    }
    listMyRequests(user.uid)
      .then(setRequests)
      .catch(() => setError('Could not load your requests. Please refresh the page.'));
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
                <RequestCard key={r.id} r={r} />
              ))}
            </ul>
          )}
        </div>
      )}
    </AppShell>
  );
}

function RequestCard({ r }: { r: ServiceRequest }) {
  const idx = STATUS_FLOW.findIndex((s) => s.id === r.status);
  const created = r.createdAt?.toDate?.().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <li className="flex flex-col gap-5 rounded-[28px] border border-sand bg-white p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-display text-xl font-bold">{r.services.map(svcName).join(', ')}</span>
          <span className="text-sm text-muted">
            {indName(r.industry)} · {r.businessType}
            {created ? ` · Sent ${created}` : ''}
          </span>
        </div>
        <span className="rounded-full bg-peach px-3 py-1.5 text-sm font-semibold text-[#7A4300]">{statusLabel(r.status)}</span>
      </div>

      <ol aria-label="Progress" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STATUS_FLOW.map((s, i) => (
          <li key={s.id} className="flex flex-col gap-1.5">
            <span className={`h-1.5 rounded-full ${i <= idx ? 'bg-brand' : 'bg-stone'}`} />
            <span className={`text-xs ${i <= idx ? 'font-semibold text-ink' : 'text-muted'}`}>{s.label}</span>
          </li>
        ))}
      </ol>

      {r.call?.dateLabel && (
        <p className="text-sm text-muted">
          Discovery call: <span className="font-semibold text-ink">{r.call.dateLabel}, {r.call.slot}</span> ({r.call.mode})
        </p>
      )}

      {r.quote && (
        <div className="flex flex-col gap-3 rounded-2xl bg-cream p-5">
          <span className="font-semibold">Your quote</span>
          {r.quote.items.map((it) => (
            <div key={it.label} className="flex justify-between gap-4 text-sm">
              <span>{it.label}</span>
              <span>{inr(it.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-sand pt-3 font-bold">
            <span>Total</span>
            <span>{inr(r.quote.total)}</span>
          </div>
          <p className="text-sm text-muted">Online acceptance and payment are coming soon. We will contact you to confirm.</p>
        </div>
      )}
    </li>
  );
}
