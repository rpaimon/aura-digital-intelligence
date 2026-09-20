"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function audit(action: string, articleId: string | null, metadata: Record<string, unknown> = {}) {
  const user = await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action,
    entity: "article",
    entity_id: articleId,
    metadata,
  });
}

function refresh() {
  revalidatePath("/admin/articles");
  revalidatePath("/news");
  revalidatePath("/sitemap.xml");
}

export async function publishArticle(formData: FormData) {
  await requireAdmin();
  const articleId = String(formData.get("articleId") || "");
  if (!articleId) throw new Error("Missing article id");

  const supabase = createAdminClient();
  const { data: article, error: readError } = await supabase
    .from("articles")
    .select("id,story_id,slug,title,status,final_quality_passed,final_quality_score,originality_passed,originality_score,published_at,first_published_at")
    .eq("id", articleId)
    .single();
  if (readError) throw new Error(readError.message);
  if (!article.final_quality_passed) throw new Error("This article has not passed the final quality gate.");
  if (!article.originality_passed) throw new Error("This article has not passed the copyright/originality guard.");

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("articles")
    .update({
      status: "published",
      published_at: now,
      first_published_at: article.first_published_at || now,
      scheduled_for: null,
      unpublished_at: null,
      publication_reason: "manual publish",
      updated_at: now,
    })
    .eq("id", articleId);
  if (error) throw new Error(error.message);

  if (article.story_id) {
    await supabase.from("stories").update({ status: "published" }).eq("id", article.story_id);
  }
  await audit("article.published", articleId, { mode: "manual" });
  refresh();
}

export async function scheduleArticle(formData: FormData) {
  await requireAdmin();
  const articleId = String(formData.get("articleId") || "");
  const raw = String(formData.get("scheduledIso") || "");
  if (!articleId || !raw) throw new Error("Article and schedule time are required.");

  const date = new Date(raw);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) throw new Error("Choose a future publication time.");

  const supabase = createAdminClient();
  const { data: article, error: readError } = await supabase
    .from("articles")
    .select("id,final_quality_passed,originality_passed")
    .eq("id", articleId)
    .single();
  if (readError) throw new Error(readError.message);
  if (!article.final_quality_passed) throw new Error("This article has not passed the final quality gate.");
  if (!article.originality_passed) throw new Error("This article has not passed the copyright/originality guard.");

  const { error } = await supabase
    .from("articles")
    .update({
      status: "approved",
      scheduled_for: date.toISOString(),
      publication_reason: "scheduled by admin",
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);
  if (error) throw new Error(error.message);

  await audit("article.scheduled", articleId, { scheduled_for: date.toISOString() });
  refresh();
}

export async function unpublishArticle(formData: FormData) {
  await requireAdmin();
  const articleId = String(formData.get("articleId") || "");
  if (!articleId) throw new Error("Missing article id");

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("articles")
    .update({
      status: "approved",
      published_at: null,
      scheduled_for: null,
      unpublished_at: now,
      publication_reason: "manually unpublished",
      updated_at: now,
    })
    .eq("id", articleId);
  if (error) throw new Error(error.message);

  await audit("article.unpublished", articleId, { mode: "manual" });
  refresh();
}

export async function setPublishingMode(formData: FormData) {
  await requireAdmin();
  const mode = String(formData.get("mode") || "manual");
  if (!['manual', 'automatic'].includes(mode)) throw new Error("Invalid publishing mode");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: "publishing_mode", value: mode, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  await audit("publishing.mode_changed", null, { mode });
  refresh();
}
