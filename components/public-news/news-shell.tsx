import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";

export function NewsHeader() {
  const desktopNav = [
    { href: "/news", label: "All News", color: "#194B70" },
    { href: "/categories", label: "Categories", color: "#B82F70" },
    { href: "/about", label: "About Us", color: "#12A7BE" },
    { href: "/career", label: "Career", color: "#FF623F" },
    { href: "/contact", label: "Contact", color: "#839439" },
  ];

  const mobileNav = [
    { href: "/news", label: "News", icon: "▣", color: "#194B70" },
    { href: "/categories", label: "Categories", icon: "⌘", color: "#B82F70" },
    { href: "/about", label: "About", icon: "◌", color: "#12A7BE" },
    { href: "/career", label: "Career", icon: "ϟ", color: "#FF623F" },
    { href: "/contact", label: "Contact", icon: "⌕", color: "#839439" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black text-white">
      <div className="hidden min-h-[62px] lg:grid lg:grid-cols-[258px_repeat(5,minmax(130px,1fr))_182px]">
        <Link href="/" className="flex items-center border-r border-white/10 px-8 font-serif text-[28px] font-semibold tracking-[-0.045em]">
          Aura Intelligence
        </Link>
        {desktopNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="grid place-items-center border-r border-black/15 px-4 text-[12px] font-black uppercase tracking-[0.06em] transition hover:brightness-110"
            style={{ backgroundColor: item.color }}
          >
            {item.label}
          </Link>
        ))}
        <details className="group relative bg-[#0B6E24]">
          <summary className="grid h-full cursor-pointer list-none place-items-center px-5 text-[12px] font-black uppercase tracking-[0.06em] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2"><Search size={15}/> Search</span>
          </summary>
          <div className="absolute right-0 top-full z-50 w-[420px] border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl">
            <form action="/news" method="get" className="flex items-center gap-3">
              <input name="q" placeholder="Search Aura Intelligence..." className="min-w-0 flex-1 border-b-2 border-white bg-transparent px-1 py-3 text-base font-bold text-white outline-none placeholder:text-white/28" />
              <button className="bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-black">Search</button>
            </form>
          </div>
        </details>
      </div>

      <div className="lg:hidden">
        <div className="grid grid-cols-[1fr_repeat(5,56px)] border-b border-white/10">
          <Link href="/" className="flex min-w-0 items-center px-4 py-4 font-serif text-[24px] font-semibold tracking-[-0.045em]">
            Aura Intelligence
          </Link>
          {mobileNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className="grid min-h-[62px] place-items-center border-l border-black/15 text-[24px] font-semibold transition active:brightness-90"
              style={{ backgroundColor: item.color }}
            >
              <span aria-hidden="true">{item.icon}</span>
            </Link>
          ))}
        </div>
        <details className="group border-b border-white/10 bg-[#0B6E24]">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] [&::-webkit-details-marker]:hidden">
            <Search size={13}/> Search Aura Intelligence
          </summary>
          <form action="/news" method="get" className="flex items-center gap-2 border-t border-black/15 bg-[#0a0a0a] p-3">
            <input name="q" placeholder="Search stories..." className="min-w-0 flex-1 border border-white/15 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-white/30" />
            <button className="bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-black">Go</button>
          </form>
        </details>
      </div>
    </header>
  );
}

export function NewsFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] text-white">
      <div className="adi-footer-noise">
        <div className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.25fr_.7fr_.7fr_1.2fr]">
            <div>
              <p className="text-3xl font-black uppercase tracking-[-0.055em]">Aura Intelligence</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">by Aura Digital Fiji</p>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/48">Clear technology reporting, practical Fiji business context and evidence-linked analysis for the Pacific.</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white">News Categories</p>
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
                <Link href="/authors" className="block hover:text-white">The Authors</Link>
                <Link href="/career" className="block hover:text-white">Career</Link>
                <Link href="/contact" className="block hover:text-white">Contact Us</Link>
                <a href="/rss.xml" className="block hover:text-white">RSS Feed</a>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white">Editorial trust</p>
              <p className="mt-4 text-sm leading-7 text-white/48">Independent-source verification, originality controls and transparent automation standards protect what reaches publication.</p>
              <div className="mt-5 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.1em] text-white/52">
                <Link href="/editorial-standards" className="hover:text-white">Standards</Link>
                <Link href="/fact-checking" className="hover:text-white">Fact checking</Link>
                <Link href="/corrections" className="hover:text-white">Corrections</Link>
                <Link href="/ai-policy" className="hover:text-white">AI policy</Link>
                <Link href="/privacy" className="hover:text-white">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[10px] font-bold uppercase tracking-[0.12em] text-white/28 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Aura Digital Fiji. All rights reserved.</p>
            <a href="https://auradigitalfiji.com" className="inline-flex items-center gap-1.5 hover:text-white">Built by Aura Digital Fiji <ArrowUpRight size={12}/></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
