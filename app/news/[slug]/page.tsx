import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { ArticleMarkdown } from "@/components/public-news/article-markdown";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { ReadingProgress } from "@/components/public-news/reading-progress";
import { ShareBar } from "@/components/public-news/share-bar";
import { getPublishedArticleBySlug, getRelatedArticles, readingTime, siteUrl, stripSourcesSection } from "@/lib/news/public";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  const canonical = article.canonical_url || `${siteUrl()}/news/${article.slug}`;
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || "Verified technology intelligence from Aura Digital Intelligence.";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical, publishedTime: article.published_at || undefined, modifiedTime: article.updated_at || undefined, section: article.category || undefined, images: article.featured_image_url ? [{ url: article.featured_image_url }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: article.featured_image_url ? [article.featured_image_url] : undefined },
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-FJ", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();
  const content = stripSourcesSection(article.content);
  const canonical = article.canonical_url || `${siteUrl()}/news/${article.slug}`;
  const sources = article.article_sources ?? [];
  const related = await getRelatedArticles(article.id, article.category, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.seo_description || article.excerpt || undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at,
    mainEntityOfPage: canonical,
    articleSection: article.category || "Technology",
    author: { "@type": "Organization", name: article.authors?.name || "Aura Digital Intelligence", url: siteUrl() },
    publisher: { "@type": "Organization", name: "Aura Digital Intelligence", url: siteUrl() },
    image: article.featured_image_url ? [article.featured_image_url] : undefined,
  };

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <NewsHeader />

      <article>
        <header className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(190,242,100,.11),transparent_36%),radial-gradient(circle_at_80%_40%,rgba(34,211,238,.06),transparent_38%)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8">
            <Link href="/news" className="inline-flex items-center gap-2 text-xs font-black text-white/45 transition hover:text-white"><ArrowLeft size={14} /> Back to intelligence</Link>
            <div className="mt-10 max-w-5xl">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-white/40"><span className="rounded-full border border-lime-300/20 bg-lime-300/[0.07] px-3 py-1.5 text-lime-200">{article.category || "Technology"}</span>{article.published_at && <><span>•</span><time>{formatDate(article.published_at)}</time></>}<span>•</span><span className="inline-flex items-center gap-1.5"><Clock3 size={12} /> {readingTime(content)} min read</span></div>
              <h1 className="mt-6 text-[2.7rem] font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-[5.5rem]">{article.title}</h1>
              {article.subtitle && <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-white/58 sm:text-xl">{article.subtitle}</p>}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full border border-lime-300/25 bg-lime-300/10 text-xs font-black text-lime-200">AI</div><div><p className="text-xs font-black">{article.authors?.name || "Aura Digital Intelligence"}</p><p className="mt-1 text-[11px] text-white/35">Verification-first technology newsroom</p></div></div>
                <ShareBar title={article.title} />
              </div>
            </div>
          </div>
        </header>

        {article.featured_image_url && (
          <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10141b]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.featured_image_url} alt="" className="max-h-[650px] w-full object-cover" />
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8 lg:pt-14">
          <div className="min-w-0">
            {article.excerpt && <div className="mb-10 border-l-2 border-lime-300 pl-5 text-lg font-semibold leading-8 text-white/62 sm:pl-6 sm:text-xl">{article.excerpt}</div>}
            <ArticleMarkdown content={content} />

            {sources.length > 0 && (
              <section className="mt-14 border-t border-white/10 pt-9">
                <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">Evidence trail</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Sources</h2></div><span className="text-xs font-bold text-white/30">{sources.length} independent source{sources.length === 1 ? "" : "s"}</span></div>
                <div className="mt-5 grid gap-3">
                  {sources.map((source, index) => (
                    <a key={source.id} href={source.source_url} target="_blank" rel="noreferrer noopener" className="group flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-lime-300/25 hover:bg-white/[0.055]">
                      <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Source {String(index + 1).padStart(2, "0")} · {source.source_name}</p><p className="mt-2 text-sm font-semibold leading-6 text-white/72">{source.citation_text || "Independent reporting used by the verification pipeline."}</p></div><ExternalLink size={15} className="mt-1 shrink-0 text-white/30 transition group-hover:text-lime-300" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center gap-2 text-xs font-black text-lime-300"><ShieldCheck size={16} /> Publication standard</div>
              <div className="mt-5 space-y-4 text-xs leading-5 text-white/45">
                <div className="border-b border-white/10 pb-4"><p className="font-black text-white/75">Independent-source verification</p><p className="mt-1">Claims must clear the newsroom's verification gate before publication.</p></div>
                <div className="border-b border-white/10 pb-4"><p className="font-black text-white/75">Originality protection</p><p className="mt-1">Generated drafts are checked for excessive phrase overlap with evidence sources.</p></div>
                <div><p className="font-black text-white/75">Quality gate</p><p className="mt-1">SEO, structure, sourcing and publication rules are validated before release.</p></div>
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-lime-300/15 bg-lime-300/[0.06] p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">For Fiji businesses</p><h3 className="mt-3 text-xl font-black tracking-[-0.03em]">Turn the signal into action.</h3><p className="mt-2 text-sm leading-6 text-white/48">Aura Digital Fiji builds practical websites, apps, ecommerce, email and digital infrastructure.</p><a href="https://auradigitalfiji.com" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-white hover:text-lime-200">Visit Aura Digital Fiji <ArrowRight size={14} /></a></div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-white/10 bg-[#090c11]">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">Continue reading</p><h2 className="mt-2 text-3xl font-black tracking-[-0.045em]">Related intelligence</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-3">{related.map((item) => <article key={item.id} className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">{item.category || "Technology"}</p><h3 className="mt-3 text-lg font-black leading-snug tracking-[-0.025em]"><Link href={`/news/${item.slug}`} className="group-hover:text-lime-200">{item.title}</Link></h3><div className="mt-5 flex items-center justify-between text-[11px] font-bold text-white/30"><span>{formatDate(item.published_at)}</span><span>{readingTime(item.excerpt)} min</span></div></article>)}</div>
          </div>
        </section>
      )}

      <NewsFooter />
    </main>
  );
}
