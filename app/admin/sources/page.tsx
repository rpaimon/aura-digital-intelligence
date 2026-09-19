import Link from "next/link";
import { ArrowLeft, Database, Plus, Rss, ShieldCheck, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FeedTestButton } from "@/components/newsroom/feed-test-button";
import { createSource, deleteSource, updateSource } from "./actions";

export const dynamic = "force-dynamic";

const categories = [
  "AI",
  "Technology",
  "Cybersecurity",
  "Web Development",
  "Cloud",
  "Business Technology",
  "Digital Marketing",
  "Ecommerce",
  "Mobile",
  "Fiji & Pacific",
];

type SearchParams = Promise<{ success?: string; error?: string }>;

export default async function SourcesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const supabase = await createClient();
  const params = await searchParams;

  const { data: sources, error } = await supabase
    .from("sources")
    .select("*")
    .order("active", { ascending: false })
    .order("trust_score", { ascending: false })
    .order("name", { ascending: true });

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#101114]">
      <header className="border-b border-[#e5e1db] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e1db] transition hover:bg-[#f7f5f2]"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Newsroom</p>
              <h1 className="mt-1 text-xl font-black">Source Manager</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm font-semibold text-gray-500 sm:flex">
            <ShieldCheck size={16} /> Discovery automated · publishing still manual
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="h-fit rounded-3xl border border-[#e5e1db] bg-white p-6 lg:sticky lg:top-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#111318] text-white">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="font-black">Add a source</h2>
                <p className="text-sm text-gray-500">Tell the scout where trusted information lives.</p>
              </div>
            </div>

            <form action={createSource} className="mt-6 space-y-4">
              <Field label="Source name" name="name" placeholder="e.g. OpenAI" required />
              <Field label="Website URL" name="url" placeholder="https://openai.com" type="url" required />
              <Field label="RSS / Atom feed URL" name="feed_url" placeholder="https://example.com/feed.xml" type="url" />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-bold">
                  Category
                  <select name="category" defaultValue="Technology" className="w-full rounded-xl border border-[#ddd8d0] bg-white px-3 py-3 font-normal outline-none focus:border-[#111318]">
                    {categories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <Field label="Country" name="country" placeholder="Global / Fiji / US" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-bold">
                  Source type
                  <select name="source_type" defaultValue="publication" className="w-full rounded-xl border border-[#ddd8d0] bg-white px-3 py-3 font-normal outline-none focus:border-[#111318]">
                    <option value="publication">Publication</option>
                    <option value="company">Company</option>
                    <option value="government">Government</option>
                    <option value="research">Research</option>
                    <option value="community">Community</option>
                  </select>
                </label>
                <Field label="Trust score" name="trust_score" type="number" min="0" max="100" defaultValue="80" required />
              </div>

              <label className="flex items-center gap-3 rounded-xl bg-[#f7f5f2] px-4 py-3 text-sm font-bold">
                <input name="active" type="checkbox" defaultChecked className="h-4 w-4" />
                Active — include this source in discovery
              </label>

              <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111318] px-4 py-3 text-sm font-black text-white transition hover:bg-black">
                <Database size={16} /> Save source
              </button>
            </form>
          </aside>

          <div>
            {(params.success || params.error || error) && (
              <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${params.error || error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {params.error ?? error?.message ?? params.success}
              </div>
            )}

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Discovery inputs</p>
                <h2 className="mt-1 text-2xl font-black">{sources?.length ?? 0} sources</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-gray-500">
                The RSS Scout checks active feeds automatically. Keep a source inactive if you do not want it scanned.
              </p>
            </div>

            <div className="space-y-4">
              {(sources ?? []).map((source) => (
                <article key={source.id} className="rounded-3xl border border-[#e5e1db] bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">{source.name}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${source.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>
                          {source.active ? "Active" : "Inactive"}
                        </span>
                        <span className="rounded-full bg-[#f7f5f2] px-2.5 py-1 text-[11px] font-bold text-gray-600">
                          Trust {source.trust_score}/100
                        </span>
                      </div>
                      <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 block max-w-full truncate text-sm text-gray-500 underline decoration-gray-300 underline-offset-4">
                        {source.url}
                      </a>
                      <p className="mt-2 text-xs text-gray-400">
                        {source.category || "Uncategorised"} · {source.country || "Global"} · Last checked {source.last_checked_at ? new Date(source.last_checked_at).toLocaleString() : "never"}
                      </p>
                    </div>
                    <FeedTestButton feedUrl={source.feed_url} />
                  </div>

                  <details className="mt-5 rounded-2xl bg-[#f7f5f2] p-4">
                    <summary className="cursor-pointer select-none text-sm font-black">Edit source</summary>
                    <form action={updateSource} className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="id" value={source.id} />
                      <Field label="Name" name="name" defaultValue={source.name} required />
                      <Field label="Website" name="url" type="url" defaultValue={source.url} required />
                      <div className="sm:col-span-2"><Field label="RSS / Atom feed" name="feed_url" type="url" defaultValue={source.feed_url ?? ""} /></div>
                      <label className="space-y-2 text-sm font-bold">
                        Category
                        <select name="category" defaultValue={source.category ?? "Technology"} className="w-full rounded-xl border border-[#ddd8d0] bg-white px-3 py-3 font-normal outline-none focus:border-[#111318]">
                          {categories.map((category) => <option key={category}>{category}</option>)}
                        </select>
                      </label>
                      <Field label="Country" name="country" defaultValue={source.country ?? ""} />
                      <label className="space-y-2 text-sm font-bold">
                        Source type
                        <select name="source_type" defaultValue={source.source_type ?? "publication"} className="w-full rounded-xl border border-[#ddd8d0] bg-white px-3 py-3 font-normal outline-none focus:border-[#111318]">
                          <option value="publication">Publication</option>
                          <option value="company">Company</option>
                          <option value="government">Government</option>
                          <option value="research">Research</option>
                          <option value="community">Community</option>
                        </select>
                      </label>
                      <Field label="Trust score" name="trust_score" type="number" min="0" max="100" defaultValue={String(source.trust_score)} required />
                      <label className="flex items-center gap-3 text-sm font-bold sm:col-span-2">
                        <input name="active" type="checkbox" defaultChecked={source.active} className="h-4 w-4" /> Active source
                      </label>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <button className="rounded-xl bg-[#111318] px-4 py-2.5 text-sm font-black text-white">Save changes</button>
                      </div>
                    </form>
                    <form action={deleteSource} className="mt-3 border-t border-[#ddd8d0] pt-3">
                      <input type="hidden" name="id" value={source.id} />
                      <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-50">
                        <Trash2 size={14} /> Delete source
                      </button>
                    </form>
                  </details>
                </article>
              ))}

              {(sources ?? []).length === 0 && (
                <div className="rounded-3xl border border-dashed border-[#d7d1c8] bg-white p-12 text-center">
                  <Rss className="mx-auto text-gray-400" />
                  <h3 className="mt-4 font-black">No sources yet</h3>
                  <p className="mt-2 text-sm text-gray-500">Add the first trusted source using the form.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-2 text-sm font-bold">
      <span>{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-[#ddd8d0] bg-white px-3 py-3 font-normal outline-none transition focus:border-[#111318]"
      />
    </label>
  );
}
