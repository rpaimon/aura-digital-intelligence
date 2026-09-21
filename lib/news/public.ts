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
  { slug: "ai", label: "Artificial Intelligence", keywords: ["ai", "artificial intelligence", "machine learning"] },
  { slug: "cybersecurity", label: "Cybersecurity", keywords: ["cyber", "security", "privacy", "ransomware", "phishing"] },
  { slug: "cloud", label: "Cloud & Infrastructure", keywords: ["cloud", "hosting", "infrastructure", "data center", "dns"] },
  { slug: "business-tech", label: "Business Technology", keywords: ["business", "technology", "digital transformation", "productivity"] },
  { slug: "ecommerce", label: "Ecommerce & Payments", keywords: ["ecommerce", "commerce", "payment", "m-paisa", "mpaisa", "retail"] },
  { slug: "fiji-pacific", label: "Fiji & Pacific", keywords: ["fiji", "pacific", "samoa", "tonga", "vanuatu", "papua new guinea"] },
] as const;

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

export async function getPublishedArticleBySlug(slug: string) {
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

export async function getRelatedArticles(articleId: string, category: string | null, limit = 3) {
  const supabase = createAdminClient();
  let query = supabase
    .from("articles")
    .select(listFields)
    .eq("status", "published")
    .not("published_at", "is", null)
    .neq("id", articleId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicArticle[];
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
      const haystack = `${article.category || ""} ${article.title} ${article.excerpt || ""}`.toLowerCase();
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
};

export function auraServiceForArticle(article: Pick<PublicArticle, "title" | "category" | "excerpt">): AuraServiceCTA {
  const text = `${article.title} ${article.category || ""} ${article.excerpt || ""}`.toLowerCase();
  if (/cyber|security|phishing|ransomware|vulnerab|privacy|hack/.test(text)) {
    return { key: "security", eyebrow: "For Fiji businesses", title: "Is your website actually protected?", text: "Aura Digital Fiji helps businesses harden, monitor and maintain modern websites and web systems.", label: "Explore website security" };
  }
  if (/email|mail|phishing|domain/.test(text)) {
    return { key: "email", eyebrow: "Business infrastructure", title: "Professional email without the complexity.", text: "Explore business email and hosting built for practical Fiji operations.", label: "Explore business email" };
  }
  if (/mobile|app|ios|android/.test(text)) {
    return { key: "apps", eyebrow: "Build the next product", title: "Turn a digital idea into a real app.", text: "Aura Digital Fiji designs custom mobile applications around real business workflows.", label: "Explore custom apps" };
  }
  if (/ecommerce|commerce|payment|retail|m-paisa|mpaisa|website|web|seo/.test(text)) {
    return { key: "web", eyebrow: "Grow online", title: "Build a faster digital storefront.", text: "Aura Digital Fiji builds custom, high-performance websites and ecommerce experiences for Fiji businesses.", label: "Explore web development" };
  }
  return { key: "it", eyebrow: "Turn insight into action", title: "Need help applying the technology?", text: "Aura Digital Fiji provides practical web, cloud, IT and digital systems support for Fiji businesses.", label: "Explore Aura Digital Fiji" };
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
