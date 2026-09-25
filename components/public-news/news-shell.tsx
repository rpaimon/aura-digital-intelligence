import Link from "next/link";
import { ArrowUpRight, Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/public-news/theme-toggle";

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
    <header className="adi-header sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group leading-none">
          <span className="adi-brand-eyebrow block text-[10px] font-black uppercase tracking-[0.24em]">Aura Digital Fiji</span>
          <span className="adi-brand-title mt-1.5 block text-xl font-black uppercase tracking-[-0.045em]">Aura Intelligence</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[11px] font-black uppercase tracking-[0.12em] lg:flex">
          {nav.map((item) => <Link key={item.href} href={item.href} className="adi-header-link transition">{item.label}</Link>)}
        </nav>

        <div className="flex items-center gap-2">
          <details className="group relative">
            <summary className="adi-circle-button grid cursor-pointer list-none place-items-center [&::-webkit-details-marker]:hidden"><Search size={16} /></summary>
            <div className="adi-search-panel fixed inset-x-0 top-[73px] z-50 border-y p-4 shadow-2xl sm:p-6">
              <form action="/news" method="get" className="mx-auto flex max-w-3xl items-center gap-3">
                <input name="q" placeholder="Search Aura Intelligence..." className="adi-search-input min-w-0 flex-1 border-b-2 bg-transparent px-1 py-3 text-lg font-bold outline-none" />
                <button className="adi-search-submit rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.12em]">Search</button>
              </form>
            </div>
          </details>

          <ThemeToggle />

          <details className="relative lg:hidden">
            <summary className="adi-circle-button grid cursor-pointer list-none place-items-center [&::-webkit-details-marker]:hidden"><Menu size={17} /></summary>
            <div className="adi-mobile-menu absolute right-0 top-12 w-64 rounded-2xl border p-3 shadow-2xl">
              {nav.map((item) => <Link key={item.href} href={item.href} className="adi-mobile-menu-link block border-b px-3 py-3 text-xs font-black uppercase tracking-[0.12em] last:border-b-0">{item.label}</Link>)}
              <ThemeToggle compact />
              <a href="https://auradigitalfiji.com" className="adi-mobile-aura mt-3 flex items-center justify-between rounded-xl px-3 py-3 text-xs font-black uppercase tracking-[0.12em]">Aura Digital Fiji <ArrowUpRight size={13}/></a>
            </div>
          </details>

          <a href="https://auradigitalfiji.com" className="adi-aura-header-link hidden items-center gap-1.5 rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition sm:inline-flex">Aura Digital Fiji <ArrowUpRight size={13}/></a>
        </div>
      </div>

      <div className="adi-topic-nav border-t">
        <div className="adi-topic-nav-track mx-auto flex max-w-[1480px] items-center gap-0 overflow-x-auto px-4 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ribbon.map(([label, href], index) => (
            <Link key={href} href={href} className="adi-topic-link flex min-w-max items-center py-3 text-[10px] font-black uppercase tracking-[0.14em] transition">
              {index > 0 && <span className="adi-topic-divider mr-4">/</span>}
              {label}
            </Link>
          ))}
          <span className="adi-topic-fade pointer-events-none sticky right-0 ml-auto h-full w-10 shrink-0 sm:hidden" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

export function NewsFooter() {
  return (
    <footer className="adi-footer border-t">
      <div className="adi-footer-noise">
        <div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_.7fr_.7fr_1fr]">
            <div>
              <p className="text-3xl font-black uppercase tracking-[-0.055em]">Aura Intelligence</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] opacity-40">by Aura Digital Fiji</p>
              <p className="mt-5 max-w-md text-sm leading-7 opacity-52">Clear technology reporting, practical Fiji business context and evidence-linked analysis for the Pacific.</p>
              <a href="https://auradigitalfiji.com" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em]">Visit Aura Digital Fiji <ArrowUpRight size={13}/></a>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em]">News Categories</p>
              <div className="mt-4 space-y-2.5 text-sm font-bold opacity-52">
                <Link href="/news/topic/ai" className="block hover:opacity-100">Artificial Intelligence</Link>
                <Link href="/news/topic/cybersecurity" className="block hover:opacity-100">Cybersecurity</Link>
                <Link href="/news/topic/business-tech" className="block hover:opacity-100">Business Technology</Link>
                <Link href="/news/topic/fiji-pacific" className="block hover:opacity-100">Fiji & Pacific</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em]">Quick Links</p>
              <div className="mt-4 space-y-2.5 text-sm font-bold opacity-52">
                <Link href="/news" className="block hover:opacity-100">News</Link>
                <Link href="/about" className="block hover:opacity-100">About Us</Link>
                <Link href="/authors" className="block hover:opacity-100">Authors</Link>
                <Link href="/career" className="block hover:opacity-100">Career</Link>
                <Link href="/contact" className="block hover:opacity-100">Contact</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em]">Editorial trust</p>
              <p className="mt-4 text-sm leading-7 opacity-52">Independent-source verification, originality checks and editorial standards protect what reaches publication.</p>
              <div className="mt-5 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.1em] opacity-60">
                <Link href="/editorial-standards">Standards</Link><Link href="/fact-checking">Fact checking</Link><Link href="/corrections">Corrections</Link><Link href="/privacy">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t pt-6 text-[10px] font-bold uppercase tracking-[0.12em] opacity-35 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Aura Digital Fiji. All rights reserved.</p>
            <a href="https://auradigitalfiji.com" className="inline-flex items-center gap-1.5">Built by Aura Digital Fiji <ArrowUpRight size={12}/></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
