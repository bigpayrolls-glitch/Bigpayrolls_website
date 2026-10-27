// Admin-only data functions. Firestore rules allow these only for users with role "admin".
import { arrayUnion, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { requireDb, type Payment, type Profile, type Quote, type ServiceRequest } from './data';
import { statusLabel } from './catalog';

export type ClientRow = Profile & { uid: string };

const byNewest = <T extends { createdAt?: Timestamp }>(a: T, b: T) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);

export async function listAllRequests(): Promise<ServiceRequest[]> {
  const snap = await getDocs(collection(requireDb(), 'requests'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceRequest, 'id'>) })).sort(byNewest);
}

export async function listClients(): Promise<ClientRow[]> {
  const snap = await getDocs(collection(requireDb(), 'users'));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Profile) })).sort(byNewest);
}

export async function getRequest(id: string): Promise<ServiceRequest | null> {
  const snap = await getDoc(doc(requireDb(), 'requests', id));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<ServiceRequest, 'id'>) } : null;
}

export async function getClient(uid: string): Promise<ClientRow | null> {
  const snap = await getDoc(doc(requireDb(), 'users', uid));
  return snap.exists() ? { uid, ...(snap.data() as Profile) } : null;
}

/** Post an update to the client's dashboard, optionally changing the status. */
export async function postUpdate(id: string, text: string, status?: string) {
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  const msg = text.trim() || (status ? `Status changed to ${statusLabel(status)}.` : '');
  if (status) patch.status = status;
  if (msg) patch.updates = arrayUnion({ text: msg, ...(status ? { status } : {}), at: Timestamp.now(), by: 'Big Payrolls' });
  await updateDoc(doc(requireDb(), 'requests', id), patch);
}

/** Save the quote. When `send` is true the client can see it and the status becomes "quote_sent". */
export async function saveQuote(id: string, quote: Omit<Quote, 'sentAt'>, send: boolean) {
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (send) {
    patch.quote = { ...quote, sentAt: Timestamp.now() };
    patch.status = 'quote_sent';
    patch.clientResponse = null;
    patch.updates = arrayUnion({
      text: 'Your custom quote is ready. Please review it below and accept it, or ask for changes.',
      status: 'quote_sent',
      at: Timestamp.now(),
      by: 'Big Payrolls',
    });
  } else {
    patch.quote = quote;
  }
  await updateDoc(doc(requireDb(), 'requests', id), patch);
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

/** Record a payment received. Moves the request to "advance_paid" if it was waiting for payment. */
export async function recordPayment(r: ServiceRequest, p: Omit<Payment, 'at'>) {
  const patch: Record<string, unknown> = {
    payments: arrayUnion({ ...p, at: Timestamp.now() }),
    updatedAt: serverTimestamp(),
  };
  const waiting = ['quote_sent', 'quote_accepted', 'changes_requested'].includes(r.status);
  if (waiting) patch.status = 'advance_paid';
  patch.updates = arrayUnion({
    text: `Payment of ${inr(p.amount)} received (${p.mode}). Thank you!`,
    ...(waiting ? { status: 'advance_paid' } : {}),
    at: Timestamp.now(),
    by: 'Big Payrolls',
  });
  await updateDoc(doc(requireDb(), 'requests', r.id), patch);
}

/** Remove a payment entered by mistake. */
export async function removePayment(r: ServiceRequest, index: number) {
  const payments = (r.payments ?? []).filter((_, i) => i !== index);
  await updateDoc(doc(requireDb(), 'requests', r.id), { payments, updatedAt: serverTimestamp() });
}

/** Private notes for the Big Payrolls team (clients cannot read these). */
export async function getInternalNotes(id: string): Promise<string> {
  const snap = await getDoc(doc(requireDb(), 'internal', id));
  return snap.exists() ? String(snap.data().notes ?? '') : '';
}

export async function saveInternalNotes(id: string, notes: string) {
  await setDoc(doc(requireDb(), 'internal', id), { notes, updatedAt: serverTimestamp() }, { merge: true });
}

/** Confirm a payment the client reported: records it as a payment and marks the claim verified. */
export async function verifyClaim(r: ServiceRequest, index: number) {
  const claim = (r.paymentClaims ?? [])[index];
  if (!claim) return;
  const claims = (r.paymentClaims ?? []).map((c, i) => (i === index ? { ...c, verified: true } : c));
  const d = claim.at?.toDate?.() ?? new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await updateDoc(doc(requireDb(), 'requests', r.id), { paymentClaims: claims });
  await recordPayment({ ...r, paymentClaims: claims }, { amount: claim.amount, date, mode: claim.mode, reference: claim.utr, note: 'Reported by client' });
}

/** Dismiss a claim that could not be matched (keeps it in the list as rejected). */
export async function rejectClaim(r: ServiceRequest, index: number) {
  const claims = (r.paymentClaims ?? []).map((c, i) => (i === index ? { ...c, verified: false, rejected: true } : c));
  await updateDoc(doc(requireDb(), 'requests', r.id), { paymentClaims: claims, updatedAt: serverTimestamp() });
}
