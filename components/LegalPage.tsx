import Header from './Header';
import Footer from './Footer';

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-10">
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">Last updated: {updated}</p>
        <div className="mt-10 flex flex-col gap-5 text-[16px] leading-relaxed text-[#2b2b2b] [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
