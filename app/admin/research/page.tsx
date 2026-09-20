import Link from "next/link";
import { ArrowLeft, ExternalLink, FlaskConical } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ResearchRow = {
  id: string;
  story_id: string;
  source_url: string;
  source_name: string;
  credibility: number | null;
  notes: string | null;
  key_facts: unknown;
  created_at: string;
  stories: { title: string; priority_score: number | null; decision: string | null } | null;
};

function facts(value: unknown) {
  if (!value || typeof value !== "object") return [] as string[];
  const candidate = (value as { key_facts?: unknown }).key_facts;
  return Array.isArray(candidate) ? candidate.filter((x): x is string => typeof x === "string").slice(0, 5) : [];
}

export default async function ResearchPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("research")
    .select("id,story_id,source_url,source_name,credibility,notes,key_facts,created_at,stories(title,priority_score,decision)")
    .eq("source_type", "ai-research-package")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as unknown as ResearchRow[];

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#101114]">
      <header className="border-b border-[#e5e1db] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5">
          <Link href="/admin/dashboard" className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e1db] hover:bg-[#f7f5f2]" aria-label="Back to dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Autonomous newsroom</p>
            <h1 className="mt-1 text-xl font-black">Research Queue</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-[#e5e1db] bg-white p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">AI research packages</p>
              <h2 className="mt-1 text-2xl font-black">Stories selected for deeper research</h2>
            </div>
            <span className="rounded-full bg-[#111318] px-3 py-1.5 text-xs font-black text-white">{rows.length} packages</span>
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error.message}</p>}

          <div className="mt-6 divide-y divide-[#eeeae4]">
            {rows.map((row) => {
              const keyFacts = facts(row.key_facts);
              return (
                <article key={row.id} className="py-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-800">RESEARCHED</span>
                    <span>Priority {row.stories?.priority_score == null ? "—" : Math.round(Number(row.stories.priority_score))}</span>
                    <span>Confidence {row.credibility == null ? "—" : Math.round(Number(row.credibility))}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-black">{row.stories?.title ?? "Unknown story"}</h3>
                  {row.notes && <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">{row.notes}</p>}
                  {keyFacts.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
                      {keyFacts.map((fact, index) => <li key={index}>• {fact}</li>)}
                    </ul>
                  )}
                  <a href={row.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs font-black hover:bg-[#f7f5f2]">
                    Original source <ExternalLink size={13} />
                  </a>
                </article>
              );
            })}

            {!rows.length && !error && (
              <div className="py-14 text-center text-gray-500">
                <FlaskConical className="mx-auto" />
                <p className="mt-3 font-black text-[#101114]">No research packages yet</p>
                <p className="mt-1 text-sm">High-priority stories will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
