'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { getProfile, type Profile } from '@/lib/data';
import { isFirebaseConfigured } from '@/lib/firebase';

type Access = 'checking' | 'ok' | 'denied' | 'error';

/** Only lets users with role "admin" through. Others are sent to sign in or shown a message. */
export function useAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [access, setAccess] = useState<Access>('checking');
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isFirebaseConfigured) {
      setAccess('error');
      return;
    }
    if (!user) {
      router.replace(`/signin/?next=${encodeURIComponent(pathname || '/admin/')}`);
      return;
    }
    getProfile(user.uid)
      .then((p) => {
        setProfile(p);
        setAccess(p?.role === 'admin' ? 'ok' : 'denied');
      })
      .catch(() => setAccess('error'));
  }, [user, loading, router, pathname]);

  return { user, profile, access };
}

const ICONS: Record<string, React.ReactNode> = {
  requests: <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />,
  clients: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-4.5-5.5" />
    </>
  ),
  settings: (
    <>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  site: <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />,
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export default function AdminShell({ children }: { children: (ctx: { name: string }) => React.ReactNode }) {
  const { user, profile, access } = useAdmin();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  const nav = [
    { href: '/admin/', label: 'Requests', icon: 'requests', active: pathname === '/admin/' || pathname.startsWith('/admin/request') },
    { href: '/admin/clients/', label: 'Clients', icon: 'clients', active: pathname.startsWith('/admin/clients') },
    { href: '/admin/settings/', label: 'Settings', icon: 'settings', active: pathname.startsWith('/admin/settings') },
  ];

  const signOut = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar (desktop) / top bar (mobile) */}
      <aside className="relative isolate overflow-hidden bg-ink text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div aria-hidden="true" className="ai-glow -bottom-24 -left-24 -z-10 hidden h-72 w-72 opacity-60 lg:block" />
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:flex-col lg:items-start lg:px-6 lg:py-7">
          <Link href="/admin/" aria-label="Admin home" className="flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal-white.png" alt="Big Payrolls" className="h-9 w-auto lg:h-10" />
            <span className="hidden self-start rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ink lg:inline-block">
              Admin
            </span>
          </Link>
          <button type="button" onClick={signOut} className="h-9 rounded-full border border-white/20 px-4 text-sm font-semibold hover:bg-white/10 lg:hidden">
            Sign out
          </button>
        </div>

        {access === 'ok' && (
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:px-3 lg:pb-0">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={n.active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors ${
                  n.active ? 'bg-white text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <NavIcon name={n.icon} />
                {n.label}
              </Link>
            ))}
            <Link href="/" className="flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-white/75 hover:bg-white/10 hover:text-white lg:mt-2">
              <NavIcon name="site" />
              View website
            </Link>
          </nav>
        )}

        <div className="hidden border-t border-white/10 px-6 py-5 lg:block">
          <p className="truncate text-sm font-semibold">{profile?.name ?? ''}</p>
          <p className="truncate text-xs text-white/55">{user?.email}</p>
          <button type="button" onClick={signOut} className="mt-3 h-9 w-full rounded-full border border-white/20 text-sm font-semibold hover:bg-white/10">
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-7 lg:px-9 lg:py-9">
        {access === 'checking' && <p className="text-muted">Checking access…</p>}
        {access === 'error' && (
          <p role="alert" className="font-medium text-[#B42318]">
            Could not check your access. Please refresh the page.
          </p>
        )}
        {access === 'denied' && (
          <div className="flex max-w-[560px] flex-col items-start gap-3 rounded-3xl border border-sand bg-white p-8">
            <h1 className="font-display text-2xl font-bold">Staff only</h1>
            <p className="text-muted">
              This area is for the Big Payrolls team. If you are staff, ask the owner to set your account&apos;s role to
              <code className="mx-1 rounded bg-stone px-1.5 py-0.5">admin</code>in Firebase.
            </p>
            <Link href="/dashboard/" className="inline-flex h-11 items-center rounded-full bg-ink px-5 font-semibold text-white">
              Go to my dashboard
            </Link>
          </div>
        )}
        {access === 'ok' && <div className="mx-auto max-w-[1240px]">{children({ name: profile?.name?.split(' ')[0] ?? 'there' })}</div>}
      </main>
    </div>
  );
}

export function StatusBadge({ status, label, tone }: { status: string; label: string; tone: string }) {
  return (
    <span data-status={status} className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

export function Panel({ title, action, children, className = '' }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-4 rounded-3xl border border-[#ECE6DC] bg-white p-5 shadow-[0_1px_2px_rgba(60,30,0,0.04),0_12px_32px_-24px_rgba(60,30,0,0.25)] sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-display text-lg font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
