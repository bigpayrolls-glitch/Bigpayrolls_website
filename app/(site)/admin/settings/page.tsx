'use client';

import { useEffect, useState } from 'react';
import AdminShell, { Panel } from '@/components/AdminShell';
import { DEFAULT_SETTINGS, getSettings, saveSettings, type BusinessSettings } from '@/lib/settings';

export default function AdminSettings() {
  return <AdminShell>{() => <SettingsForm />}</AdminShell>;
}

function SettingsForm() {
  const [s, setS] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getSettings()
      .then((x) => {
        setS(x);
        setLoaded(true);
      })
      .catch(() => {
        setMsg('Could not load settings. Publish the latest security rules first.');
        setLoaded(true);
      });
  }, []);

  const f = (k: keyof BusinessSettings) => ({
    value: s[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.value }),
  });

  async function save() {
    setMsg('');
    if (s.upiId && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(s.upiId.trim())) return setMsg('UPI ID looks wrong. It should look like name@bank.');
    if (s.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(s.ifsc.trim().toUpperCase())) return setMsg('IFSC should be 11 characters, like HDFC0001234.');
    setBusy(true);
    try {
      await saveSettings({ ...s, upiId: s.upiId.trim(), ifsc: s.ifsc.trim().toUpperCase(), accountNumber: s.accountNumber.replace(/\s/g, '') });
      setMsg('Saved. Clients will see these details when they pay.');
    } catch {
      setMsg('Could not save. Make sure the latest security rules are published.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-[900px] flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Settings</h1>
        <p className="text-muted">Payment details clients see, and what is printed on invoices.</p>
      </div>

      <Panel title="UPI payments">
        <p className="-mt-2 text-sm text-muted">
          Clients get a <strong>Pay with UPI</strong> button (opens GPay, PhonePe, Paytm with the amount filled in) and a QR code. Free, money goes
          straight to your bank.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="upi" label="UPI ID" placeholder="e.g. bigpayrolls@okhdfcbank" {...f('upiId')} />
          <Field id="payee" label="Name shown in UPI app" {...f('payeeName')} />
        </div>
      </Panel>

      <Panel title="Bank transfer (NEFT / IMPS / RTGS)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="acname" label="Account name" {...f('accountName')} />
          <Field id="acno" label="Account number" {...f('accountNumber')} />
          <Field id="ifsc" label="IFSC" placeholder="HDFC0001234" {...f('ifsc')} />
          <Field id="bank" label="Bank name" {...f('bankName')} />
          <Field id="branch" label="Branch" {...f('branch')} />
        </div>
        <Field id="pnote" label="Note shown with payment options" area {...f('paymentNote')} />
      </Panel>

      <Panel title="Invoices">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="prefix" label="Invoice number prefix" placeholder="BP" {...f('invoicePrefix')} />
          <Field id="gstin" label="GSTIN (leave empty if not registered)" {...f('gstin')} />
          <Field id="iemail" label="Email on invoice" {...f('invoiceEmail')} />
          <Field id="iphone" label="Phone on invoice" {...f('invoicePhone')} />
        </div>
        <Field id="iaddr" label="Address on invoice (optional)" area {...f('invoiceAddress')} />
        <Field id="ifoot" label="Footer line" {...f('invoiceFooter')} />
        <p className="text-xs text-muted">
          Invoice numbers run in order per financial year, e.g. {(s.invoicePrefix || 'BP').trim()}/2026-27/0001.
        </p>
      </Panel>

      {msg && <p role="status" className="font-medium">{msg}</p>}
      <button type="button" disabled={busy || !loaded} onClick={save} className="h-12 self-start rounded-full bg-ink px-7 font-semibold text-white disabled:opacity-60">
        {busy ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}

function Field({
  id,
  label,
  area = false,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  area?: boolean;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">{label}</label>
      {area ? (
        <textarea id={id} rows={2} className="field resize-y text-[15px]" value={value} onChange={onChange} placeholder={placeholder} />
      ) : (
        <input id={id} className="field field-sm" value={value} onChange={onChange} placeholder={placeholder} />
      )}
    </div>
  );
}
