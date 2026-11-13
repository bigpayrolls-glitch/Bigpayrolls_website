// Kept free of sign-in code: this screen is part of every page's bundle, including the fast ad landing page.
export default function NotFound() {
  return (
    <>
      <header className="mx-auto flex max-w-[1240px] items-center px-6 py-4">
        <a href="/" aria-label="Big Payrolls home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal-sm.webp" alt="Big Payrolls Solution Private Limited" width={180} height={40} className="h-9 w-auto sm:h-[52px]" />
        </a>
      </header>
      <main className="mx-auto flex max-w-[640px] flex-col items-start gap-5 px-6 py-24">
        <h1 className="font-display text-5xl font-bold tracking-[-0.03em]">Page not found</h1>
        <p className="text-lg text-muted">The page you are looking for does not exist or has moved.</p>
        <a href="/" className="inline-flex h-12 items-center rounded-full bg-ink px-6 font-semibold text-white">
          Back to home
        </a>
      </main>
    </>
  );
}
