import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";

export function EditorialPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="adi-public-shell min-h-screen">
      <NewsHeader />
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="adi-kicker">{eyebrow}</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div><h1 className="adi-display max-w-5xl text-white">{title}</h1><p className="mt-5 max-w-3xl text-base leading-8 text-white/52 sm:text-lg">{intro}</p></div>
            <div className="border-t border-white/15 pt-5 lg:border-l lg:border-t-0 lg:pl-7"><p className="adi-kicker">Publisher</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Aura Digital Fiji</h2><p className="mt-3 text-sm leading-7 text-white/46">The Fiji digital agency behind Aura Intelligence.</p><a href="https://auradigitalfiji.com" className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-white">Visit Aura <ArrowUpRight size={13}/></a></div>
          </div>
        </div>
      </section>
      <section className="bg-[#f1eee6] text-black">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-12">
          <aside className="lg:sticky lg:top-32 lg:self-start"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/45">Aura Intelligence</p><div className="mt-4 space-y-2 text-sm font-bold text-black/52"><Link href="/about" className="block hover:text-black">About</Link><Link href="/editorial-standards" className="block hover:text-black">Editorial Standards</Link><Link href="/fact-checking" className="block hover:text-black">Fact Checking</Link><Link href="/corrections" className="block hover:text-black">Corrections</Link><Link href="/ai-policy" className="block hover:text-black">AI Policy</Link><Link href="/privacy" className="block hover:text-black">Privacy</Link></div></aside>
          <div className="space-y-10 text-[15px] leading-8 text-black/68 [&_a]:font-bold [&_a]:text-black [&_a]:underline [&_a]:decoration-black/25 [&_a]:underline-offset-4 [&_h2]:border-t [&_h2]:border-black/15 [&_h2]:pt-7 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:tracking-[-0.045em] [&_h2]:text-black [&_li]:mb-2 [&_strong]:text-black">{children}<div className="mt-10 border-t border-black/15 pt-6"><Link href="/news" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-black/60 hover:text-black"><ArrowLeft size={13}/> Back to the newsroom</Link></div></div>
        </div>
      </section>
      <NewsFooter />
    </main>
  );
}
