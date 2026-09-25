import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { ArticleMarkdown } from "@/components/public-news/article-markdown";
import { StoryCard, CategoryChip } from "@/components/public-news/framagz-ui";
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
  const shareImage = `${canonical}/opengraph-image`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      siteName: "Aura Digital Intelligence",
      locale: "en_FJ",
      title,
      description,
      url: canonical,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || undefined,
      section: displayCategory(article),
      images: [{ url: shareImage, width: 1200, height: 630, alt: article.featured_image_alt || article.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [shareImage] },
  };
}

function dateTime(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-FJ", { timeZone: "Pacific/Fiji", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function AuraInlineReferral({ articleSlug, cta, compact = false }: { articleSlug: string; cta: ReturnType<typeof auraServiceForArticle>; compact?: boolean }) {
  return (
    <aside className="adi-aura-inline">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/45">Aura Digital Fiji · Practical implementation</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h3 className="text-xl font-black leading-tight tracking-[-0.035em] text-black">{cta.title}</h3>{!compact && <p className="mt-2 max-w-2xl text-sm leading-6 text-black/58">{cta.text}</p>}</div>
        <a href={`/go/aura?service=${encodeURIComponent(cta.key)}&article=${encodeURIComponent(articleSlug)}`} className="inline-flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-black">{cta.label} <ArrowRight size={13}/></a>
      </div>
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
  const latest = await getPublishedArticles(5);
  const cta = auraServiceForArticle(article);
  const canonical = canonicalArticleUrl(article);
  const image = article.featured_image_url || `${canonical}/opengraph-image`;
  const authorName = article.authors?.name || "Aura Intelligence Desk";
  const authorSlug = article.authors?.slug || "aura-digital-intelligence";
  const category = displayCategory(article);

  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title, description: article.seo_description || article.excerpt || undefined, datePublished: article.published_at || undefined, dateModified: article.updated_at, mainEntityOfPage: canonical, articleSection: category, isAccessibleForFree: true, author: { "@type": "Organization", name: authorName, url: `${siteUrl()}/authors/${authorSlug}` }, publisher: { "@type": "Organization", name: "Aura Digital Intelligence", url: siteUrl() }, image: [image] };

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <NewsHeader />

      <article>
        <header className="border-b border-white/10">
          <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <Link href="/news" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40 hover:text-white"><ArrowLeft size={13}/> Back to all news</Link>
            <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/42"><CategoryChip label={category}/>{article.published_at && <time dateTime={article.published_at}>{dateTime(article.published_at)} FJT</time>}<span>•</span><span className="inline-flex items-center gap-1"><Clock3 size={11}/> {readingTime(content)} min read</span></div>
                <h1 className="adi-title-balance mt-6 max-w-5xl text-[2.55rem] font-black leading-[.98] tracking-[-0.06em] sm:text-[3.5rem] lg:text-[4rem]">{article.title}</h1>
                {article.subtitle && <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/54">{article.subtitle}</p>}
              </div>
              <div className="border-t border-white/15 pt-5 lg:border-t-0 lg:border-l lg:pl-7">
                <p className="adi-kicker">Published by Aura Digital Fiji</p>
                <p className="mt-3 text-sm leading-7 text-white/48">Aura Intelligence turns verified technology developments into practical context for Fiji businesses.</p>
                <a href="https://auradigitalfiji.com" className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-white">Visit Aura Digital Fiji <ArrowUpRight size={13}/></a>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-5">
              <Link href={`/authors/${authorSlug}`} className="group flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-white text-[10px] font-black text-black">ADI</div><div><p className="text-xs font-black uppercase tracking-[0.06em] group-hover:text-white/70">{authorName}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white/28">Technology Editor · Fiji</p></div></Link>
              <ShareBar title={article.title}/>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] sm:px-6 lg:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={article.featured_image_alt || article.title} className="adi-mobile-full aspect-[16/9] max-h-[590px] w-full object-cover" />
          {article.featured_image_credit && <p className="px-4 pt-2 text-right text-[10px] text-white/28 sm:px-0">{article.featured_image_source_url ? <a href={article.featured_image_source_url} target="_blank" rel="noreferrer noopener" className="hover:text-white">{article.featured_image_credit}</a> : article.featured_image_credit}</p>}
        </div>

        <section className="mt-8 bg-[#f1eee6] text-black sm:mt-10">
          <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:px-8 lg:py-12">
            <div className="min-w-0">
              {article.excerpt && <p className="max-w-3xl border-b border-black/15 pb-6 text-[1.3rem] font-black leading-[1.45] tracking-[-0.025em] text-black sm:text-[1.55rem]">{article.excerpt}</p>}
              <AuraInlineReferral articleSlug={article.slug} cta={cta}/>
              <div className="adi-article-prose"><ArticleMarkdown content={content} inserts={[<AuraInlineReferral key="aura-1" articleSlug={article.slug} cta={cta} compact/>,<AuraInlineReferral key="aura-2" articleSlug={article.slug} cta={cta} compact/>]} /></div>

              {sources.length > 0 && <section className="mt-12 border-t-2 border-black pt-5"><div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/45">Independent evidence</p><h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">Sources</h2></div><span className="text-[9px] font-black uppercase tracking-[0.12em] text-black/36">{sources.length} source{sources.length===1?"":"s"}</span></div><div className="mt-4 divide-y divide-black/12">{sources.map((source,index)=><a key={source.id} href={source.source_url} target="_blank" rel="noreferrer noopener" className="group flex items-start justify-between gap-4 py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-black/45">Source {String(index+1).padStart(2,"0")} · {source.source_name}</p><p className="mt-2 text-sm font-semibold leading-6 text-black/64">{source.citation_text || "Independent reporting used by the verification pipeline."}</p></div><ExternalLink size={15} className="mt-1 shrink-0 text-black/35"/></a>)}</div></section>}
            </div>

            <aside className="space-y-7 border-t border-black/15 pt-7 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em]"><ShieldCheck size={15}/> Publication standard</div><div className="mt-4 space-y-4 text-xs leading-6 text-black/55"><div className="border-t border-black/12 pt-3"><p className="font-black uppercase tracking-[0.06em] text-black">Independent verification</p><p className="mt-1">Evidence-linked claims clear the newsroom gate before publication.</p></div><div className="border-t border-black/12 pt-3"><p className="font-black uppercase tracking-[0.06em] text-black">Originality protection</p><p className="mt-1">Drafts are checked for excessive exact phrase overlap.</p></div><div className="border-t border-black/12 pt-3"><p className="font-black uppercase tracking-[0.06em] text-black">Editorial accountability</p><p className="mt-1">Published stories must meet sourcing, originality and quality standards.</p></div></div><Link href="/editorial-standards" className="mt-4 inline-block text-[10px] font-black uppercase tracking-[0.12em] text-black">Read our standards →</Link></div>
              <div className="border-t-2 border-black pt-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/45">Aura Digital Fiji</p><h3 className="mt-2 text-2xl font-black leading-[1.05] tracking-[-0.05em]">{cta.title}</h3><p className="mt-3 text-sm leading-7 text-black/58">{cta.text}</p><a href={`/go/aura?service=${encodeURIComponent(cta.key)}&article=${encodeURIComponent(article.slug)}`} className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-black">{cta.label} <ArrowRight size={13}/></a></div>
              {latest.length > 1 && <div className="border-t border-black/15 pt-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/45">Latest picks</p><div className="mt-2 divide-y divide-black/12">{latest.filter((item)=>item.id!==article.id).slice(0,4).map((item)=><Link key={item.id} href={articlePath(item)} className="block py-3"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-black/38">{displayCategory(item)}</p><p className="mt-1 text-sm font-black leading-tight text-black">{item.title}</p></Link>)}</div></div>}
            </aside>
          </div>
        </section>
      </article>

      {related.length > 0 && <section className="border-t border-white/10"><div className="mx-auto max-w-[1320px] px-0 py-9 sm:px-6 lg:px-8 lg:py-12"><div className="mb-5 flex items-end justify-between gap-4 px-4 sm:px-0"><div><p className="adi-kicker">Continue reading</p><h2 className="adi-section-title mt-1">Related intelligence</h2></div><Link href="/news" className="text-[10px] font-black uppercase tracking-[0.12em] text-white/45 hover:text-white">All news →</Link></div><div className="adi-story-grid three">{related.map((item)=><StoryCard key={item.id} article={item} compact />)}</div></div></section>}

      <NewsFooter />
    </main>
  );
}
