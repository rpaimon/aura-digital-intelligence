interface Env {
  AI: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };
  VERCEL_SCOUT_URL: string;
  CRON_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  MAX_STORIES_PER_RUN?: string;
  AI_MODEL?: string;
}

type StoryRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  published_at: string | null;
  discovered_at: string;
  sources: { name?: string; trust_score?: number } | null;
};

type AiScores = {
  importance: number;
  fiji_relevance: number;
  business_relevance: number;
  aura_service_relevance: number;
  reason: string;
};

const DEFAULT_MODEL = "@cf/zai-org/glm-4.7-flash";
const DEFAULT_BATCH = 6;

function clampScore(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function supabaseHeaders(env: Env, prefer?: string) {
  return {
    apikey: env.SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function runDiscovery(env: Env) {
  if (!env.VERCEL_SCOUT_URL || !env.CRON_SECRET) {
    throw new Error("Missing VERCEL_SCOUT_URL or CRON_SECRET");
  }

  const response = await fetch(env.VERCEL_SCOUT_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Vercel RSS Scout failed (${response.status}): ${text.slice(0, 300)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, response: text.slice(0, 300) };
  }
}

async function getUnscoredStories(env: Env): Promise<StoryRow[]> {
  const limit = Math.max(1, Math.min(12, Number(env.MAX_STORIES_PER_RUN ?? DEFAULT_BATCH) || DEFAULT_BATCH));
  const query = new URLSearchParams({
    select: "id,title,description,category,published_at,discovered_at,sources(name,trust_score)",
    status: "eq.discovered",
    order: "discovered_at.asc",
    limit: String(limit),
  });

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/stories?${query.toString()}`, {
    headers: supabaseHeaders(env),
  });

  if (!response.ok) {
    throw new Error(`Supabase story fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }

  return (await response.json()) as StoryRow[];
}

function extractJson(raw: unknown): Record<string, unknown> {
  const text = typeof raw === "string"
    ? raw
    : raw && typeof raw === "object" && "response" in raw
      ? String((raw as { response?: unknown }).response ?? "")
      : JSON.stringify(raw ?? "");

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const object = fenced.match(/\{[\s\S]*\}/)?.[0];
  if (!object) throw new Error("AI response did not contain JSON");
  return JSON.parse(object) as Record<string, unknown>;
}

async function scoreStory(env: Env, story: StoryRow): Promise<AiScores> {
  const sourceTrust = clampScore(story.sources?.trust_score ?? 70);
  const model = env.AI_MODEL || DEFAULT_MODEL;

  const prompt = `You are the story triage engine for Aura Digital Intelligence, a technology intelligence publication serving Fiji and Pacific businesses.

Score this story from 0 to 100 on four dimensions:
1. importance: global technology/business significance and likely real-world impact.
2. fiji_relevance: direct or plausible relevance to Fiji or Pacific markets, organisations, consumers or regulation. Do not force relevance.
3. business_relevance: usefulness to business owners, managers or decision makers.
4. aura_service_relevance: relevance to services offered by a digital agency such as websites, ecommerce, apps, AI automation, cybersecurity, cloud, SEO, digital marketing and digital transformation.

Source trust score supplied by our source manager: ${sourceTrust}/100.

Return ONLY valid JSON in exactly this shape:
{"importance":0,"fiji_relevance":0,"business_relevance":0,"aura_service_relevance":0,"reason":"one short sentence"}

Story title: ${story.title}
Category: ${story.category ?? "Unknown"}
Description: ${(story.description ?? "No description provided").slice(0, 1800)}`;

  const response = await env.AI.run(model, {
    prompt: `Be conservative, factual and consistent. Output JSON only.\n\n${prompt}`,
    max_tokens: 220,
    temperature: 0.1,
  });

  const parsed = extractJson(response);
  return {
    importance: clampScore(parsed.importance),
    fiji_relevance: clampScore(parsed.fiji_relevance),
    business_relevance: clampScore(parsed.business_relevance),
    aura_service_relevance: clampScore(parsed.aura_service_relevance),
    reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 400) : "Scored by Workers AI",
  };
}

async function saveScores(env: Env, story: StoryRow, scores: AiScores) {
  const sourceTrust = clampScore(story.sources?.trust_score ?? 70);
  const priority = Math.round(
    scores.importance * 0.30 +
    scores.fiji_relevance * 0.20 +
    scores.business_relevance * 0.25 +
    scores.aura_service_relevance * 0.15 +
    sourceTrust * 0.10
  );

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/stories?id=eq.${encodeURIComponent(story.id)}`, {
    method: "PATCH",
    headers: supabaseHeaders(env, "return=minimal"),
    body: JSON.stringify({
      importance_score: scores.importance,
      fiji_relevance_score: scores.fiji_relevance,
      business_relevance_score: scores.business_relevance,
      aura_service_relevance_score: scores.aura_service_relevance,
      status: "scored",
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase score update failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }

  return { priority, reason: scores.reason };
}

async function writeJobLog(env: Env, result: Record<string, unknown>, errorMessage?: string) {
  const now = new Date().toISOString();
  await fetch(`${env.SUPABASE_URL}/rest/v1/jobs`, {
    method: "POST",
    headers: supabaseHeaders(env, "return=minimal"),
    body: JSON.stringify({
      job_type: "cloudflare_intelligence_cycle",
      status: errorMessage ? "failed" : "completed",
      priority: 90,
      attempts: 1,
      payload: { scheduler: "cloudflare", ai: "workers-ai" },
      result,
      error_message: errorMessage ?? null,
      started_at: now,
      finished_at: now,
    }),
  });
}

async function runCycle(env: Env) {
  const startedAt = new Date().toISOString();
  const discovery = await runDiscovery(env);
  const stories = await getUnscoredStories(env);

  const scored: Array<Record<string, unknown>> = [];
  const failed: Array<Record<string, unknown>> = [];

  for (const story of stories) {
    try {
      const scores = await scoreStory(env, story);
      const saved = await saveScores(env, story, scores);
      scored.push({ storyId: story.id, title: story.title, ...scores, ...saved });
    } catch (error) {
      failed.push({
        storyId: story.id,
        title: story.title,
        error: error instanceof Error ? error.message : "Unknown scoring error",
      });
    }
  }

  const result = {
    ok: failed.length === 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    discovery,
    selectedForScoring: stories.length,
    scoredCount: scored.length,
    failedCount: failed.length,
    scored,
    failed,
  };

  await writeJobLog(env, result, failed.length ? `${failed.length} story scoring failure(s)` : undefined);
  return result;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "aura-intelligence-automation" });
    }

    if (url.pathname === "/run" && request.method === "POST") {
      const supplied = request.headers.get("authorization");
      if (!env.CRON_SECRET || supplied !== `Bearer ${env.CRON_SECRET}`) {
        return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }

      try {
        return Response.json(await runCycle(env));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Automation cycle failed";
        await writeJobLog(env, { ok: false }, message);
        return Response.json({ ok: false, error: message }, { status: 500 });
      }
    }

    return Response.json({
      ok: true,
      service: "Aura Digital Intelligence automation",
      endpoints: ["GET /health", "POST /run"],
    });
  },

  async scheduled(_controller: unknown, env: Env, ctx: { waitUntil: (promise: Promise<unknown>) => void }): Promise<void> {
    ctx.waitUntil(
      runCycle(env).catch(async (error) => {
        const message = error instanceof Error ? error.message : "Scheduled cycle failed";
        await writeJobLog(env, { ok: false }, message);
      })
    );
  },
};
