import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export function NewsHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090d]/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-lime-300/30 bg-lime-300/10 text-sm font-black text-lime-300 shadow-[0_0_30px_rgba(190,242,100,0.08)]">A</span>
          <span className="leading-none">
            <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-white/45">Aura Digital</span>
            <span className="mt-1 block text-sm font-black tracking-[-0.02em] text-white">Intelligence</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-xs font-black text-white/50 lg:flex">
          <Link href="/news" className="hover:text-white">News</Link>
          <Link href="/news/topic/cybersecurity" className="hover:text-white">Cybersecurity</Link>
          <Link href="/news/topic/ai" className="hover:text-white">AI</Link>
          <Link href="/news/topic/fiji-pacific" className="hover:text-white">Fiji & Pacific</Link>
          <Link href="/about" className="hover:text-white">About</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-white/55 md:flex">
            <ShieldCheck size={13} className="text-lime-300" /> Verification-first
          </div>
          <a href="https://auradigitalfiji.com" className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 text-xs font-black text-white transition hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-lime-200 sm:px-4">
            Aura Digital Fiji <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </header>
  );
}

export function NewsFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#05070a]">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">Aura Digital Intelligence</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">Technology intelligence for Fiji and the Pacific. Published by Aura Digital Fiji with independent-source verification, originality controls and transparent automation standards.</p>
        </div>
        <div className="flex max-w-xl flex-wrap items-start gap-x-5 gap-y-3 text-xs font-bold text-white/55 md:justify-end">
          <Link href="/news" className="hover:text-white">Latest</Link>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/editorial-standards" className="hover:text-white">Standards</Link>
          <Link href="/fact-checking" className="hover:text-white">Fact checking</Link>
          <Link href="/corrections" className="hover:text-white">Corrections</Link>
          <Link href="/ai-policy" className="hover:text-white">AI policy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <a href="https://auradigitalfiji.com" className="hover:text-white">Aura Digital Fiji</a>
          <span className="text-white/25">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
