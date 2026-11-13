'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { listAllRequests, listClients, type ClientRow } from '@/lib/admin';
import { paidTotal, type ServiceRequest } from '@/lib/data';
import { INTERESTS } from '@/lib/catalog';
import { fmtDate, inr, waLink } from '@/lib/format';

const interestName = (id: string) => INTERESTS.find((i) => i.id === id)?.t ?? id;

export default function AdminClients() {
  return <AdminShell>{() => <ClientsList />}</AdminShell>;
}

function ClientsList() {
  const [clients, setClients] = useState<ClientRow[] | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listClients(), listAllRequests()])
      .then(([c, r]) => {
        setClients(c);
        setRequests(r);
      })
      .catch(() => setError('Could not load clients. Make sure your account role is "admin".'));
  }, []);

  const visible = (clients ?? []).filter((c) => {
    if (!q.trim()) return true;
    return [c.name, c.company, c.phone, c.email].join(' ').toLowerCase().includes(q.trim().toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Clients</h1>
        <p className="text-muted">Everyone who has created an account{clients ? ` · ${clients.length} total` : ''}.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-sand bg-white p-4 sm:p-5">
        <label htmlFor="csearch" className="sr-only">Search clients</label>
        <input
          id="csearch"
          placeholder="Search name, company, phone, email"
          className="field field-sm max-w-[380px]"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {error && <p role="alert" className="text-sm font-medium text-[#B42318]">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-sand text-xs uppercase tracking-wide text-muted">
                <th className="py-2.5 pr-3 font-semibold">Joined</th>
                <th className="py-2.5 pr-3 font-semibold">Client</th>
                <th className="py-2.5 pr-3 font-semibold">Contact</th>
                <th className="py-2.5 pr-3 font-semibold">Interested in</th>
                <th className="py-2.5 pr-3 font-semibold">Size</th>
                <th className="py-2.5 pr-3 font-semibold">Requests</th>
                <th className="py-2.5 text-right font-semibold">Paid</th>
              </tr>
            </thead>
            <tbody>
              {clients === null && !error && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">Loading…</td>
                </tr>
              )}
              {visible.map((c) => {
                const mine = requests.filter((r) => r.uid === c.uid);
                const paid = mine.reduce((s, r) => s + paidTotal(r), 0);
                return (
                  <tr key={c.uid} className="border-b border-stone align-top last:border-0">
                    <td className="py-3 pr-3 text-muted">{fmtDate(c.createdAt) || '—'}</td>
                    <td className="py-3 pr-3">
                      <span className="flex flex-col">
                        <span className="font-semibold">
                          {c.company || '—'}
                          {c.role === 'admin' && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold">ADMIN</span>}
                        </span>
                        <span className="text-[13px] text-muted">{c.name}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[13px]">
                      <span className="flex flex-col gap-0.5">
                        {c.phone && (
                          <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" className="font-medium text-[#166534] underline-offset-2 hover:underline">
                            {c.phone} (WhatsApp)
                          </a>
                        )}
                        {c.email && <a href={`mailto:${c.email}`} className="text-muted hover:underline">{c.email}</a>}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[13px]">{(c.interests ?? []).map(interestName).join(', ') || '—'}</td>
                    <td className="py-3 pr-3 text-[13px]">{c.companySize || '—'}</td>
                    <td className="py-3 pr-3">
                      {mine.length === 0 ? (
                        <span className="text-muted">None yet</span>
                      ) : (
                        <span className="flex flex-col gap-1">
                          {mine.map((r) => (
                            <Link key={r.id} href={`/admin/request/?id=${r.id}`} className="font-medium underline underline-offset-2">
                              {fmtDate(r.createdAt) || 'Open'}
                            </Link>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">{paid ? inr(paid) : '—'}</td>
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
