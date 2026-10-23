import { createEditorialPost, updateEditorialPost } from "@/app/admin/editorial/actions";

type Post = { id?: string; title?: string; excerpt?: string; content?: string; category?: string;
  source_url?: string; source_name?: string; featured_image_url?: string | null;
  featured_image_alt?: string | null; featured_image_credit?: string | null; };
const input = "w-full rounded-xl border border-[#dbdfdf] bg-white px-4 py-3 text-sm text-[#17212b] outline-none focus:border-[#177452]";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-[.06em] text-[#3f505b]";
export function EditorialForm({ post, brief }: { post?: Post; brief?: Post }) {
  const v = post || brief || {};
  return <form action={post?.id ? updateEditorialPost : createEditorialPost} className="grid gap-5">
    {post?.id && <input type="hidden" name="id" value={post.id} />}
    <div><label className={label} htmlFor="title">Headline · simple, factual English</label><input id="title" name="title" required maxLength={140} className={input} defaultValue={v.title || ""} placeholder="What happened, to whom, and why does it matter?" /></div>
    <div><label className={label} htmlFor="excerpt">Short summary · 1–2 sentences</label><textarea id="excerpt" name="excerpt" required rows={3} maxLength={320} className={input} defaultValue={v.excerpt || ""} placeholder="Tell readers what happened without technical jargon." /></div>
    <div><label className={label} htmlFor="category">News desk</label><select id="category" name="category" defaultValue={v.category || "Technology"} className={input}>
      {["Technology", "Cybersecurity", "Artificial Intelligence", "Business", "Cloud", "Ecommerce", "Fiji + Pacific"].map((c) => <option key={c}>{c}</option>)}
    </select></div>
    <div><label className={label} htmlFor="content">Full article · Markdown supported</label><textarea id="content" name="content" required rows={16} maxLength={30000} className={`${input} font-mono leading-7`} defaultValue={v.content || ""} placeholder="Use short paragraphs, explain technical terms, cite sources, and clearly mark uncertainties." /></div>
    <div className="grid gap-5 md:grid-cols-2"><div><label className={label} htmlFor="sourceName">Original source / reporting credit</label><input id="sourceName" name="sourceName" required maxLength={120} className={input} defaultValue={v.source_name || ""} placeholder="e.g. Citizen Lab" /></div><div><label className={label} htmlFor="sourceUrl">Source URL</label><input id="sourceUrl" type="url" name="sourceUrl" required className={input} defaultValue={v.source_url || ""} placeholder="https://..." /></div></div>
    <div className="rounded-2xl bg-[#eef2ef] p-5"><h3 className="mb-4 font-black text-[#183025]">Optional licensed photo</h3>
      <div className="grid gap-4"><div><label className={label} htmlFor="imageUrl">Image URL</label><input id="imageUrl" name="imageUrl" type="url" className={input} defaultValue={v.featured_image_url || ""} placeholder="https://..." /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className={label} htmlFor="imageAlt">Image description</label><input id="imageAlt" name="imageAlt" className={input} defaultValue={v.featured_image_alt || ""} /></div><div><label className={label} htmlFor="imageCredit">Image credit / licence</label><input id="imageCredit" name="imageCredit" className={input} defaultValue={v.featured_image_credit || ""} /></div></div>
      <label className="flex items-start gap-2 text-sm text-[#34453c]"><input type="checkbox" name="imageRights" value="yes" className="mt-1" /> I have rights to use this image and have included its credit.</label></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d8dddd] pt-5"><p className="text-sm text-[#465762]">Saving does not publish anything. Publication is a separate confirmation.</p><button type="submit" className="rounded-xl bg-[#142a22] px-6 py-3 text-sm font-black text-white">{post?.id ? "Save article changes" : "Save draft"}</button></div>
  </form>;
}
