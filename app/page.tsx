import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Photo from '@/components/Photo';
import { ArrowRight, Check, Phone, Sparkle } from '@/components/Icons';
import { photos } from '@/lib/site';

const TRUST = ['Free discovery call', 'Custom quote, no fixed packages', 'Support on WhatsApp'];
const STRIP = ['Payroll', 'PF and ESI', 'Hiring', 'Compliance', 'Websites', 'Apps', 'Software'];
const HR = ['Payroll processing', 'PF and ESI', 'Recruitment', 'Attendance and leave', 'PT, LWF, gratuity', 'HR policies'];
const TECH = ['Business websites', 'Online ordering', 'Booking systems', 'Mobile apps', 'Custom software', 'Hosting and support'];

const AI = [
  { n: '01', t: 'Smart payroll checks', d: 'Unusual salaries and missing deductions flagged before payout.' },
  { n: '02', t: 'Deadline reminders', d: 'Alerts before every PF, ESI and PT due date.' },
  { n: '03', t: 'Resume screening', d: 'Candidates ranked against your job, best first.' },
  { n: '04', t: 'Quick employee answers', d: 'Payslip, leave and PF questions answered fast.' },
];

const INDUSTRIES = [
  { t: 'Hotels and restaurants', d: 'Staff payroll and ordering websites', hint: 'Photo: restaurant staff', photo: photos.industryRestaurant, tone: 'warm' as const },
  { t: 'Retail and shops', d: 'Payroll and online stores', hint: 'Photo: shop owner at counter', photo: photos.industryRetail, tone: 'stone' as const },
  { t: 'Healthcare', d: 'Compliance and booking systems', hint: 'Photo: clinic reception', photo: photos.industryHealthcare, tone: 'warm' as const },
  { t: 'Manufacturing', d: 'PF, ESI and contract staff', hint: 'Photo: factory team', photo: photos.industryManufacturing, tone: 'stone' as const },
];

const STEPS = [
  { n: '1', t: 'Tell us what you need', d: 'Create an account and pick your service, industry and features.' },
  { n: '2', t: 'Free discovery call', d: 'We call to understand exactly what your business needs.' },
  { n: '3', t: 'Custom quote', d: 'Review it in your dashboard, accept and pay the advance online.' },
  { n: '4', t: 'We deliver', d: 'Follow progress in your dashboard until it goes live.' },
];

const PF_ROWS = [
  { t: 'Monthly ECR', s: 'Filed', ok: true },
  { t: 'Challan payment', s: 'Paid', ok: true },
  { t: 'UAN KYC updates', s: 'Pending', ok: false },
];

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <span className={`text-sm font-semibold uppercase tracking-[0.1em] text-brand-dark ${center ? 'text-center' : ''}`}>{children}</span>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        {/* Hero */}
        <section className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-12 px-6 pb-14 pt-6">
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-sand bg-white px-3.5 py-1.5 text-sm font-medium">
              <Sparkle size={16} className="text-[#E08600]" />
              HR + Tech, now with a little AI
            </span>
            <h1 className="font-display text-5xl font-bold leading-none tracking-[-0.035em] sm:text-6xl lg:text-[72px]">
              Payroll, people and tech,{' '}
              <span className="relative inline-block">
                sorted.
                <svg viewBox="0 0 220 24" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-3.5 left-0 h-5 w-full">
                  <path d="M4 16 C 60 4, 140 4, 216 14" fill="none" stroke="#F9A11B" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="max-w-[540px] text-lg leading-relaxed text-muted sm:text-[19px]">
              We run your payroll, PF and ESI compliance and hiring, and build the websites and software your business runs on. One
              friendly team, one phone call away.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup/" className="inline-flex h-14 items-center rounded-full bg-brand px-7 text-base font-bold text-ink hover:brightness-95">
                Get a custom quote
              </Link>
              <Link href="/get-started/" className="inline-flex h-14 items-center gap-2.5 rounded-full border-[1.5px] border-ink bg-white px-6 text-base font-semibold">
                <Phone /> Book a free call
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-muted">
              {TRUST.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check size={16} className="text-[#16803C]" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative h-[440px] min-w-0 flex-[1_1_420px] sm:h-[520px]">
            <div className="ai-glow -left-10 top-10 h-[70%] w-[80%]" aria-hidden="true" />
            <div className="ai-glow -right-6 bottom-0 h-[50%] w-[50%] opacity-70" aria-hidden="true" />
            <Photo
              src={photos.heroTeam}
              alt="Colleagues working together at an office desk"
              hint="Photo: your HR team with a client"
              tilt={[2, 7, -1]}
              className="absolute left-0 top-0 h-full w-[57%] rounded-t-[240px] rounded-b-[28px]"
            />
            <div className="float-slow absolute right-0 top-6 w-[39%]">
              <Photo
                src={photos.heroEmployee}
                alt="Smiling professional in an office"
                position="27% 30%"
                hint="Photo: happy employee"
                tone="stone"
                tilt={[4, -10, 2]}
                className="aspect-square w-full rounded-full"
              />
            </div>
            <div className="float-slower absolute bottom-2 right-0 w-[39%]">
              <Photo
                src={photos.heroOwner}
                alt="Shop owner at his grocery store counter"
                hint="Photo: business owner at their shop"
                tone="stone"
                tilt={[-3, -9, 1]}
                className="h-[190px] w-full rounded-[28px] sm:h-[220px]"
              />
            </div>
            <Sparkle size={26} className="float-slow absolute left-[52%] top-[6%] text-brand" />
            <Sparkle size={16} className="float-slower absolute bottom-[38%] right-[42%] text-[#FF7A45]" />
            <Sparkle size={20} className="float-slow absolute bottom-[4%] left-[50%] text-brand" />
          </div>
        </section>

        {/* Ribbon */}
        <section aria-label="What we do" className="-mx-5 -rotate-[1.2deg] bg-ink text-white">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-5 py-4 font-display text-xl font-semibold sm:text-[22px]">
            {STRIP.map((s) => (
              <span key={s} className="inline-flex items-center gap-6">
                {s}
                <span className="text-brand" aria-hidden="true">✳</span>
              </span>
            ))}
          </div>
        </section>

        {/* Services */}
        <section id="services" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-8 px-6 pb-10 pt-16">
          <div className="flex flex-col items-center gap-3.5 text-center">
            <Eyebrow center>What we do</Eyebrow>
            <h2 className="max-w-[760px] font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-[54px]">Two things, done really well.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ServiceCard
              badge="HR services"
              badgeDark={false}
              photo={photos.hrServices}
              hint="Photo: HR team at work, payroll on screen"
              title="Payroll, compliance and hiring, handled every month."
              chips={HR}
              chipBg="bg-peach"
              cta="Get HR support"
            />
            <ServiceCard
              id="tech"
              badge="Tech build"
              badgeDark
              photo={photos.techBuild}
              hint="Photo: developer building a website on a laptop"
              tone="stone"
              title="Websites, apps and software, built around your business."
              chips={TECH}
              chipBg="bg-stone"
              cta="Start a tech project"
            />
          </div>
        </section>

        {/* Products */}
        <section id="products" className="scroll-mt-6 bg-peach">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-14">
            <div className="flex max-w-[640px] flex-col gap-3.5">
              <Eyebrow>Our products</Eyebrow>
              <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-[54px]">Made in-house, from real HR work.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-5 rounded-[32px] bg-white p-7 sm:p-9">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand font-display text-[22px] font-extrabold">PF</span>
                  <div className="flex flex-col">
                    <span className="font-display text-3xl font-bold tracking-[-0.02em]">PF Mitra</span>
                    <span className="text-sm text-soft">Your PF compliance buddy</span>
                  </div>
                </div>
                <p className="text-[17px] leading-relaxed text-muted">
                  Manage UANs, monthly returns and challans, and employee PF queries, all in one simple place.
                </p>
                <div aria-hidden="true" className="flex flex-col gap-2 rounded-[20px] border border-[#F1E6D3] bg-cream p-3.5">
                  {PF_ROWS.map((r) => (
                    <div key={r.t} className="flex items-center justify-between rounded-xl border border-[#F1E6D3] bg-white px-3 py-2.5">
                      <span className="text-sm font-semibold">{r.t}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.ok ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>{r.s}</span>
                    </div>
                  ))}
                </div>
                <Link href="/signup/" className="inline-flex h-12 items-center self-start rounded-full bg-ink px-5 font-semibold text-white">
                  Explore PF Mitra
                </Link>
              </div>

              <div className="flex flex-col gap-5 rounded-[32px] bg-white p-7 sm:p-9">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-ink font-display text-xl font-extrabold text-brand">ATG</span>
                  <div className="flex flex-col">
                    <span className="font-display text-3xl font-bold tracking-[-0.02em]">Auto Talent Grid</span>
                    <span className="text-sm text-soft">Hiring, sped up with AI</span>
                  </div>
                </div>
                <p className="text-[17px] leading-relaxed text-muted">
                  Post jobs, let AI screen and rank candidates, and track every applicant on one clear grid.
                </p>
                <div aria-hidden="true" className="grid grid-cols-3 gap-2">
                  {[
                    { h: 'Applied', n: 3, on: false },
                    { h: 'AI picks', n: 2, on: true },
                    { h: 'Hired', n: 1, on: false },
                  ].map((c) => (
                    <div key={c.h} className="flex flex-col gap-1.5 rounded-2xl border border-[#F1E6D3] bg-cream p-2.5">
                      <span className="text-xs font-semibold text-soft">{c.h}</span>
                      {Array.from({ length: c.n }).map((_, i) => (
                        <span key={i} className={`h-[22px] rounded-lg border ${c.on ? 'border-brand bg-[#FFE3B3]' : 'border-transparent bg-stone'}`} />
                      ))}
                    </div>
                  ))}
                </div>
                <Link href="/signup/" className="inline-flex h-12 items-center self-start rounded-full bg-ink px-5 font-semibold text-white">
                  Explore Auto Talent Grid
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* People + AI */}
        <section className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-12 px-6 py-14">
          <Photo
            src={photos.supportCall}
            alt="Colleagues discussing work in an office"
            position="72% center"
            hint="Photo: your team member on a call with a client"
            tilt={[2, 6, 0]}
            className="min-h-[380px] flex-[1_1_380px] rounded-[28px] rounded-br-[220px] sm:min-h-[460px]"
          />
          <div className="flex flex-[1_1_440px] flex-col gap-5">
            <Eyebrow>Real people, AI speed</Eyebrow>
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-[50px]">Experts you can call. AI that double-checks.</h2>
            <p className="text-lg leading-relaxed text-muted">
              A dedicated person looks after you on call and WhatsApp. Behind them, AI quietly catches mistakes and reminds us of every
              deadline.
            </p>
            <div className="flex flex-col">
              {AI.map((a) => (
                <div key={a.n} className="flex gap-4 border-b border-dashed border-line py-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-peach font-display font-bold">{a.n}</span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[17px] font-semibold">{a.t}</span>
                    <span className="text-[15px] leading-normal text-muted">{a.d}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries */}
        <section id="industries" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-8 px-6 pb-14">
          <h2 className="max-w-[700px] font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-[50px]">Built for businesses like yours</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((i) => (
              <Photo key={i.t} src={i.photo} alt={i.t} hint={i.hint} tone={i.tone} tilt={[4, 0, 0]} className="h-72 rounded-[28px]">
                <span className="photo-label absolute inset-x-3.5 bottom-3.5 flex flex-col gap-0.5 rounded-2xl bg-white px-4 py-3.5">
                  <span className="text-base font-bold">{i.t}</span>
                  <span className="text-[13px] text-muted">{i.d}</span>
                </span>
              </Photo>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-6 border-y border-sand bg-white">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 py-14">
            <div className="flex flex-col items-center gap-3.5 text-center">
              <Eyebrow center>How it works</Eyebrow>
              <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-[50px]">No fixed packages. Just what you need.</h2>
            </div>
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.n} className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-xl font-extrabold ${
                        i % 2 ? 'bg-ink text-white' : 'bg-brand text-ink'
                      }`}
                    >
                      {s.n}
                    </span>
                    <span className="flex-1 border-t-2 border-dashed border-line" />
                  </div>
                  <span className="font-display text-[22px] font-bold">{s.t}</span>
                  <span className="text-[15px] leading-relaxed text-muted">{s.d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1240px] px-6 py-12">
          <div className="flex flex-wrap items-center justify-between gap-8 rounded-[40px] bg-brand px-8 py-14 sm:px-12 sm:py-16">
            <div className="flex max-w-[640px] flex-col gap-3.5">
              <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-[52px]">Let’s talk about your business.</h2>
              <p className="text-lg leading-relaxed">Create a free account, tell us what you need, and get a custom quote after a short call.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup/" className="inline-flex h-14 items-center gap-2 rounded-full bg-ink px-7 text-base font-bold text-white">
                Create client account <ArrowRight />
              </Link>
              <Link href="/signin/" className="inline-flex h-14 items-center rounded-full bg-white px-6 text-base font-semibold">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ServiceCard(props: {
  id?: string;
  badge: string;
  badgeDark: boolean;
  photo: string | null;
  hint: string;
  tone?: 'warm' | 'stone';
  title: string;
  chips: string[];
  chipBg: string;
  cta: string;
}) {
  return (
    <div id={props.id} className="card-3d flex scroll-mt-6 flex-col overflow-hidden rounded-[32px] border border-sand bg-white">
      <Photo src={props.photo} alt={props.badge} hint={props.hint} tone={props.tone} effect={false} className="card-photo h-[240px]">
        <span
          className={`photo-label absolute bottom-5 left-5 rounded-full px-3.5 py-2 text-sm font-bold ${props.badgeDark ? 'bg-ink text-white' : 'bg-white text-ink'}`}
        >
          {props.badge}
        </span>
      </Photo>
      <div className="flex flex-1 flex-col gap-4 p-7 sm:p-8">
        <h3 className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[32px]">{props.title}</h3>
        <div className="flex flex-wrap gap-2">
          {props.chips.map((c) => (
            <span key={c} className={`rounded-full px-3.5 py-2 text-sm font-medium ${props.chipBg}`}>
              {c}
            </span>
          ))}
        </div>
        <Link href="/signup/" className="mt-auto inline-flex items-center gap-2 self-start pt-2 text-base font-bold underline-offset-4 hover:underline">
          {props.cta} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
