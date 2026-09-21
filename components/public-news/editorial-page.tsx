import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";

export function EditorialPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <NewsHeader />
      <section className="adi-noise border-b border-white/10"><div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{eyebrow}</p><h1 className="mt-4 text-5xl font-black uppercase leading-[.9] tracking-[-0.065em] sm:text-7xl lg:text-[6.5rem]">{title}</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-white/55">{intro}</p></div></section>
      <section className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]"><aside><p className="border-t-4 border-white pt-4 text-xs font-black uppercase tracking-[0.13em] text-white/45">Aura Intelligence</p><div className="mt-4 space-y-2 text-sm font-bold text-white/42"><Link href="/about" className="block hover:text-white">About</Link><Link href="/editorial-standards" className="block hover:text-white">Editorial Standards</Link><Link href="/fact-checking" className="block hover:text-white">Fact Checking</Link><Link href="/corrections" className="block hover:text-white">Corrections</Link><Link href="/ai-policy" className="block hover:text-white">AI Policy</Link><Link href="/privacy" className="block hover:text-white">Privacy</Link></div></aside><div className="space-y-10 text-[15px] leading-8 text-white/64 [&_a]:font-bold [&_a]:text-white [&_a]:underline [&_a]:decoration-white/25 [&_a]:underline-offset-4 [&_h2]:border-t [&_h2]:border-white/10 [&_h2]:pt-7 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-[-0.045em] [&_h2]:text-white [&_li]:mb-2 [&_strong]:text-white">{children}</div></div><div className="mt-16 border-t border-white/10 pt-8"><Link href="/news" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/50 hover:text-white"><ArrowLeft size={13}/> Back to the newsroom</Link></div></section>
      <NewsFooter />
    </main>
  );
}
