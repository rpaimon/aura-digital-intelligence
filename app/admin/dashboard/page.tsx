import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Activity, FileText, Radio, Rss, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const [{ count: stories }, { count: sources }, { count: articles }, { count: jobs }] =
    await Promise.all([
      supabase.from("stories").select("*", { count: "exact", head: true }),
      supabase.from("sources").select("*", { count: "exact", head: true }),
      supabase.from("articles").select("*", { count: "exact", head: true }),
      supabase.from("jobs").select("*", { count: "exact", head: true }),
    ]);

  const cards = [
    { label: "Stories", value: stories ?? 0, icon: Radio },
    { label: "Sources", value: sources ?? 0, icon: Rss },
    { label: "Articles", value: articles ?? 0, icon: FileText },
    { label: "Jobs", value: jobs ?? 0, icon: Activity },
  ];

  return (
    <main className="min-h-screen bg-[#f7f5f2]">
      <header className="border-b border-[#e5e1db] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Aura Digital Intelligence
            </p>
            <h1 className="mt-1 text-xl font-black">Newsroom</h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-3xl bg-[#111318] p-8 text-white">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <ShieldCheck size={16} />
                Authenticated newsroom
              </div>
              <h2 className="mt-4 text-3xl font-black">Automatic discovery is online.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-white/65">
                Signed in as {user.email}. Active RSS sources are now prepared for scheduled discovery and duplicate protection. AI research and publishing come next.
              </p>
            </div>
            <div className="hidden rounded-2xl bg-white/10 px-4 py-3 text-sm md:block">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
              System ready
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-3xl border border-[#e5e1db] bg-white p-6">
                <Icon size={20} />
                <p className="mt-8 text-sm text-gray-500">{card.label}</p>
                <p className="mt-1 text-4xl font-black">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#e5e1db] bg-white p-7">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold">Build sequence</h3>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/stories" className="rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs font-black">Story inbox</Link>
                <Link href="/admin/sources" className="rounded-xl bg-[#111318] px-3 py-2 text-xs font-black text-white">Manage sources</Link>
              </div>
            </div>
            <ol className="mt-5 space-y-3 text-sm text-gray-600">
              <li>01 — Database & authentication ✓</li>
              <li>02 — Source manager ✓</li>
              <li>03 — News discovery worker ✓</li>
              <li>04 — Duplicate detection ✓</li>
              <li>05 — Fiji + Aura relevance engine</li>
              <li>06 — Research agent</li>
              <li>07 — Writer + fact checker</li>
              <li>08 — SEO + publishing</li>
            </ol>
          </div>

          <div className="rounded-3xl border border-[#e5e1db] bg-white p-7">
            <h3 className="text-lg font-bold">Commercial objective</h3>
            <p className="mt-4 leading-7 text-gray-600">
              Every content feature is being built around the real business goal:
              attract Fiji business owners and convert relevant readers into Aura
              website, security, hosting, email, ecommerce, app and IT enquiries.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
