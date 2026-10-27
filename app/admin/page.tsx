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
    return [
      { label: 'New requests', value: count(['submitted']), hint: 'Need a call', filter: 'submitted' },
      { label: 'Calls scheduled', value: count(['call_scheduled']), hint: 'Prepare quotes', filter: 'call_scheduled' },
      { label: 'Waiting on client', value: count(['quote_sent', 'changes_requested', 'quote_accepted']), hint: 'Quote / payment', filter: 'waiting' },
      { label: 'In progress', value: count(['advance_paid', 'in_progress']), hint: 'Active projects', filter: 'active' },
      { label: 'Payments received', value: inr(r.reduce((s, x) => s + paidTotal(x), 0)), hint: 'All time', filter: 'paid' },
    ];
  }, [rows]);

  const groups: Record<string, string[]> = {
    open: ['submitted', 'call_scheduled', 'quote_sent', 'changes_requested', 'quote_accepted', 'advance_paid', 'in_progress'],
    waiting: ['quote_sent', 'changes_requested', 'quote_accepted'],
    active: ['advance_paid', 'in_progress'],
  };

  const visible = (rows ?? []).filter((r) => {
    if (filter === 'paid' && paidTotal(r) <= 0) return false;
    if (groups[filter] && !groups[filter].includes(r.status)) return false;
    if (!groups[filter] && filter !== 'all' && filter !== 'paid' && r.status !== filter) return false;
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setFilter(s.filter)}
            className={`flex flex-col items-start gap-1 rounded-2xl border bg-white p-4 text-left transition-colors ${
              filter === s.filter ? 'border-ink' : 'border-sand hover:border-[#c9bca6]'
            }`}
          >
            <span className="text-[13px] font-medium text-muted">{s.label}</span>
            <span className="font-display text-2xl font-bold">{rows ? s.value : '–'}</span>
            <span className="text-xs text-soft">{s.hint}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-sand bg-white p-4 sm:p-5">
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
                      <Link href={href} className="flex flex-col">
                        <span className="font-semibold">{r.details?.business || '—'}</span>
                        <span className="text-[13px] text-muted">
                          {r.details?.name} · {r.details?.phone}
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
