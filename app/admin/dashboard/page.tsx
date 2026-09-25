import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Activity, ArrowUpRight, FileText, MousePointerClick, Radio, Rss, SearchCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAdmin();
  const supabase = await createClient();
  const today = new Date();
  const fijiDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Fiji", year: "numeric", month: "2-digit", day: "2-digit" }).format(today);
  const start = new Date(`${fijiDate}T00:00:00+12:00`).toISOString();

  const [storiesR, sourcesR, articlesR, jobsR, factChecksR, publishedR, clicksR] = await Promise.all([
    supabase.from("stories").select("*", { count: "exact", head: true }),
    supabase.from("sources").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("fact_checks").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published").gte("published_at", start),
    supabase.from("conversion_events").select("*", { count: "exact", head: true }).gte("created_at", start),
  ]);

  const cards = [
    { label: "Stories", value: storiesR.count ?? 0, icon: Radio, href: "/admin/stories" },
    { label: "Sources", value: sourcesR.count ?? 0, icon: Rss, href: "/admin/sources" },
    { label: "Articles", value: articlesR.count ?? 0, icon: FileText, href: "/admin/articles" },
    { label: "Fact checks", value: factChecksR.count ?? 0, icon: SearchCheck, href: "/admin/fact-checks" },
    { label: "Published today", value: publishedR.count ?? 0, icon: Activity, href: "/admin/articles" },
    { label: "Aura clicks today", value: clicksR.count ?? 0, icon: MousePointerClick, href: "/admin/articles" },
  ];

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-[#111318]">
      <section className="mx-auto max-w-[1440px] px-5 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Newsroom control</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Good to see you.</h1>
            <p className="mt-2 text-sm text-gray-500">Signed in as {user.email}. Monitor discovery, verification, publication and traffic from one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/articles" className="rounded-xl bg-[#11151b] px-4 py-2.5 text-xs font-black text-white">Review articles</Link>
            <Link href="/news" target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-[#dfe3e8] bg-white px-4 py-2.5 text-xs font-black">Open newsroom <ArrowUpRight size={13}/></Link>
          </div>
        </div>

        <div className="mt-7 grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href} className="group rounded-3xl border border-[#dfe3e8] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c8ced6]">
                <div className="flex items-center justify-between"><Icon size={18}/><ArrowUpRight size={13} className="text-gray-300 transition group-hover:text-black"/></div>
                <p className="mt-6 text-[11px] font-bold text-gray-500">{card.label}</p>
                <p className="mt-1 text-3xl font-black tracking-[-0.05em]">{card.value}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl bg-[#11151b] p-6 text-white sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/48"><ShieldCheck size={15}/> Live publishing system</div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">Target 2/day</span>
            </div>
            <h2 className="mt-4 max-w-2xl text-2xl font-black tracking-[-0.04em] sm:text-3xl">Discovery → verification → article → publication.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">The backend pipeline is running automatically. Use this admin area to monitor decisions, inspect evidence, review article quality, manage sources and confirm what is live.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-4">
              <Link href="/admin/stories" className="rounded-xl bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/20">Story inbox</Link>
              <Link href="/admin/fact-checks" className="rounded-xl bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/20">Fact checks</Link>
              <Link href="/admin/articles" className="rounded-xl bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/20">Publishing</Link>
              <Link href="/admin/sources" className="rounded-xl bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/20">Sources</Link>
            </div>
          </section>

          <section className="rounded-3xl border border-[#dfe3e8] bg-white p-6 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Today in Fiji</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Publication progress</h2>
            <div className="mt-5 flex items-end gap-3"><span className="text-6xl font-black tracking-[-0.08em]">{publishedR.count ?? 0}</span><span className="pb-2 text-sm font-bold text-gray-400">of 2 published</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#11151b]" style={{ width: `${Math.min(100, ((publishedR.count ?? 0) / 2) * 100)}%` }}/></div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-[#f5f7f9] p-4"><span className="text-gray-400">Jobs</span><strong className="mt-1 block text-xl">{jobsR.count ?? 0}</strong></div><div className="rounded-2xl bg-[#f5f7f9] p-4"><span className="text-gray-400">Clicks today</span><strong className="mt-1 block text-xl">{clicksR.count ?? 0}</strong></div></div>
          </section>
        </div>
      </section>
    </main>
  );
}
