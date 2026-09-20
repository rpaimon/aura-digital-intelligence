import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ArticleRow = {
  id: string;
  story_id: string | null;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  quality_score: number | null;
  quality_notes: unknown;
  seo_keywords: unknown;
  generated_at: string | null;
  created_at: string;
  stories: {
    source_url: string;
    verification_status: string | null;
    verification_confidence: number | null;
  } | null;
};

function keywords(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 10)
    : [];
}

function qualityNotes(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function StatusBadge({ status }: { status: string }) {
  const style = status === "review"
    ? "bg-emerald-100 text-emerald-800"
    : status === "published"
      ? "bg-blue-100 text-blue-800"
      : "bg-amber-100 text-amber-800";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${style}`}>
      {status}
    </span>
  );
}

export default async function ArticlesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("id,story_id,slug,title,subtitle,excerpt,content,category,seo_title,seo_description,status,quality_score,quality_notes,seo_keywords,generated_at,created_at,stories(source_url,verification_status,verification_confidence)")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as unknown as ArticleRow[];
  const reviews = rows.filter((row) => row.status === "review").length;
  const drafts = rows.filter((row) => row.status === "draft").length;
  const published = rows.filter((row) => row.status === "published").length;

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#101114]">
      <header className="border-b border-[#e5e1db] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5">
          <Link href="/admin/dashboard" className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e1db] hover:bg-[#f7f5f2]" aria-label="Back to dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Verified-content pipeline</p>
            <h1 className="mt-1 text-xl font-black">Article Drafts</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Generated" value={rows.length} />
          <Stat label="Draft" value={drafts} />
          <Stat label="Review-ready" value={reviews} />
          <Stat label="Published" value={published} />
        </div>

        <div className="mt-6 rounded-3xl border border-[#e5e1db] bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                <ShieldCheck size={14} /> Safe-facts writer
              </div>
              <h2 className="mt-1 text-2xl font-black">Generated only after fact-check approval</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-gray-500">
              Automatic public publishing is still off. Articles marked REVIEW have passed the first deterministic writing-quality check and are ready for the later final publishing gate.
            </p>
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error.message}</p>}

          <div className="mt-6 divide-y divide-[#eeeae4]">
            {rows.map((row) => {
              const notes = qualityNotes(row.quality_notes);
              const tags = keywords(row.seo_keywords);
              return (
                <article key={row.id} className="py-7">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
                    <StatusBadge status={row.status} />
                    <span>Quality {row.quality_score == null ? "—" : Math.round(Number(row.quality_score))}</span>
                    <span>Fact-check {row.stories?.verification_confidence == null ? "—" : Math.round(Number(row.stories.verification_confidence))}</span>
                    {row.generated_at && <span>{new Date(row.generated_at).toLocaleString()}</span>}
                  </div>

                  <h3 className="mt-3 text-xl font-black">{row.title}</h3>
                  {row.subtitle && <p className="mt-1 text-sm font-bold text-gray-600">{row.subtitle}</p>}
                  {row.excerpt && <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">{row.excerpt}</p>}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric label="Safe facts" value={String(notes.safe_fact_count ?? "—")} />
                    <Metric label="Sources" value={String(notes.independent_source_count ?? "—")} />
                    <Metric label="Words" value={String(notes.word_count ?? "—")} />
                    <Metric label="Category" value={row.category ?? "—"} />
                  </div>

                  {(row.seo_title || row.seo_description) && (
                    <div className="mt-4 rounded-2xl border border-[#e9e4dd] bg-[#fbfaf8] p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-500">SEO preview</p>
                      <p className="mt-2 text-sm font-black">{row.seo_title || row.title}</p>
                      {row.seo_description && <p className="mt-1 text-xs leading-5 text-gray-600">{row.seo_description}</p>}
                    </div>
                  )}

                  {tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tags.map((tag) => <span key={tag} className="rounded-full bg-[#f0ede8] px-2.5 py-1 text-[10px] font-black uppercase text-gray-600">{tag}</span>)}
                    </div>
                  )}

                  <details className="mt-4 rounded-2xl border border-[#e9e4dd] p-4">
                    <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-gray-500">Draft content</summary>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-gray-700">{row.content || "No content"}</pre>
                  </details>

                  {row.stories?.source_url && (
                    <a href={row.stories.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-gray-600 hover:text-black">
                      Original story <ExternalLink size={12} />
                    </a>
                  )}
                </article>
              );
            })}

            {!rows.length && !error && (
              <div className="py-14 text-center text-gray-500">
                <FileText className="mx-auto" />
                <p className="mt-3 font-black text-[#101114]">No article drafts yet</p>
                <p className="mt-1 text-sm">The first APPROVED fact check will automatically queue the writer.</p>
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
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f7f5f2] px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}
