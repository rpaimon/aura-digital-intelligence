import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { ArticleMarkdown } from "@/components/public-news/article-markdown";
import { NumberedPick, StoryCard, categoryColor } from "@/components/public-news/framagz-ui";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { ReadingProgress } from "@/components/public-news/reading-progress";
import { ShareBar } from "@/components/public-news/share-bar";
import { articlePath, auraServiceForArticle, canonicalArticleUrl, displayCategory, getPublishedArticleBySlug, getRelatedArticles, getPublishedArticles, readingTime, siteUrl, stripSourcesSection } from "@/lib/news/public";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  const canonical = canonicalArticleUrl(article);
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || "Verified technology intelligence from Aura Digital Intelligence.";
  const image = article.featured_image_url || `${canonical}/opengraph-image`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical, publishedTime: article.published_at || undefined, modifiedTime: article.updated_at || undefined, section: article.category || undefined, images: [{ url: image, width: 1200, height: 630, alt: article.featured_image_alt || article.title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

function dateTime(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-FJ", { timeZone: "Pacific/Fiji", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function AuraInlineReferral({ accent, articleSlug, cta, compact = false }: { accent: string; articleSlug: string; cta: ReturnType<typeof auraServiceForArticle>; compact?: boolean }) {
  return (
    <aside className={`adi-aura-referral ${compact ? "adi-aura-referral-compact" : ""}`} style={{ borderColor: accent }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/42">Practical Fiji implementation · Aura Digital Fiji</p>
          <h3 className="mt-2 text-xl font-black uppercase leading-tight tracking-[-0.035em] text-white">{cta.title}</h3>
          {!compact && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/56">{cta.text}</p>}
        </div>
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <a href={`/go/aura?service=${encodeURIComponent(cta.key)}&article=${encodeURIComponent(articleSlug)}`} className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">
        {cta.label} <ArrowRight size={13}/>
      </a>
    </aside>
  );
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const publicPath = articlePath(article);
  if (`/news/${slug}` !== publicPath) redirect(publicPath);

  const content = stripSourcesSection(article.content);
  const sources = article.article_sources ?? [];
  const related = await getRelatedArticles(article.id, article.category, 3);
  const latest = await getPublishedArticles(4);
  const cta = auraServiceForArticle(article);
  const canonical = canonicalArticleUrl(article);
  const image = article.featured_image_url || `${canonical}/opengraph-image`;
  const authorName = article.authors?.name || "Aura Intelligence Desk";
  const authorSlug = article.authors?.slug || "aura-digital-intelligence";
  const category = displayCategory(article);
  const accent = categoryColor(category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.seo_description || article.excerpt || undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at,
    mainEntityOfPage: canonical,
    articleSection: category,
    isAccessibleForFree: true,
    author: { "@type": "Organization", name: authorName, url: `${siteUrl()}/authors/${authorSlug}` },
    publisher: { "@type": "Organization", name: "Aura Digital Intelligence", url: siteUrl() },
    image: [image],
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <NewsHeader />

      <article>
        <header className="adi-noise border-b border-white/10">
          <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-8 sm:px-6 sm:pb-14 lg:px-8">
            <Link href="/news" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/42 hover:text-white"><ArrowLeft size={13}/> Back to all news</Link>
            <div className="mt-9 max-w-6xl">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/42">
                <span className="px-3 py-2 text-black" style={{ backgroundColor: accent }}>{category}</span>
                {article.published_at && <><span>•</span><time dateTime={article.published_at}>{dateTime(article.published_at)} FJT</time></>}
                <span>•</span><span className="inline-flex items-center gap-1"><Clock3 size={11}/> {readingTime(content)} min read</span>
              </div>
              <h1 className="mt-7 max-w-[1120px] text-[2.55rem] font-black uppercase leading-[.94] tracking-[-0.055em] sm:text-5xl md:text-6xl lg:text-[5.35rem]">{article.title}</h1>
              {article.subtitle && <p className="mt-6 max-w-4xl text-lg font-semibold leading-8 text-white/58 sm:text-xl">{article.subtitle}</p>}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-5">
                <Link href={`/authors/${authorSlug}`} className="group flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-xs font-black text-black">ADI</div>
                  <div><p className="text-xs font-black uppercase tracking-[0.06em] group-hover:text-white/70">{authorName}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">Technology Editor · Fiji</p></div>
                </Link>
                <ShareBar title={article.title} />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] px-4 pt-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden border border-white/12 bg-[#111]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={article.featured_image_alt || article.title} className="aspect-[16/8.3] max-h-[640px] w-full object-cover" />
          </div>
          {article.featured_image_credit && <p className="mt-2 text-right text-[10px] text-white/28">{article.featured_image_source_url ? <a href={article.featured_image_source_url} target="_blank" rel="noreferrer noopener" className="hover:text-white">{article.featured_image_credit}</a> : article.featured_image_credit}</p>}
        </div>

        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:pt-14">
          <div className="min-w-0">
            {article.excerpt && <div className="mb-7 border-y border-white/10 py-6 text-xl font-black leading-8 text-white/82 sm:text-2xl">{article.excerpt}</div>}
            <div className="mb-8"><AuraInlineReferral accent={accent} articleSlug={article.slug} cta={cta} /></div>
            <div className="adi-article-prose">
              <ArticleMarkdown
                content={content}
                inserts={[
                  <AuraInlineReferral key="aura-inline-1" accent={accent} articleSlug={article.slug} cta={cta} compact />,
                  <AuraInlineReferral key="aura-inline-2" accent={accent} articleSlug={article.slug} cta={cta} compact />,
                ]}
              />
            </div>

            {sources.length > 0 && (
              <section className="mt-14 border-t-4 border-white pt-6">
                <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: accent }}>Independent evidence</p><h2 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em]">Sources</h2></div><span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/32">{sources.length} source{sources.length === 1 ? "" : "s"}</span></div>
                <div className="mt-5 grid gap-3">
                  {sources.map((source, index) => (
                    <a key={source.id} href={source.source_url} target="_blank" rel="noreferrer noopener" className="group flex items-start justify-between gap-4 border border-white/12 bg-[#0c0c0c] p-5 transition hover:bg-white hover:text-black">
                      <div><p className="text-[9px] font-black uppercase tracking-[0.15em] opacity-60">Source {String(index + 1).padStart(2, "0")} · {source.source_name}</p><p className="mt-2 text-sm font-semibold leading-6 opacity-80">{source.citation_text || "Independent reporting used by the verification pipeline."}</p></div><ExternalLink size={15} className="mt-1 shrink-0 opacity-40" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
            <div className="border border-white/12 bg-[#0c0c0c] p-5">
              <div className="flex items-center gap-2 border-b-4 border-white pb-4 text-xs font-black uppercase tracking-[0.12em]"><ShieldCheck size={16}/> Publication standard</div>
              <div className="mt-5 space-y-4 text-xs leading-6 text-white/46">
                <div className="border-b border-white/10 pb-4"><p className="font-black uppercase tracking-[0.06em] text-white/80">Independent verification</p><p className="mt-1">Evidence-linked claims must clear the newsroom gate before publication.</p></div>
                <div className="border-b border-white/10 pb-4"><p className="font-black uppercase tracking-[0.06em] text-white/80">Originality protection</p><p className="mt-1">Drafts are checked for excessive exact phrase overlap.</p></div>
                <div><p className="font-black uppercase tracking-[0.06em] text-white/80">Editorial accountability</p><p className="mt-1">Published stories must meet our sourcing, originality and quality standards.</p></div>
              </div>
              <Link href="/editorial-standards" className="mt-5 inline-block border-b border-white pb-1 text-[10px] font-black uppercase tracking-[0.12em]">Read our standards</Link>
            </div>

            <div className="p-6 text-black" style={{ backgroundColor: accent }}>
              <p className="text-[10px] font-black uppercase tracking-[0.15em]">Aura Digital Fiji · {cta.eyebrow}</p>
              <h3 className="mt-3 text-3xl font-black uppercase leading-none tracking-[-0.05em]">{cta.title}</h3>
              <p className="mt-4 text-sm font-semibold leading-6 text-black/65">{cta.text}</p>
              <a href={`/go/aura?service=${encodeURIComponent(cta.key)}&article=${encodeURIComponent(article.slug)}`} className="mt-5 inline-flex items-center gap-2 border-b-2 border-black pb-1 text-xs font-black uppercase tracking-[0.12em]">{cta.label} <ArrowRight size={13}/></a>
            </div>

            {latest.length > 1 && <div className="border border-white/12 bg-[#0c0c0c] p-5"><h3 className="border-b-4 border-white pb-4 text-lg font-black uppercase">Staff Picks</h3><div className="mt-2">{latest.filter((item)=>item.id!==article.id).slice(0,3).map((item,index)=><NumberedPick key={item.id} article={item} index={index+1}/>)}</div></div>}
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-white/10 bg-[#0a0a0a]">
          <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-7 flex items-end justify-between border-t-4 border-white pt-5"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/32">Continue reading</p><h2 className="mt-1 text-4xl font-black uppercase tracking-[-0.05em]">Related Intelligence</h2></div><Link href="/news" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/45 hover:text-white">All news <ArrowUpRight size={12}/></Link></div>
            <div className="grid gap-6 md:grid-cols-3">{related.map((item)=><StoryCard key={item.id} article={item} compact />)}</div>
          </div>
        </section>
      )}

      <NewsFooter />
    </main>
  );
}
