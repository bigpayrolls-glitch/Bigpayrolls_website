import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export type Profile = {
  name: string;
  company: string;
  phone: string;
  email: string;
  interests: string[];
  companySize: string | null;
  role: 'client' | 'admin';
  createdAt?: Timestamp;
};

export type QuoteItem = { label: string; amount: number };

/** Recurring maintenance charge, billed separately from the one-time project total. */
export type Maintenance = {
  amount: number;
  cycle: 'monthly' | 'quarterly' | 'yearly';
  /** When billing starts, e.g. "From the month after the site goes live" */
  startsFrom?: string;
  /** What the maintenance covers */
  includes?: string;
};

export const CYCLE_LABEL: Record<Maintenance['cycle'], string> = { monthly: 'month', quarterly: 'quarter', yearly: 'year' };
export const CYCLE_NAME: Record<Maintenance['cycle'], string> = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };

export type Quote = {
  items: QuoteItem[];
  total: number;
  /** Percentage of the total due as advance, e.g. 50 */
  advancePercent: number;
  notes?: string;
  timeline?: string;
  /** Optional recurring maintenance (not part of the one-time total or the advance) */
  maintenance?: Maintenance | null;
  sentAt?: Timestamp;
};

/** A message posted to the client's dashboard (shown newest first). */
export type RequestUpdate = { text: string; status?: string; at: Timestamp; by: string };

export type Payment = {
  amount: number;
  /** yyyy-mm-dd */
  date: string;
  mode: string;
  reference?: string;
  note?: string;
  at: Timestamp;
};

export type PaymentClaim = { amount: number; utr: string; mode: string; at: Timestamp; verified?: boolean; rejected?: boolean };

export type ClientResponse = { decision: 'accepted' | 'changes_requested'; note?: string; at: Timestamp };

export type ServiceRequest = {
  id: string;
  uid: string;
  services: string[];
  industry: string;
  businessType: string;
  features: string[];
  details: { name: string; business: string; phone: string; email: string; city: string; website: string; notes: string };
  budget: string | null;
  timeline: string | null;
  call: { date: string; dateLabel: string; slot: string; mode: string };
  status: string;
  quote?: Quote | null;
  updates?: RequestUpdate[];
  payments?: Payment[];
  clientResponse?: ClientResponse | null;
  invoice?: { number: string; date: string; createdAt?: Timestamp } | null;
  /** Razorpay (or other) payment link pasted by the admin */
  paymentLink?: string;
  /** Payments the client says they made, waiting for admin to verify */
  paymentClaims?: PaymentClaim[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

/** Statuses at which the client can see the quote. */
export const QUOTE_VISIBLE = ['quote_sent', 'changes_requested', 'quote_accepted', 'advance_paid', 'in_progress', 'live', 'completed'];

export function requireDb() {
  if (!db) throw new Error('Firebase is not configured yet. Add the values in .env.local.');
  return db;
}

export const paidTotal = (r: Pick<ServiceRequest, 'payments'>) => (r.payments ?? []).reduce((s, p) => s + (Number(p.amount) || 0), 0);

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(requireDb(), 'users', uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}

export async function saveProfile(uid: string, p: Omit<Profile, 'role' | 'createdAt'>) {
  const ref = doc(requireDb(), 'users', uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    // Never touch role or createdAt on an existing profile
    await setDoc(ref, { ...p, updatedAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(ref, { ...p, role: 'client', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}

export async function createRequest(
  uid: string,
  r: Omit<
    ServiceRequest,
    'id' | 'uid' | 'status' | 'createdAt' | 'updatedAt' | 'quote' | 'updates' | 'payments' | 'clientResponse' | 'invoice' | 'paymentLink' | 'paymentClaims'
  >,
) {
  const ref = await addDoc(collection(requireDb(), 'requests'), {
    ...r,
    uid,
    status: 'submitted',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listMyRequests(uid: string): Promise<ServiceRequest[]> {
  const snap = await getDocs(query(collection(requireDb(), 'requests'), where('uid', '==', uid)));
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceRequest, 'id'>) }));
  // Newest first (sorted here so no extra Firestore index is needed)
  return rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

/** Client accepts the quote or asks for changes (only allowed while status is "quote_sent"). */
export async function respondToQuote(requestId: string, decision: ClientResponse['decision'], note: string) {
  await updateDoc(doc(requireDb(), 'requests', requestId), {
    status: decision === 'accepted' ? 'quote_accepted' : 'changes_requested',
    clientResponse: { decision, note: note.trim(), at: Timestamp.now() },
    updatedAt: serverTimestamp(),
  });
}
