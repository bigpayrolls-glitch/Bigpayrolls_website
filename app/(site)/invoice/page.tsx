'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getRequest } from '@/lib/admin';
import { CYCLE_LABEL, CYCLE_NAME, getProfile, paymentKey, type Payment, type ServiceRequest } from '@/lib/data';
import { fmtDate, inr, rupeesInWords } from '@/lib/format';
import { invoiceView, receiptView } from '@/lib/invoice';
import { getSettings, type BusinessSettings } from '@/lib/settings';
import { site } from '@/lib/site';

/** /invoice/?id=REQUEST shows the invoice; /invoice/?id=REQUEST&receipt=PAYMENT shows that payment's advance receipt. */
export default function InvoicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [r, setR] = useState<ServiceRequest | null | undefined>(undefined);
  const [s, setS] = useState<BusinessSettings | null>(null);
  const [receiptKey, setReceiptKey] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    const q = new URLSearchParams(window.location.search);
    const id = q.get('id');
    setReceiptKey(q.get('receipt'));
    if (!user) {
      router.replace(`/signin/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
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

  const payment = receiptKey && r ? (r.payments ?? []).find((p) => paymentKey(p) === receiptKey && p.receipt?.number) : undefined;
  const docNumber = payment ? payment.receipt!.number : r?.invoice?.number;

  async function download() {
    if (!ref.current || !docNumber) return;
    setBusy(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: 0,
          filename: `${payment ? 'Receipt' : 'Invoice'}-${docNumber.replace(/\//g, '-')}.pdf`,
          image: { type: 'jpeg', quality: 0.97 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(ref.current)
        .save();
    } finally {
      setBusy(false);
    }
  }

  if (r === undefined) return <p className="p-8 text-muted">Loading…</p>;
  const missing = !r || !s || (receiptKey ? !payment : !r.invoice);
  if (missing)
    return (
      <div className="flex flex-col items-start gap-3 p-8">
        <p className="font-medium">{receiptKey ? 'This receipt is not available.' : 'This invoice is not available yet.'}</p>
        <Link href="/dashboard/" className="font-semibold underline">Back to dashboard</Link>
      </div>
    );

  const back = isAdmin ? `/admin/request/?id=${r!.id}` : '/dashboard/';
  return (
    <div className="min-h-screen bg-[#EDEAE4] py-6 print:bg-white print:py-0">
      <style>{'@page { size: A4; margin: 0; } @media print { html, body { background: #fff !important; } }'}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <Link href={back} className="text-sm font-semibold text-muted hover:text-ink">← Back</Link>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className="h-11 rounded-full border border-sand bg-white px-5 font-semibold">Print</button>
          <button type="button" onClick={download} disabled={busy} className="h-11 rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-60">
            {busy ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto px-4 print:overflow-visible print:px-0">
        <div ref={ref} className="mx-auto w-[210mm] bg-white shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] print:shadow-none">
          {payment ? <ReceiptDoc r={r!} s={s!} p={payment} /> : <InvoiceDoc r={r!} s={s!} />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ shared pieces */

const LABEL = 'mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#777]';

function Page({ children, footer, right }: { children: React.ReactNode; footer: string; right: string }) {
  return (
    <div className="relative flex min-h-[297mm] flex-col px-[15mm] pb-[8mm] pt-[13mm] text-[11.5px] leading-normal text-[#1a1a1a]">
      <div className="flex-1">{children}</div>
      <div className="mt-6 flex justify-between gap-4 border-t border-[#eee] pt-2 text-[10.5px] text-[#777]">
        <span>{footer}</span>
        <span className="text-right">{right}</span>
      </div>
    </div>
  );
}

function From({ s }: { s: BusinessSettings }) {
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-horizontal.png" alt={site.legalName} className="h-[44px] w-auto" />
      <div className="mt-2.5 leading-[1.45] text-[#444]">
        <p className="font-bold text-[#1a1a1a]">{site.legalName}</p>
        {site.cin && <p>CIN: {site.cin}</p>}
        {s.gstin && <p>GSTIN: {s.gstin}</p>}
        {(s.invoiceAddress || site.address) && <p className="max-w-[90mm] whitespace-pre-line">{s.invoiceAddress || site.address}</p>}
        {(s.invoiceEmail || s.invoicePhone || site.phone) && <p>{[s.invoiceEmail, s.invoicePhone || site.phone].filter(Boolean).join(' · ')}</p>}
        <p>{site.domain}</p>
      </div>
    </div>
  );
}

function Pill({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'amber' | 'grey' }) {
  const c = tone === 'green' ? 'bg-[#e6f6ec] text-[#17803d]' : tone === 'amber' ? 'bg-[#fff4e0] text-[#92400e]' : 'bg-[#f0eeea] text-[#1a1a1a]';
  return <span className={`mt-1.5 inline-block rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] ${c}`}>{children}</span>;
}

function Lines({ text }: { text: string }) {
  return <>{text.split('\n').filter((l) => l.trim()).map((l, i) => <p key={i}>{l}</p>)}</>;
}

function gstNote(s: BusinessSettings) {
  return s.gstin ? '' : 'Supplier not registered under GST (turnover below threshold limit). GST not charged.';
}

/* ------------------------------------------------------------------ invoice */

function InvoiceDoc({ r, s }: { r: ServiceRequest; s: BusinessSettings }) {
  const inv = r.invoice!;
  const v = invoiceView(r);
  const tone = v.status === 'Payment due' ? 'grey' : v.status === 'Partly paid' ? 'amber' : 'green';
  const showSummary = v.projectValue !== v.total || v.others.length > 0;
  const m = r.quote?.maintenance;
  return (
    <Page footer={s.invoiceFooter || 'Thank you for your business!'} right="This is a computer-generated invoice and needs no signature.">
      <div className="flex items-start justify-between gap-6">
        <From s={s} />
        <div className="text-right">
          {inv.revised && <span className="mb-1 inline-block rounded border border-[#f5c26b] bg-[#fff7e6] px-[7px] py-[2px] text-[10px] font-bold tracking-[0.08em] text-[#b45309]">REVISED</span>}
          <h1 className="text-[26px] font-extrabold tracking-[0.02em]">INVOICE</h1>
          <div className="mt-1.5 leading-[1.7] text-[#555]">
            <p>Invoice no. <b className="text-[#1a1a1a]">{inv.number}</b></p>
            <p>Invoice date <b className="text-[#1a1a1a]">{fmtDate(inv.date)}</b></p>
            {inv.workOrderDate && <p>Work order date <b className="text-[#1a1a1a]">{fmtDate(inv.workOrderDate)}</b></p>}
          </div>
          <Pill tone={tone}>{v.status}</Pill>
        </div>
      </div>

      <div className="my-3 h-[3px] bg-[#F5A623]" />

      <div className="flex justify-between gap-5">
        <div className="leading-normal">
          <p className={LABEL}>Bill to</p>
          <p className="text-[14.5px] font-bold">{v.billTo.name}</p>
          {v.billTo.attn && <p>Attn: {v.billTo.attn}</p>}
          {v.billTo.address && <Lines text={v.billTo.address} />}
          {v.billTo.phones && <p>{v.billTo.phones}</p>}
          {v.billTo.email && <p>{v.billTo.email}</p>}
        </div>
        <div className="text-right leading-normal">
          <p className={LABEL}>Project</p>
          {v.project.name && <p className="font-bold">{v.project.name}</p>}
          {v.project.subtitle && <p>{v.project.subtitle}</p>}
          {r.createdAt && <p>Enquiry via {site.domain}: {fmtDate(r.createdAt)}</p>}
          {v.project.timeline && <p>Timeline: {v.project.timeline}</p>}
          <p>Total project value: <b>{inr(v.projectValue)}</b></p>
        </div>
      </div>

      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr className="bg-[#141414] text-left text-[10.5px] tracking-[0.08em] text-white">
            <th className="w-[6%] px-2.5 py-[9px] font-bold">#</th>
            <th className="px-2.5 py-[9px] font-bold">DESCRIPTION</th>
            <th className="w-[22%] px-2.5 py-[9px] text-right font-bold">AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody>
          {v.heading && (
            <tr className="border-b border-[#eee] bg-[#fafafa] font-bold">
              <td className="px-2.5 py-1" />
              <td className="px-2.5 py-1">{v.heading}</td>
              <td className="px-2.5 py-1" />
            </tr>
          )}
          {v.lines.map((l, i) => (
            <tr key={i} className="border-b border-[#eee] align-top">
              <td className="px-2.5 py-1">{i + 1}</td>
              <td className="px-2.5 py-1">
                {l.label}
                {l.detail && <small className="block text-[11px] text-[#777]">{l.detail}</small>}
              </td>
              <td className="px-2.5 py-1 text-right">{Math.round(l.amount).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-2.5 w-[52%]">
        <div className="flex justify-between border-t border-[#ddd] px-2.5 py-1 text-[14px] font-extrabold"><span>Invoice total</span><span>{inr(v.total)}</span></div>
        <div className="flex justify-between px-2.5 py-1 text-[#666]">
          <span>Amount received{v.covered.length > 1 ? ` (${v.covered.length} payments)` : ''}</span>
          <span>– {inr(v.received)}</span>
        </div>
        <div className="flex justify-between rounded-md bg-[#fff4e0] px-2.5 py-1 text-[14px] font-extrabold"><span>Balance on this invoice</span><span>{inr(v.balance)}</span></div>
      </div>

      {gstNote(s) && <p className="mt-2.5 text-[11px] text-[#555]">{gstNote(s)}</p>}

      {v.covered.length > 0 && (
        <>
          <h3 className="mb-1.5 mt-3 text-[10.5px] font-bold tracking-[0.12em] text-[#555]">PAYMENTS RECEIVED AGAINST THIS INVOICE</h3>
          <PaymentTable payments={v.covered} />
        </>
      )}

      {showSummary && (
        <div className="mt-2 rounded-lg border border-[#eee] px-3 py-[7px]">
          <p className={`${LABEL} !mb-1`}>Project payment summary</p>
          <SumRow k="Total project value" v={inr(v.projectValue)} />
          <SumRow k={`Received – this invoice${v.covered.length > 1 ? ` (${v.covered.length} payments)` : ''}`} v={inr(v.received)} />
          {v.others.map((p, i) => (
            <SumRow
              key={i}
              k={`Received – ${p.receipt?.number ? `advance receipt ${p.receipt.number}` : fmtDate(p.date)}${p.reference ? ` (${p.reference})` : ''}`}
              v={inr(p.amount)}
            />
          ))}
          <SumRow k="Balance due on delivery" v={inr(v.projectBalance)} bold />
        </div>
      )}

      {v.balance > 0 && (s.upiId || s.accountNumber) && (
        <div className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-[#eee] px-3 py-2">
          {s.upiId && (
            <div>
              <p className={LABEL}>Pay by UPI</p>
              <p className="font-semibold">{s.upiId}</p>
              <p className="text-[#666]">{s.payeeName}</p>
            </div>
          )}
          {s.accountNumber && (
            <div>
              <p className={LABEL}>Bank transfer</p>
              <p>{s.accountName}</p>
              <p>A/c <b>{s.accountNumber}</b> · IFSC <b>{s.ifsc}</b></p>
              <p className="text-[#666]">{[s.bankName, s.branch].filter(Boolean).join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {m && (
        <div className="mt-2 rounded-lg border border-[#f0e2c4] bg-[#fffbf3] px-3 py-[7px] leading-[1.55]">
          <p className={`${LABEL} !mb-0.5`}>{CYCLE_NAME[m.cycle]} maintenance (billed separately)</p>
          <p><b>{inr(m.amount)} per {CYCLE_LABEL[m.cycle]}</b>{m.startsFrom ? ` · ${m.startsFrom}` : ''}</p>
          {m.includes && <p>Includes {m.includes.replace(/^includes:?\s*/i, '').replace(/^./, (c) => c.toLowerCase())}</p>}
        </div>
      )}

      {v.notes && (
        <>
          <h3 className="mb-1.5 mt-3 text-[10.5px] font-bold tracking-[0.12em] text-[#555]">NOTES</h3>
          <p className="whitespace-pre-line leading-relaxed text-[#333]">{v.notes}</p>
        </>
      )}
    </Page>
  );
}

function PaymentTable({ payments }: { payments: Payment[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-[#ddd] text-left text-[10px] tracking-[0.05em] text-[#777]">
          <th className="py-[5px] font-semibold">Date</th>
          <th className="py-[5px] font-semibold">Mode</th>
          <th className="py-[5px] font-semibold">Payment ID</th>
          <th className="py-[5px] text-right font-semibold">Amount</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p, i) => (
          <tr key={i} className="border-b border-[#f0f0f0]">
            <td className="py-[5px]">{fmtDate(p.date)}</td>
            <td className="py-[5px]">{p.mode}</td>
            <td className="py-[5px]">{p.reference || '—'}</td>
            <td className="py-[5px] text-right font-bold">{inr(p.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SumRow({ k, v, bold = false }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-0.5 ${bold ? 'font-bold' : ''}`}>
      <span>{k}</span>
      <span className="whitespace-nowrap">{v}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ advance receipt */

function ReceiptDoc({ r, s, p }: { r: ServiceRequest; s: BusinessSettings; p: Payment }) {
  const v = invoiceView(r);
  const t = receiptView(r, p);
  const rc = p.receipt!;
  return (
    <Page footer={s.invoiceFooter || 'Thank you for your business!'} right="This is a computer-generated receipt and needs no signature.">
      <div className="flex items-start justify-between gap-6">
        <From s={s} />
        <div className="text-right">
          <h1 className="text-[26px] font-extrabold tracking-[0.02em]">RECEIPT</h1>
          <div className="mt-1.5 leading-[1.7] text-[#555]">
            <p>Advance receipt no. <b className="text-[#1a1a1a]">{rc.number}</b></p>
            <p>Receipt date <b className="text-[#1a1a1a]">{fmtDate(rc.date)}</b></p>
          </div>
          <Pill>Payment received</Pill>
        </div>
      </div>

      <div className="my-3 h-[3px] bg-[#F5A623]" />

      <div className="flex justify-between gap-5">
        <div className="leading-normal">
          <p className={LABEL}>Received from</p>
          <p className="text-[14.5px] font-bold">{v.billTo.name}</p>
          {v.billTo.attn && <p>Attn: {v.billTo.attn}</p>}
          {v.billTo.address && <Lines text={v.billTo.address} />}
          {v.billTo.phones && <p>{v.billTo.phones}</p>}
          {v.billTo.email && <p>{v.billTo.email}</p>}
        </div>
        <div className="text-right leading-normal">
          <p className={LABEL}>Project</p>
          {v.project.name && <p className="font-bold">{v.project.name}</p>}
          {r.invoice?.number && <p>Ref. invoice {r.invoice.number}</p>}
        </div>
      </div>

      <div className="mt-[18px] flex items-center justify-between rounded-[10px] border-2 border-[#F5A623] p-4">
        <div>
          <p className={`${LABEL} !mb-0.5`}>Amount received</p>
          <p className="text-[#555]">Rupees {rupeesInWords(t.amount)} Only</p>
        </div>
        <p className="text-[26px] font-extrabold">{inr(t.amount)}</p>
      </div>

      <table className="mt-3.5 w-full border-collapse">
        <tbody>
          {[
            ['Payment ID', <b key="id">{p.reference || '—'}</b>],
            ['Payment date', fmtDate(p.date)],
            ['Mode', p.mode],
            ['Towards', rc.towards || `Advance – ${v.project.name || 'project'}`],
            ['Total project value', inr(t.projectValue)],
            ['Total received to date', inr(t.projectReceived)],
            ['Balance due on delivery', inr(t.projectBalance)],
          ].map(([k, val]) => (
            <tr key={String(k)} className="border-b border-[#f0f0f0]">
              <td className="w-[38%] py-2 text-[#666]">{k}</td>
              <td className="py-2">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3.5 text-[11px] text-[#555]">
        This is an advance receipt. A tax / final invoice for this amount will be issued on delivery of the project.
        {gstNote(s) ? ` ${gstNote(s)}` : ''}
      </p>
    </Page>
  );
}
