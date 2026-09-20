import Link from "next/link";
import { ArrowRight, Bot, Globe2, ShieldCheck, Sparkles } from "lucide-react";

const pillars = [
  {
    icon: Globe2,
    title: "Global technology",
    text: "We monitor important developments across AI, software, cloud, cybersecurity and digital business.",
  },
  {
    icon: ShieldCheck,
    title: "Verified first",
    text: "Stories are designed around source verification and original analysis instead of simple rewrites.",
  },
  {
    icon: Bot,
    title: "Built for Fiji",
    text: "The editorial system looks for practical implications for Fiji businesses and local digital needs.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-black tracking-tight">
            AURA <span className="font-normal">DIGITAL INTELLIGENCE</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/news" className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">News</Link>
            <Link href="/admin/login" className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">Newsroom</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-24">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--muted)]">
            <Sparkles size={15} />
            Technology intelligence for Fiji & the Pacific
          </div>

          <h1 className="text-5xl font-black tracking-[-0.05em] sm:text-7xl">
            Technology news that actually matters to Fiji businesses.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Aura Digital Intelligence is the future content and research engine
            behind Aura Digital Fiji — designed to turn global technology
            developments into useful local business insight.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/news" className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-semibold text-white">Read the News <ArrowRight size={17} /></Link>
            <a
              href="https://auradigitalfiji.com"
              className="rounded-full border border-[var(--line)] bg-white px-6 py-3 font-semibold"
            >
              Aura Digital Fiji
            </a>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-3xl border border-[var(--line)] bg-white p-7"
              >
                <Icon size={24} />
                <h2 className="mt-8 text-xl font-bold">{item.title}</h2>
                <p className="mt-3 leading-7 text-[var(--muted)]">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
