'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProfile } from '@/lib/data';
import { useAuth } from './AuthProvider';
import { ArrowUpRight, Close, Menu } from './Icons';

const NAV = [
  { href: '/#services', label: 'Services' },
  { href: '/#products', label: 'Products' },
  { href: '/#industries', label: 'Industries' },
  { href: '/#how', label: 'How it works' },
  { href: '/#contact', label: 'Contact' },
];

export default function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return setIsAdmin(false);
    getProfile(user.uid)
      .then((p) => setIsAdmin(p?.role === 'admin'))
      .catch(() => setIsAdmin(false));
  }, [user]);
  const homeHref = isAdmin ? '/admin/' : '/dashboard/';
  const homeLabel = isAdmin ? 'Admin' : 'Dashboard';

  return (
    <header className="relative z-20 mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-4">
      <Link href="/" aria-label="Big Payrolls home" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-horizontal.png" alt="Big Payrolls Solution Private Limited" className="h-9 w-auto sm:h-[52px]" />
      </Link>

      <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-sand bg-white p-1.5 text-[15px] font-medium lg:flex">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className="rounded-full px-4 py-2 hover:bg-peach">
            {n.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {user ? (
          <Link href={homeHref} className="hidden h-11 items-center rounded-full px-4 text-[15px] font-semibold hover:bg-peach sm:inline-flex">
            {homeLabel}
          </Link>
        ) : (
          <Link href="/signin/" className="hidden h-11 items-center rounded-full px-4 text-[15px] font-semibold hover:bg-peach sm:inline-flex">
            Sign in
          </Link>
        )}
        <Link
          href={user ? '/get-started/' : '/signup/'}
          className="hidden h-11 items-center gap-2 rounded-full bg-ink pl-5 pr-1.5 text-[15px] font-semibold text-white sm:inline-flex"
        >
          Get started
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-ink">
            <ArrowUpRight size={16} />
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sand bg-white lg:hidden"
        >
          {open ? <Close /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav aria-label="Mobile" className="flex w-full flex-col rounded-3xl border border-sand bg-white p-2 lg:hidden">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 font-medium hover:bg-peach">
              {n.label}
            </a>
          ))}
          <Link href={user ? homeHref : '/signin/'} className="rounded-2xl px-4 py-3 font-medium hover:bg-peach">
            {user ? homeLabel : 'Sign in'}
          </Link>
          <Link href={user ? '/get-started/' : '/signup/'} className="mt-1 rounded-2xl bg-ink px-4 py-3 text-center font-semibold text-white">
            Get started
          </Link>
        </nav>
      )}
    </header>
  );
}
