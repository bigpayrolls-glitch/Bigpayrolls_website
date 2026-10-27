import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Terms and conditions' };

// Template text. Have it reviewed by your legal advisor before going live.
export default function Terms() {
  return (
    <LegalPage title="Terms and conditions" updated="27 October 2026">
      <p>
        These terms apply to your use of {site.domain} and to services provided by {site.legalName} (“Big Payrolls”). By creating an
        account or placing a request you agree to them.
      </p>
      <h2>Accounts</h2>
      <p>You must give accurate information and keep your login details safe. You are responsible for activity on your account.</p>
      <h2>Quotes and scope</h2>
      <ul>
        <li>Every project is quoted individually after a discovery call. The quote lists the scope, price, timeline and payment terms.</li>
        <li>Work starts after you accept the quote and pay the advance shown in it.</li>
        <li>Work outside the accepted scope is quoted separately.</li>
        <li>Prices are in Indian Rupees and exclude GST unless the quote says otherwise.</li>
      </ul>
      <h2>Your responsibilities</h2>
      <p>
        You provide the content, data and approvals we need (for example employee data for payroll, or menus and photos for a website)
        on time. Delays in providing them may move the timeline.
      </p>
      <h2>Payroll and compliance services</h2>
      <p>
        We process payroll and statutory filings based on the data you provide. You remain responsible for the accuracy of that data
        and for making statutory payments where the law requires the employer to do so.
      </p>
      <h2>Ownership</h2>
      <p>
        Once paid in full, you own the website or software content created specifically for you. We may keep reusable tools and
        components, and may show the work in our portfolio unless you ask us not to.
      </p>
      <h2>Liability</h2>
      <p>
        Our total liability for any claim is limited to the amount you paid for the service concerned. We are not liable for indirect
        or consequential losses.
      </p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India. Courts at [Your city] have jurisdiction.</p>
      <h2>Contact</h2>
      <p>
        {site.email} · {site.phone}
      </p>
    </LegalPage>
  );
}
