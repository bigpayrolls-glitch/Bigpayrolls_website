'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { listLeads, updateLead, type LeadRow } from '@/lib/admin';
import { LEAD_STATUSES } from '@/lib/leads';
import { INTERESTS } from '@/lib/catalog';
import { waLink } from '@/lib/format';

const STATUS_LABEL: Record<string, string> = { new: 'New', contacted: 'Called', quoted: 'Quote sent', won: 'Won', lost: 'Not interested' };
const STATUS_STYLE: Record<string, string> = {
  new: 'bg-[#FFF1D6] text-[#8A4B00]',
  contacted: 'bg-[#E4EEF8] text-[#1F3A5F]',
  quoted: 'bg-[#EFE7FA] text-[#5B3A8C]',
  won: 'bg-[#E7F6EC] text-[#1E7B3E]',
  lost: 'bg-stone text-muted',
};
const interestName = (id: string) => INTERESTS.find((i) => i.id === id)?.t ?? id;

function when(l: LeadRow) {
  const d = l.createdAt?.toDate?.();
  return d ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';
}

function cameFrom(l: LeadRow) {
  const u = l.utm ?? {};
  if (u.source || u.campaign) return [u.source, u.medium, u.campaign, u.content].filter(Boolean).join(' · ');
  if (u.fbclid) return 'Meta ad click';
  return u.referrer ? `Link from ${u.referrer}` : 'Direct';
}

function csv(rows: LeadRow[]) {
  const head = ['Time', 'Name', 'Mobile', 'Business', 'Needs', 'Message', 'Company', 'Email', 'Status', 'Note', 'Form', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((l) =>
    [when(l), l.name, l.phone, l.businessType, l.need || (l.interests ?? []).map(interestName).join('; '), l.message, l.company, l.email, STATUS_LABEL[l.status] ?? l.status, l.note, l.source, l.utm?.source, l.utm?.medium, l.utm?.campaign, l.utm?.content]
      .map(cell)
      .join(','),
  );
  const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminLeads() {
  return <AdminShell>{() => <Leads />}</AdminShell>;
}

function Leads() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [filter, setFilter] = useState('open');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    listLeads()
      .then(setLeads)
      .catch(() => setError('Could not load enquiries. Make sure your account role is "admin" and the latest security rules are published.'));
  }, []);

  async function change(l: LeadRow, patch: { status?: string; note?: string }) {
    setError('');
    try {
      await updateLead(l.id, patch);
      setLeads((xs) => (xs ?? []).map((x) => (x.id === l.id ? { ...x, ...patch } : x)));
    } catch {
      setError('Could not save. Please try again.');
    }
  }

  const all = leads ?? [];
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, all.filter((l) => l.status === s).length]));
  const visible = all.filter((l) => {
    if (filter === 'open' && (l.status === 'won' || l.status === 'lost')) return false;
    if (filter !== 'open' && filter !== 'all' && l.status !== filter) return false;
    if (!q.trim()) return true;
    return [l.name, l.phone, l.businessType, l.need, l.message, l.company, l.email, l.utm?.campaign].join(' ').toLowerCase().includes(q.trim().toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Enquiries</h1>
          <p className="text-muted">From the website quote page and quick sign-ups. Call new enquiries within 24 hours.</p>
        </div>
        <button type="button" onClick={() => csv(visible)} disabled={!visible.length} className="h-10 rounded-full border-[1.5px] border-[#d6d0c5] bg-white px-4 text-sm font-semibold disabled:opacity-50">
          Download CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[['open', `Open (${(counts.new ?? 0) + (counts.contacted ?? 0) + (counts.quoted ?? 0)})`], ...LEAD_STATUSES.map((s) => [s, `${STATUS_LABEL[s]} (${counts[s] ?? 0})`]), ['all', `All (${all.length})`]].map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`h-9 rounded-full px-3.5 text-sm font-semibold ${filter === k ? 'bg-ink text-white' : 'border border-sand bg-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-sand bg-white p-4 sm:p-5">
        <label htmlFor="lsearch" className="sr-only">Search enquiries</label>
        <input id="lsearch" placeholder="Search name, mobile, business, campaign" className="field field-sm max-w-[380px]" value={q} onChange={(e) => setQ(e.target.value)} />
        {error && <p role="alert" className="text-sm font-medium text-[#B42318]">{error}</p>}
        {leads === null && !error && <p className="py-8 text-center text-muted">Loading…</p>}
        {leads !== null && visible.length === 0 && <p className="py-8 text-center text-muted">No enquiries here yet.</p>}
        <ul className="flex flex-col divide-y divide-stone">
          {visible.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 py-4 lg:grid lg:grid-cols-[1.2fr_1.3fr_1fr] lg:gap-5">
              <div className="flex flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">{l.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLE[l.status] ?? STATUS_STYLE.lost}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
                </span>
                <span className="text-[13px] text-muted">{when(l)} · {l.source === 'signup' ? 'Sign-up page' : 'Quote page'}</span>
                <span className="mt-1 flex flex-wrap gap-2">
                  <a href={`tel:+91${l.phone}`} className="inline-flex h-9 items-center rounded-full bg-ink px-3.5 text-sm font-semibold text-white">Call {l.phone}</a>
                  <a href={waLink(l.phone, `Hi ${l.name}, this is Big Payrolls. Thanks for your enquiry about a website.`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full bg-[#25D366] px-3.5 text-sm font-semibold text-white">WhatsApp</a>
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <span><span className="text-muted">Needs:</span> <strong>{l.need || (l.interests ?? []).map(interestName).join(', ') || '—'}</strong>{l.businessType ? ` · ${l.businessType}` : ''}</span>
                {(l.company || l.email || l.companySize) && <span className="text-muted">{[l.company, l.email, l.companySize && `${l.companySize} employees`].filter(Boolean).join(' · ')}</span>}
                {l.message && <span className="rounded-xl bg-stone px-3 py-2">“{l.message}”</span>}
                <span className="text-[13px] text-muted">Came from: {cameFrom(l)}</span>
              </div>
              <div className="flex flex-col gap-2">
                <label className="sr-only" htmlFor={`st-${l.id}`}>Status</label>
                <select id={`st-${l.id}`} className="field field-sm" value={l.status} onChange={(e) => void change(l, { status: e.target.value })}>
                  {LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <label className="sr-only" htmlFor={`nt-${l.id}`}>Note</label>
                <textarea
                  id={`nt-${l.id}`}
                  rows={2}
                  maxLength={1000}
                  placeholder="Note (e.g. call back Monday)"
                  className="field text-sm"
                  value={notes[l.id] ?? l.note ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [l.id]: e.target.value }))}
                  onBlur={() => notes[l.id] !== undefined && notes[l.id] !== (l.note ?? '') && void change(l, { note: notes[l.id] })}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
