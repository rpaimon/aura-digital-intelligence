import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { ArticleMarkdown } from "@/components/public-news/article-markdown";
import { StoryCard, StoryVisual, CategoryChip, headlineLengthClass } from "@/components/public-news/framagz-ui";
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
    authors: [{ name: article.authors?.name || "Aura Intelligence Desk", url: `${siteUrl()}/authors/${article.authors?.slug || "aura-digital-intelligence"}` }],
    creator: "Aura Digital Intelligence",
    publisher: "Aura Digital Fiji",
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
      authors: [article.authors?.name || "Aura Intelligence Desk"],
      images: [{ url: shareImage, width: 1200, height: 630, type: "image/png", alt: `${article.title} — Aura Digital Intelligence` }],
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
      <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-50">Aura Digital Fiji · Practical implementation</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h3 className="text-xl font-black leading-tight tracking-[-0.035em]">{cta.title}</h3>{!compact && <p className="adi-reading-copy mt-2 max-w-2xl text-sm leading-6">{cta.text}</p>}</div>
        <a href={`/go/aura?service=${encodeURIComponent(cta.key)}&article=${encodeURIComponent(articleSlug)}`} className="inline-flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em]">{cta.label} <ArrowRight size={13}/></a>
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
  const related = await getRelatedArticles(article.id, article.category, 4);
  const latest = await getPublishedArticles(7);
  const cta = auraServiceForArticle(article);
  const canonical = canonicalArticleUrl(article);
  const shareImage = `${canonical}/opengraph-image`;
  const authorName = article.authors?.name || "Aura Intelligence Desk";
  const authorSlug = article.authors?.slug || "aura-digital-intelligence";
  const category = displayCategory(article);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.seo_description || article.excerpt || undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || article.published_at || undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    articleSection: category,
    inLanguage: "en-FJ",
    isAccessibleForFree: true,
    author: { "@type": "Organization", name: authorName, url: `${siteUrl()}/authors/${authorSlug}` },
    publisher: { "@type": "Organization", name: "Aura Digital Intelligence", url: siteUrl() },
    image: [shareImage],
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "News", item: `${siteUrl()}/news` },
      { "@type": "ListItem", position: 3, name: article.title, item: canonical },
    ],
  };

  return (
    <main className="adi-public-shell min-h-screen">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
      <NewsHeader />

      <article>
        <header className="border-b border-white/10">
          <div className="adi-article-wide px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
            <Link href="/news" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40 hover:text-white"><ArrowLeft size={13}/> Back to all news</Link>

            <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px] xl:gap-12">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/42">
                  <CategoryChip label={category}/>
                  {article.published_at && <time dateTime={article.published_at}>{dateTime(article.published_at)} FJT</time>}
                  <span className="hidden sm:inline">•</span>
                  <span className="inline-flex items-center gap-1"><Clock3 size={11}/> {readingTime(content)} min read</span>
                </div>
                <h1 className={`adi-article-title ${headlineLengthClass(article.title)} adi-title-balance mt-4`}>{article.title}</h1>
                {article.subtitle && <p className="mt-4 max-w-4xl text-[1rem] font-semibold leading-7 text-white/54 sm:text-[1.08rem] sm:leading-8">{article.subtitle}</p>}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                  <Link href={`/authors/${authorSlug}`} className="group flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-white text-[10px] font-black text-black">ADI</div><div><p className="text-xs font-black uppercase tracking-[0.06em] group-hover:text-white/70">{authorName}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white/28">Technology Editor · Fiji</p></div></Link>
                  <ShareBar title={article.title}/>
                </div>
              </div>

              <aside className="hidden border-l border-white/10 pl-6 lg:block">
                <p className="adi-kicker">Aura Digital Fiji</p>
                <h2 className="mt-2 text-2xl font-black leading-[1.05] tracking-[-0.045em]">{cta.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/48">{cta.text}</p>
                <a href={`/go/aura?service=${encodeURIComponent(cta.key)}&article=${encodeURIComponent(article.slug)}`} className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-white">{cta.label} <ArrowRight size={13}/></a>
              </aside>
            </div>
          </div>
        </header>

        <div className="adi-article-wide px-0 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-10 xl:gap-12">
            <div>
              <div className="adi-story-media sm:mt-6">
                <StoryVisual article={article} className="adi-mobile-full aspect-[16/8.7] max-h-[580px]" />
              </div>
              {article.featured_image_credit && <p className="px-4 pt-2 text-right text-[10px] text-white/28 sm:px-0">{article.featured_image_source_url ? <a href={article.featured_image_source_url} target="_blank" rel="noreferrer noopener" className="hover:text-white">{article.featured_image_credit}</a> : article.featured_image_credit}</p>}
            </div>

            <aside className="hidden pt-6 lg:block">
              <p className="adi-kicker">Related to this story</p>
              <div className="mt-2 divide-y divide-white/10">
                {related.slice(0,3).map((item) => <Link key={item.id} href={articlePath(item)} className="block py-4"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/34">{displayCategory(item)}</p><p className="mt-1 text-sm font-black leading-tight text-white/88">{item.title}</p></Link>)}
              </div>
              <div className="mt-6 border-t border-white/10 pt-5"><p className="adi-kicker">Why trust this report</p><p className="mt-3 text-sm leading-7 text-white/46">Independent-source verification, originality checks and a final quality gate are required before publication.</p></div>
            </aside>
          </div>
        </div>

        <section className="adi-reading-surface mt-0 sm:mt-8">
          <div className="adi-article-wide grid gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,820px)_340px] lg:justify-between lg:px-8 lg:py-11 xl:gap-14">
            <div className="min-w-0">
              {article.excerpt && <p className="adi-reading-copy max-w-[70ch] border-b pb-6 text-[1.08rem] font-black leading-[1.5] tracking-[-0.02em] sm:text-[1.28rem]" style={{ borderColor: "var(--adi-reading-line)" }}>{article.excerpt}</p>}

              <div className="adi-article-prose mt-7">
                <ArticleMarkdown
                  content={content}
                  inserts={[
                    <AuraInlineReferral key="aura-1" articleSlug={article.slug} cta={cta} compact/>,
                    <AuraInlineReferral key="aura-2" articleSlug={article.slug} cta={cta} compact/>,
                  ]}
                />
              </div>

              {sources.length > 0 && (
                <section className="mt-12 border-t-2 pt-5" style={{ borderColor: "var(--adi-reading-fg)" }}>
                  <div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-45">Independent evidence</p><h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">Sources</h2></div><span className="text-[9px] font-black uppercase tracking-[0.12em] opacity-40">{sources.length} source{sources.length===1?"":"s"}</span></div>
                  <div className="mt-4 divide-y" style={{ borderColor: "var(--adi-reading-line)" }}>{sources.map((source,index)=><a key={source.id} href={source.source_url} target="_blank" rel="noreferrer noopener" className="group flex items-start justify-between gap-4 py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] opacity-45">Source {String(index+1).padStart(2,"0")} · {source.source_name}</p><p className="adi-reading-copy mt-2 text-sm font-semibold leading-6">{source.citation_text || "Independent reporting used by the verification pipeline."}</p></div><ExternalLink size={15} className="mt-1 shrink-0 opacity-35"/></a>)}</div>
                </section>
              )}
            </div>

            <aside className="adi-article-sidebar hidden space-y-7 border-l pl-7 lg:block" style={{ borderColor: "var(--adi-reading-line)" }}>
              <div className="adi-sidebar-aura">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-55">Aura Digital Fiji · {cta.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black leading-[1.05] tracking-[-0.05em]">{cta.title}</h3>
                <p className="mt-3 text-sm leading-7 opacity-65">{cta.text}</p>
                <a href={`/go/aura?service=${encodeURIComponent(cta.key)}&article=${encodeURIComponent(article.slug)}`} className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em]">{cta.label} <ArrowRight size={13}/></a>
              </div>

              {latest.length > 1 && <div className="adi-sidebar-module"><p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-45">Latest intelligence</p><div className="mt-2 divide-y" style={{ borderColor: "var(--adi-reading-line)" }}>{latest.filter((item)=>item.id!==article.id).slice(0,4).map((item)=><Link key={item.id} href={articlePath(item)} className="block py-3"><p className="text-[9px] font-black uppercase tracking-[0.12em] opacity-38">{displayCategory(item)}</p><p className="mt-1 text-sm font-black leading-tight">{item.title}</p></Link>)}</div></div>}

              <div className="adi-sidebar-module">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em]"><ShieldCheck size={15}/> Publication standard</div>
                <div className="adi-reading-copy mt-4 space-y-3 text-xs leading-6"><p>Independent-source verification before publication.</p><p>Originality checks protect against excessive phrase overlap.</p><p>Final quality review gates every published story.</p></div>
                <Link href="/editorial-standards" className="mt-4 inline-block text-[10px] font-black uppercase tracking-[0.12em]">Read our standards →</Link>
              </div>
            </aside>
          </div>
        </section>
      </article>

      {related.length > 0 && <section className="border-t border-white/10"><div className="adi-article-wide px-0 py-9 sm:px-6 lg:px-8 lg:py-12"><div className="mb-5 flex items-end justify-between gap-4 px-4 sm:px-0"><div><p className="adi-kicker">Continue reading</p><h2 className="adi-section-title mt-1">Related intelligence</h2></div><Link href="/news" className="text-[10px] font-black uppercase tracking-[0.12em] text-white/45 hover:text-white">All news →</Link></div><div className="adi-story-grid three">{related.slice(0,3).map((item)=><StoryCard key={item.id} article={item} compact />)}</div></div></section>}

      <NewsFooter />
    </main>
  );
}
