'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import AuthShell, { authErrorMessage, nextPath } from '@/components/AuthShell';
import { Google } from '@/components/Icons';
import { auth } from '@/lib/firebase';
import { getProfile } from '@/lib/data';
import { useAuth } from '@/components/AuthProvider';

export default function SignInPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const routing = useRef(false);

  // Already signed in (or just signed in): send them to the right place once.
  useEffect(() => {
    if (!loading && user && !routing.current) {
      routing.current = true;
      afterLogin(user.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  async function afterLogin(uid: string) {
    const profile = await getProfile(uid).catch(() => null);
    const hasNext = new URLSearchParams(window.location.search).has('next');
    // Staff land on the admin dashboard unless they were heading somewhere specific
    const next = profile?.role === 'admin' && !hasNext ? '/admin/' : nextPath();
    router.replace(profile ? next : `/signup/?next=${encodeURIComponent(next)}`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!auth) return setError('Login is not connected yet.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // The effect above routes them once the login state updates
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError('');
    if (!auth) return setError('Login is not connected yet.');
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    setError('');
    setInfo('');
    if (!auth) return setError('Login is not connected yet.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Type your email above first, then click “Forgot password”.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Password reset link sent. Check your email.');
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <AuthShell
      side="dark"
      title="Welcome back."
      points={[{ t: 'Track your service requests' }, { t: 'Review and accept quotes' }, { t: 'Pay securely online' }, { t: 'See project and payroll status' }]}
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-3xl font-bold tracking-[-0.02em]">Sign in to your account</h2>
        <p className="text-[15px] text-muted">
          New to Big Payrolls?{' '}
          <Link href="/signup/" className="font-semibold underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={busy}
        className="inline-flex h-[52px] items-center justify-center gap-3 rounded-full border-[1.5px] border-[#d6d0c5] bg-white font-semibold hover:bg-cream disabled:opacity-60"
      >
        <Google /> Continue with Google
      </button>

      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-sand" /> or with email <span className="h-px flex-1 bg-sand" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <button type="button" onClick={onForgot} className="text-[13px] font-semibold underline underline-offset-2">
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-[#B42318]">{error}</p>}
        {info && <p role="status" className="text-sm font-medium text-[#166534]">{info}</p>}
        <button type="submit" disabled={busy} className="h-[54px] rounded-full bg-ink text-base font-semibold text-white disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-center text-[13px] text-muted">
        By signing in you agree to our{' '}
        <Link href="/terms/" className="underline">Terms</Link> and <Link href="/privacy/" className="underline">Privacy policy</Link>.
      </p>
    </AuthShell>
  );
}
