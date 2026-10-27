'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AdminShell, { StatusBadge } from '@/components/AdminShell';
import { listAllRequests } from '@/lib/admin';
import { paidTotal, type ServiceRequest } from '@/lib/data';
import { ALL_STATUSES, INDUSTRIES, SERVICES, statusLabel, statusTone } from '@/lib/catalog';
import { fmtDate, inr } from '@/lib/format';

const svcName = (id: string) => SERVICES.find((s) => s.id === id)?.t ?? id;
const indName = (id: string) => INDUSTRIES.find((s) => s.id === id)?.t ?? id;

export default function AdminHome() {
  return <AdminShell>{({ name }) => <RequestsBoard name={name} />}</AdminShell>;
}

function RequestsBoard({ name }: { name: string }) {
  const [rows, setRows] = useState<ServiceRequest[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('open');
  const [q, setQ] = useState('');

  const load = () => {
    setError('');
    listAllRequests()
      .then(setRows)
      .catch(() => setError('Could not load requests. Make sure your account role is "admin" and the latest security rules are published.'));
  };
  useEffect(load, []);

  const stats = useMemo(() => {
    const r = rows ?? [];
    const count = (ids: string[]) => r.filter((x) => ids.includes(x.status)).length;
    const toVerify = r.filter((x) => (x.paymentClaims ?? []).some((c) => !c.verified && !c.rejected)).length;
    return [
      { label: 'New requests', value: count(['submitted']), hint: 'Need a call', filter: 'submitted', color: '#F9A11B', bg: '#FFF4E2' },
      { label: 'Calls scheduled', value: count(['call_scheduled']), hint: 'Prepare quotes', filter: 'call_scheduled', color: '#0369A1', bg: '#E0F2FE' },
      { label: 'Waiting on client', value: count(['quote_sent', 'changes_requested', 'quote_accepted']), hint: 'Quote / payment', filter: 'waiting', color: '#6D28D9', bg: '#EDE9FE' },
      { label: 'Payments to verify', value: toVerify, hint: 'Client says paid', filter: 'verify', color: '#BE123C', bg: '#FFE4E6' },
      { label: 'In progress', value: count(['advance_paid', 'in_progress']), hint: 'Active projects', filter: 'active', color: '#C2410C', bg: '#FFEDD5' },
      { label: 'Received', value: inr(r.reduce((s, x) => s + paidTotal(x), 0)), hint: 'All payments', filter: 'paid', color: '#15803D', bg: '#DCFCE7' },
    ];
  }, [rows]);

  const groups: Record<string, string[]> = {
    open: ['submitted', 'call_scheduled', 'quote_sent', 'changes_requested', 'quote_accepted', 'advance_paid', 'in_progress'],
    waiting: ['quote_sent', 'changes_requested', 'quote_accepted'],
    active: ['advance_paid', 'in_progress'],
  };

  const visible = (rows ?? []).filter((r) => {
    if (filter === 'paid' && paidTotal(r) <= 0) return false;
    if (filter === 'verify' && !(r.paymentClaims ?? []).some((c) => !c.verified && !c.rejected)) return false;
    if (groups[filter] && !groups[filter].includes(r.status)) return false;
    if (!groups[filter] && !['all', 'paid', 'verify'].includes(filter) && r.status !== filter) return false;
    if (q.trim()) {
      const hay = [r.details?.name, r.details?.business, r.details?.phone, r.details?.email, r.details?.city].join(' ').toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  const chips = [
    { id: 'open', label: 'Open' },
    { id: 'all', label: 'All' },
    ...ALL_STATUSES.map((s) => ({ id: s.id as string, label: s.label as string })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Hi {name}</h1>
          <p className="text-muted">Every client request, newest first.</p>
        </div>
        <button type="button" onClick={load} className="h-10 rounded-full border border-sand bg-white px-4 text-sm font-semibold hover:bg-peach">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            aria-pressed={filter === s.filter}
            onClick={() => setFilter(s.filter)}
            className={`relative flex flex-col items-start gap-1 overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(60,30,0,0.04)] transition hover:-translate-y-0.5 ${
              filter === s.filter ? 'border-ink ring-1 ring-ink' : 'border-[#ECE6DC]'
            }`}
          >
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: s.color }} />
            <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-display text-[26px] font-bold leading-tight">{rows ? s.value : '–'}</span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: s.bg, color: s.color }}>
              {s.hint}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-[#ECE6DC] bg-white p-4 shadow-[0_1px_2px_rgba(60,30,0,0.04),0_12px_32px_-24px_rgba(60,30,0,0.25)] sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="search" className="sr-only">Search requests</label>
          <input
            id="search"
            placeholder="Search name, business, phone, email, city"
            className="field field-sm w-full sm:w-[340px]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filter === c.id}
                onClick={() => setFilter(c.id)}
                className={`h-8 rounded-full px-3 text-[13px] font-medium ${filter === c.id ? 'bg-ink text-white' : 'bg-stone hover:bg-[#e8e2d8]'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="text-sm font-medium text-[#B42318]">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-sand text-xs uppercase tracking-wide text-muted">
                <th className="py-2.5 pr-3 font-semibold">Received</th>
                <th className="py-2.5 pr-3 font-semibold">Client</th>
                <th className="py-2.5 pr-3 font-semibold">Needs</th>
                <th className="py-2.5 pr-3 font-semibold">Call</th>
                <th className="py-2.5 pr-3 font-semibold">Status</th>
                <th className="py-2.5 pr-3 text-right font-semibold">Quote</th>
                <th className="py-2.5 text-right font-semibold">Paid</th>
              </tr>
            </thead>
            <tbody>
              {rows === null && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">Loading…</td>
                </tr>
              )}
              {rows !== null && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">No requests here yet.</td>
                </tr>
              )}
              {visible.map((r) => {
                const href = `/admin/request/?id=${r.id}`;
                const paid = paidTotal(r);
                return (
                  <tr key={r.id} className="border-b border-stone align-top last:border-0 hover:bg-cream">
                    <td className="py-3 pr-3 text-muted">
                      <Link href={href} className="block">{fmtDate(r.createdAt) || '—'}</Link>
                    </td>
                    <td className="py-3 pr-3">
                      <Link href={href} className="flex items-center gap-3">
                        <span aria-hidden="true" className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-peach font-display text-[13px] font-bold text-[#7A4300]">
                          {(r.details?.business || r.details?.name || '?').trim().slice(0, 2).toUpperCase()}
                        </span>
                        <span className="flex flex-col">
                          <span className="font-semibold">
                            {r.details?.business || '—'}
                            {(r.paymentClaims ?? []).some((c) => !c.verified && !c.rejected) && (
                              <span className="ml-2 rounded-full bg-[#FFE4E6] px-2 py-0.5 text-[11px] font-bold text-[#BE123C]">Verify payment</span>
                            )}
                          </span>
                          <span className="text-[13px] text-muted">
                            {r.details?.name} · {r.details?.phone}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="max-w-[260px] py-3 pr-3">
                      <Link href={href} className="flex flex-col">
                        <span>{r.services.map(svcName).join(', ')}</span>
                        <span className="text-[13px] text-muted">
                          {indName(r.industry)} · {r.businessType}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-[13px]">
                      {r.call?.dateLabel ? (
                        <>
                          {r.call.dateLabel}, {r.call.slot}
                          <span className="block text-muted">{r.call.mode}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={r.status} label={statusLabel(r.status)} tone={statusTone(r.status)} />
                    </td>
                    <td className="py-3 pr-3 text-right">{r.quote?.total ? inr(r.quote.total) : '—'}</td>
                    <td className="py-3 text-right">{paid ? <span className="font-semibold text-[#166534]">{inr(paid)}</span> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
