"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(value: string) {
  if (!value) return "";
  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`Invalid URL: ${value}`);
  }
}

function sourcePayload(formData: FormData) {
  const name = clean(formData.get("name"));
  const url = normalizeUrl(clean(formData.get("url")));
  const rawFeedUrl = clean(formData.get("feed_url"));
  const feed_url = rawFeedUrl ? normalizeUrl(rawFeedUrl) : null;
  const category = clean(formData.get("category")) || null;
  const country = clean(formData.get("country")) || null;
  const source_type = clean(formData.get("source_type")) || "publication";
  const trustRaw = Number(clean(formData.get("trust_score")) || "70");
  const trust_score = Math.max(0, Math.min(100, Number.isFinite(trustRaw) ? trustRaw : 70));
  const active = formData.get("active") === "on";

  if (!name || !url) {
    throw new Error("Source name and website URL are required.");
  }

  return {
    name,
    url,
    feed_url,
    category,
    country,
    source_type,
    trust_score,
    active,
  };
}

export async function createSource(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const payload = sourcePayload(formData);

  const { error } = await supabase.from("sources").insert(payload);
  if (error) {
    redirect(`/admin/sources?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/sources");
  revalidatePath("/admin/dashboard");
  redirect("/admin/sources?success=Source%20added");
}

export async function updateSource(formData: FormData) {
  await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) redirect("/admin/sources?error=Missing%20source%20ID");

  const supabase = await createClient();
  const payload = sourcePayload(formData);
  const { error } = await supabase.from("sources").update(payload).eq("id", id);

  if (error) {
    redirect(`/admin/sources?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/sources");
  revalidatePath("/admin/dashboard");
  redirect("/admin/sources?success=Source%20updated");
}

export async function deleteSource(formData: FormData) {
  await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) redirect("/admin/sources?error=Missing%20source%20ID");

  const supabase = await createClient();
  const { error } = await supabase.from("sources").delete().eq("id", id);

  if (error) {
    redirect(`/admin/sources?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/sources");
  revalidatePath("/admin/dashboard");
  redirect("/admin/sources?success=Source%20deleted");
}
