import { createAdminClient } from "@/lib/supabase/admin";

export type PublicArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  featured_image_url: string | null;
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

const listFields = "id,slug,title,subtitle,excerpt,category,featured_image_url,seo_title,seo_description,canonical_url,published_at,updated_at,created_at,authors(name,slug,bio,avatar_url)";

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
    .select("id,slug,title,subtitle,excerpt,content,category,featured_image_url,seo_title,seo_description,canonical_url,published_at,updated_at,created_at,authors(name,slug,bio,avatar_url),article_sources(id,source_url,source_name,source_type,citation_text)")
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
