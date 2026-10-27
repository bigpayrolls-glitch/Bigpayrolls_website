import Link from 'next/link';
import { site } from '@/lib/site';

const COLS = [
  { h: 'Services', links: [['Payroll', '/#services'], ['PF and ESI', '/#services'], ['Recruitment', '/#services'], ['Websites and apps', '/#services']] },
  { h: 'Products', links: [['PF Mitra', '/#products'], ['Auto Talent Grid', '/#products']] },
  { h: 'Company', links: [['How it works', '/#how'], ['Get started', '/signup/'], ['Client sign in', '/signin/']] },
  { h: 'Legal', links: [['Privacy policy', '/privacy/'], ['Terms and conditions', '/terms/'], ['Refund policy', '/refund/']] },
];

export default function Footer() {
  return (
    <footer id="contact" className="bg-peach">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 pb-8 pt-16">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="flex max-w-[340px] flex-[1_1_280px] flex-col gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-stacked.png" alt={site.legalName} className="h-24 w-auto self-start" />
            <p className="text-[15px] leading-relaxed text-muted">HR services, payroll, compliance and technology for growing businesses.</p>
            <div className="flex flex-col gap-1.5 text-[15px]">
              <span>{site.phone}</span>
              <span>{site.email}</span>
              <span>{site.address}</span>
            </div>
          </div>
          <div className="grid flex-[2_1_520px] grid-cols-2 gap-8 sm:grid-cols-4">
            {COLS.map((c) => (
              <div key={c.h} className="flex flex-col gap-3">
                <span className="text-sm font-bold">{c.h}</span>
                {c.links.map(([label, href]) => (
                  <Link key={label} href={href} className="text-[15px] text-muted hover:text-ink">
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-[#ead9bc] pt-6 text-sm text-muted">
          <span>© {new Date().getFullYear()} {site.legalName}</span>
          <span>
            CIN: {site.cin} · GSTIN: {site.gstin}
          </span>
        </div>
      </div>
    </footer>
  );
}
