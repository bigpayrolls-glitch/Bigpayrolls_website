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

export default function AdminShell({ children }: { children: (ctx: { name: string }) => React.ReactNode }) {
  const { user, profile, access } = useAdmin();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  const nav = [
    { href: '/admin/', label: 'Requests', active: pathname === '/admin/' || pathname.startsWith('/admin/request') },
    { href: '/admin/clients/', label: 'Clients', active: pathname.startsWith('/admin/clients') },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F1]">
      <header className="sticky top-0 z-30 border-b border-[#2a2a2a] bg-ink text-white">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin/" aria-label="Admin home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-horizontal-white.png" alt="Big Payrolls" className="h-9 w-auto" />
            </Link>
            <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-ink">Admin</span>
          </div>
          {access === 'ok' && (
            <nav aria-label="Admin" className="flex items-center gap-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={n.active ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 text-[15px] font-medium ${n.active ? 'bg-white text-ink' : 'text-white/80 hover:bg-white/10'}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-3 text-sm">
            {user?.email && <span className="hidden text-white/60 md:inline">{user.email}</span>}
            <Link href="/" className="hidden rounded-full px-3 py-2 text-white/80 hover:bg-white/10 sm:inline-flex">
              View site
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace('/');
              }}
              className="h-9 rounded-full border border-white/20 px-4 font-semibold hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-5 py-7">
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
        {access === 'ok' && children({ name: profile?.name?.split(' ')[0] ?? 'there' })}
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
    <section className={`flex flex-col gap-4 rounded-3xl border border-sand bg-white p-5 sm:p-6 ${className}`}>
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
