'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getRequest } from '@/lib/admin';
import { getProfile, paidTotal, type ServiceRequest } from '@/lib/data';
import { getSettings, type BusinessSettings } from '@/lib/settings';
import { site } from '@/lib/site';
import { fmtDate, inr } from '@/lib/format';

export default function InvoicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [r, setR] = useState<ServiceRequest | null | undefined>(undefined);
  const [s, setS] = useState<BusinessSettings | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    const id = new URLSearchParams(window.location.search).get('id');
    if (!user) {
      router.replace(`/signin/?next=${encodeURIComponent(`/invoice/?id=${id ?? ''}`)}`);
      return;
    }
    if (!id) return setR(null);
    Promise.all([getRequest(id), getSettings(), getProfile(user.uid)])
      .then(([req, set, prof]) => {
        setR(req);
        setS(set);
        setIsAdmin(prof?.role === 'admin');
      })
      .catch(() => setR(null));
  }, [user, loading, router]);

  async function download() {
    if (!ref.current || !r?.invoice) return;
    setBusy(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: `Invoice-${r.invoice.number.replace(/\//g, '-')}.pdf`,
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(ref.current)
        .save();
    } finally {
      setBusy(false);
    }
  }

  if (r === undefined) return <p className="p-8 text-muted">Loading invoice…</p>;
  if (!r || !r.invoice || !s)
    return (
      <div className="flex flex-col items-start gap-3 p-8">
        <p className="font-medium">This invoice is not available yet.</p>
        <Link href="/dashboard/" className="font-semibold underline">Back to dashboard</Link>
      </div>
    );

  const total = r.quote?.total ?? 0;
  const paid = paidTotal(r);
  const balance = Math.max(0, total - paid);
  const d = r.details;
  const back = isAdmin ? `/admin/request/?id=${r.id}` : '/dashboard/';

  return (
    <div className="min-h-screen bg-[#EDEAE4] py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <Link href={back} className="text-sm font-semibold text-muted hover:text-ink">← Back</Link>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className="h-11 rounded-full border border-sand bg-white px-5 font-semibold">
            Print
          </button>
          <button type="button" onClick={download} disabled={busy} className="h-11 rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-60">
            {busy ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[820px] px-4 print:max-w-none print:px-0">
        <div ref={ref} className="bg-white px-8 py-9 text-[13px] leading-relaxed text-ink shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] sm:px-12 print:shadow-none">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-6 border-b-4 border-brand pb-6">
            <div className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-horizontal.png" alt={site.legalName} className="h-12 w-auto self-start" />
              <div className="text-[12px] text-muted">
                <p className="font-semibold text-ink">{site.legalName}</p>
                {s.invoiceAddress && <p className="whitespace-pre-line">{s.invoiceAddress}</p>}
                {site.cin && <p>CIN: {site.cin}</p>}
                {s.gstin && <p>GSTIN: {s.gstin}</p>}
                {(s.invoiceEmail || s.invoicePhone) && <p>{[s.invoiceEmail, s.invoicePhone].filter(Boolean).join(' · ')}</p>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <h1 className="font-display text-3xl font-bold tracking-tight">INVOICE</h1>
              <p>
                <span className="text-muted">Invoice no.</span> <strong>{r.invoice.number}</strong>
              </p>
              <p>
                <span className="text-muted">Date</span> <strong>{fmtDate(r.invoice.date)}</strong>
              </p>
              <span
                className={`mt-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  balance <= 0 && total > 0 ? 'bg-[#DCFCE7] text-[#166534]' : paid > 0 ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-stone text-ink'
                }`}
              >
                {balance <= 0 && total > 0 ? 'Paid in full' : paid > 0 ? 'Partly paid' : 'Payment due'}
              </span>
            </div>
          </div>

          {/* Bill to */}
          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Bill to</p>
              <p className="text-[15px] font-semibold">{d.business}</p>
              <p>{d.name}</p>
              {d.city && <p>{d.city}</p>}
              {d.phone && <p>+91 {d.phone}</p>}
              {d.email && <p>{d.email}</p>}
            </div>
            <div className="sm:text-right">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Project</p>
              {r.quote?.timeline && <p>Timeline: {r.quote.timeline}</p>}
              <p>Advance: {r.quote?.advancePercent ?? 0}%</p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-ink text-left text-[11px] uppercase tracking-wider text-white">
                <th className="w-10 px-3 py-2.5 font-semibold">#</th>
                <th className="px-3 py-2.5 font-semibold">Description</th>
                <th className="w-36 px-3 py-2.5 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(r.quote?.items ?? []).map((it, i) => (
                <tr key={i} className="border-b border-sand">
                  <td className="px-3 py-2.5 text-muted">{i + 1}</td>
                  <td className="px-3 py-2.5">{it.label}</td>
                  <td className="px-3 py-2.5 text-right">{inr(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="flex w-full max-w-[300px] flex-col gap-1.5">
              <Row k="Total" v={inr(total)} strong />
              <Row k="Amount received" v={`− ${inr(paid)}`} />
              <div className="mt-1 flex items-center justify-between rounded-lg bg-[#FFF4E2] px-3 py-2.5 text-[15px] font-bold">
                <span>Balance due</span>
                <span>{inr(balance)}</span>
              </div>
            </div>
          </div>

          {!s.gstin && <p className="mt-3 text-[11px] text-muted">GST not applicable.</p>}

          {(r.payments ?? []).length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Payments received</p>
              <table className="w-full border-collapse text-[12px]">
                <tbody>
                  {(r.payments ?? []).map((p, i) => (
                    <tr key={i} className="border-b border-stone">
                      <td className="py-1.5 pr-3">{fmtDate(p.date)}</td>
                      <td className="py-1.5 pr-3">{p.mode}</td>
                      <td className="py-1.5 pr-3 text-muted">{p.reference || ''}</td>
                      <td className="py-1.5 text-right font-semibold">{inr(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {balance > 0 && (s.upiId || s.accountNumber) && (
            <div className="mt-6 grid gap-4 rounded-xl border border-sand p-4 sm:grid-cols-2">
              {s.upiId && (
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Pay by UPI</p>
                  <p className="font-semibold">{s.upiId}</p>
                  <p className="text-muted">{s.payeeName}</p>
                </div>
              )}
              {s.accountNumber && (
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Bank transfer</p>
                  <p>{s.accountName}</p>
                  <p>
                    A/c <strong>{s.accountNumber}</strong> · IFSC <strong>{s.ifsc}</strong>
                  </p>
                  <p className="text-muted">{[s.bankName, s.branch].filter(Boolean).join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {r.quote?.notes && (
            <div className="mt-6">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Notes</p>
              <p className="whitespace-pre-line">{r.quote.notes}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-sand pt-4 text-[11px] text-muted">
            <span>{s.invoiceFooter}</span>
            <span>This is a computer-generated invoice and needs no signature.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 ${strong ? 'text-[14px] font-semibold' : ''}`}>
      <span className={strong ? '' : 'text-muted'}>{k}</span>
      <span>{v}</span>
    </div>
  );
}
