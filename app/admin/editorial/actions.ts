"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { seoSlugFromTitle } from "@/lib/news/public";

function required(form: FormData, key: string, max: number) {
  const value = String(form.get(key) || "").trim();
  if (!value || value.length > max) throw new Error(`${key} is required (max ${max} characters).`);
  return value;
}
function optional(form: FormData, key: string, max: number) {
  const value = String(form.get(key) || "").trim();
  if (value.length > max) throw new Error(`${key} exceeds the ${max}-character limit.`);
  return value || null;
}
function safeHttpsUrl(value: string | null, field: string) {
  if (!value) return null;
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`Provide a valid ${field} URL.`); }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error(`${field} URL must use HTTPS or HTTP.`);
  if (url.username || url.password) throw new Error(`${field} URL must not contain credentials.`);
  return url.toString();
}
const allowedCategories = ["Technology", "Cybersecurity", "Artificial Intelligence", "Business", "Cloud", "Ecommerce", "Fiji + Pacific"];
function editorialFields(form: FormData) {
  const title = required(form, "title", 140);
  const excerpt = required(form, "excerpt", 320);
  const content = required(form, "content", 30000);
  const category = required(form, "category", 50);
  if (title.length < 18 || content.length < 250) throw new Error("Please use a complete headline and at least 250 characters of verified reporting.");
  if (!allowedCategories.includes(category)) throw new Error("Unsupported category.");
  const imageUrl = safeHttpsUrl(optional(form, "imageUrl", 1500), "image");
  const imageCredit = optional(form, "imageCredit", 200);
  if (imageUrl && (form.get("imageRights") !== "yes" || !imageCredit)) {
    throw new Error("For an article image, confirm reuse rights and provide a photo credit.");
  }
  return {
    title, excerpt, content, category,
    source_url: safeHttpsUrl(required(form, "sourceUrl", 1500), "source")!,
    source_name: required(form, "sourceName", 120),
    featured_image_url: imageUrl,
    featured_image_alt: optional(form, "imageAlt", 180) || title,
    featured_image_credit: imageCredit,
    updated_at: new Date().toISOString(),
  };
}
function refreshPublic() {
  for (const path of ["/", "/news", "/rss.xml", "/sitemap.xml", "/news-sitemap.xml", "/admin/editorial"]) {
    revalidatePath(path);
  }
}

/** Separate human editorial table: does not create jobs/stories, or call the automatic publisher. */
export async function createEditorialPost(form: FormData) {
  await requireAdmin();
  const fields = editorialFields(form);
  const db = createAdminClient();
  const slug = `${seoSlugFromTitle(fields.title).slice(0, 58)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await db.from("editorial_posts")
    .insert({ ...fields, slug, status: "draft", published_at: null })
    .select("id").single();
  if (error) throw new Error(`Unable to save editorial draft: ${error.message}. Has migration 019 been applied?`);
  refreshPublic();
  redirect(`/admin/editorial/edit/${data.id}?created=1`);
}

export async function updateEditorialPost(form: FormData) {
  await requireAdmin();
  const id = required(form, "id", 60);
  const fields = editorialFields(form);
  const db = createAdminClient();
  const { error } = await db.from("editorial_posts").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  refreshPublic();
  redirect(`/admin/editorial/edit/${id}?saved=1`);
}

export async function setEditorialPublication(form: FormData) {
  await requireAdmin();
  const id = required(form, "id", 60);
  const intent = required(form, "intent", 12);
  if (!["publish", "unpublish"].includes(intent)) throw new Error("Invalid publishing action.");
  if (intent === "publish" && form.get("verified") !== "yes") {
    throw new Error("Confirm you checked the facts and cited the original source before publishing.");
  }
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await db.from("editorial_posts")
    .update({ status: intent === "publish" ? "published" : "draft",
      published_at: intent === "publish" ? now : null, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refreshPublic();
  redirect(`/admin/editorial/edit/${id}?${intent === "publish" ? "published" : "unpublished"}=1`);
}

/** Original generated article title and image are never overwritten. */
export async function saveGeneratedPresentation(form: FormData) {
  await requireAdmin();
  const articleId = required(form, "articleId", 60);
  const headline = required(form, "displayTitle", 140);
  const plainSummary = optional(form, "plainSummary", 320);
  if (headline.length < 18) throw new Error("Provide a clear and complete headline.");
  const imageUrl = safeHttpsUrl(optional(form, "imageUrl", 1500), "image");
  const imageCredit = optional(form, "imageCredit", 200);
  if (imageUrl && (form.get("imageRights") !== "yes" || !imageCredit)) {
    throw new Error("Confirm image reuse rights and give the photographer/source credit.");
  }
  const db = createAdminClient();
  const { data, error: lookupError } = await db.from("articles")
    .select("id").eq("id", articleId).eq("status", "published").maybeSingle();
  if (lookupError || !data) throw new Error("Published generated article not found.");
  const { error } = await db.from("editorial_overrides").upsert({
    article_id: articleId, display_title: headline, plain_summary: plainSummary,
    featured_image_url: imageUrl, featured_image_alt: optional(form, "imageAlt", 180),
    featured_image_credit: imageCredit,
    updated_at: new Date().toISOString(),
  }, { onConflict: "article_id" });
  if (error) throw new Error(`Unable to save editorial display: ${error.message}. Has migration 019 been applied?`);
  refreshPublic();
  redirect("/admin/editorial?updated=1");
}
