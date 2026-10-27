'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { ServiceRequest } from '@/lib/data';
import { amountDue, submitPaymentClaim, upiLink, type BusinessSettings } from '@/lib/settings';
import { fmtDateTime, inr } from '@/lib/format';
import { ArrowUpRight, Check } from './Icons';

/** Client "Pay now" panel: amount due, UPI (button + QR), bank transfer, payment link, and an "I've paid" form. */
export default function PayPanel({ r, settings, onChange }: { r: ServiceRequest; settings: BusinessSettings | null; onChange: () => void }) {
  const due = amountDue(r);
  const s = settings;
  const [qr, setQr] = useState('');
  const [tab, setTab] = useState<'upi' | 'bank'>('upi');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(due.now || ''));
  const [utr, setUtr] = useState('');
  const [mode, setMode] = useState('UPI');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState('');

  const pending = (r.paymentClaims ?? []).filter((c) => !c.verified && !c.rejected);
  const ref = r.invoice?.number ?? `BP-${r.id.slice(0, 6).toUpperCase()}`;
  const upi = s?.upiId ? upiLink(s, due.now, `${ref} ${r.details?.business ?? ''}`) : '';
  const hasBank = !!s?.accountNumber;

  useEffect(() => {
    setAmount(String(due.now || ''));
  }, [due.now]);

  useEffect(() => {
    if (!upi || due.now <= 0) return setQr('');
    QRCode.toDataURL(upi, { margin: 1, width: 360, color: { dark: '#141414', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [upi, due.now]);

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
  }

  async function submit() {
    setMsg('');
    const amt = Number(amount.replace(/[^\d.]/g, ''));
    if (!amt || amt <= 0) return setMsg('Enter the amount you paid.');
    if (utr.trim().length < 6) return setMsg('Enter the UTR / transaction ID from your payment app or bank (at least 6 characters).');
    setBusy(true);
    try {
      await submitPaymentClaim(r.id, { amount: amt, utr, mode });
      setUtr('');
      setOpen(false);
      onChange();
    } catch {
      setMsg('Could not send. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#ECE6DC] bg-gradient-to-br from-white to-[#FFF8EC] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">{due.now > 0 ? (due.isAdvance ? 'Advance due now' : 'Balance due') : 'Payments'}</span>
          <span className="font-display text-3xl font-bold">{due.now > 0 ? inr(due.now) : 'All paid'}</span>
          <span className="text-sm text-muted">
            Paid {inr(due.paid)} of {inr(due.total)}
          </span>
        </div>
        {r.invoice && (
          <Link href={`/invoice/?id=${r.id}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-sand bg-white px-4 text-sm font-semibold hover:bg-peach">
            Invoice {r.invoice.number} · Download
          </Link>
        )}
      </div>

      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-stone">
        <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${due.total ? Math.min(100, (due.paid / due.total) * 100) : 0}%` }} />
      </div>

      {pending.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl bg-[#FEF3C7] px-4 py-3 text-sm text-[#78350F]">
          {pending.map((c, i) => (
            <span key={i}>
              We received your note: {inr(c.amount)} by {c.mode} (UTR {c.utr}) on {fmtDateTime(c.at)}. We will confirm it shortly.
            </span>
          ))}
        </div>
      )}

      {due.now > 0 && (
        <>
          {!s || (!s.upiId && !hasBank && !r.paymentLink) ? (
            <p className="text-sm text-muted">Our team will share payment details with you shortly.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {r.paymentLink && (
                <a
                  href={r.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 font-semibold text-white sm:self-start"
                >
                  Pay online (card, UPI, netbanking) <ArrowUpRight size={16} />
                </a>
              )}

              {(s.upiId || hasBank) && (
                <div className="flex flex-col gap-3">
                  <div role="tablist" aria-label="Payment method" className="inline-flex gap-1 self-start rounded-full bg-stone p-1">
                    {s.upiId && (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'upi'}
                        onClick={() => setTab('upi')}
                        className={`h-9 rounded-full px-4 text-sm font-semibold ${tab === 'upi' ? 'bg-white shadow-sm' : 'text-muted'}`}
                      >
                        UPI
                      </button>
                    )}
                    {hasBank && (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'bank' || !s.upiId}
                        onClick={() => setTab('bank')}
                        className={`h-9 rounded-full px-4 text-sm font-semibold ${tab === 'bank' || !s.upiId ? 'bg-white shadow-sm' : 'text-muted'}`}
                      >
                        Bank transfer
                      </button>
                    )}
                  </div>

                  {tab === 'upi' && s.upiId ? (
                    <div className="flex flex-wrap items-center gap-5">
                      {qr && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qr} alt={`UPI QR code to pay ${inr(due.now)}`} className="h-40 w-40 rounded-xl border border-sand bg-white p-1.5" />
                      )}
                      <div className="flex flex-col gap-2.5">
                        <a href={upi} className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 font-bold text-ink sm:hidden">
                          Pay {inr(due.now)} with UPI app
                        </a>
                        <p className="hidden text-sm text-muted sm:block">Scan with GPay, PhonePe, Paytm or any UPI app. The amount is filled in.</p>
                        <button type="button" onClick={() => copy('upi', s.upiId)} className="flex items-center gap-2 self-start text-sm">
                          UPI ID <strong>{s.upiId}</strong>
                          <span className="rounded-full bg-stone px-2 py-0.5 text-xs font-semibold">{copied === 'upi' ? 'Copied' : 'Copy'}</span>
                        </button>
                        <span className="text-sm text-muted">Pay to {s.payeeName}</span>
                      </div>
                    </div>
                  ) : (
                    hasBank && (
                      <dl className="grid gap-x-6 gap-y-2 rounded-xl bg-white p-4 text-sm sm:grid-cols-2">
                        {[
                          ['Account name', s.accountName],
                          ['Account number', s.accountNumber],
                          ['IFSC', s.ifsc],
                          ['Bank', [s.bankName, s.branch].filter(Boolean).join(', ')],
                          ['Amount', inr(due.now)],
                          ['Reference', ref],
                        ]
                          .filter(([, v]) => v)
                          .map(([k, v]) => (
                            <div key={k} className="flex flex-col">
                              <dt className="text-xs text-muted">{k}</dt>
                              <dd className="flex items-center gap-2 font-semibold">
                                {v}
                                {['Account number', 'IFSC'].includes(k) && (
                                  <button type="button" onClick={() => copy(k, v)} className="rounded-full bg-stone px-2 py-0.5 text-xs font-semibold">
                                    {copied === k ? 'Copied' : 'Copy'}
                                  </button>
                                )}
                              </dd>
                            </div>
                          ))}
                      </dl>
                    )
                  )}
                </div>
              )}

              {s.paymentNote && <p className="text-sm text-muted">{s.paymentNote}</p>}
            </div>
          )}

          {!open ? (
            <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 items-center gap-2 self-start rounded-full border-[1.5px] border-ink bg-white px-5 font-semibold">
              <Check size={16} /> I have paid
            </button>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-sand bg-white p-4">
              <span className="font-semibold">Tell us about your payment</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor={`pamt-${r.id}`} className="label">Amount (₹)</label>
                  <input id={`pamt-${r.id}`} inputMode="numeric" className="field field-sm" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={`pmode-${r.id}`} className="label">Paid by</label>
                  <select id={`pmode-${r.id}`} className="field field-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option>UPI</option>
                    <option>Bank transfer</option>
                    <option>Card / Razorpay</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={`putr-${r.id}`} className="label">UTR / transaction ID</label>
                  <input id={`putr-${r.id}`} className="field field-sm" value={utr} onChange={(e) => setUtr(e.target.value)} />
                </div>
              </div>
              {msg && <p role="alert" className="text-sm font-medium text-[#B42318]">{msg}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={submit} className="h-11 rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-60">
                  {busy ? 'Sending…' : 'Send to Big Payrolls'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full px-4 font-semibold text-muted">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
