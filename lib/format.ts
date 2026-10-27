import type { Timestamp } from 'firebase/firestore';

export const inr = (n: number | undefined | null) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export function fmtDate(t?: Timestamp | string | null) {
  if (!t) return '';
  const d = typeof t === 'string' ? new Date(t + 'T00:00:00') : t.toDate?.();
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(t?: Timestamp | null) {
  const d = t?.toDate?.();
  if (!d) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** WhatsApp link for an Indian mobile number. */
export const waLink = (phone: string, text = '') => {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `https://wa.me/91${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
