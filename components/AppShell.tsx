'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { getProfile, type Profile } from '@/lib/data';
import { isFirebaseConfigured } from '@/lib/firebase';

/** Sends visitors to sign in (or to finish their profile) before showing a client page. */
export function useClientProfile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isFirebaseConfigured) {
      setReady(true);
      return;
    }
    const next = encodeURIComponent(pathname || '/dashboard/');
    if (!user) {
      router.replace(`/signin/?next=${next}`);
      return;
    }
    getProfile(user.uid)
      .then((p) => {
        if (!p) router.replace(`/signup/?next=${next}`);
        else {
          setProfile(p);
          setReady(true);
        }
      })
      .catch(() => setReady(true));
  }, [user, loading, router, pathname]);

  return { user, profile, ready };
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return setIsAdmin(false);
    getProfile(user.uid)
      .then((p) => setIsAdmin(p?.role === 'admin'))
      .catch(() => setIsAdmin(false));
  }, [user]);

  const link = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={pathname === href ? 'page' : undefined}
      className={`rounded-full px-4 py-2 text-[15px] font-medium ${pathname === href ? 'bg-ink text-white' : 'hover:bg-peach'}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-sand bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Link href="/" aria-label="Big Payrolls home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal.png" alt="Big Payrolls Solution Private Limited" className="h-10 w-auto sm:h-11" />
          </Link>
          <nav aria-label="Client" className="flex flex-wrap items-center gap-1">
            {link('/dashboard/', 'Dashboard')}
            {link('/get-started/', 'New request')}
            {isAdmin && (
              <Link href="/admin/" className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[15px] font-bold text-ink">
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {user?.email && <span className="hidden text-muted sm:inline">{user.email}</span>}
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace('/');
              }}
              className="h-10 rounded-full border border-sand bg-white px-4 font-semibold hover:bg-peach"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      {!isFirebaseConfigured && (
        <p role="status" className="mx-auto mt-4 max-w-[1180px] rounded-2xl border border-[#F1E2C8] bg-peach px-4 py-3 text-sm">
          Preview mode: Firebase is not connected yet, so nothing is saved. See README to connect it.
        </p>
      )}
      <main className="mx-auto max-w-[1180px] px-5 py-8">{children}</main>
    </div>
  );
}
