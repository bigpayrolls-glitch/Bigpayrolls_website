import Link from 'next/link';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-[640px] flex-col items-start gap-5 px-6 py-24">
        <h1 className="font-display text-5xl font-bold tracking-[-0.03em]">Page not found</h1>
        <p className="text-lg text-muted">The page you are looking for does not exist or has moved.</p>
        <Link href="/" className="inline-flex h-12 items-center rounded-full bg-ink px-6 font-semibold text-white">
          Back to home
        </Link>
      </main>
    </>
  );
}
