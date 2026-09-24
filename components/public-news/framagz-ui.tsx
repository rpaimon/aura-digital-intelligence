import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { PublicArticle } from "@/lib/news/public";
import { articleFallbackImage, articlePath, displayCategory, readingTime } from "@/lib/news/public";

export const categoryPalette: Record<string, string> = {
  ai: "#6bd4ff",
  cybersecurity: "#ff6a9b",
  cloud: "#86d874",
  business: "#ff9b63",
  ecommerce: "#f6d15f",
  fiji: "#af92ff",
  technology: "#6bd4ff",
};

export function categoryColor(label?: string | null) {
  const text = String(label || "technology").toLowerCase();
  if (text.includes("cyber") || text.includes("security")) return categoryPalette.cybersecurity;
  if (text.includes("business")) return categoryPalette.business;
  if (text.includes("cloud") || text.includes("infrastructure")) return categoryPalette.cloud;
  if (text.includes("commerce") || text.includes("payment")) return categoryPalette.ecommerce;
  if (text.includes("fiji") || text.includes("pacific")) return categoryPalette.fiji;
  return categoryPalette.ai;
}

export function formatNewsDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-FJ", {
    timeZone: "Pacific/Fiji",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CategoryChip({ label }: { label?: string | null }) {
  const category = displayCategory({ title: "", category: label || "", excerpt: "" });
  return (
    <span className="adi-chip">
      <span className="adi-chip-dot" style={{ backgroundColor: categoryColor(category) }} />
      {category}
    </span>
  );
}

export function StoryCard({ article, compact = false }: { article: PublicArticle; compact?: boolean }) {
  const category = displayCategory(article);
  return (
    <article className="adi-story-card adi-panel-soft group overflow-hidden p-3 sm:p-4">
      <div className={`${compact ? "grid gap-3 md:block" : "grid gap-4"} ${compact ? "grid-cols-[110px_minmax(0,1fr)] md:grid-cols-1" : ""}`}>
        <Link href={articlePath(article)} className="block overflow-hidden rounded-2xl bg-[#131a22]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.featured_image_url || articleFallbackImage(article)} alt={article.featured_image_alt || article.title} className={`${compact ? "aspect-square md:aspect-[16/10]" : "aspect-[16/10]"} w-full object-cover transition duration-700 group-hover:scale-[1.045]`} />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
            <CategoryChip label={category} />
            <span>{formatNewsDate(article.published_at)}</span>
          </div>
          <h3 className={`${compact ? "text-[1.02rem] sm:text-[1.08rem]" : "text-2xl sm:text-[1.75rem]"} adi-title-balance mt-3 font-black leading-[1.08] tracking-[-0.04em] text-white transition group-hover:text-white/75`}>
            <Link href={articlePath(article)}>{article.title}</Link>
          </h3>
          {article.excerpt && <p className={`mt-3 ${compact ? "line-clamp-2 text-[0.92rem] leading-6 text-white/48" : "line-clamp-3 text-sm leading-6 text-white/50"}`}>{article.excerpt}</p>}
        </div>
      </div>
    </article>
  );
}

export function StoryRow({ article, showExcerpt = true }: { article: PublicArticle; showExcerpt?: boolean }) {
  const category = displayCategory(article);
  return (
    <article className="adi-story-card adi-panel-soft group p-3 sm:p-4">
      <div className="adi-story-row">
        <Link href={articlePath(article)} className="block overflow-hidden rounded-2xl bg-[#131a22]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.featured_image_url || articleFallbackImage(article)} alt={article.featured_image_alt || article.title} className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
            <CategoryChip label={category} />
            <span>{formatNewsDate(article.published_at)}</span>
          </div>
          <h3 className="adi-title-balance mt-2 text-[1.02rem] font-black leading-[1.14] tracking-[-0.035em] text-white transition group-hover:text-white/75 sm:text-[1.12rem]">
            <Link href={articlePath(article)}>{article.title}</Link>
          </h3>
          {showExcerpt && article.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/46">{article.excerpt}</p>}
        </div>
      </div>
    </article>
  );
}

export function NumberedPick({ article, index }: { article: PublicArticle; index: number }) {
  const category = displayCategory(article);
  return (
    <Link href={articlePath(article)} className="group grid grid-cols-[28px_68px_1fr] items-center gap-3 border-b border-white/8 py-3 last:border-b-0">
      <span className="text-[1.75rem] font-black tracking-[-0.06em] text-white/18">{index}</span>
      <div className="overflow-hidden rounded-xl bg-[#151515]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={article.featured_image_url || articleFallbackImage(article)} alt="" className="aspect-square h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/40">{category}</p>
        <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white/88 transition group-hover:text-white">{article.title}</p>
      </div>
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, href }: { eyebrow?: string; title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="adi-kicker">{eyebrow}</p>}
        <h2 className="mt-1 text-[1.7rem] font-black leading-none tracking-[-0.055em] text-white sm:text-[2.1rem]">{title}</h2>
      </div>
      {href && <Link href={href} className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-white/48 transition hover:text-white">View all <ArrowUpRight size={13} /></Link>}
    </div>
  );
}

export function MetaLine({ article }: { article: PublicArticle }) {
  const category = displayCategory(article);
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-white/45">
      <span>{category}</span><span>•</span><span>{formatNewsDate(article.published_at)}</span><span>•</span><span className="inline-flex items-center gap-1"><Clock3 size={11} /> {readingTime(article.excerpt || article.content)} min</span>
    </div>
  );
}
