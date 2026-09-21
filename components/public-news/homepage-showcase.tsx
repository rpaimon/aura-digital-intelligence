"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Grid2X2,
  Newspaper,
  Phone,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import type { PublicArticle } from "@/lib/news/public";
import styles from "./homepage-showcase.module.css";

const fallbackImages = {
  ai: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=88",
  cyber: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1800&q=88",
  cloud: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1800&q=88",
  business: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=88",
  ecommerce: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=88",
  pacific: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=88",
  default: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1800&q=88",
};

function imageFor(article: PublicArticle) {
  if (article.featured_image_url) return article.featured_image_url;
  const text = `${article.category || ""} ${article.title}`.toLowerCase();
  if (/cyber|security|hack|ransom|phish/.test(text)) return fallbackImages.cyber;
  if (/\bai\b|artificial|gemini|openai|anthropic|machine learning/.test(text)) return fallbackImages.ai;
  if (/cloud|hosting|infrastructure|server|data center/.test(text)) return fallbackImages.cloud;
  if (/ecommerce|commerce|payment|retail|shopping/.test(text)) return fallbackImages.ecommerce;
  if (/fiji|pacific|samoa|tonga|vanuatu/.test(text)) return fallbackImages.pacific;
  if (/business|productivity|enterprise|startup/.test(text)) return fallbackImages.business;
  return fallbackImages.default;
}

function categoryLabel(article: PublicArticle) {
  const text = `${article.category || ""} ${article.title}`.toLowerCase();
  if (/cyber|security|hack|ransom|phish/.test(text)) return "Cybersecurity";
  if (/\bai\b|artificial|gemini|openai|anthropic|machine learning/.test(text)) return "Artificial Intelligence";
  if (/cloud|hosting|infrastructure|server|data center/.test(text)) return "Cloud";
  if (/ecommerce|commerce|payment|retail|shopping/.test(text)) return "Ecommerce";
  if (/fiji|pacific|samoa|tonga|vanuatu/.test(text)) return "Fiji + Pacific";
  return article.category || "Technology";
}

function formatDate(value: string | null) {
  if (!value) return "Latest update";
  return new Intl.DateTimeFormat("en-FJ", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Pacific/Fiji",
  }).format(new Date(value));
}

function HomeHeader() {
  const nav = [
    { href: "/news", label: "All News", icon: Newspaper, color: "#1f5279" },
    { href: "/categories", label: "Categories", icon: Grid2X2, color: "#bc3975" },
    { href: "/about", label: "About Us", icon: Users, color: "#19a7ba" },
    { href: "/career", label: "Career", icon: Sparkles, color: "#ff633f" },
    { href: "/contact", label: "Contact", icon: Phone, color: "#8d9637" },
    { href: "/news", label: "Search", icon: Search, color: "#126b2c" },
  ];

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Aura Intelligence home">
        Aura Intelligence
      </Link>
      <nav className={styles.desktopNav} aria-label="Primary navigation">
        {nav.map((item) => (
          <Link key={item.label} href={item.href} className={styles.navItem} style={{ backgroundColor: item.color }}>
            {item.label}
          </Link>
        ))}
      </nav>
      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className={styles.mobileNavItem} style={{ backgroundColor: item.color }} aria-label={item.label} title={item.label}>
              <Icon size={22} strokeWidth={2.15} />
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function StoryRow({ article }: { article: PublicArticle }) {
  return (
    <article className={styles.storyRow}>
      <Link href={`/news/${article.slug}`} className={styles.storyImageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageFor(article)} alt={article.featured_image_alt || article.title} className={styles.storyImage} />
      </Link>
      <div className={styles.storyCopy}>
        <span className={styles.storyCategory}>{categoryLabel(article)}</span>
        <span className={styles.storyDate}>{formatDate(article.published_at)}</span>
        <h3><Link href={`/news/${article.slug}`}>{article.title}</Link></h3>
        {article.excerpt && <p>{article.excerpt}</p>}
      </div>
    </article>
  );
}

function StaffPick({ article, index }: { article: PublicArticle; index: number }) {
  return (
    <article className={styles.staffPick}>
      <span className={styles.staffIndex}>{index}</span>
      <Link href={`/news/${article.slug}`} className={styles.staffThumbWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageFor(article)} alt={article.featured_image_alt || article.title} className={styles.staffThumb} />
      </Link>
      <div>
        <span>{categoryLabel(article)}</span>
        <h3><Link href={`/news/${article.slug}`}>{article.title}</Link></h3>
      </div>
    </article>
  );
}

export function HomepageShowcase({ articles }: { articles: PublicArticle[] }) {
  const heroArticles = useMemo(() => articles.slice(0, 4), [articles]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (heroArticles.length <= 1) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % heroArticles.length), 7600);
    return () => window.clearInterval(timer);
  }, [heroArticles.length]);

  const lead = heroArticles[active] ?? null;
  const used = new Set(heroArticles.map((article) => article.id));
  const remaining = articles.filter((article) => !used.has(article.id));
  const happenings = remaining.slice(0, 4);
  const staff = remaining.slice(4, 7);

  return (
    <>
      <HomeHeader />

      <section className={styles.hero}>
        {lead ? (
          <div key={lead.id} className={styles.heroSlide}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageFor(lead)} alt={lead.featured_image_alt || lead.title} className={styles.heroImage} />
            <div className={styles.heroShade} />
            <div className={styles.heroUpdate}>Today&apos;s Update</div>
            <div className={styles.heroContent}>
              <div className={styles.heroMeta}>{formatDate(lead.published_at)} <span>/</span> {categoryLabel(lead)}</div>
              <h1 className={styles.heroHeadline}><Link href={`/news/${lead.slug}`}>{lead.title}</Link></h1>
              <Link href={`/news/${lead.slug}`} className={styles.heroRead}>Read full story <ArrowRight size={18} /></Link>
            </div>
            {heroArticles.length > 1 && (
              <div className={styles.dots} aria-label="Featured story controls">
                {heroArticles.map((article, index) => (
                  <button key={article.id} onClick={() => setActive(index)} aria-label={`Show featured story ${index + 1}`} className={index === active ? styles.dotActive : styles.dot} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyHero}>
            <div className={styles.heroUpdate}>Today&apos;s Update</div>
            <div><p>Aura Intelligence</p><h1>Verified technology intelligence for Fiji.</h1></div>
          </div>
        )}
      </section>

      {(happenings.length > 0 || staff.length > 0) && (
        <section className={styles.newsGrid}>
          <div className={styles.happeningColumn}>
            <div className={styles.sectionTitleRow}><h2>Happening Today!</h2><Link href="/news">All news <ArrowRight size={15}/></Link></div>
            <div>{happenings.map((article) => <StoryRow key={article.id} article={article} />)}</div>
          </div>

          {staff.length > 0 && (
            <aside className={styles.staffColumn}>
              <div className={styles.sectionTitleRow}><h2>Staff Picks</h2></div>
              <div className={styles.staffList}>{staff.map((article, index) => <StaffPick key={article.id} article={article} index={index + 1} />)}</div>
            </aside>
          )}
        </section>
      )}

      <section className={styles.auraStrip}>
        <div>
          <span>Aura Digital Fiji</span>
          <h2>Technology intelligence is useful. Implementing it is where businesses win.</h2>
        </div>
        <a href="https://auradigitalfiji.com?utm_source=aura_intelligence&utm_medium=homepage&utm_campaign=homepage_editorial_cta">Explore Aura Digital Fiji <ArrowRight size={18}/></a>
      </section>
    </>
  );
}
