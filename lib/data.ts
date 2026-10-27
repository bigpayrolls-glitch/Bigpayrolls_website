import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
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
};

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
  quote?: { total: number; items: { label: string; amount: number }[]; notes?: string; advancePercent?: number } | null;
  createdAt?: Timestamp;
};

function requireDb() {
  if (!db) throw new Error('Firebase is not configured yet. Add the values in .env.local.');
  return db;
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(requireDb(), 'users', uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}

export async function saveProfile(uid: string, p: Omit<Profile, 'role'>) {
  const ref = doc(requireDb(), 'users', uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    // Never touch role or createdAt on an existing profile
    await setDoc(ref, { ...p, updatedAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(ref, { ...p, role: 'client', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}

export async function createRequest(uid: string, r: Omit<ServiceRequest, 'id' | 'uid' | 'status' | 'createdAt' | 'quote'>) {
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
