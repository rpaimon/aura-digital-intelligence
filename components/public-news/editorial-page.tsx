import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";

export function EditorialPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader />
      <section className="adi-noise border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="adi-kicker">{eyebrow}</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div>
              <h1 className="adi-hero-title max-w-4xl font-black text-white">{title}</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/54 sm:text-lg">{intro}</p>
            </div>
            <div className="adi-panel p-5">
              <p className="adi-kicker">Publisher</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Aura Digital Fiji</h2>
              <p className="mt-3 text-sm leading-7 text-white/48">The agency behind Aura Intelligence, serving Fiji businesses with practical digital systems and growth support.</p>
              <a href="https://auradigitalfiji.com" className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">Visit Aura <ArrowUpRight size={13}/></a>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="adi-panel p-5">
              <p className="adi-kicker">Aura Intelligence</p>
              <div className="mt-4 space-y-2 text-sm font-bold text-white/48">
                <Link href="/about" className="block hover:text-white">About</Link>
                <Link href="/editorial-standards" className="block hover:text-white">Editorial Standards</Link>
                <Link href="/fact-checking" className="block hover:text-white">Fact Checking</Link>
                <Link href="/corrections" className="block hover:text-white">Corrections</Link>
                <Link href="/ai-policy" className="block hover:text-white">AI Policy</Link>
                <Link href="/privacy" className="block hover:text-white">Privacy</Link>
              </div>
            </div>
          </aside>
          <div className="adi-panel p-5 sm:p-7">
            <div className="space-y-10 text-[15px] leading-8 text-white/64 [&_a]:font-bold [&_a]:text-white [&_a]:underline [&_a]:decoration-white/25 [&_a]:underline-offset-4 [&_h2]:border-t [&_h2]:border-white/10 [&_h2]:pt-7 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:tracking-[-0.045em] [&_h2]:text-white [&_li]:mb-2 [&_strong]:text-white">{children}</div>
            <div className="mt-10 border-t border-white/10 pt-6"><Link href="/news" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/50 hover:text-white"><ArrowLeft size={13}/> Back to the newsroom</Link></div>
          </div>
        </div>
      </section>
      <NewsFooter />
    </main>
  );
}
