import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Activity, ExternalLink, FileText, MousePointerClick, Radio, Rss, SearchCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

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
    { label: "Stories", value: storiesR.count ?? 0, icon: Radio },
    { label: "Sources", value: sourcesR.count ?? 0, icon: Rss },
    { label: "Articles", value: articlesR.count ?? 0, icon: FileText },
    { label: "Fact checks", value: factChecksR.count ?? 0, icon: SearchCheck },
    { label: "Published today", value: publishedR.count ?? 0, icon: Activity },
    { label: "Aura clicks today", value: clicksR.count ?? 0, icon: MousePointerClick },
  ];

  return (
    <main className="min-h-screen bg-[#f7f5f2]">
      <header className="border-b border-[#e5e1db] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Aura Digital Intelligence</p><h1 className="mt-1 text-xl font-black">Acquisition newsroom</h1></div>
          <SignOutButton />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-3xl bg-[#111318] p-8 text-white">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/60"><ShieldCheck size={16} /> Free Acquisition Engine v2</div>
              <h2 className="mt-4 text-3xl font-black">Two strong articles. Zero routine AI waste.</h2>
              <p className="mt-3 max-w-3xl leading-7 text-white/65">Signed in as {user.email}. RSS discovery and story scoring run without generative AI. Only the best daily candidates consume free AI for independent-source verification and final writing. Approved drafts must pass originality and quality gates before automatic publication.</p>
            </div>
            <div className="hidden rounded-2xl bg-white/10 px-4 py-3 text-sm md:block"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" /> Daily target: 2</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-3xl border border-[#e5e1db] bg-white p-5"><Icon size={19} /><p className="mt-7 text-xs text-gray-500">{card.label}</p><p className="mt-1 text-3xl font-black">{card.value}</p></div>; })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#e5e1db] bg-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-lg font-bold">Live pipeline</h3><p className="mt-1 text-sm text-gray-500">Deterministic first. AI only at the evidence and writing gates.</p></div>
              <div className="flex flex-wrap justify-end gap-2"><Link href="/admin/stories" className="rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs font-black">Story inbox</Link><Link href="/admin/fact-checks" className="rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs font-black">Fact checks</Link><Link href="/admin/articles" className="rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs font-black">Articles</Link><Link href="/admin/sources" className="rounded-xl bg-[#111318] px-3 py-2 text-xs font-black text-white">Sources</Link></div>
            </div>
            <ol className="mt-6 space-y-3 text-sm text-gray-600">
              <li>01 — Curated source discovery + health monitoring ✓</li>
              <li>02 — Duplicate protection + freshness filters ✓</li>
              <li>03 — Zero-AI Fiji/business/Aura relevance scoring ✓</li>
              <li>04 — Best-candidate selector (maximum 8 AI candidates/day) ✓</li>
              <li>05 — Independent-source claim verification ✓</li>
              <li>06 — Verified-facts article writer ✓</li>
              <li>07 — Copyright/originality guard ✓</li>
              <li>08 — Fiji usefulness + SEO quality gate ✓</li>
              <li>09 — Automatic publishing capped at 2/day ✓</li>
              <li>10 — Contextual Aura service CTA tracking ✓</li>
            </ol>
          </div>

          <div className="rounded-3xl border border-[#e5e1db] bg-white p-7">
            <h3 className="text-lg font-bold">Commercial objective</h3>
            <p className="mt-4 leading-7 text-gray-600">The KPI is not article volume. It is useful Fiji technology visibility that earns search traffic, sends relevant readers to Aura Digital Fiji, and produces enquiries.</p>
            <div className="mt-6 rounded-2xl bg-[#f5f3ee] p-5 text-sm leading-6 text-gray-600"><strong className="text-black">Conversion path:</strong> Google / News / Discover → verified article → contextual Aura service CTA → enquiry.</div>
            <a href="/news" target="_blank" className="mt-5 inline-flex items-center gap-2 text-sm font-black">Open public newsroom <ExternalLink size={14} /></a>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400">Jobs in database: {jobsR.count ?? 0}. AI research queue is intentionally retired in v2.</p>
      </section>
    </main>
  );
}
