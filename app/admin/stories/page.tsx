import Link from "next/link";
import { ArrowLeft, CircleDot, ExternalLink, Radio } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Story = {
  id: string;
  title: string;
  source_url: string;
  status: string;
  category: string | null;
  published_at: string | null;
  discovered_at: string;
  duplicate_score: number | null;
  importance_score: number | null;
  fiji_relevance_score: number | null;
  business_relevance_score: number | null;
  aura_service_relevance_score: number | null;
  sources: { name: string } | null;
};

export default async function StoriesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stories")
    .select("id,title,source_url,status,category,published_at,discovered_at,duplicate_score,importance_score,fiji_relevance_score,business_relevance_score,aura_service_relevance_score,sources(name)")
    .order("discovered_at", { ascending: false })
    .limit(100);

  const stories = (data ?? []) as unknown as Story[];
  const discovered = stories.filter((story) => story.status === "discovered").length;
  const duplicates = stories.filter((story) => story.status === "duplicate").length;
  const scored = stories.filter((story) => story.status === "scored").length;

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#101114]">
      <header className="border-b border-[#e5e1db] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5">
          <Link href="/admin/dashboard" className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e1db] hover:bg-[#f7f5f2]" aria-label="Back to dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Automation monitor</p>
            <h1 className="mt-1 text-xl font-black">Story Inbox</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Latest loaded" value={stories.length} />
          <Stat label="New discoveries" value={discovered} />
          <Stat label="AI scored" value={scored} />
          <Stat label="Duplicates blocked" value={duplicates} />
        </div>

        <div className="mt-6 rounded-3xl border border-[#e5e1db] bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">RSS Scout output</p>
              <h2 className="mt-1 text-2xl font-black">Latest 100 stories</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-gray-500">This page is only for monitoring. Discovery runs automatically; you do not need to add stories manually.</p>
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error.message}</p>}

          <div className="mt-6 divide-y divide-[#eeeae4]">
            {stories.map((story) => (
              <article key={story.id} className="grid gap-3 py-5 md:grid-cols-[1fr_auto] md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={story.status} />
                    <span className="text-xs font-bold text-gray-400">{story.category ?? "Uncategorised"}</span>
                    <span className="text-xs text-gray-400">{story.sources?.name ?? "Unknown source"}</span>
                  </div>
                  <h3 className="mt-2 text-base font-black leading-6">{story.title}</h3>
                  {story.status === "scored" && (
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-gray-600">
                      <Score label="Importance" value={story.importance_score} />
                      <Score label="Fiji/Pacific" value={story.fiji_relevance_score} />
                      <Score label="Business" value={story.business_relevance_score} />
                      <Score label="Aura" value={story.aura_service_relevance_score} />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Published {story.published_at ? new Date(story.published_at).toLocaleString() : "unknown"} · Discovered {new Date(story.discovered_at).toLocaleString()}
                  </p>
                </div>
                <a href={story.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs font-black hover:bg-[#f7f5f2]">
                  Original <ExternalLink size={13} />
                </a>
              </article>
            ))}

            {!stories.length && !error && (
              <div className="py-14 text-center text-gray-500">
                <Radio className="mx-auto" />
                <p className="mt-3 font-black text-[#101114]">No stories discovered yet</p>
                <p className="mt-1 text-sm">Once the RSS Scout runs, new stories will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[#e5e1db] bg-white p-5">
      <CircleDot size={18} />
      <p className="mt-6 text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="rounded-lg bg-[#f7f5f2] px-2.5 py-1">
      {label}: {value == null ? "—" : Math.round(Number(value))}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "duplicate"
    ? "bg-amber-100 text-amber-800"
    : status === "discovered"
      ? "bg-emerald-100 text-emerald-800"
      : status === "scored"
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-700";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${cls}`}>{status}</span>;
}
