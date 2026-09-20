import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Globe2, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { publishArticle, setPublishingMode, unpublishArticle } from "./actions";
import { ScheduleForm } from "./schedule-form";

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
  final_quality_score: number | null;
  final_quality_passed: boolean | null;
  final_quality_notes: unknown;
  scheduled_for: string | null;
  published_at: string | null;
  seo_keywords: unknown;
  generated_at: string | null;
  created_at: string;
  stories: {
    source_url: string;
    verification_status: string | null;
    verification_confidence: number | null;
  } | null;
};

function tags(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 10) : [];
}

function obj(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function StatusBadge({ status }: { status: string }) {
  const style = status === "published" ? "bg-blue-100 text-blue-800" : status === "approved" ? "bg-emerald-100 text-emerald-800" : status === "review" ? "bg-violet-100 text-violet-800" : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${style}`}>{status}</span>;
}

export default async function ArticlesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data, error }, { data: publishingSetting }] = await Promise.all([
    supabase
      .from("articles")
      .select("id,story_id,slug,title,subtitle,excerpt,content,category,seo_title,seo_description,status,quality_score,quality_notes,final_quality_score,final_quality_passed,final_quality_notes,scheduled_for,published_at,seo_keywords,generated_at,created_at,stories(source_url,verification_status,verification_confidence)")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("settings").select("value").eq("key", "publishing_mode").maybeSingle(),
  ]);

  const rows = (data ?? []) as unknown as ArticleRow[];
  const publishingMode = typeof publishingSetting?.value === "string" ? publishingSetting.value : "manual";
  const passed = rows.filter((row) => row.final_quality_passed).length;
  const published = rows.filter((row) => row.status === "published").length;
  const scheduled = rows.filter((row) => row.scheduled_for && row.status !== "published").length;

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#101114]">
      <header className="border-b border-[#e5e1db] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5">
          <Link href="/admin/dashboard" className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e1db] hover:bg-[#f7f5f2]" aria-label="Back to dashboard"><ArrowLeft size={18} /></Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Publishing engine</p>
            <h1 className="mt-1 text-xl font-black">Articles & Publication</h1>
          </div>
          <Link href="/news" target="_blank" className="hidden items-center gap-2 rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs font-black sm:inline-flex">Public newsroom <ExternalLink size={13} /></Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Generated" value={rows.length} />
          <Stat label="Quality passed" value={passed} />
          <Stat label="Scheduled" value={scheduled} />
          <Stat label="Published" value={published} />
        </div>

        <div className="mt-6 rounded-3xl border border-[#e5e1db] bg-[#111318] p-6 text-white">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/50"><Globe2 size={14} /> Publishing mode</div>
              <h2 className="mt-2 text-2xl font-black">{publishingMode === "automatic" ? "Automatic publishing is ON" : "Manual publishing is ON"}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Only articles that pass the deterministic final quality gate are eligible. Scheduled articles publish at their selected time in either mode.</p>
            </div>
            <div className="flex gap-2">
              <form action={setPublishingMode}><input type="hidden" name="mode" value="manual" /><button className={`rounded-xl px-4 py-2 text-sm font-black ${publishingMode === "manual" ? "bg-white text-black" : "bg-white/10 text-white"}`}>Manual</button></form>
              <form action={setPublishingMode}><input type="hidden" name="mode" value="automatic" /><button className={`rounded-xl px-4 py-2 text-sm font-black ${publishingMode === "automatic" ? "bg-emerald-400 text-black" : "bg-white/10 text-white"}`}>Automatic</button></form>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-[#e5e1db] bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-500"><ShieldCheck size={14} /> Final publication gate</div>
              <h2 className="mt-1 text-2xl font-black">Verified, written, checked, then published</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-gray-500">A HOLD or REJECT story cannot reach this page as a publishable article. The final gate is deterministic and does not spend another AI call.</p>
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error.message}</p>}

          <div className="mt-6 divide-y divide-[#eeeae4]">
            {rows.map((row) => {
              const notes = obj(row.quality_notes);
              const finalNotes = obj(row.final_quality_notes);
              const seoTags = tags(row.seo_keywords);
              return (
                <article key={row.id} className="py-7">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
                    <StatusBadge status={row.status} />
                    <span>Writer {row.quality_score == null ? "—" : Math.round(Number(row.quality_score))}</span>
                    <span>Final {row.final_quality_score == null ? "Pending" : Math.round(Number(row.final_quality_score))}</span>
                    <span className={row.final_quality_passed ? "text-emerald-700" : ""}>{row.final_quality_passed ? "Gate passed" : row.final_quality_passed === false ? "Needs review" : "Awaiting gate"}</span>
                    {row.published_at && <span>Published {new Date(row.published_at).toLocaleString()}</span>}
                    {row.scheduled_for && !row.published_at && <span>Scheduled {new Date(row.scheduled_for).toLocaleString()}</span>}
                  </div>

                  <h3 className="mt-3 text-xl font-black">{row.title}</h3>
                  {row.subtitle && <p className="mt-1 text-sm font-bold text-gray-600">{row.subtitle}</p>}
                  {row.excerpt && <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">{row.excerpt}</p>}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Metric label="Fact-check" value={row.stories?.verification_confidence == null ? "—" : String(Math.round(Number(row.stories.verification_confidence)))} />
                    <Metric label="Safe facts" value={String(notes.safe_fact_count ?? "—")} />
                    <Metric label="Sources" value={String(notes.independent_source_count ?? "—")} />
                    <Metric label="Words" value={String(notes.word_count ?? "—")} />
                    <Metric label="Category" value={row.category ?? "—"} />
                  </div>

                  {Array.isArray(finalNotes.failures) && finalNotes.failures.length > 0 && (
                    <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                      <p className="font-black">Quality gate notes</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">{finalNotes.failures.map((item, i) => <li key={i}>{String(item)}</li>)}</ul>
                    </div>
                  )}

                  {(row.seo_title || row.seo_description) && (
                    <div className="mt-4 rounded-2xl border border-[#e9e4dd] bg-[#fbfaf8] p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-500">SEO preview</p>
                      <p className="mt-2 text-sm font-black">{row.seo_title || row.title}</p>
                      {row.seo_description && <p className="mt-1 text-xs leading-5 text-gray-600">{row.seo_description}</p>}
                    </div>
                  )}

                  {seoTags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{seoTags.map((tag) => <span key={tag} className="rounded-full bg-[#f0ede8] px-2.5 py-1 text-[10px] font-black uppercase text-gray-600">{tag}</span>)}</div>}

                  <div className="mt-5 flex flex-wrap items-end gap-2">
                    {row.final_quality_passed && row.status !== "published" && (
                      <form action={publishArticle}><input type="hidden" name="articleId" value={row.id} /><button className="rounded-xl bg-[#111318] px-4 py-2.5 text-xs font-black text-white">Publish now</button></form>
                    )}
                    {row.final_quality_passed && row.status !== "published" && <ScheduleForm articleId={row.id} />}
                    {row.status === "published" && (
                      <><Link href={`/news/${row.slug}`} target="_blank" className="rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-800">View live</Link><form action={unpublishArticle}><input type="hidden" name="articleId" value={row.id} /><button className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-black text-red-700">Unpublish</button></form></>
                    )}
                    {row.stories?.source_url && <a href={row.stories.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-2 py-2 text-xs font-black text-gray-600">Original story <ExternalLink size={12} /></a>}
                  </div>

                  <details className="mt-4 rounded-2xl border border-[#e9e4dd] p-4"><summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-gray-500">Draft content</summary><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-gray-700">{row.content || "No content"}</pre></details>
                </article>
              );
            })}

            {!rows.length && !error && <div className="py-14 text-center text-gray-500"><FileText className="mx-auto" /><p className="mt-3 font-black text-[#101114]">No article drafts yet</p><p className="mt-1 text-sm">Future APPROVED fact checks will automatically enter the writer and final quality gate.</p></div>}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-3xl border border-[#e5e1db] bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#f7f5f2] px-3 py-2.5"><p className="text-[10px] font-black uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 truncate text-sm font-black">{value}</p></div>;
}
