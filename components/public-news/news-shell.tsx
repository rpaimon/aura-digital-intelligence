import Link from "next/link";
import { ArrowUpRight, Menu, Search } from "lucide-react";

const nav = [
  { href: "/news", label: "All News" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About Us" },
  { href: "/authors", label: "Authors" },
  { href: "/career", label: "Career" },
  { href: "/contact", label: "Contact" },
];

const ribbon = [
  ["AI", "/news/topic/ai"],
  ["CYBER", "/news/topic/cybersecurity"],
  ["CLOUD", "/news/topic/cloud"],
  ["BUSINESS", "/news/topic/business-tech"],
  ["ECOMMERCE", "/news/topic/ecommerce"],
  ["FIJI + PACIFIC", "/news/topic/fiji-pacific"],
] as const;

export function NewsHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a0d]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group leading-none">
          <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/38">Aura Digital Fiji</span>
          <span className="mt-1.5 block text-xl font-black uppercase tracking-[-0.045em] text-white">Aura Intelligence</span>
        </Link>
        <nav className="hidden items-center gap-6 text-[11px] font-black uppercase tracking-[0.12em] text-white/58 lg:flex">
          {nav.map((item) => <Link key={item.href} href={item.href} className="transition hover:text-white">{item.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <details className="group relative">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-white/12 text-white/65 transition hover:bg-white hover:text-black [&::-webkit-details-marker]:hidden"><Search size={16} /></summary>
            <div className="fixed inset-x-0 top-[74px] z-50 border-y border-white/10 bg-[#0a0d11] p-4 shadow-2xl sm:p-6">
              <form action="/news" method="get" className="mx-auto flex max-w-3xl items-center gap-3">
                <input name="q" placeholder="Search Aura Intelligence..." className="min-w-0 flex-1 border-b-2 border-white bg-transparent px-1 py-3 text-lg font-bold text-white outline-none placeholder:text-white/28" />
                <button className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black">Search</button>
              </form>
            </div>
          </details>
          <details className="relative lg:hidden">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-white/12 text-white/70 [&::-webkit-details-marker]:hidden"><Menu size={17} /></summary>
            <div className="absolute right-0 top-12 w-64 border border-white/10 bg-[#0a0d11] p-3 shadow-2xl">
              {nav.map((item) => <Link key={item.href} href={item.href} className="block border-b border-white/8 px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/70 last:border-b-0">{item.label}</Link>)}
              <a href="https://auradigitalfiji.com" className="mt-3 flex items-center justify-between bg-white px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-black">Aura Digital Fiji <ArrowUpRight size={13}/></a>
            </div>
          </details>
          <a href="https://auradigitalfiji.com" className="hidden items-center gap-1.5 rounded-full border border-white/14 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-black sm:inline-flex">Aura Digital Fiji <ArrowUpRight size={13}/></a>
        </div>
      </div>
      <div className="border-t border-white/8 bg-[#0a0d11]">
        <div className="mx-auto flex max-w-[1480px] items-center gap-5 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ribbon.map(([label, href], index) => (
            <div key={href} className="flex shrink-0 items-center gap-5">
              <Link href={href} className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50 transition hover:text-white">{label}</Link>
              {index < ribbon.length - 1 && <span className="text-white/14">/</span>}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

export function NewsFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050608] text-white">
      <div className="adi-footer-noise">
        <div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_.7fr_.7fr_1fr]">
            <div>
              <p className="text-3xl font-black uppercase tracking-[-0.055em]">Aura Intelligence</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">by Aura Digital Fiji</p>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/48">Technology reporting, practical Fiji business context and evidence-linked analysis for the Pacific.</p>
              <a href="https://auradigitalfiji.com" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white hover:text-white/70">Visit Aura Digital Fiji <ArrowUpRight size={13}/></a>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white">Categories</p>
              <div className="mt-4 space-y-2.5 text-sm font-bold text-white/48">
                <Link href="/news/topic/ai" className="block hover:text-white">Artificial Intelligence</Link>
                <Link href="/news/topic/cybersecurity" className="block hover:text-white">Cybersecurity</Link>
                <Link href="/news/topic/business-tech" className="block hover:text-white">Business Technology</Link>
                <Link href="/news/topic/fiji-pacific" className="block hover:text-white">Fiji & Pacific</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white">Quick Links</p>
              <div className="mt-4 space-y-2.5 text-sm font-bold text-white/48">
                <Link href="/news" className="block hover:text-white">News</Link>
                <Link href="/about" className="block hover:text-white">About Us</Link>
                <Link href="/authors" className="block hover:text-white">Authors</Link>
                <Link href="/career" className="block hover:text-white">Career</Link>
                <Link href="/contact" className="block hover:text-white">Contact</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white">Editorial trust</p>
              <p className="mt-4 text-sm leading-7 text-white/48">Independent-source verification, originality checks and editorial standards protect what reaches publication.</p>
              <div className="mt-5 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.1em] text-white/52">
                <Link href="/editorial-standards" className="hover:text-white">Standards</Link>
                <Link href="/fact-checking" className="hover:text-white">Fact checking</Link>
                <Link href="/corrections" className="hover:text-white">Corrections</Link>
                <Link href="/privacy" className="hover:text-white">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[10px] font-bold uppercase tracking-[0.12em] text-white/28 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Aura Digital Fiji. All rights reserved.</p>
            <a href="https://auradigitalfiji.com" className="inline-flex items-center gap-1.5 hover:text-white">Built by Aura Digital Fiji <ArrowUpRight size={12}/></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
