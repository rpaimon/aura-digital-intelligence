import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EditorialForm } from "@/components/newsroom/editorial-form";
import { setEditorialPublication } from "../../actions";
export const dynamic = "force-dynamic";
export default async function EditEditorialArticle({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{created?:string;saved?:string;published?:string;unpublished?:string}>}) {
  await requireAdmin();
  const {id} = await params;
  const notice = await searchParams;
  const db = createAdminClient();
  const {data:post,error} = await db.from("editorial_posts").select("*").eq("id",id).maybeSingle();
  if (error || !post) notFound();
  return <main className="min-h-screen bg-[#f5f6f3] px-4 py-8 text-[#132522] sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/admin/editorial" className="text-sm font-black text-[#53765f]">← Editorial desk</Link>
    <div className="mt-8 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#638274]">Human editorial · {post.status}</p><h1 className="mt-2 text-4xl font-black tracking-[-.06em]">Edit your article.</h1></div>{post.status === "published" && <Link href={`/news/${post.slug}`} target="_blank" className="text-sm font-bold text-[#226b4b]">View published article ↗</Link>}</div>
    {(notice.created || notice.saved || notice.published || notice.unpublished) && <p className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-900">Article {notice.published ? "published" : notice.unpublished ? "unpublished" : "saved"} successfully.</p>}
    <div className="mt-7 rounded-3xl border border-[#dce3dc] bg-white p-5 sm:p-8"><EditorialForm post={post} /></div>
    <form action={setEditorialPublication} className="mt-5 rounded-3xl border border-[#dce3dc] bg-white p-6">
      <input type="hidden" name="id" value={id}/>
      <h2 className="text-lg font-black">Publication control</h2>
      <p className="mt-2 text-sm leading-6 text-[#607066]">Publishing is an explicit human action, separate from automatic article generation and its daily target.</p>
      {post.status !== "published" && <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" name="verified" value="yes" required className="mt-1"/> I have reviewed the article, checked its claims against primary sources, and confirmed it is ready for public release.</label>}
      <button type="submit" name="intent" value={post.status === "published" ? "unpublish" : "publish"} className={`mt-5 rounded-xl px-6 py-3 text-sm font-black text-white ${post.status === "published" ? "bg-[#8e3939]" : "bg-[#1d6a43]"}`}>{post.status === "published" ? "Unpublish article" : "Publish this article"}</button>
    </form>
  </div></main>;
}
