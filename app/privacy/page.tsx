import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy policy' };

// Template text. Have it reviewed by your legal advisor before going live.
export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="27 October 2026">
      <p>
        This policy explains how {site.legalName} (“Big Payrolls”, “we”, “us”) collects, uses and protects your information when you use{' '}
        {site.domain} and our services.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account details: name, company name, mobile number, email address.</li>
        <li>Request details you share: services needed, industry, features, budget, timeline and call preferences.</li>
        <li>Payment details are handled by our payment partner; we do not store your card or UPI details.</li>
        <li>Basic technical data such as browser type and pages visited, used to keep the site secure and working.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To create and manage your client account.</li>
        <li>To contact you about your request, schedule calls and send quotes.</li>
        <li>To deliver the services you buy and provide support.</li>
        <li>To meet legal and tax obligations.</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We do not sell your personal information. We share it only with service providers who help us run the website and services
        (for example hosting, login and payment providers), and when required by law.
      </p>
      <h2>Storage and security</h2>
      <p>
        Your data is stored with Google Firebase. Access is limited to you and authorised Big Payrolls staff. We keep data only as long
        as needed for the purposes above or as required by law.
      </p>
      <h2>Your choices</h2>
      <p>
        You can ask us to see, correct or delete your information by writing to {site.email}. We will respond within a reasonable
        time.
      </p>
      <h2>Contact</h2>
      <p>
        {site.legalName}, {site.address}. Email: {site.email}. Phone: {site.phone}.
      </p>
    </LegalPage>
  );
}
