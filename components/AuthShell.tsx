import Link from 'next/link';
import { Check, Sparkle } from './Icons';
import { isFirebaseConfigured } from '@/lib/firebase';
import { photos } from '@/lib/site';

/**
 * Two-panel layout for sign in / sign up.
 * Left: premium dark panel (faded photo, orange glow, glass step cards). Right: the form in a card.
 */
export default function AuthShell({
  side,
  title,
  points,
  children,
}: {
  /** 'dark' = sign in (check marks), 'brand' = sign up (numbered steps) */
  side: 'dark' | 'brand';
  title: string;
  points: { t: string; d?: string }[];
  children: React.ReactNode;
}) {
  const numbered = side === 'brand';
  const photo = numbered ? photos.heroTeam : photos.supportCall;
  return (
    <div className="flex min-h-screen flex-wrap overflow-x-clip bg-cream">
      <aside className="relative isolate flex flex-[1_1_440px] flex-col justify-between gap-6 overflow-hidden bg-ink px-6 py-7 text-white sm:gap-10 sm:p-12 lg:min-h-screen">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              'linear-gradient(160deg, rgba(14,14,16,0.97) 0%, rgba(14,14,16,0.86) 45%, rgba(40,22,4,0.78) 100%)',
          }}
        />
        <div aria-hidden="true" className="ai-glow -bottom-24 -left-20 -z-10 h-80 w-80" />
        <div aria-hidden="true" className="ai-glow -right-24 top-10 -z-10 h-64 w-64 opacity-60" />

        <Link href="/" aria-label="Back to Big Payrolls home" className="self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal-white.png" alt="Big Payrolls Solution Private Limited" className="h-10 w-auto sm:h-14" />
        </Link>

        <div className="flex max-w-[470px] flex-col gap-4 sm:gap-7">
          <span className="hidden items-center gap-2 self-start rounded-full border border-white/15 sm:inline-flex bg-white/10 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur">
            <Sparkle size={14} className="text-brand" />
            Client portal
          </span>
          <h1 className="font-display text-3xl font-bold leading-[1.06] tracking-[-0.03em] sm:text-[46px]">
            {title.split(' ').slice(0, -2).join(' ')}{' '}
            <span className="bg-gradient-to-r from-[#FDB813] via-[#F9A11B] to-[#FF7A45] bg-clip-text text-transparent">
              {title.split(' ').slice(-2).join(' ')}
            </span>
          </h1>
          <ul className="hidden flex-col gap-3 lg:flex">
            {points.map((p, i) => (
              <li
                key={p.t}
                className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur-md"
              >
                <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#FDB813] to-[#F7931E] font-display text-sm font-bold text-ink">
                  {numbered ? i + 1 : <Check size={15} />}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{p.t}</span>
                  {p.d && <span className="text-sm text-white/70">{p.d}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden flex-wrap items-center justify-between gap-3 text-[13px] text-white/60 lg:flex">
          <span className="inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Secure sign-in · Your data stays private
          </span>
          <span>© {new Date().getFullYear()} Big Payrolls</span>
        </div>
      </aside>

      <main className="relative flex flex-[1_1_540px] min-w-0 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div aria-hidden="true" className="ai-glow -right-20 -top-20 h-72 w-72 opacity-40" />
        <div className="relative flex w-full max-w-[560px] flex-col gap-6 rounded-[32px] border border-sand bg-white p-6 shadow-[0_2px_6px_rgba(60,30,0,0.05),0_30px_60px_-30px_rgba(120,60,0,0.25)] sm:p-10">
          {!isFirebaseConfigured && (
            <p role="status" className="rounded-2xl border border-[#F1E2C8] bg-peach px-4 py-3 text-sm">
              Login is not connected yet. Add your Firebase keys in <code>.env.local</code> (see README) to turn on sign in and sign up.
            </p>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/weak-password':
      return 'Use a password with at least 8 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/network-request-failed':
      return 'Network problem. Check your internet and try again.';
    default:
      return (e as Error)?.message || 'Something went wrong. Please try again.';
  }
}

export function nextPath(fallback = '/dashboard/') {
  if (typeof window === 'undefined') return fallback;
  const n = new URLSearchParams(window.location.search).get('next');
  // Only allow internal paths
  return n && n.startsWith('/') && !n.startsWith('//') ? n : fallback;
}
