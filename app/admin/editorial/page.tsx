import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveGeneratedPresentation } from "./actions";
import { zeroClickBrief } from "@/lib/news/verified-brief";
import { readerHeadline } from "@/lib/news/editorial-presentation";

export const dynamic = "force-dynamic";
export default async function EditorialDesk({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  await requireAdmin();
  const { updated } = await searchParams;
  const db = createAdminClient();
  const [manual, generated, overrides] = await Promise.all([
    db.from("editorial_posts").select("id,title,slug,status,created_at,published_at")
      .order("created_at", { ascending: false }).limit(35),
    db.from("articles").select("id,title,slug,excerpt,featured_image_url,published_at")
      .eq("status", "published").order("published_at", { ascending: false }).limit(12),
    db.from("editorial_overrides").select("article_id,display_title,plain_summary,featured_image_url,featured_image_alt,featured_image_credit"),
  ]);
  const overridesById = new Map((overrides.data ?? []).map((edit) => [edit.article_id, edit]));
  return <main className="min-h-screen bg-[#f5f6f3] p-4 text-[#132522] sm:p-8">
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><Link href="/admin/dashboard" className="text-xs font-bold text-[#4b6860]">← Dashboard</Link>
          <p className="mt-6 text-xs font-black uppercase tracking-[.22em] text-[#48745c]">Aura Digital Intelligence · editorial</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.06em] sm:text-5xl">The editorial desk.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#566a62]">Publish your own reporting separately from automation. Fix public headlines and photos without changing the original generated story or its URL.</p></div>
        <Link href="/admin/editorial/new" className="rounded-xl bg-[#14332b] px-5 py-3 text-sm font-black text-white">+ Write a story</Link>
      </div>
      {updated && <p className="mb-5 rounded-xl border border-green-300 bg-green-50 p-4 text-sm font-bold text-green-800">Public presentation updated. Original generated article preserved.</p>}
      {manual.error && <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Manual publishing requires the one-time SQL migration <code>supabase/migrations/019_manual_editorial_separate.sql</code>. Existing automatic publishing is unaffected.</p>}
      <section className="grid gap-4 md:grid-cols-[1.3fr_.7fr]">
        <Link href="/admin/editorial/new?brief=zero-click" className="group rounded-3xl bg-[#132923] p-6 text-white transition hover:bg-[#234839]">
          <span className="text-xs font-black uppercase tracking-[.16em] text-[#adeda7]">Verified story lead · October 15</span>
          <h2 className="mt-5 text-2xl font-black tracking-[-.035em]">Spyware that needs no click: review the research brief</h2>
          <p className="mt-3 text-sm leading-7 text-white/75">A prewritten, attributed draft based on Citizen Lab research. Nothing is published until you review and approve it.</p>
          <span className="mt-6 inline-block text-sm font-black text-[#bbed96]">Open editor →</span>
        </Link>
        <div className="rounded-3xl border border-[#d9e2da] bg-white p-6">
          <span className="text-xs font-black uppercase tracking-[.16em] text-[#4e7460]">Desk rules</span>
          <h2 className="mt-4 text-xl font-black">People first. Facts first.</h2>
          <p className="mt-3 text-sm leading-7 text-[#5a6b62]">Short headlines. Clear summaries. Verified dates and source links. Image rights checked. Never claim a Fiji connection without evidence.</p>
        </div>
      </section>
      <section className="mt-10 rounded-3xl border border-[#dce3dc] bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.15em] text-[#557665]">Your reporting</p><h2 className="mt-1 text-2xl font-black">Manual articles</h2></div><Link href="/admin/editorial/new" className="text-sm font-black text-[#226b4b]">New article +</Link></div>
        <div className="divide-y divide-[#edf0ec]">{(manual.data ?? []).map((a) => <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold">{a.title}</p><p className="mt-1 text-xs text-[#68786f]">{a.status === "published" ? "Published" : "Draft"} · {new Date(a.created_at).toLocaleDateString("en-FJ")}</p></div><Link href={`/admin/editorial/edit/${a.id}`} className="rounded-lg border border-[#dce3dc] px-4 py-2 text-xs font-black">Edit / publish</Link></div>)}
          {!manual.data?.length && <p className="py-8 text-sm text-[#657468]">No manual drafts yet.</p>}
        </div>
      </section>
      <section className="mt-10 rounded-3xl border border-[#dce3dc] bg-white p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[.15em] text-[#557665]">Automated articles · display only</p>
        <h2 className="mt-1 text-2xl font-black">Correct difficult headlines and repeated photos</h2>
        <p className="mt-2 mb-6 max-w-3xl text-sm leading-6 text-[#68786f]">These edits are stored separately. They change public headlines and image choice—not the writer, quality gates, source record, publishing date or existing URL. Leave the photo field empty to retain its current image.</p>
        <div className="grid gap-4 md:grid-cols-2">{(generated.data ?? []).map((article) => <form key={article.id} action={saveGeneratedPresentation} className="rounded-2xl border border-[#e0e5df] bg-[#fafbf9] p-5">
          <input type="hidden" name="articleId" value={article.id}/>
          <p className="text-xs font-bold uppercase tracking-widest text-[#708277]">Generated headline</p>
          <p className="mt-1 text-sm text-[#46534a]">{article.title}</p>
          <label className="mt-4 block text-xs font-black" htmlFor={`t-${article.id}`}>Clear reader headline</label>
          <input id={`t-${article.id}`} required name="displayTitle" maxLength={140} defaultValue={overridesById.get(article.id)?.display_title || readerHeadline({title:article.title})} className="mt-1 w-full rounded-xl border border-[#d2dad1] p-3 text-sm" />
          <label className="mt-3 block text-xs font-black" htmlFor={`s-${article.id}`}>Explain in simple English (optional)</label>
          <textarea id={`s-${article.id}`} name="plainSummary" maxLength={320} rows={3} defaultValue={overridesById.get(article.id)?.plain_summary || article.excerpt || ""} className="mt-1 w-full rounded-xl border border-[#d2dad1] p-3 text-sm" />
          <label className="mt-3 block text-xs font-black" htmlFor={`i-${article.id}`}>Replacement licensed photo (optional)</label>
          <input id={`i-${article.id}`} name="imageUrl" type="url" placeholder="https://..." defaultValue={overridesById.get(article.id)?.featured_image_url || ""} className="mt-1 w-full rounded-xl border border-[#d2dad1] p-3 text-sm"/>
          <input name="imageAlt" placeholder="Photo description" defaultValue={overridesById.get(article.id)?.featured_image_alt || ""} className="mt-2 w-full rounded-xl border border-[#d2dad1] p-3 text-sm" />
          <input name="imageCredit" placeholder="Photographer/source credit (required with a replacement)" defaultValue={overridesById.get(article.id)?.featured_image_credit || ""} className="mt-2 w-full rounded-xl border border-[#d2dad1] p-3 text-sm" />
          <label className="mt-3 flex items-start gap-2 text-xs text-[#46584f]"><input type="checkbox" name="imageRights" value="yes"/> I have permission to use a replacement image (if supplied).</label>
          <button className="mt-4 rounded-lg bg-[#183b2e] px-4 py-2.5 text-xs font-black text-white">Save public display</button>
        </form>)}</div>
      </section>
      <p className="mt-8 text-xs text-[#718078]">Research reference: <a className="underline" href={zeroClickBrief.source_url} target="_blank" rel="noopener noreferrer">Citizen Lab's original report</a>. Human review is required before publication.</p>
    </div>
  </main>;
}
