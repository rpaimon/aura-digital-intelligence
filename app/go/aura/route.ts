import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SERVICE_TARGETS: Record<string, string> = {
  security: "https://auradigitalfiji.com/website-management-security-fiji",
  email: "https://auradigitalfiji.com/business-email-hosting-fiji",
  apps: "https://auradigitalfiji.com/custom-mobile-app-fiji",
  web: "https://auradigitalfiji.com/web-design-development-fiji",
  it: "https://auradigitalfiji.com/it-services-fiji",
};

export async function GET(request: NextRequest) {
  const service = request.nextUrl.searchParams.get("service") || "it";
  const slug = request.nextUrl.searchParams.get("article") || "unknown";
  const targetBase = SERVICE_TARGETS[service] || "https://auradigitalfiji.com";
  const target = new URL(targetBase);
  target.searchParams.set("utm_source", "aura_digital_intelligence");
  target.searchParams.set("utm_medium", "editorial");
  target.searchParams.set("utm_campaign", "news_to_client");
  target.searchParams.set("utm_content", slug.slice(0, 120));

  try {
    const supabase = createAdminClient();
    const { data: article } = await supabase
      .from("articles")
      .select("id,story_id")
      .eq("slug", slug)
      .maybeSingle();

    await supabase.from("conversion_events").insert({
      article_id: article?.id ?? null,
      story_id: article?.story_id ?? null,
      service_key: service.slice(0, 80),
      target_url: target.toString(),
    });
  } catch {
    // Conversion tracking must never block the reader's destination.
  }

  return NextResponse.redirect(target, 307);
}
