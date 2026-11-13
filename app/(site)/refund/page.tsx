import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { contactLine } from '@/lib/site';

export const metadata: Metadata = { title: 'Refund and cancellation policy' };

// Template text. Have it reviewed by your legal advisor before going live.
export default function Refund() {
  return (
    <LegalPage title="Refund and cancellation policy" updated="27 October 2026">
      <h2>Before work starts</h2>
      <p>
        If you cancel after paying the advance but before we start design or setup, we refund the advance in full, minus any payment
        gateway charges.
      </p>
      <h2>After work starts</h2>
      <ul>
        <li>The advance is non-refundable once design, development or onboarding has started.</li>
        <li>Milestone payments already made are non-refundable for work delivered up to that milestone.</li>
        <li>Monthly services (payroll, compliance, maintenance) can be cancelled with 30 days’ notice. Fees for months already served are not refunded.</li>
      </ul>
      <h2>Domain, hosting and third-party fees</h2>
      <p>Domain names, hosting, SMS, WhatsApp and other third-party charges paid on your behalf are non-refundable.</p>
      <h2>How refunds are paid</h2>
      <p>Approved refunds are paid to the original payment method within 7–10 working days.</p>
      <h2>Contact</h2>
      <p>
        To request a cancellation or refund, contact us {contactLine()} with your registered email and request details.
      </p>
    </LegalPage>
  );
}
