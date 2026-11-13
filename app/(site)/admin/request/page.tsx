'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminShell, { Panel, StatusBadge } from '@/components/AdminShell';
import { ArrowRight } from '@/components/Icons';
import {
  getClient,
  getInternalNotes,
  getRequest,
  postUpdate,
  recordPayment,
  removePayment,
  saveInternalNotes,
  saveQuote,
  type ClientRow,
  rejectClaim,
  verifyClaim,
} from '@/lib/admin';
import { createInvoice, getSettings, setPaymentLink } from '@/lib/settings';
import { CYCLE_LABEL, paidTotal, QUOTE_VISIBLE, type Maintenance, type QuoteItem, type ServiceRequest } from '@/lib/data';
import { ALL_STATUSES, INDUSTRIES, INTERESTS, PAYMENT_MODES, SERVICES, statusLabel, statusTone } from '@/lib/catalog';
import { fmtDate, fmtDateTime, inr, todayISO, waLink } from '@/lib/format';

const svcName = (id: string) => SERVICES.find((s) => s.id === id)?.t ?? id;
const indName = (id: string) => INDUSTRIES.find((s) => s.id === id)?.t ?? id;

export default function AdminRequestPage() {
  return <AdminShell>{() => <RequestDetail />}</AdminShell>;
}

function RequestDetail() {
  const [id, setId] = useState<string | null>(null);
  const [r, setR] = useState<ServiceRequest | null | undefined>(undefined);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('id');
    if (q) setId(q);
    else setR(null);
  }, []);

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const req = await getRequest(id);
      setR(req);
      if (req) getClient(req.uid).then(setClient).catch(() => setClient(null));
    } catch {
      setError('Could not load this request.');
      setR(null);
    }
  }, [id]);

  useEffect(() => {
    if (id) reload();
  }, [id, reload]);

  if (r === undefined) return <p className="text-muted">Loading…</p>;
  if (r === null)
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="font-medium">{error || 'Request not found.'}</p>
        <Link href="/admin/" className="font-semibold underline">Back to all requests</Link>
      </div>
    );

  const d = r.details ?? ({} as ServiceRequest['details']);
  const firstName = (d.name || '').split(' ')[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link href="/admin/" className="text-sm font-semibold text-muted hover:text-ink">← All requests</Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">{d.business || 'Request'}</h1>
              <StatusBadge status={r.status} label={statusLabel(r.status)} tone={statusTone(r.status)} />
            </div>
            <p className="text-muted">
              {d.name} · received {fmtDate(r.createdAt)}
              {r.updatedAt ? ` · last updated ${fmtDateTime(r.updatedAt)}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {d.phone && (
              <a
                href={waLink(d.phone, `Hi ${firstName}, this is Big Payrolls regarding your request.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-full bg-[#16803C] px-4 text-sm font-semibold text-white"
              >
                WhatsApp
              </a>
            )}
            {d.phone && (
              <a href={`tel:+91${d.phone.replace(/\D/g, '').slice(-10)}`} className="inline-flex h-10 items-center rounded-full border border-sand bg-white px-4 text-sm font-semibold">
                Call {d.phone}
              </a>
            )}
            {d.email && (
              <a href={`mailto:${d.email}`} className="inline-flex h-10 items-center rounded-full border border-sand bg-white px-4 text-sm font-semibold">
                Email
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title="What they need">
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <Item k="Services" v={r.services.map(svcName).join(', ')} />
              <Item k="Industry" v={`${indName(r.industry)} · ${r.businessType}`} />
              <Item k="Features" v={r.features.length ? r.features.join(', ') : 'Not sure yet'} wide />
              <Item k="Budget" v={r.budget || '—'} />
              <Item k="Timeline" v={r.timeline || '—'} />
              <Item k="City" v={d.city || '—'} />
              <Item k="Current website" v={d.website || '—'} />
              <Item k="Notes from client" v={d.notes || '—'} wide />
            </dl>
          </Panel>

          {r.clientResponse && (
            <section
              className={`flex flex-col gap-1 rounded-3xl border p-5 ${
                r.clientResponse.decision === 'accepted' ? 'border-[#86EFAC] bg-[#F0FDF4]' : 'border-[#FDA4AF] bg-[#FFF1F2]'
              }`}
            >
              <span className="font-semibold">
                {r.clientResponse.decision === 'accepted' ? 'Client accepted the quote' : 'Client asked for changes'} ·{' '}
                <span className="font-normal text-muted">{fmtDateTime(r.clientResponse.at)}</span>
              </span>
              {r.clientResponse.note && <p className="text-sm">“{r.clientResponse.note}”</p>}
            </section>
          )}

          <QuoteBuilder r={r} onSaved={reload} />
          <Payments r={r} onSaved={reload} />
          <InvoiceAndLink r={r} onSaved={reload} />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <StatusUpdater r={r} onSaved={reload} />

          <Panel title="Discovery call">
            {r.call?.dateLabel ? (
              <p className="text-sm">
                <span className="font-semibold">{r.call.dateLabel}, {r.call.slot}</span>
                <span className="block text-muted">{r.call.mode}</span>
              </p>
            ) : (
              <p className="text-sm text-muted">No call booked.</p>
            )}
          </Panel>

          <Panel title="Client account">
            {client ? (
              <dl className="grid gap-3 text-sm">
                <Item k="Name" v={client.name} />
                <Item k="Company" v={client.company} />
                <Item k="Mobile" v={client.phone} />
                <Item k="Email" v={client.email} />
                <Item k="Employees" v={client.companySize || '—'} />
                <Item k="Interested in" v={(client.interests ?? []).map((i) => INTERESTS.find((x) => x.id === i)?.t ?? i).join(', ') || '—'} />
                <Item k="Joined" v={fmtDate(client.createdAt) || '—'} />
              </dl>
            ) : (
              <p className="text-sm text-muted">Profile not found.</p>
            )}
          </Panel>

          <InternalNotes id={r.id} />
        </div>
      </div>
    </div>
  );
}

function Item({ k, v, wide = false }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt>
      <dd className="whitespace-pre-line break-words">{v}</dd>
    </div>
  );
}

/* ---------------- Status + updates ---------------- */

function StatusUpdater({ r, onSaved }: { r: ServiceRequest; onSaved: () => void }) {
  const [status, setStatus] = useState(r.status);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const updates = [...(r.updates ?? [])].sort((a, b) => (b.at?.toMillis?.() ?? 0) - (a.at?.toMillis?.() ?? 0));

  useEffect(() => setStatus(r.status), [r.status]);

  async function send() {
    setMsg('');
    const changed = status !== r.status;
    if (!changed && !text.trim()) return setMsg('Write a message or choose a new status.');
    setBusy(true);
    try {
      await postUpdate(r.id, text, changed ? status : undefined);
      setText('');
      setMsg('Sent. The client sees it on their dashboard.');
      onSaved();
    } catch {
      setMsg('Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Update the client">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="label">Status</label>
        <select id="status" className="field field-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {ALL_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="upd" className="label">Message to client <span className="font-normal text-muted">(optional)</span></label>
        <textarea
          id="upd"
          rows={3}
          className="field resize-y text-[15px]"
          placeholder="e.g. Thanks for the call! Your quote will be ready by tomorrow."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {msg && <p role="status" className="text-sm font-medium">{msg}</p>}
      <button type="button" onClick={send} disabled={busy} className="h-11 rounded-full bg-ink font-semibold text-white disabled:opacity-60">
        {busy ? 'Sending…' : 'Send update'}
      </button>

      <div className="flex flex-col gap-3 border-t border-stone pt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">History (client can see)</span>
        {updates.length === 0 && <p className="text-sm text-muted">No updates yet.</p>}
        <ol className="flex flex-col gap-3">
          {updates.map((u, i) => (
            <li key={i} className="flex flex-col gap-1 border-l-2 border-brand pl-3 text-sm">
              <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {fmtDateTime(u.at)}
                {u.status && <StatusBadge status={u.status} label={statusLabel(u.status)} tone={statusTone(u.status)} />}
              </span>
              <span>{u.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

/* ---------------- Quote builder ---------------- */

function QuoteBuilder({ r, onSaved }: { r: ServiceRequest; onSaved: () => void }) {
  const [items, setItems] = useState<{ label: string; amount: string }[]>(
    r.quote?.items?.length
      ? r.quote.items.map((i) => ({ label: i.label, amount: String(i.amount) }))
      : r.services.map((s) => ({ label: svcName(s), amount: '' })),
  );
  const [advance, setAdvance] = useState(String(r.quote?.advancePercent ?? 50));
  const [timeline, setTimeline] = useState(r.quote?.timeline ?? '');
  const [notes, setNotes] = useState(r.quote?.notes ?? '');
  const m0 = r.quote?.maintenance;
  const [mOn, setMOn] = useState(!!m0);
  const [mAmount, setMAmount] = useState(m0 ? String(m0.amount) : '');
  const [mCycle, setMCycle] = useState<Maintenance['cycle']>(m0?.cycle ?? 'monthly');
  const [mStart, setMStart] = useState(m0?.startsFrom ?? 'From the month after the site goes live');
  const [mIncludes, setMIncludes] = useState(m0?.includes ?? 'Hosting, security updates, backups, small content changes and support');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const parsed: QuoteItem[] = items
    .map((i) => ({ label: i.label.trim(), amount: Number(i.amount.replace(/[^\d.]/g, '')) || 0 }))
    .filter((i) => i.label && i.amount > 0);
  const total = parsed.reduce((s, i) => s + i.amount, 0);
  const adv = Math.min(100, Math.max(0, Number(advance) || 0));
  const sent = QUOTE_VISIBLE.includes(r.status) && !!r.quote?.sentAt;
  const mAmt = Number(mAmount.replace(/[^\d.]/g, '')) || 0;
  const maintenance: Maintenance | null = mOn && mAmt > 0 ? { amount: mAmt, cycle: mCycle, startsFrom: mStart.trim(), includes: mIncludes.trim() } : null;

  async function save(send: boolean) {
    setMsg('');
    if (!parsed.length) return setMsg('Add at least one item with an amount.');
    if (mOn && mAmt <= 0) return setMsg('Enter the maintenance amount, or untick maintenance.');
    if (send && !confirmSend()) return;
    setBusy(true);
    try {
      await saveQuote(r.id, { items: parsed, total, advancePercent: adv, notes: notes.trim(), timeline: timeline.trim(), maintenance }, send);
      setMsg(send ? 'Quote sent. The client can now see it and accept it.' : 'Draft saved (not visible to the client).');
      onSaved();
    } catch {
      setMsg('Could not save the quote. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const confirmSend = () => {
    if (!sent) return true;
    return window.confirm('This replaces the quote the client already has and asks them to accept again. Continue?');
  };

  const setItem = (i: number, k: 'label' | 'amount', v: string) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <Panel
      title="Quote"
      action={
        r.quote?.sentAt ? (
          <span className="text-xs text-muted">Last sent {fmtDateTime(r.quote.sentAt)}</span>
        ) : r.quote ? (
          <span className="text-xs text-muted">Draft, not sent</span>
        ) : null
      }
    >
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_140px_36px] gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Item</span>
          <span>Amount (₹)</span>
          <span />
        </div>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_140px_36px] items-center gap-2">
            <label className="sr-only" htmlFor={`qi-${i}`}>Item {i + 1}</label>
            <input id={`qi-${i}`} className="field field-sm" value={it.label} onChange={(e) => setItem(i, 'label', e.target.value)} placeholder="e.g. Website design and build" />
            <label className="sr-only" htmlFor={`qa-${i}`}>Amount {i + 1}</label>
            <input id={`qa-${i}`} inputMode="numeric" className="field field-sm text-right" value={it.amount} onChange={(e) => setItem(i, 'amount', e.target.value)} placeholder="0" />
            <button
              type="button"
              aria-label={`Remove item ${i + 1}`}
              onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}
              className="h-9 w-9 rounded-full text-lg text-muted hover:bg-stone"
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setItems((xs) => [...xs, { label: '', amount: '' }])} className="self-start text-sm font-semibold underline underline-offset-2">
          + Add item
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="adv" className="label">Advance %</label>
          <input id="adv" inputMode="numeric" className="field field-sm" value={advance} onChange={(e) => setAdvance(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="qt" className="label">Delivery timeline</label>
          <input id="qt" className="field field-sm" value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. 12–15 working days" />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-sand p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-[#F5A31A]" checked={mOn} onChange={(e) => setMOn(e.target.checked)} />
          <span>
            <span className="block font-semibold">Maintenance charges</span>
            <span className="block text-xs text-muted">Recurring charge after delivery, shown separately from the one-time total.</span>
          </span>
        </label>
        {mOn && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ma" className="label">Amount (₹)</label>
                <input id="ma" inputMode="numeric" className="field field-sm text-right" value={mAmount} onChange={(e) => setMAmount(e.target.value)} placeholder="e.g. 1500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mc" className="label">Billed</label>
                <select id="mc" className="field field-sm" value={mCycle} onChange={(e) => setMCycle(e.target.value as Maintenance['cycle'])}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ms" className="label">Starts</label>
                <input id="ms" className="field field-sm" value={mStart} onChange={(e) => setMStart(e.target.value)} placeholder="e.g. After 1 free month" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mi" className="label">What it includes</label>
              <input id="mi" className="field field-sm" value={mIncludes} onChange={(e) => setMIncludes(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="qn" className="label">Notes for the client</label>
        <textarea
          id="qn"
          rows={3}
          className="field resize-y text-[15px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What's included, exclusions, GST, payment terms…"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3">
        <span className="text-sm">
          Total <strong className="font-display text-xl">{inr(total)}</strong>
          <span className="ml-3 text-muted">Advance {adv}% = {inr((total * adv) / 100)}</span>
          {maintenance && (
            <span className="ml-3 text-muted">
              + Maintenance <strong className="text-ink">{inr(maintenance.amount)}/{CYCLE_LABEL[maintenance.cycle]}</strong>
            </span>
          )}
        </span>
      </div>

      {msg && <p role="status" className="text-sm font-medium">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => save(false)} className="h-11 rounded-full border border-sand bg-white px-5 font-semibold disabled:opacity-60">
          Save draft
        </button>
        <button type="button" disabled={busy} onClick={() => save(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 font-bold text-ink disabled:opacity-60">
          {sent ? 'Send revised quote' : 'Send quote to client'} <ArrowRight size={16} />
        </button>
      </div>
    </Panel>
  );
}

/* ---------------- Payments ---------------- */

function Payments({ r, onSaved }: { r: ServiceRequest; onSaved: () => void }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [mode, setMode] = useState(PAYMENT_MODES[0]);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const total = r.quote?.total ?? 0;
  const paid = paidTotal(r);
  const advanceDue = Math.max(0, (total * (r.quote?.advancePercent ?? 0)) / 100 - paid);
  const balance = Math.max(0, total - paid);

  async function add() {
    setMsg('');
    const amt = Number(amount.replace(/[^\d.]/g, ''));
    if (!amt || amt <= 0) return setMsg('Enter the amount received.');
    if (!date) return setMsg('Enter the payment date.');
    setBusy(true);
    try {
      await recordPayment(r, { amount: amt, date, mode, reference: reference.trim(), note: note.trim() });
      setAmount('');
      setReference('');
      setNote('');
      setMsg('Payment recorded. The client sees it on their dashboard.');
      onSaved();
    } catch {
      setMsg('Could not record the payment. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(i: number) {
    if (!window.confirm('Remove this payment entry?')) return;
    try {
      await removePayment(r, i);
      onSaved();
    } catch {
      setMsg('Could not remove the payment.');
    }
  }

  return (
    <Panel title="Payments">
      <PaymentClaims r={r} onSaved={onSaved} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat k="Quote total" v={total ? inr(total) : '—'} />
        <Stat k="Received" v={inr(paid)} tone="text-[#166534]" />
        <Stat k="Advance due" v={total ? inr(advanceDue) : '—'} />
        <Stat k="Balance" v={total ? inr(balance) : '—'} />
      </div>

      {(r.payments ?? []).length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-sand text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Mode</th>
                <th className="py-2 pr-3 font-semibold">Reference</th>
                <th className="py-2 pr-3 text-right font-semibold">Amount</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {(r.payments ?? []).map((p, i) => (
                <tr key={i} className="border-b border-stone last:border-0">
                  <td className="py-2.5 pr-3">{fmtDate(p.date)}</td>
                  <td className="py-2.5 pr-3">{p.mode}</td>
                  <td className="py-2.5 pr-3 text-muted">
                    {p.reference || '—'}
                    {p.note ? <span className="block text-xs">{p.note}</span> : null}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-semibold">{inr(p.amount)}</td>
                  <td className="py-2.5 text-right">
                    <button type="button" onClick={() => remove(i)} className="text-xs font-semibold text-muted underline hover:text-[#B42318]">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line p-4">
        <span className="text-sm font-semibold">Record a payment received</span>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pa" className="label">Amount (₹) *</label>
            <input id="pa" inputMode="numeric" className="field field-sm" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={advanceDue ? String(Math.round(advanceDue)) : '0'} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pd" className="label">Date *</label>
            <input id="pd" type="date" className="field field-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pm" className="label">Mode</label>
            <select id="pm" className="field field-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
              {PAYMENT_MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pr" className="label">UTR / reference</label>
            <input id="pr" className="field field-sm" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="pn" className="label">Note</label>
            <input id="pn" className="field field-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 50% advance" />
          </div>
        </div>
        {msg && <p role="status" className="text-sm font-medium">{msg}</p>}
        <button type="button" disabled={busy} onClick={add} className="h-11 self-start rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-60">
          {busy ? 'Saving…' : 'Record payment'}
        </button>
        <p className="text-xs text-muted">Online payment through Razorpay can be added once your Razorpay account is approved.</p>
      </div>
    </Panel>
  );
}

function Stat({ k, v, tone = '' }: { k: string; v: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-cream px-3.5 py-3">
      <span className="text-xs font-medium text-muted">{k}</span>
      <span className={`font-display text-lg font-bold ${tone}`}>{v}</span>
    </div>
  );
}

/* ---------------- Internal notes ---------------- */

function InternalNotes({ id }: { id: string }) {
  const [notes, setNotes] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getInternalNotes(id)
      .then((n) => {
        setNotes(n);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [id]);

  async function save() {
    setMsg('');
    try {
      await saveInternalNotes(id, notes);
      setMsg('Saved.');
    } catch {
      setMsg('Could not save notes.');
    }
  }

  return (
    <Panel title="Team notes" action={<span className="text-xs text-muted">Private, client can’t see</span>}>
      <label htmlFor="notes" className="sr-only">Team notes</label>
      <textarea
        id="notes"
        rows={5}
        disabled={!loaded}
        className="field resize-y text-[15px]"
        placeholder="Call notes, decisions, follow-ups…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {msg && <p role="status" className="text-sm font-medium">{msg}</p>}
      <button type="button" onClick={save} className="h-10 self-start rounded-full border border-sand bg-white px-4 text-sm font-semibold hover:bg-peach">
        Save notes
      </button>
    </Panel>
  );
}

/* ---------------- Client-reported payments ---------------- */

function PaymentClaims({ r, onSaved }: { r: ServiceRequest; onSaved: () => void }) {
  const [busy, setBusy] = useState<number | null>(null);
  const claims = (r.paymentClaims ?? []).map((c, i) => ({ c, i })).filter(({ c }) => !c.verified && !c.rejected);
  if (!claims.length) return null;

  async function act(i: number, ok: boolean) {
    if (!ok && !window.confirm('Mark this as not received? The client will still see it as pending.')) return;
    setBusy(i);
    try {
      if (ok) await verifyClaim(r, i);
      else await rejectClaim(r, i);
      onSaved();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#FDA4AF] bg-[#FFF1F2] p-4">
      <span className="text-sm font-semibold text-[#9F1239]">Client says they paid. Check your bank / UPI app, then confirm.</span>
      {claims.map(({ c, i }) => (
        <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 text-sm">
          <span>
            <strong>{inr(c.amount)}</strong> by {c.mode} · UTR <strong>{c.utr}</strong>
            <span className="ml-2 text-xs text-muted">{fmtDateTime(c.at)}</span>
          </span>
          <span className="flex gap-2">
            <button type="button" disabled={busy !== null} onClick={() => act(i, true)} className="h-9 rounded-full bg-[#15803D] px-4 text-sm font-semibold text-white disabled:opacity-60">
              {busy === i ? 'Saving…' : 'Confirm received'}
            </button>
            <button type="button" disabled={busy !== null} onClick={() => act(i, false)} className="h-9 rounded-full border border-sand px-3 text-sm font-semibold">
              Not received
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Invoice + payment link ---------------- */

function InvoiceAndLink({ r, onSaved }: { r: ServiceRequest; onSaved: () => void }) {
  const [link, setLink] = useState(r.paymentLink ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const canInvoice = !!r.quote?.total && ['quote_accepted', 'advance_paid', 'in_progress', 'live', 'completed'].includes(r.status);

  async function makeInvoice() {
    setMsg('');
    setBusy(true);
    try {
      const s = await getSettings();
      const n = await createInvoice(r, s.invoicePrefix);
      setMsg(`Invoice ${n} created. The client can download it from their dashboard.`);
      onSaved();
    } catch {
      setMsg('Could not create the invoice. Make sure the latest security rules are published.');
    } finally {
      setBusy(false);
    }
  }

  async function saveLink() {
    setMsg('');
    const v = link.trim();
    if (v && !/^https:\/\/\S+$/.test(v)) return setMsg('Paste a full link starting with https://');
    try {
      await setPaymentLink(r.id, v);
      setMsg(v ? 'Payment link saved. The client now sees a "Pay online" button.' : 'Payment link removed.');
      onSaved();
    } catch {
      setMsg('Could not save the link.');
    }
  }

  return (
    <Panel title="Invoice and online payment">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3.5">
        {r.invoice ? (
          <>
            <span className="text-sm">
              Invoice <strong>{r.invoice.number}</strong> · {fmtDate(r.invoice.date)}
            </span>
            <Link href={`/invoice/?id=${r.id}`} className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white">
              View / download PDF
            </Link>
          </>
        ) : (
          <>
            <span className="text-sm text-muted">
              {canInvoice ? 'Create a numbered invoice the client can download.' : 'Available once the client accepts the quote.'}
            </span>
            <button
              type="button"
              disabled={!canInvoice || busy}
              onClick={makeInvoice}
              className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? 'Creating…' : 'Create invoice'}
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="plink" className="label">
          Razorpay payment link <span className="font-normal text-muted">(optional, for card / netbanking)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="plink"
            className="field field-sm min-w-0 flex-1"
            placeholder="https://rzp.io/l/…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <button type="button" onClick={saveLink} className="h-11 rounded-full border border-sand bg-white px-4 text-sm font-semibold hover:bg-peach">
            Save link
          </button>
        </div>
        <p className="text-xs text-muted">Create it in Razorpay → Payment Links for the amount due, then paste it here.</p>
      </div>
      {msg && <p role="status" className="text-sm font-medium">{msg}</p>}
    </Panel>
  );
}
