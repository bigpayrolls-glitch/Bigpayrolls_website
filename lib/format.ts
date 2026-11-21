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

/** Indian-system amount in words, e.g. 100000 -> "One Lakh". */
export function rupeesInWords(n: number): string {
  n = Math.round(Number(n) || 0);
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x: number) => (x < 20 ? ones[x]! : `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ''}`);
  const three = (x: number) => (x >= 100 ? `${ones[Math.floor(x / 100)]} Hundred${x % 100 ? ` ${two(x % 100)}` : ''}` : two(x));
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const rest = n % 1e3;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (rest) parts.push(three(rest));
  return parts.join(' ');
}
