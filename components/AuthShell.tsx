import Link from 'next/link';
import { Check } from './Icons';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function AuthShell({
  side,
  title,
  points,
  children,
}: {
  side: 'dark' | 'brand';
  title: string;
  points: { t: string; d?: string }[];
  children: React.ReactNode;
}) {
  const dark = side === 'dark';
  return (
    <div className="flex min-h-screen flex-wrap bg-white">
      <aside className={`flex flex-[1_1_420px] flex-col justify-between gap-12 p-8 sm:p-12 ${dark ? 'bg-ink text-white' : 'bg-brand text-ink'}`}>
        <Link href="/" aria-label="Back to Big Payrolls home" className="self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dark ? '/logo-horizontal-white.png' : '/logo-horizontal.png'}
            alt="Big Payrolls Solution Private Limited"
            className="h-12 w-auto sm:h-14"
          />
        </Link>
        <div className="flex max-w-[460px] flex-col gap-6">
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">{title}</h1>
          <ul className="flex flex-col gap-4">
            {points.map((p) => (
              <li key={p.t} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full ${dark ? 'bg-brand text-ink' : 'bg-ink text-white'}`}>
                  <Check size={15} />
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-semibold">{p.t}</span>
                  {p.d && <span className={`text-sm ${dark ? 'text-[#d0d0d0]' : ''}`}>{p.d}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <span className={`text-[13px] ${dark ? 'text-[#a3a3a3]' : ''}`}>© {new Date().getFullYear()} Big Payrolls Solution Private Limited</span>
      </aside>
      <main className="flex flex-[1_1_520px] items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[520px] flex-col gap-6">
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
