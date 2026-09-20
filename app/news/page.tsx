import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { getPublishedArticles, readingTime, siteUrl } from "@/lib/news/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Technology News for Fiji & the Pacific",
  description: "Verified technology, AI, cybersecurity and digital business intelligence for Fiji and the Pacific.",
  alternates: { canonical: `${siteUrl()}/news` },
  openGraph: {
    type: "website",
    title: "Aura Digital Intelligence",
    description: "Verified technology intelligence for Fiji and the Pacific.",
    url: `${siteUrl()}/news`,
  },
};

export default async function NewsPage() {
  const articles = await getPublishedArticles(30);

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#101114]">
      <header className="border-b border-[#e5e1db] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="font-black tracking-tight">AURA <span className="font-normal">DIGITAL INTELLIGENCE</span></Link>
          <Link href="https://auradigitalfiji.com" className="rounded-full border border-[#ddd8d0] px-4 py-2 text-sm font-bold">Aura Digital Fiji</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-14 pt-16">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ded9d2] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-gray-600">
            <ShieldCheck size={14} /> Verified before publication
          </div>
          <h1 className="mt-6 text-5xl font-black tracking-[-0.05em] sm:text-7xl">Technology intelligence for Fiji & the Pacific.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">Global technology developments, independently checked and translated into useful business context.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        {articles.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article, index) => (
              <article key={article.id} className={`rounded-3xl border border-[#e5e1db] bg-white p-6 ${index === 0 ? "md:col-span-2 xl:col-span-2" : ""}`}>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-gray-500">
                  <span>{article.category || "Technology"}</span>
                  {article.published_at && <><span>•</span><span>{new Date(article.published_at).toLocaleDateString("en-FJ", { day: "numeric", month: "short", year: "numeric" })}</span></>}
                </div>
                <h2 className={`mt-4 font-black tracking-[-0.035em] ${index === 0 ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
                  <Link href={`/news/${article.slug}`} className="hover:underline">{article.title}</Link>
                </h2>
                {article.excerpt && <p className="mt-4 line-clamp-4 leading-7 text-gray-600">{article.excerpt}</p>}
                <div className="mt-7 flex items-center justify-between gap-4 text-sm font-bold">
                  <span className="inline-flex items-center gap-2 text-gray-500"><Clock3 size={15} /> {readingTime(article.excerpt)} min read</span>
                  <Link href={`/news/${article.slug}`} className="inline-flex items-center gap-2">Read article <ArrowRight size={16} /></Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#d8d2ca] bg-white p-12 text-center">
            <h2 className="text-2xl font-black">Verified stories are on the way.</h2>
            <p className="mx-auto mt-3 max-w-lg leading-7 text-gray-600">Nothing is published until it clears the newsroom's fact-check and final quality gates.</p>
          </div>
        )}
      </section>
    </main>
  );
}
