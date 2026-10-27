// Business settings (payment + invoice details), invoice numbering and client payment claims.
import { arrayUnion, doc, getDoc, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { paidTotal, requireDb, type ServiceRequest } from './data';
import { site } from './site';
import { todayISO } from './format';

export type BusinessSettings = {
  /** UPI ID shown to clients, e.g. bigpayrolls@okhdfcbank */
  upiId: string;
  /** Name shown in the UPI app */
  payeeName: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  /** Shown under payment options, e.g. "Please share the UTR after paying." */
  paymentNote: string;
  /** Invoice number prefix, e.g. BP */
  invoicePrefix: string;
  /** Optional address printed on invoices */
  invoiceAddress: string;
  invoiceEmail: string;
  invoicePhone: string;
  gstin: string;
  /** Footer line on invoices */
  invoiceFooter: string;
};

export const DEFAULT_SETTINGS: BusinessSettings = {
  upiId: '',
  payeeName: site.legalName,
  bankName: '',
  accountName: site.legalName,
  accountNumber: '',
  ifsc: '',
  branch: '',
  paymentNote: 'After paying, please submit the UTR / transaction ID below so we can confirm it quickly.',
  invoicePrefix: 'BP',
  invoiceAddress: '',
  invoiceEmail: '',
  invoicePhone: '',
  gstin: '',
  invoiceFooter: 'Thank you for your business!',
};

export async function getSettings(): Promise<BusinessSettings> {
  const snap = await getDoc(doc(requireDb(), 'settings', 'business'));
  return { ...DEFAULT_SETTINGS, ...(snap.exists() ? (snap.data() as Partial<BusinessSettings>) : {}) };
}

export async function saveSettings(s: BusinessSettings) {
  await setDoc(doc(requireDb(), 'settings', 'business'), { ...s, updatedAt: serverTimestamp() }, { merge: true });
}

/** Indian financial year label for a date, e.g. 2026-27 */
export function financialYear(d = new Date()) {
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/** Creates the invoice for a request with the next sequential number (e.g. BP/2026-27/0001). Admin only. */
export async function createInvoice(r: ServiceRequest, prefix: string) {
  const db = requireDb();
  const fy = financialYear();
  const counterRef = doc(db, 'settings', 'counters');
  const reqRef = doc(db, 'requests', r.id);
  return runTransaction(db, async (tx) => {
    const req = await tx.get(reqRef);
    const existing = req.data()?.invoice;
    if (existing?.number) return existing.number as string;
    const c = await tx.get(counterRef);
    const key = `invoice_${fy.replace('-', '_')}`;
    const next = ((c.exists() ? (c.data()[key] as number) : 0) || 0) + 1;
    const number = `${(prefix || 'BP').trim()}/${fy}/${String(next).padStart(4, '0')}`;
    tx.set(counterRef, { [key]: next }, { merge: true });
    tx.update(reqRef, {
      invoice: { number, date: todayISO(), createdAt: Timestamp.now() },
      updates: arrayUnion({ text: `Invoice ${number} is ready to download.`, at: Timestamp.now(), by: 'Big Payrolls' }),
      updatedAt: serverTimestamp(),
    });
    return number;
  });
}

/** Admin: set (or clear) a Razorpay / payment link for this request. */
export async function setPaymentLink(id: string, link: string) {
  await updateDoc(doc(requireDb(), 'requests', id), { paymentLink: link.trim(), updatedAt: serverTimestamp() });
}

/** Client: tell us they have paid (admin then verifies and records it). */
export async function submitPaymentClaim(id: string, claim: { amount: number; utr: string; mode: string }) {
  await updateDoc(doc(requireDb(), 'requests', id), {
    paymentClaims: arrayUnion({ ...claim, utr: claim.utr.trim(), at: Timestamp.now() }),
    updatedAt: serverTimestamp(),
  });
}

/** Statuses where the client can pay. */
export const PAYABLE = ['quote_accepted', 'advance_paid', 'in_progress', 'live', 'completed'];

/** What the client should pay now: the rest of the advance first, then the balance. */
export function amountDue(r: ServiceRequest) {
  const total = r.quote?.total ?? 0;
  const paid = paidTotal(r);
  const advance = (total * (r.quote?.advancePercent ?? 0)) / 100;
  const advanceLeft = Math.max(0, Math.round(advance - paid));
  const balance = Math.max(0, Math.round(total - paid));
  return { total, paid, advanceLeft, balance, now: advanceLeft > 0 ? advanceLeft : balance, isAdvance: advanceLeft > 0 };
}

/** UPI deep link that opens GPay / PhonePe / Paytm with the amount filled in. */
export function upiLink(s: Pick<BusinessSettings, 'upiId' | 'payeeName'>, amount: number, note: string) {
  const p = new URLSearchParams({ pa: s.upiId.trim(), pn: s.payeeName.trim() || site.legalName, am: amount.toFixed(2), cu: 'INR', tn: note.slice(0, 50) });
  return `upi://pay?${p.toString().replace(/\+/g, '%20')}`;
}
