interface Env {
  AI: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };
  VERCEL_SCOUT_URL: string;
  CRON_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  MAX_STORIES_PER_RUN?: string;
  MAX_RESEARCH_PER_RUN?: string;
  AI_MODEL?: string;
}

type SourceInfo = { name?: string; trust_score?: number } | null;
type StoryRow = {
  id: string;
  source_url: string;
  title: string;
  description: string | null;
  category: string | null;
  published_at: string | null;
  discovered_at: string;
  importance_score?: number | null;
  fiji_relevance_score?: number | null;
  business_relevance_score?: number | null;
  aura_service_relevance_score?: number | null;
  priority_score?: number | null;
  decision?: string | null;
  sources: SourceInfo;
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
const DEFAULT_RESEARCH_BATCH = 2;

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

async function sb(env: Env, path: string, init: RequestInit = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...supabaseHeaders(env), ...(init.headers ?? {}) },
  });
}

async function runDiscovery(env: Env) {
  const response = await fetch(env.VERCEL_SCOUT_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Vercel RSS Scout failed (${response.status}): ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return { ok: true, response: text.slice(0, 300) }; }
}

async function getSettings(env: Env) {
  const response = await sb(env, "settings?select=key,value&key=in.(watch_priority_threshold,research_priority_threshold,max_research_per_run)");
  if (!response.ok) return { watch: 50, research: 72, maxResearch: DEFAULT_RESEARCH_BATCH };
  const rows = await response.json() as Array<{ key: string; value: unknown }>;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    watch: Number(map.watch_priority_threshold ?? 50),
    research: Number(map.research_priority_threshold ?? 72),
    maxResearch: Math.max(1, Math.min(4, Number(env.MAX_RESEARCH_PER_RUN ?? map.max_research_per_run ?? DEFAULT_RESEARCH_BATCH))),
  };
}

async function getUnscoredStories(env: Env): Promise<StoryRow[]> {
  const limit = Math.max(1, Math.min(12, Number(env.MAX_STORIES_PER_RUN ?? DEFAULT_BATCH) || DEFAULT_BATCH));
  const query = new URLSearchParams({
    select: "id,source_url,title,description,category,published_at,discovered_at,sources(name,trust_score)",
    status: "eq.discovered",
    order: "discovered_at.asc",
    limit: String(limit),
  });
  const response = await sb(env, `stories?${query}`);
  if (!response.ok) throw new Error(`Supabase story fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  return await response.json() as StoryRow[];
}

function extractJson(raw: unknown): Record<string, unknown> {
  const text = typeof raw === "string" ? raw : raw && typeof raw === "object" && "response" in raw
    ? String((raw as { response?: unknown }).response ?? "") : JSON.stringify(raw ?? "");
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const object = fenced.match(/\{[\s\S]*\}/)?.[0];
  if (!object) throw new Error("AI response did not contain JSON");
  return JSON.parse(object) as Record<string, unknown>;
}

async function scoreStory(env: Env, story: StoryRow): Promise<AiScores> {
  const sourceTrust = clampScore(story.sources?.trust_score ?? 70);
  const prompt = `You are the story triage engine for Aura Digital Intelligence, a technology intelligence publication serving Fiji and Pacific businesses.\n\nScore from 0 to 100: importance, fiji_relevance, business_relevance, aura_service_relevance. Do not force a Fiji angle. Source trust: ${sourceTrust}/100.\n\nReturn ONLY JSON: {"importance":0,"fiji_relevance":0,"business_relevance":0,"aura_service_relevance":0,"reason":"one short sentence"}\n\nTitle: ${story.title}\nCategory: ${story.category ?? "Unknown"}\nDescription: ${(story.description ?? "No description").slice(0, 1800)}`;
  const response = await env.AI.run(env.AI_MODEL || DEFAULT_MODEL, { prompt, max_tokens: 220, temperature: 0.1 });
  const parsed = extractJson(response);
  return {
    importance: clampScore(parsed.importance),
    fiji_relevance: clampScore(parsed.fiji_relevance),
    business_relevance: clampScore(parsed.business_relevance),
    aura_service_relevance: clampScore(parsed.aura_service_relevance),
    reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 400) : "Scored by Workers AI",
  };
}

function calculatePriority(story: StoryRow, scores: AiScores) {
  const sourceTrust = clampScore(story.sources?.trust_score ?? 70);
  return Math.round(scores.importance * 0.30 + scores.fiji_relevance * 0.20 + scores.business_relevance * 0.25 + scores.aura_service_relevance * 0.15 + sourceTrust * 0.10);
}

function decide(priority: number, scores: AiScores, thresholds: { watch: number; research: number }) {
  let decision: "ignore" | "watch" | "research" = "ignore";
  if (priority >= thresholds.research && (scores.importance >= 55 || scores.business_relevance >= 65 || scores.aura_service_relevance >= 65)) decision = "research";
  else if (priority >= thresholds.watch) decision = "watch";

  const strongest = [
    ["importance", scores.importance], ["Fiji/Pacific relevance", scores.fiji_relevance],
    ["business relevance", scores.business_relevance], ["Aura relevance", scores.aura_service_relevance],
  ].sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  return { decision, reason: `${decision.toUpperCase()} at priority ${priority}; strongest signal is ${strongest[0]} (${strongest[1]}).` };
}

async function saveScoringDecision(env: Env, story: StoryRow, scores: AiScores, thresholds: { watch: number; research: number }) {
  const priority = calculatePriority(story, scores);
  const choice = decide(priority, scores, thresholds);
  const status = choice.decision === "ignore" ? "rejected" : choice.decision === "research" ? "researching" : "scored";
  const response = await sb(env, `stories?id=eq.${encodeURIComponent(story.id)}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      importance_score: scores.importance,
      fiji_relevance_score: scores.fiji_relevance,
      business_relevance_score: scores.business_relevance,
      aura_service_relevance_score: scores.aura_service_relevance,
      priority_score: priority,
      decision: choice.decision,
      decision_reason: `${choice.reason} ${scores.reason}`.slice(0, 700),
      decided_at: new Date().toISOString(),
      status,
    }),
  });
  if (!response.ok) throw new Error(`Supabase decision update failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  if (choice.decision === "research") await enqueueResearch(env, story.id, priority);
  return { priority, decision: choice.decision, reason: choice.reason };
}

async function enqueueResearch(env: Env, storyId: string, priority: number) {
  const existing = await sb(env, `jobs?select=id&job_type=eq.research_story&story_id=eq.${encodeURIComponent(storyId)}&status=in.(queued,processing,completed)&limit=1`);
  if (existing.ok && (await existing.json() as unknown[]).length) return;
  await sb(env, "jobs", {
    method: "POST", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ job_type: "research_story", status: "queued", priority, story_id: storyId, payload: { reason: "automatic decision engine" } }),
  });
}

function decodeHtml(text: string) {
  return text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function pageToText(html: string) {
  return decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ").trim().slice(0, 14000);
}

async function fetchSourceText(url: string) {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "AuraDigitalIntelligence/1.0 (+research; respectful-fetch)" }, redirect: "follow" });
    if (!response.ok) return "";
    return pageToText(await response.text());
  } catch { return ""; }
}

async function getQueuedResearchJobs(env: Env, limit: number) {
  const query = new URLSearchParams({
    select: "id,story_id,priority,stories(id,source_url,title,description,category,published_at,sources(name,trust_score))",
    job_type: "eq.research_story", status: "eq.queued", order: "priority.desc,created_at.asc", limit: String(limit),
  });
  const response = await sb(env, `jobs?${query}`);
  if (!response.ok) throw new Error(`Research queue fetch failed (${response.status})`);
  return await response.json() as Array<{ id: string; story_id: string; priority: number; stories: StoryRow }>;
}

async function updateJob(env: Env, id: string, patch: Record<string, unknown>) {
  await sb(env, `jobs?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
}

async function researchStory(env: Env, job: { id: string; story_id: string; stories: StoryRow }) {
  const story = job.stories;
  await updateJob(env, job.id, { status: "processing", attempts: 1, started_at: new Date().toISOString() });
  const pageText = await fetchSourceText(story.source_url);
  const evidence = pageText || `${story.title}\n${story.description ?? ""}`;
  const prompt = `You are a cautious research assistant for Aura Digital Intelligence. Build a preliminary research package from the supplied source text. This is NOT final fact-checking and must not invent corroboration. Distinguish source claims from verified facts.\n\nReturn ONLY JSON with: summary (string), key_facts (array of 3-7 concise strings), why_it_matters (string), fiji_pacific_angle (string), business_implications (array), aura_opportunity (string), risks_uncertainties (array), claims_to_verify (array), confidence (0-100), recommended_angle (string).\n\nStory: ${story.title}\nURL: ${story.source_url}\nCategory: ${story.category ?? "Unknown"}\nSource text:\n${evidence.slice(0, 12000)}`;
  try {
    const raw = await env.AI.run(env.AI_MODEL || DEFAULT_MODEL, { prompt, max_tokens: 900, temperature: 0.1 });
    const pkg = extractJson(raw);
    const confidence = clampScore(pkg.confidence);
    const existing = await sb(env, `research?select=id&story_id=eq.${encodeURIComponent(story.id)}&source_type=eq.ai-research-package&limit=1`);
    const rows = existing.ok ? await existing.json() as Array<{ id: string }> : [];
    const payload = {
      story_id: story.id,
      source_url: story.source_url,
      source_name: story.sources?.name ?? "Original source",
      source_type: "ai-research-package",
      key_facts: pkg,
      source_date: story.published_at,
      credibility: confidence,
      notes: typeof pkg.summary === "string" ? pkg.summary.slice(0, 1500) : "Preliminary AI research package",
    };
    if (rows.length) {
      await sb(env, `research?id=eq.${rows[0].id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
    } else {
      await sb(env, "research", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
    }
    await updateJob(env, job.id, { status: "completed", result: pkg, finished_at: new Date().toISOString() });
    return { storyId: story.id, title: story.title, confidence, sourceFetched: Boolean(pageText) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    await updateJob(env, job.id, { status: "failed", error_message: message, finished_at: new Date().toISOString() });
    throw error;
  }
}

async function writeCycleLog(env: Env, result: Record<string, unknown>, errorMessage?: string) {
  const now = new Date().toISOString();
  await sb(env, "jobs", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({
    job_type: "cloudflare_intelligence_cycle", status: errorMessage ? "failed" : "completed", priority: 90,
    attempts: 1, payload: { scheduler: "cloudflare", ai: "workers-ai", stage: "decision-and-research" }, result,
    error_message: errorMessage ?? null, started_at: now, finished_at: now,
  }) });
}

async function runCycle(env: Env) {
  const startedAt = new Date().toISOString();
  const thresholds = await getSettings(env);
  const discovery = await runDiscovery(env);
  const stories = await getUnscoredStories(env);
  const decisions: Array<Record<string, unknown>> = [];
  const failures: Array<Record<string, unknown>> = [];

  for (const story of stories) {
    try {
      const scores = await scoreStory(env, story);
      const decision = await saveScoringDecision(env, story, scores, thresholds);
      decisions.push({ storyId: story.id, title: story.title, ...scores, ...decision });
    } catch (error) {
      failures.push({ storyId: story.id, title: story.title, error: error instanceof Error ? error.message : "Unknown scoring error" });
    }
  }

  const jobs = await getQueuedResearchJobs(env, thresholds.maxResearch);
  const researched: Array<Record<string, unknown>> = [];
  for (const job of jobs) {
    try { researched.push(await researchStory(env, job)); }
    catch (error) { failures.push({ storyId: job.story_id, stage: "research", error: error instanceof Error ? error.message : "Research failed" }); }
  }

  const result = {
    ok: failures.length === 0, startedAt, finishedAt: new Date().toISOString(), discovery,
    scoredCount: decisions.length, decisions, researchProcessed: researched.length, researched,
    failedCount: failures.length, failures, thresholds,
  };
  await writeCycleLog(env, result, failures.length ? `${failures.length} automation failure(s)` : undefined);
  return result;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ ok: true, service: "aura-intelligence-automation", stage: "decision-and-research" });
    if (url.pathname === "/run" && request.method === "POST") {
      if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      try { return Response.json(await runCycle(env)); }
      catch (error) {
        const message = error instanceof Error ? error.message : "Automation cycle failed";
        await writeCycleLog(env, { ok: false }, message);
        return Response.json({ ok: false, error: message }, { status: 500 });
      }
    }
    return Response.json({ ok: true, service: "Aura Digital Intelligence automation", endpoints: ["GET /health", "POST /run"] });
  },
  async scheduled(_controller: unknown, env: Env, ctx: { waitUntil: (promise: Promise<unknown>) => void }) {
    ctx.waitUntil(runCycle(env).catch(async (error) => {
      const message = error instanceof Error ? error.message : "Scheduled cycle failed";
      await writeCycleLog(env, { ok: false }, message);
    }));
  },
};
