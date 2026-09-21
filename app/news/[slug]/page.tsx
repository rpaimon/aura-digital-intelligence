import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { ArticleMarkdown } from "@/components/public-news/article-markdown";
import { AuraInlineCTA } from "@/components/public-news/aura-cta";
import { EditorialVisual, StoryCard, categoryColor } from "@/components/public-news/framagz-ui";
import { MobileAuraCTA } from "@/components/public-news/mobile-aura-cta";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { ReadingProgress } from "@/components/public-news/reading-progress";
import { ShareBar } from "@/components/public-news/share-bar";
import {
  articlePath,
  auraServiceForArticle,
  canonicalArticleUrl,
  displayCategory,
  getPublishedArticleBySlug,
  getRelatedArticles,
  readingTime,
  siteUrl,
  stripSourcesSection,
} from "@/lib/news/public";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  const canonical = canonicalArticleUrl(article);
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || "Technology intelligence from Aura Digital Intelligence.";
  const image = article.featured_image_url || `${siteUrl()}/news/${article.slug}/opengraph-image`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical, publishedTime: article.published_at || undefined, modifiedTime: article.updated_at || undefined, section: displayCategory(article), images: [{ url: image, width: 1200, height: 630, alt: article.featured_image_alt || article.title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

function dateTime(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-FJ", { timeZone: "Pacific/Fiji", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();
  const cleanPath = articlePath(article);
  if (`/news/${slug}` !== cleanPath) redirect(cleanPath);

  const content = stripSourcesSection(article.content);
  const sources = article.article_sources ?? [];
  const related = await getRelatedArticles(article.id, article.category, 3);
  const cta = auraServiceForArticle(article);
  const canonical = canonicalArticleUrl(article);
  const image = article.featured_image_url || `${siteUrl()}/news/${article.slug}/opengraph-image`;
  const authorName = article.authors?.name || "Aura Intelligence Desk";
  const authorSlug = article.authors?.slug || "aura-digital-intelligence";
  const category = displayCategory(article);
  const accent = categoryColor(category);
  const ctaHref = `/go/aura?service=${encodeURIComponent(cta.key)}&article=${encodeURIComponent(article.slug)}`;

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
        <header className="adi-article-header">
          <div className="adi-article-header-inner">
            <Link href="/news" className="adi-back-link"><ArrowLeft size={13}/> Back to all news</Link>
            <div className="adi-article-meta">
              <span className="adi-article-category" style={{ backgroundColor: accent }}>{category}</span>
              {article.published_at && <time dateTime={article.published_at}>{dateTime(article.published_at)} FJT</time>}
              <span className="inline-flex items-center gap-1"><Clock3 size={12}/> {readingTime(content)} min read</span>
            </div>
            <h1 className="adi-article-title">{article.title}</h1>
            {article.subtitle && <p className="adi-article-dek">{article.subtitle}</p>}
            <div className="adi-article-author-row">
              <Link href={`/authors/${authorSlug}`} className="adi-article-author">
                <div className="adi-author-avatar">ADI</div>
                <div><p>{authorName}</p><span>Technology Editor · Fiji</span></div>
              </Link>
              <ShareBar title={article.title} />
            </div>
          </div>
        </header>

        <div className="adi-article-visual-wrap">
          <div className="adi-article-visual group"><EditorialVisual article={article} /></div>
          {article.featured_image_credit && <p className="adi-image-credit">{article.featured_image_source_url ? <a href={article.featured_image_source_url} target="_blank" rel="noreferrer noopener">{article.featured_image_credit}</a> : article.featured_image_credit}</p>}
        </div>

        <div className="adi-article-layout">
          <div className="adi-article-main">
            {article.excerpt && <p className="adi-article-summary">{article.excerpt}</p>}
            <AuraInlineCTA cta={cta} articleSlug={article.slug} variant="early" />

            <ArticleMarkdown
              content={content}
              afterSection={{
                "what this means for fiji businesses": <AuraInlineCTA cta={cta} articleSlug={article.slug} variant="mid" />,
              }}
            />

            <AuraInlineCTA cta={cta} articleSlug={article.slug} variant="final" />

            {sources.length > 0 && (
              <section className="adi-sources">
                <div className="adi-sources-head">
                  <div><p style={{ color: accent }}>Independent evidence</p><h2>Sources</h2></div>
                  <span>{sources.length} source{sources.length === 1 ? "" : "s"}</span>
                </div>
                <div className="adi-source-list">
                  {sources.map((source, index) => (
                    <a key={source.id} href={source.source_url} target="_blank" rel="noreferrer noopener" className="adi-source-card">
                      <div><p>Source {String(index + 1).padStart(2, "0")} · {source.source_name}</p><span>{source.citation_text || "Independent reporting used for verification."}</span></div><ExternalLink size={15} />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="adi-article-sidebar">
            <div className="adi-trust-card">
              <div className="adi-trust-title"><ShieldCheck size={16}/> Publication standard</div>
              <div className="adi-trust-item"><strong>Fact checked</strong><span>Key claims are checked against independent reporting before publication.</span></div>
              <div className="adi-trust-item"><strong>Originality checked</strong><span>Published drafts are screened for excessive phrase overlap.</span></div>
              <div className="adi-trust-item"><strong>Corrections welcome</strong><span>If something needs attention, our corrections policy explains how to contact us.</span></div>
              <Link href="/editorial-standards">Read our standards</Link>
            </div>
            <AuraInlineCTA cta={cta} articleSlug={article.slug} variant="mid" />
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="adi-related">
          <div className="adi-related-head"><div><p>Continue reading</p><h2>Related Intelligence</h2></div><Link href="/news">All news <ArrowUpRight size={12}/></Link></div>
          <div className="adi-related-grid">{related.map((item) => <StoryCard key={item.id} article={item} compact />)}</div>
        </section>
      )}

      <NewsFooter />
      <MobileAuraCTA href={ctaHref} label={cta.serviceName} />
    </main>
  );
}
