import { createAdminClient } from "@/lib/supabase/admin";

export type PublicArticle = {
  id: string;
  story_id?: string | null;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  featured_image_url: string | null;
  featured_image_credit: string | null;
  featured_image_source_url: string | null;
  featured_image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  authors: {
    name: string;
    slug: string;
    bio: string | null;
    avatar_url: string | null;
  } | null;
  article_sources?: Array<{
    id: string;
    source_url: string;
    source_name: string;
    source_type: string | null;
    citation_text: string | null;
  }>;
};

const listFields =
  "id,story_id,slug,title,subtitle,excerpt,category,featured_image_url,featured_image_credit,featured_image_source_url,featured_image_alt,seo_title,seo_description,canonical_url,published_at,updated_at,created_at,authors(name,slug,bio,avatar_url)";

export const TOPIC_HUBS = [
  { slug: "ai", label: "Artificial Intelligence", shortLabel: "AI", keywords: ["ai", "artificial intelligence", "machine learning", "gemini", "openai", "anthropic", "llm"] },
  { slug: "cybersecurity", label: "Cybersecurity", shortLabel: "Cyber", keywords: ["cyber", "security", "privacy", "ransomware", "phishing", "hack", "malware", "breach", "threat intelligence"] },
  { slug: "cloud", label: "Cloud & Infrastructure", shortLabel: "Cloud", keywords: ["cloud", "hosting", "infrastructure", "data center", "dns", "server", "network"] },
  { slug: "business-tech", label: "Business Technology", shortLabel: "Business", keywords: ["business", "technology", "digital transformation", "productivity", "workplace", "enterprise"] },
  { slug: "ecommerce", label: "Ecommerce & Payments", shortLabel: "Ecommerce", keywords: ["ecommerce", "commerce", "payment", "m-paisa", "mpaisa", "retail", "shopify", "checkout"] },
  { slug: "fiji-pacific", label: "Fiji & Pacific", shortLabel: "Fiji + Pacific", keywords: ["fiji", "pacific", "samoa", "tonga", "vanuatu", "papua new guinea", "solomon islands"] },
] as const;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have", "how", "in", "into", "is", "it", "its", "new", "of", "on", "or", "our", "s", "the", "their", "this", "to", "what", "when", "where", "which", "who", "why", "with", "your",
]);

export function seoSlugFromTitle(value: string) {
  const words = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const useful = words.filter((word) => !STOP_WORDS.has(word));
  const chosen = (useful.length >= 5 ? useful : words).slice(0, 10);
  return chosen.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "story";
}

export function publicSlugForArticle(article: Pick<PublicArticle, "title" | "slug">) {
  const base = seoSlugFromTitle(article.title);
  const stored = String(article.slug || "").trim();
  if (!base) return stored || "story";
  // New writer slugs are either the clean base or base + a 6-char collision suffix.
  // Preserve those stable unique URLs, but hide legacy UUID-style 8-char suffixes.
  if (stored === base || new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-[a-f0-9]{6}$`).test(stored)) {
    return stored;
  }
  return base;
}

export function articlePath(article: Pick<PublicArticle, "title" | "slug">) {
  return `/news/${publicSlugForArticle(article)}`;
}

export function canonicalArticleUrl(article: Pick<PublicArticle, "title" | "slug">) {
  return `${siteUrl()}${articlePath(article)}`;
}

export function displayCategory(article: Pick<PublicArticle, "title" | "category" | "excerpt">) {
  const text = `${article.category || ""} ${article.title || ""} ${article.excerpt || ""}`.toLowerCase();
  if (/cyber|security|privacy|ransomware|phishing|hack|malware|breach|threat intelligence|supply-chain hacking/.test(text)) return "Cybersecurity";
  if (/\bai\b|artificial intelligence|machine learning|gemini|openai|anthropic|llm/.test(text)) return "Artificial Intelligence";
  if (/cloud|hosting|infrastructure|data center|dns|server|network/.test(text)) return "Cloud";
  if (/ecommerce|commerce|payment|retail|shopify|checkout|m-paisa|mpaisa/.test(text)) return "Ecommerce";
  if (/fiji|pacific|samoa|tonga|vanuatu|papua new guinea|solomon islands/.test(text)) return "Fiji + Pacific";
  if (/business|enterprise|productivity|workplace|digital transformation/.test(text)) return "Business";
  return article.category?.trim() || "Technology";
}

export async function getPublishedArticles(limit = 24) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("articles")
    .select(listFields)
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicArticle[];
}

async function getArticleByStoredSlug(slug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id,story_id,slug,title,subtitle,excerpt,content,category,featured_image_url,featured_image_credit,featured_image_source_url,featured_image_alt,seo_title,seo_description,canonical_url,published_at,updated_at,created_at,authors(name,slug,bio,avatar_url),article_sources(id,source_url,source_name,source_type,citation_text)"
    )
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as unknown as PublicArticle | null;
}

export async function getPublishedArticleBySlug(slug: string) {
  const exact = await getArticleByStoredSlug(slug);
  if (exact) return exact;

  // Public links use short, readable SEO slugs without mutating old database rows.
  const recent = await getPublishedArticles(250);
  const match = recent.find((article) => publicSlugForArticle(article) === slug);
  if (!match) return null;
  return getArticleByStoredSlug(match.slug);
}

export async function getRelatedArticles(articleId: string, category: string | null, limit = 3) {
  const all = await getPublishedArticles(120);
  const sourceCategory = displayCategory({ title: "", category, excerpt: "" });
  const same = all.filter((article) => article.id !== articleId && displayCategory(article) === sourceCategory);
  const fallback = all.filter((article) => article.id !== articleId && !same.some((sameArticle) => sameArticle.id === article.id));
  return [...same, ...fallback].slice(0, limit);
}

export function topicBySlug(slug: string) {
  return TOPIC_HUBS.find((topic) => topic.slug === slug) ?? null;
}

export async function getPublishedArticlesForTopic(slug: string, limit = 36) {
  const topic = topicBySlug(slug);
  if (!topic) return [];
  const articles = await getPublishedArticles(200);
  const keys = topic.keywords.map((key) => key.toLowerCase());
  return articles
    .filter((article) => {
      const category = displayCategory(article).toLowerCase();
      const haystack = `${category} ${article.title} ${article.excerpt || ""}`.toLowerCase();
      return keys.some((key) => haystack.includes(key));
    })
    .slice(0, limit);
}

export type AuraServiceCTA = {
  key: string;
  eyebrow: string;
  title: string;
  text: string;
  label: string;
  serviceName: string;
};

export function auraServiceForArticle(article: Pick<PublicArticle, "title" | "category" | "excerpt">): AuraServiceCTA {
  const text = `${article.title} ${article.category || ""} ${article.excerpt || ""}`.toLowerCase();
  if (/cyber|security|phishing|ransomware|vulnerab|privacy|hack|malware|breach/.test(text)) {
    return { key: "security", eyebrow: "Protect your Fiji business", title: "Is your digital setup ready for the next threat?", text: "Aura Digital Fiji helps businesses secure, monitor and maintain websites, email and digital infrastructure.", label: "Explore website security", serviceName: "Website Management & Security" };
  }
  if (/email|mail|domain/.test(text)) {
    return { key: "email", eyebrow: "Business infrastructure", title: "Move business email beyond personal inboxes.", text: "Aura Digital Fiji provides professional business email and hosting designed for practical Fiji operations.", label: "Explore business email", serviceName: "Business Email & Hosting" };
  }
  if (/mobile|app|ios|android/.test(text)) {
    return { key: "apps", eyebrow: "Build the next product", title: "Turn the opportunity into a real mobile product.", text: "Aura Digital Fiji designs custom mobile applications around real business workflows and customer needs.", label: "Explore custom apps", serviceName: "Custom Mobile Apps" };
  }
  if (/ecommerce|commerce|payment|retail|m-paisa|mpaisa|website|web|seo/.test(text)) {
    return { key: "web", eyebrow: "Grow online", title: "Turn the insight into a faster digital experience.", text: "Aura Digital Fiji builds custom, high-performance websites and ecommerce systems for Fiji businesses.", label: "Explore web development", serviceName: "Web Design & Development" };
  }
  return { key: "it", eyebrow: "Turn insight into action", title: "Need help applying this technology to your business?", text: "Aura Digital Fiji provides practical web, cloud, IT and digital systems support for Fiji businesses.", label: "Explore Aura Digital Fiji", serviceName: "IT Services" };
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function stripSourcesSection(content: string | null | undefined) {
  return String(content || "").replace(/\n##\s+Sources[\s\S]*$/i, "").trim();
}

export function readingTime(content: string | null | undefined) {
  const words = String(content || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
