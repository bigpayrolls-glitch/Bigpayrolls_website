// Everything shown on an invoice or advance receipt, worked out from the request in one place
// (so the page, the admin editor and the tests agree on every number).
import { paidTotal, paymentKey, type InvoiceLine, type Payment, type ServiceRequest } from './data';

export type InvoiceStatus = 'Paid in full' | 'Advance received' | 'Partly paid' | 'Payment due';

export type InvoiceView = {
  lines: InvoiceLine[];
  heading: string;
  total: number;
  covered: Payment[];
  received: number;
  balance: number;
  status: InvoiceStatus;
  projectValue: number;
  projectReceived: number;
  projectBalance: number;
  /** Payments outside this invoice (shown in the project summary, with their receipt number if any) */
  others: Payment[];
  billTo: { name: string; attn: string; address: string; phones: string; email: string };
  project: { name: string; subtitle: string; timeline: string };
  notes: string;
};

const sum = (xs: { amount: number }[]) => xs.reduce((s, x) => s + (Number(x.amount) || 0), 0);

export function invoiceView(r: ServiceRequest): InvoiceView {
  const inv = r.invoice ?? ({} as NonNullable<ServiceRequest['invoice']>);
  const payments = r.payments ?? [];
  const custom = (inv.lines ?? []).filter((l) => l.label.trim() || l.amount);
  const lines: InvoiceLine[] = custom.length ? custom : (r.quote?.items ?? []).map((i) => ({ label: i.label, detail: i.detail, amount: i.amount }));
  const total = sum(lines);
  const covered = inv.covers ? payments.filter((p) => inv.covers!.includes(paymentKey(p))) : payments;
  const received = sum(covered);
  const balance = Math.max(0, total - received);
  const projectValue = r.quote?.total ?? total;
  const projectReceived = paidTotal(r);
  const projectBalance = Math.max(0, projectValue - projectReceived);
  const status: InvoiceStatus =
    total > 0 && balance <= 0 ? (projectBalance > 0 ? 'Advance received' : 'Paid in full') : received > 0 ? 'Partly paid' : 'Payment due';
  const d = r.details;
  return {
    lines,
    heading: inv.heading?.trim() ?? '',
    total,
    covered,
    received,
    balance,
    status,
    projectValue,
    projectReceived,
    projectBalance,
    others: payments.filter((p) => !covered.includes(p)),
    billTo: {
      name: inv.billTo?.name?.trim() || d.business,
      attn: inv.billTo?.attn?.trim() ?? d.name,
      address: inv.billTo?.address?.trim() ?? d.city,
      phones: inv.billTo?.phones?.trim() ?? (d.phone ? `+91 ${d.phone}` : ''),
      email: inv.billTo?.email?.trim() ?? d.email,
    },
    project: {
      name: inv.project?.name?.trim() || '',
      subtitle: inv.project?.subtitle?.trim() || '',
      timeline: inv.project?.timeline?.trim() ?? r.quote?.timeline ?? '',
    },
    notes: inv.notes?.trim() ?? r.quote?.notes ?? '',
  };
}

/** For a receipt: totals for the whole project up to and including all recorded payments. */
export function receiptView(r: ServiceRequest, p: Payment) {
  const projectValue = r.quote?.total ?? 0;
  const projectReceived = paidTotal(r);
  return { amount: Number(p.amount) || 0, projectValue, projectReceived, projectBalance: Math.max(0, projectValue - projectReceived) };
}
