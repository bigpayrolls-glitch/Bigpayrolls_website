'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import AuthShell, { authErrorMessage, nextPath } from '@/components/AuthShell';
import { Google } from '@/components/Icons';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { getProfile, saveProfile } from '@/lib/data';
import { COMPANY_SIZES, INTERESTS } from '@/lib/catalog';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [needsProfileOnly, setNeedsProfileOnly] = useState(false);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [size, setSize] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  // Signed-in users with a profile go straight on; signed-in users without one (e.g. first Google login) only fill the profile.
  useEffect(() => {
    if (loading || submitting.current) return;
    if (!user) {
      setNeedsProfileOnly(false);
      setChecking(false);
      return;
    }
    getProfile(user.uid)
      .then((p) => {
        if (p) router.replace(nextPath('/get-started/'));
        else {
          setNeedsProfileOnly(true);
          setName((n) => n || user.displayName || '');
          setEmail((e) => e || user.email || '');
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [user, loading, router]);

  function validateProfile(): string {
    if (!name.trim() || !company.trim()) return 'Enter your name and company name.';
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10)) || phone.replace(/\D/g, '').length < 10)
      return 'Enter a valid 10-digit mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address.';
    if (!interests.length) return 'Pick at least one thing you are interested in.';
    if (!agree) return 'Please accept the terms to continue.';
    return '';
  }

  async function finish(uid: string) {
    await saveProfile(uid, {
      name: name.trim(),
      company: company.trim(),
      phone: phone.replace(/\D/g, '').slice(-10),
      email: email.trim(),
      interests,
      companySize: size,
    });
    router.replace(nextPath('/get-started/'));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!auth) return setError('Login is not connected yet.');
    const v = validateProfile();
    if (v) return setError(v);
    if (!needsProfileOnly && password.length < 8) return setError('Use a password with at least 8 characters.');
    setBusy(true);
    submitting.current = true;
    try {
      if (needsProfileOnly && user) {
        await finish(user.uid);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await finish(cred.user.uid);
      }
    } catch (err) {
      submitting.current = false;
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError('');
    if (!auth) return setError('Login is not connected yet.');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // The effect above then shows the short profile form (or moves on if a profile exists)
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  const toggle = (id: string) => setInterests((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  return (
    <AuthShell
      side="brand"
      title="Start with a free client account."
      points={[
        { t: 'Create your account', d: 'Takes a minute.' },
        { t: 'Tell us what you need', d: 'Pick your service, industry and features.' },
        { t: 'Free discovery call', d: 'We understand your needs and send a custom quote.' },
        { t: 'Accept, pay and track', d: 'Pay the advance online and follow progress.' },
      ]}
    >
      {checking ? null : (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em]">{needsProfileOnly ? 'Almost there' : 'Create your account'}</h2>
            <p className="text-[15px] text-muted">
              {needsProfileOnly ? (
                'A few details about your business so we can help you better.'
              ) : (
                <>
                  Already a client?{' '}
                  <Link href="/signin/" className="font-semibold underline underline-offset-2">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>

          {!needsProfileOnly && (
            <>
              <button
                type="button"
                onClick={onGoogle}
                disabled={busy}
                className="inline-flex h-[52px] items-center justify-center gap-3 rounded-full border-[1.5px] border-[#d6d0c5] bg-white font-semibold hover:bg-cream disabled:opacity-60"
              >
                <Google /> Sign up with Google
              </button>
              <div className="flex items-center gap-3 text-sm text-muted">
                <span className="h-px flex-1 bg-sand" /> or with email <span className="h-px flex-1 bg-sand" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="label">Full name *</label>
                <input id="name" autoComplete="name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="company" className="label">Company name *</label>
                <input id="company" autoComplete="organization" className="field" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="label">Mobile number *</label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit mobile"
                  className="field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="label">Work email *</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={needsProfileOnly && !!user?.email}
                />
              </div>
              {!needsProfileOnly && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="password" className="label">Password * <span className="font-normal text-muted">(at least 8 characters)</span></label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            <fieldset className="flex flex-col gap-2.5">
              <legend className="label mb-2.5">What are you interested in? *</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {INTERESTS.map((it) => {
                  const on = interests.includes(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(it.id)}
                      className={`flex min-h-16 flex-col items-start gap-0.5 rounded-2xl border-[1.5px] px-3.5 py-3 text-left ${
                        on ? 'border-ink bg-[#FFF4E0]' : 'border-[#d6d0c5] bg-white'
                      }`}
                    >
                      <span className="text-[15px] font-semibold">{it.t}</span>
                      <span className="text-[13px] text-muted">{it.d}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="flex flex-col">
              <legend className="label mb-2.5">Number of employees</legend>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={size === s}
                    onClick={() => setSize(s)}
                    className={`min-h-11 rounded-full border-[1.5px] px-4 text-sm font-medium ${
                      size === s ? 'border-ink bg-ink text-white' : 'border-[#d6d0c5] bg-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-normal text-muted">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-ink" />
              <span>
                I agree to the <Link href="/terms/" className="underline">Terms and conditions</Link> and{' '}
                <Link href="/privacy/" className="underline">Privacy policy</Link>.
              </span>
            </label>

            {error && <p role="alert" className="text-sm font-medium text-[#B42318]">{error}</p>}
            <button type="submit" disabled={busy} className="h-[54px] rounded-full bg-ink text-base font-semibold text-white disabled:opacity-60">
              {busy ? 'Saving…' : needsProfileOnly ? 'Continue' : 'Create account'}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
