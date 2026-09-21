// @ts-nocheck

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
const DEFAULT_BATCH = 12;
const DEFAULT_RESEARCH_BATCH = 0;
const DEFAULT_FACT_CHECK_BATCH = 1;
const DEFAULT_ARTICLE_BATCH = 1;
const DEFAULT_HOLD_RETRY_BATCH = 1;
const FIJI_TIMEZONE = "Pacific/Fiji";

class AIUnavailableError extends Error {
  constructor(message, providerErrors = []) {
    super(message);
    this.name = "AIUnavailableError";
    this.providerErrors = providerErrors;
  }
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function headers(env, prefer) {
  return {
    apikey: env.SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function sb(env, path, init = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...headers(env),
      ...(init.headers || {}),
    },
  });
}

async function runDiscovery(env) {
  const r = await fetch(env.VERCEL_SCOUT_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
    },
  });

  const text = await r.text();

  if (!r.ok) {
    throw new Error(
      `Vercel RSS Scout failed (${r.status}): ${text.slice(0, 300)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: true,
      response: text.slice(0, 300),
    };
  }
}

async function getSettings(env) {
  const r = await sb(
    env,
    "settings?select=key,value&key=in.(watch_priority_threshold,research_priority_threshold,max_fact_checks_per_run,fact_check_min_sources,fact_check_approve_confidence,max_articles_per_run,article_writer_enabled,article_min_fact_confidence,fact_check_hold_retry_enabled,fact_check_hold_retry_max,fact_check_hold_retry_minutes,final_quality_gate_enabled,final_quality_gate_batch_size,minimum_quality_score,minimum_source_count,publishing_mode,max_publish_per_run,originality_guard_enabled,originality_shingle_size,originality_max_overlap_ratio,originality_max_phrase_words,originality_max_rewrites,daily_article_target,max_ai_candidates_per_day,candidate_min_priority,ai_router_enabled,cloudflare_ai_fallback_enabled)"
  );

  if (!r.ok) {
    return {
      watch: 50,
      research: 72,
      maxResearch: 0,
      maxFactChecks: DEFAULT_FACT_CHECK_BATCH,
      factCheckMinSources: 2,
      factCheckApproveConfidence: 75,
      maxArticles: DEFAULT_ARTICLE_BATCH,
      articleWriterEnabled: true,
      articleMinFactConfidence: 75,
      holdRetryEnabled: false,
      holdRetryMax: 0,
      holdRetryMinutes: 360,
      finalQualityGateEnabled: true,
      finalQualityBatchSize: 4,
      minimumQualityScore: 90,
      minimumSourceCount: 2,
      publishingMode: "automatic",
      maxPublishPerRun: 2,
      dailyArticleTarget: 2,
      maxAiCandidatesPerDay: 5,
      candidateMinPriority: 68,
      aiRouterEnabled: true,
      cloudflareAiFallbackEnabled: false,
      originalityGuardEnabled: true,
      originalityShingleSize: 8,
      originalityMaxOverlapRatio: 0.08,
      originalityMaxPhraseWords: 18,
      originalityMaxRewrites: 2,
    };
  }

  const rows = await r.json();

  const map = Object.fromEntries(
    rows.map((x) => [x.key, x.value])
  );

  return {
    watch: Number(
      map.watch_priority_threshold ?? 50
    ),

    research: Number(
      map.research_priority_threshold ?? 72
    ),

    maxResearch: 0,

    maxFactChecks: Math.max(
      1,
      Math.min(
        2,
        Number(
          env.MAX_FACT_CHECKS_PER_RUN ??
            map.max_fact_checks_per_run ??
            DEFAULT_FACT_CHECK_BATCH
        ) || DEFAULT_FACT_CHECK_BATCH
      )
    ),

    factCheckMinSources: Math.max(
      1,
      Math.min(
        4,
        Number(map.fact_check_min_sources ?? 2) || 2
      )
    ),

    factCheckApproveConfidence: Math.max(
      50,
      Math.min(
        95,
        Number(map.fact_check_approve_confidence ?? 75) || 75
      )
    ),
    maxArticles: Math.max(
      1,
      Math.min(
        2,
        Number(env.MAX_ARTICLES_PER_RUN ?? map.max_articles_per_run ?? DEFAULT_ARTICLE_BATCH) || DEFAULT_ARTICLE_BATCH
      )
    ),
    articleWriterEnabled: map.article_writer_enabled !== false,
    articleMinFactConfidence: Math.max(
      60,
      Math.min(95, Number(map.article_min_fact_confidence ?? 75) || 75)
    ),
    holdRetryEnabled: map.fact_check_hold_retry_enabled === true,
    holdRetryMax: Math.max(0, Math.min(6, Number(map.fact_check_hold_retry_max ?? 0) || 0)),
    holdRetryMinutes: Math.max(60, Math.min(2880, Number(map.fact_check_hold_retry_minutes ?? 360) || 360)),
    finalQualityGateEnabled: map.final_quality_gate_enabled !== false,
    finalQualityBatchSize: Math.max(1, Math.min(8, Number(map.final_quality_gate_batch_size ?? 4) || 4)),
    minimumQualityScore: Math.max(70, Math.min(100, Number(map.minimum_quality_score ?? 90) || 90)),
    minimumSourceCount: Math.max(2, Math.min(5, Number(map.minimum_source_count ?? 2) || 2)),
    publishingMode: String(map.publishing_mode ?? "automatic").replace(/^"|"$/g, "") === "automatic" ? "automatic" : "manual",
    maxPublishPerRun: Math.max(1, Math.min(4, Number(map.max_publish_per_run ?? 1) || 1)),
    dailyArticleTarget: Math.max(1, Math.min(3, Number(map.daily_article_target ?? 2) || 2)),
    maxAiCandidatesPerDay: Math.max(2, Math.min(8, Number(map.max_ai_candidates_per_day ?? 5) || 5)),
    candidateMinPriority: Math.max(50, Math.min(95, Number(map.candidate_min_priority ?? 68) || 68)),
    aiRouterEnabled: map.ai_router_enabled !== false,
    cloudflareAiFallbackEnabled: map.cloudflare_ai_fallback_enabled === true,
    originalityGuardEnabled: map.originality_guard_enabled !== false,
    originalityShingleSize: Math.max(6, Math.min(12, Number(map.originality_shingle_size ?? 8) || 8)),
    originalityMaxOverlapRatio: Math.max(0.02, Math.min(0.25, Number(map.originality_max_overlap_ratio ?? 0.08) || 0.08)),
    originalityMaxPhraseWords: Math.max(14, Math.min(40, Number(map.originality_max_phrase_words ?? 18) || 18)),
    originalityMaxRewrites: Math.max(0, Math.min(3, Number(map.originality_max_rewrites ?? 2) || 2)),
  };
}

async function getUnscoredStories(env) {
  const limit = Math.max(
    1,
    Math.min(
      12,
      Number(
        env.MAX_STORIES_PER_RUN ??
          DEFAULT_BATCH
      ) || DEFAULT_BATCH
    )
  );

  const q = new URLSearchParams({
    select:
      "id,source_url,title,description,category,published_at,discovered_at,sources(name,trust_score,country,category,source_type)",

    status: "eq.discovered",

    order: "discovered_at.asc",

    limit: String(limit),
  });

  const r = await sb(
    env,
    `stories?${q}`
  );

  if (!r.ok) {
    throw new Error(
      `Supabase story fetch failed (${r.status}): ${(await r.text()).slice(
        0,
        300
      )}`
    );
  }

  return r.json();
}

function parseStructured(raw) {
  if (!raw) {
    throw new Error(
      "AI returned an empty response"
    );
  }

  if (
    raw.response &&
    typeof raw.response === "object"
  ) {
    return raw.response;
  }

  const candidates = [];

  if (
    typeof raw.response === "string"
  ) {
    candidates.push(raw.response);
  }

  if (
    Array.isArray(raw.choices) &&
    raw.choices[0]
  ) {
    const c = raw.choices[0];

    if (
      typeof c?.message?.content ===
      "string"
    ) {
      candidates.push(
        c.message.content
      );
    }

    if (
      typeof c?.text === "string"
    ) {
      candidates.push(c.text);
    }
  }

  if (
    raw.response &&
    Array.isArray(
      raw.response.choices
    ) &&
    raw.response.choices[0]
  ) {
    const c =
      raw.response.choices[0];

    if (
      typeof c?.message?.content ===
      "string"
    ) {
      candidates.push(
        c.message.content
      );
    }

    if (
      typeof c?.text === "string"
    ) {
      candidates.push(c.text);
    }
  }

  if (typeof raw === "string") {
    candidates.push(raw);
  }

  for (let text of candidates) {
    text = text
      .trim()
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /```$/i,
        ""
      )
      .trim();

    try {
      return JSON.parse(text);
    } catch {}

    const start =
      text.indexOf("{");

    const end =
      text.lastIndexOf("}");

    if (
      start !== -1 &&
      end > start
    ) {
      try {
        return JSON.parse(
          text.slice(
            start,
            end + 1
          )
        );
      } catch {}
    }
  }

  throw new Error(
    `AI structured response could not be parsed: ${JSON.stringify(
      raw
    ).slice(0, 500)}`
  );
}


function safeJsonParse(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {}
  const start = cleaned.indexOf("{");
  const finish = cleaned.lastIndexOf("}");
  if (start !== -1 && finish > start) {
    return JSON.parse(cleaned.slice(start, finish + 1));
  }
  throw new Error("Provider response did not contain valid JSON");
}

function providerErrorMessage(provider, status, text) {
  return `${provider} ${status}: ${String(text || "").replace(/\s+/g, " ").slice(0, 350)}`;
}

async function callGeminiJson(env, systemPrompt, userPrompt, schema, maxTokens, temperature) {
  if (!env.GEMINI_API_KEY) throw new Error("Gemini API key not configured");
  const model = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          ...(schema ? { responseSchema: schema } : {}),
          maxOutputTokens: maxTokens,
          temperature,
        },
      }),
    }
  );
  const text = await response.text();
  if (!response.ok) throw new Error(providerErrorMessage("gemini", response.status, text));
  const payload = JSON.parse(text);
  const output = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join("")
    .trim();
  if (!output) throw new Error("gemini returned no text");
  return { data: safeJsonParse(output), provider: "gemini", model };
}

async function callGroqJson(env, systemPrompt, userPrompt, schema, maxTokens, temperature) {
  if (!env.GROQ_API_KEY) throw new Error("Groq API key not configured");
  const model = env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: schema
        ? {
            type: "json_schema",
            json_schema: {
              name: "aura_newsroom_response",
              strict: true,
              schema,
            },
          }
        : { type: "json_object" },
      reasoning_effort: "low",
      max_completion_tokens: maxTokens,
      temperature,
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(providerErrorMessage("groq", response.status, text));
  const payload = JSON.parse(text);
  const output = payload?.choices?.[0]?.message?.content;
  if (!output) throw new Error("groq returned no text");
  return { data: safeJsonParse(output), provider: "groq", model };
}

async function callCloudflareJson(env, systemPrompt, userPrompt, schema, maxTokens, temperature) {
  if (!env.AI) throw new Error("Cloudflare AI binding not configured");
  const model = env.AI_MODEL || DEFAULT_MODEL;
  const raw = await env.AI.run(model, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: schema
      ? { type: "json_schema", json_schema: schema }
      : { type: "json_object" },
    max_tokens: maxTokens,
    temperature,
  });
  return { data: parseStructured(raw), provider: "cloudflare", model };
}

async function aiJson(env, settings, role, systemPrompt, userPrompt, schema, options = {}) {
  const maxTokens = Math.max(200, Math.min(4000, Number(options.maxTokens || 1200)));
  const temperature = Math.max(0, Math.min(0.8, Number(options.temperature ?? 0.1)));
  const providerErrors = [];
  const order = role === "writer"
    ? ["gemini", "groq", "cloudflare"]
    : ["groq", "gemini", "cloudflare"];

  for (const provider of order) {
    if (provider === "gemini" && !env.GEMINI_API_KEY) continue;
    if (provider === "groq" && !env.GROQ_API_KEY) continue;
    if (provider === "cloudflare" && !settings.cloudflareAiFallbackEnabled) continue;

    try {
      if (provider === "gemini") {
        return await callGeminiJson(env, systemPrompt, userPrompt, schema, maxTokens, temperature);
      }
      if (provider === "groq") {
        return await callGroqJson(env, systemPrompt, userPrompt, schema, maxTokens, temperature);
      }
      return await callCloudflareJson(env, systemPrompt, userPrompt, schema, maxTokens, temperature);
    } catch (error) {
      providerErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const configured = [env.GEMINI_API_KEY ? "Gemini" : null, env.GROQ_API_KEY ? "Groq" : null, settings.cloudflareAiFallbackEnabled ? "Cloudflare" : null]
    .filter(Boolean)
    .join(", ");
  throw new AIUnavailableError(
    configured
      ? `All configured free AI providers are temporarily unavailable: ${providerErrors.join(" | ").slice(0, 900)}`
      : "No free AI provider is configured. Add GEMINI_API_KEY and/or GROQ_API_KEY.",
    providerErrors
  );
}

function isAIUnavailable(error) {
  return error instanceof AIUnavailableError || /quota|rate limit|resource_exhausted|too many requests|daily free allocation|429|4006|temporarily unavailable|no free ai provider/i.test(
    error instanceof Error ? error.message : String(error)
  );
}

function futureIso(minutes) {
  return new Date(Date.now() + Math.max(5, Number(minutes || 60)) * 60 * 1000).toISOString();
}

async function deferAIJob(env, job, error, minutes = 60) {
  const message = error instanceof Error ? error.message : String(error);
  await updateJob(env, job.id, {
    status: "queued",
    attempts: Math.max(0, Number(job.attempts || 0)),
    started_at: null,
    finished_at: null,
    error_message: `Deferred automatically: ${message}`.slice(0, 1800),
    deferred_reason: "free-ai-provider-unavailable",
    next_attempt_at: futureIso(minutes),
  });
  return {
    storyId: job.story_id,
    title: job.stories?.title || "",
    deferred: true,
    retryAfterMinutes: minutes,
    reason: message.slice(0, 500),
  };
}

function providerStatus(env, settings) {
  return {
    geminiConfigured: Boolean(env.GEMINI_API_KEY),
    groqConfigured: Boolean(env.GROQ_API_KEY),
    pexelsConfigured: Boolean(env.PEXELS_API_KEY),
    cloudflareFallbackEnabled: Boolean(settings.cloudflareAiFallbackEnabled),
    routineScoringUsesAI: false,
  };
}

function fijiDayBounds(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FIJI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const start = new Date(`${values.year}-${values.month}-${values.day}T00:00:00+12:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString(), key: `${values.year}-${values.month}-${values.day}` };
}

const SCORE_SCHEMA = {
  type: "object",

  properties: {
    importance: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },

    fiji_relevance: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },

    business_relevance: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },

    aura_service_relevance: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },

    reason: {
      type: "string",
    },
  },

  required: [
    "importance",
    "fiji_relevance",
    "business_relevance",
    "aura_service_relevance",
    "reason",
  ],
};

const RESEARCH_SCHEMA = {
  type: "object",

  properties: {
    summary: {
      type: "string",
    },

    key_facts: {
      type: "array",
      items: {
        type: "string",
      },
    },

    why_it_matters: {
      type: "string",
    },

    fiji_pacific_angle: {
      type: "string",
    },

    business_implications: {
      type: "array",
      items: {
        type: "string",
      },
    },

    aura_opportunity: {
      type: "string",
    },

    risks_uncertainties: {
      type: "array",
      items: {
        type: "string",
      },
    },

    claims_to_verify: {
      type: "array",
      items: {
        type: "string",
      },
    },

    confidence: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },

    recommended_angle: {
      type: "string",
    },
  },

  required: [
    "summary",
    "key_facts",
    "why_it_matters",
    "fiji_pacific_angle",
    "business_implications",
    "aura_opportunity",
    "risks_uncertainties",
    "claims_to_verify",
    "confidence",
    "recommended_angle",
  ],
};


const ARTICLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    excerpt: { type: "string" },
    content: { type: "string" },
    category: { type: "string" },
    seo_title: { type: "string" },
    seo_description: { type: "string" },
    keywords: { type: "string" },
  },
  required: [
    "title",
    "subtitle",
    "excerpt",
    "content",
    "category",
    "seo_title",
    "seo_description",
    "keywords",
  ],
};


const FACT_CHECK_STATUS_VALUES = ["supported", "partial", "conflicted", "unverified"];

function claimResultSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      status: {
        type: "string",
        enum: FACT_CHECK_STATUS_VALUES,
      },
      explanation: {
        type: "string",
      },
      source_indexes: {
        type: "array",
        items: { type: "integer", minimum: 1 },
      },
    },
    required: ["status", "explanation", "source_indexes"],
  };
}

function buildFactCheckSchema(claimCount) {
  const verificationProperties = {};
  const verificationRequired = [];

  for (let i = 0; i < claimCount; i += 1) {
    const key = `claim_${i + 1}`;
    verificationProperties[key] = claimResultSchema();
    verificationRequired.push(key);
  }

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: {
        type: "string",
      },
      verification: {
        type: "object",
        additionalProperties: false,
        properties: verificationProperties,
        required: verificationRequired,
      },
      conflicts: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["summary", "verification", "conflicts"],
  };
}

function buildSingleClaimSchema() {
  return claimResultSchema();
}

function keywordHits(text, groups) {
  let score = 0;
  const matched = [];
  for (const [term, weight] of groups) {
    if (text.includes(term)) {
      score += weight;
      matched.push(term);
    }
  }
  return { score, matched };
}

async function scoreStory(_env, story) {
  const title = String(story.title || "");
  const description = String(story.description || "");
  const category = String(story.category || story.sources?.category || "");
  const sourceCountry = String(story.sources?.country || "");
  const sourceType = String(story.sources?.source_type || "");
  const text = `${title} ${description} ${category}`.toLowerCase();
  const trust = clampScore(story.sources?.trust_score ?? 70);

  const published = story.published_at ? new Date(story.published_at).getTime() : new Date(story.discovered_at || Date.now()).getTime();
  const ageHours = Math.max(0, (Date.now() - published) / 3600000);
  const freshness = ageHours <= 6 ? 100 : ageHours <= 24 ? 85 : ageHours <= 48 ? 65 : ageHours <= 96 ? 40 : 20;

  const impact = keywordHits(text, [
    ["critical vulnerability", 30], ["zero-day", 28], ["data breach", 28], ["ransomware", 26],
    ["cyberattack", 24], ["security", 12], ["artificial intelligence", 15], [" ai ", 10],
    ["launch", 10], ["released", 8], ["regulation", 18], ["policy", 12], ["outage", 18],
    ["acquisition", 14], ["payment", 12], ["ecommerce", 14], ["cloud", 12], ["privacy", 14],
    ["google", 7], ["microsoft", 7], ["apple", 5], ["meta", 5], ["openai", 8], ["cloudflare", 8]
  ]);

  let importance = 25 + Math.min(45, impact.score) + Math.round((trust - 50) * 0.25) + Math.round(freshness * 0.15);
  if (["government", "company"].includes(sourceType.toLowerCase())) importance += 5;

  const local = keywordHits(text, [
    ["fiji", 45], ["fijian", 45], ["suva", 25], ["nadi", 20], ["lautoka", 20],
    ["m-paisa", 30], ["mpaisa", 30], ["mycash", 25], ["reserve bank of fiji", 30],
    ["fiji cert", 35], ["pacific islands", 25], ["south pacific", 20], ["pacific", 12],
    ["samoa", 12], ["vanuatu", 12], ["tonga", 12], ["papua new guinea", 12]
  ]);
  let fiji = 8 + Math.min(75, local.score);
  if (/fiji/i.test(sourceCountry)) fiji = Math.max(fiji, 78);
  else if (/pacific/i.test(sourceCountry)) fiji = Math.max(fiji, 58);

  const business = keywordHits(text, [
    ["business", 20], ["businesses", 20], ["company", 12], ["companies", 12], ["enterprise", 15],
    ["small business", 25], ["sme", 25], ["retail", 14], ["tourism", 15], ["hotel", 12], ["resort", 12],
    ["payment", 16], ["ecommerce", 20], ["commerce", 12], ["productivity", 12], ["workplace", 10],
    ["cybersecurity", 18], ["security", 12], ["cloud", 12], ["website", 14], ["email", 12], ["marketing", 10],
    ["digital transformation", 22], ["customer", 8], ["data", 8]
  ]);
  let businessRelevance = 22 + Math.min(68, business.score);
  if (/business|technology|cybersecurity|cloud|ecommerce/i.test(category)) businessRelevance += 8;

  const aura = keywordHits(text, [
    ["website", 20], ["wordpress", 24], ["web development", 24], ["ecommerce", 25], ["online store", 20],
    ["cybersecurity", 24], ["security", 14], ["phishing", 18], ["ransomware", 20], ["vulnerability", 18],
    ["business email", 24], ["email", 12], ["hosting", 20], ["cloud", 16], ["dns", 16], ["domain", 12],
    ["mobile app", 24], ["app", 8], ["seo", 24], ["search", 8], ["digital marketing", 22],
    ["automation", 18], ["artificial intelligence", 16], [" ai ", 10], ["payment", 14], ["m-paisa", 24], ["mpaisa", 24]
  ]);
  let auraRelevance = 15 + Math.min(78, aura.score);

  const consumerNoise = /gaming|game console|celebrity|streaming show|movie|smartphone review|phone review|headphones|camera review/i.test(text);
  if (consumerNoise && fiji < 45) {
    importance -= 12;
    businessRelevance -= 20;
    auraRelevance -= 20;
  }

  importance = clampScore(importance);
  fiji = clampScore(fiji);
  businessRelevance = clampScore(businessRelevance);
  auraRelevance = clampScore(auraRelevance);

  const reasons = [];
  if (fiji >= 60) reasons.push("strong Fiji/Pacific relevance");
  if (businessRelevance >= 70) reasons.push("high business usefulness");
  if (auraRelevance >= 70) reasons.push("strong Aura service fit");
  if (importance >= 75) reasons.push("high-impact technology signal");
  if (!reasons.length) reasons.push("limited commercial/local signal");

  return {
    importance,
    fiji_relevance: fiji,
    business_relevance: businessRelevance,
    aura_service_relevance: auraRelevance,
    reason: `Free deterministic scoring: ${reasons.join(", ")}. Age ${Math.round(ageHours)}h; source trust ${trust}.`,
  };
}

function priority(
  story,
  s
) {
  const trust =
    clampScore(
      story.sources
        ?.trust_score ?? 70
    );

  return Math.round(
    s.importance * 0.30 +
      s.fiji_relevance * 0.20 +
      s.business_relevance *
        0.25 +
      s.aura_service_relevance *
        0.15 +
      trust * 0.10
  );
}

function decide(
  p,
  s,
  thresholds
) {
  if (
    p >=
      thresholds.research &&
    (
      s.importance >= 55 ||
      s.business_relevance >=
        65 ||
      s.aura_service_relevance >=
        65
    )
  ) {
    return "research";
  }

  if (
    p >= thresholds.watch
  ) {
    return "watch";
  }

  return "ignore";
}

async function enqueueResearch(
  env,
  storyId,
  p
) {
  const check =
    await sb(
      env,

      `jobs?select=id&job_type=eq.research_story&story_id=eq.${encodeURIComponent(
        storyId
      )}&status=in.(queued,processing,completed)&limit=1`
    );

  if (
    check.ok &&
    (await check.json()).length
  ) {
    return;
  }

  const r =
    await sb(
      env,
      "jobs",

      {
        method: "POST",

        headers: {
          Prefer:
            "return=minimal",
        },

        body:
          JSON.stringify({
            job_type:
              "research_story",

            status: "queued",

            priority: p,

            story_id:
              storyId,

            payload: {
              reason:
                "automatic decision engine",
            },
          }),
      }
    );

  if (!r.ok) {
    throw new Error(
      `Research queue insert failed (${r.status}): ${(await r.text()).slice(
        0,
        300
      )}`
    );
  }
}

async function saveDecision(
  env,
  story,
  scores,
  thresholds
) {
  const p =
    priority(
      story,
      scores
    );

  const d =
    decide(
      p,
      scores,
      thresholds
    );

  const status = d === "ignore" ? "rejected" : "scored";

  const r =
    await sb(
      env,

      `stories?id=eq.${encodeURIComponent(
        story.id
      )}`,

      {
        method: "PATCH",

        headers: {
          Prefer:
            "return=minimal",
        },

        body:
          JSON.stringify({
            importance_score:
              scores.importance,

            fiji_relevance_score:
              scores.fiji_relevance,

            business_relevance_score:
              scores.business_relevance,

            aura_service_relevance_score:
              scores.aura_service_relevance,

            priority_score: p,

            decision: d,

            decision_reason:
              `${d.toUpperCase()} at priority ${p}. ${scores.reason}`.slice(
                0,
                700
              ),

            decided_at:
              new Date().toISOString(),

            status,
          }),
      }
    );

  if (!r.ok) {
    throw new Error(
      `Supabase decision update failed (${r.status}): ${(await r.text()).slice(
        0,
        300
      )}`
    );
  }

  return {
    priority: p,
    decision: d,
  };
}

function htmlToText(html) {
  return html
    .replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      " "
    )

    .replace(
      /<style\b[^>]*>[\s\S]*?<\/style>/gi,
      " "
    )

    .replace(
      /<nav\b[^>]*>[\s\S]*?<\/nav>/gi,
      " "
    )

    .replace(
      /<footer\b[^>]*>[\s\S]*?<\/footer>/gi,
      " "
    )

    .replace(
      /<[^>]+>/g,
      " "
    )

    .replace(
      /&nbsp;/gi,
      " "
    )

    .replace(
      /&amp;/gi,
      "&"
    )

    .replace(
      /&quot;/gi,
      '"'
    )

    .replace(
      /&#39;|&apos;/gi,
      "'"
    )

    .replace(
      /&lt;/gi,
      "<"
    )

    .replace(
      /&gt;/gi,
      ">"
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim()

    .slice(
      0,
      9000
    );
}

async function fetchSourceText(
  url
) {
  try {
    const r =
      await fetch(
        url,

        {
          headers: {
            "User-Agent":
              "AuraDigitalIntelligence/1.0 (+research; respectful-fetch)",
          },

          redirect:
            "follow",
        }
      );

    if (!r.ok) {
      return "";
    }

    return htmlToText(
      await r.text()
    );
  } catch {
    return "";
  }
}

async function getQueuedResearchJobs(
  env,
  limit
) {
  const q =
    new URLSearchParams({
      select:
        "id,story_id,priority,attempts,max_attempts,stories(id,source_url,title,description,category,published_at,sources(name,trust_score))",

      job_type:
        "eq.research_story",

      status: "eq.queued",

      order:
        "priority.desc,created_at.asc",

      limit:
        String(limit),
    });

  const r =
    await sb(
      env,
      `jobs?${q}`
    );

  if (!r.ok) {
    throw new Error(
      `Research queue fetch failed (${r.status}): ${(await r.text()).slice(
        0,
        300
      )}`
    );
  }

  return r.json();
}

async function updateJob(
  env,
  id,
  patch
) {
  const r =
    await sb(
      env,

      `jobs?id=eq.${encodeURIComponent(
        id
      )}`,

      {
        method: "PATCH",

        headers: {
          Prefer:
            "return=minimal",
        },

        body:
          JSON.stringify(
            patch
          ),
      }
    );

  if (!r.ok) {
    throw new Error(
      `Job update failed (${r.status}): ${(await r.text()).slice(
        0,
        300
      )}`
    );
  }
}


const SEO_SLUG_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have", "how", "in", "into", "is", "it", "its", "new", "of", "on", "or", "our", "s", "the", "their", "this", "to", "what", "when", "where", "which", "who", "why", "with", "your",
]);

function slugify(value) {
  const words = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const useful = words.filter((word) => !SEO_SLUG_STOP_WORDS.has(word));
  const chosen = (useful.length >= 5 ? useful : words).slice(0, 10);
  return chosen.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || `story-${Date.now()}`;
}

async function buildUniqueArticleSlug(env, title, storyId) {
  const base = slugify(title);
  try {
    const response = await sb(env, `articles?select=id,story_id&slug=eq.${encodeURIComponent(base)}&limit=1`);
    if (response.ok) {
      const rows = await response.json();
      if (!rows.length || rows[0]?.story_id === storyId) return base;
    }
  } catch {}
  return `${base}-${String(storyId || "story").slice(0, 6)}`;
}

function inferArticleCategory(story, generated) {
  const text = `${story?.title || ""} ${story?.description || ""} ${story?.category || ""} ${generated?.title || ""} ${generated?.category || ""}`.toLowerCase();
  if (/cyber|security|privacy|ransomware|phishing|hack|malware|breach|threat intelligence|supply-chain hacking|credential|vulnerab/.test(text)) return "Cybersecurity";
  if (/\bai\b|artificial intelligence|machine learning|gemini|openai|anthropic|llm|model/.test(text)) return "Artificial Intelligence";
  if (/cloud|hosting|infrastructure|data center|dns|server|network/.test(text)) return "Cloud";
  if (/ecommerce|commerce|payment|retail|shopify|checkout|m-paisa|mpaisa/.test(text)) return "Ecommerce";
  if (/fiji|pacific|samoa|tonga|vanuatu|papua new guinea|solomon islands/.test(text)) return "Fiji + Pacific";
  if (/business|enterprise|productivity|workplace|digital transformation/.test(text)) return "Business";
  return "Technology";
}

function asStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function objOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeSimilarityText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[`*_>#~|{}\[\]()]/g, " ")
    .replace(/[^a-zA-Z0-9'\s-]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function hashPhrase(value) {
  // FNV-1a 32-bit. We store only hashes, never copied publisher prose.
  let hash = 0x811c9dc5;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function shingleSequence(value, size = 8, maxShingles = 1800) {
  const normalized = normalizeSimilarityText(value);
  const words = normalized ? normalized.split(" ").filter(Boolean) : [];
  const hashes = [];
  if (words.length < size) return { words, hashes };
  for (let i = 0; i <= words.length - size && hashes.length < maxShingles; i += 1) {
    hashes.push(hashPhrase(words.slice(i, i + size).join(" ")));
  }
  return { words, hashes };
}

function buildSourceFingerprints(evidence, shingleSize = 8) {
  return (Array.isArray(evidence) ? evidence : [])
    .filter((source) => source && typeof source === "object" && source.excerpt)
    .slice(0, 5)
    .map((source) => {
      const sequence = shingleSequence(String(source.excerpt || "").slice(0, 16000), shingleSize, 1600);
      return {
        domain: String(source.domain || source.source_name || "source").slice(0, 180),
        url: String(source.url || "").slice(0, 1500),
        shingle_size: shingleSize,
        hashes: [...new Set(sequence.hashes)].slice(0, 1600),
      };
    })
    .filter((row) => row.hashes.length > 0);
}

function evaluateOriginality(content, sourceFingerprints, settings) {
  const sourceRows = Array.isArray(sourceFingerprints) ? sourceFingerprints : [];
  const shingleSize = settings.originalityShingleSize || 8;
  const articleBody = String(content || "").replace(/\n##\s+Sources[\s\S]*$/i, "").trim();
  const article = shingleSequence(articleBody, shingleSize, 2400);
  const sourceSets = sourceRows
    .filter((row) => Array.isArray(row?.hashes) && row.hashes.length)
    .map((row) => ({
      domain: String(row.domain || "source"),
      url: String(row.url || ""),
      hashes: new Set(row.hashes.map((x) => String(x))),
    }));

  if (!settings.originalityGuardEnabled) {
    return {
      passed: true,
      evaluable: false,
      score: 100,
      overlapRatio: 0,
      matchedShingles: 0,
      totalShingles: article.hashes.length,
      longestMatchedWords: 0,
      perSource: [],
      reason: "Originality guard disabled by setting",
    };
  }

  if (!article.hashes.length || !sourceSets.length) {
    return {
      passed: false,
      evaluable: false,
      score: 0,
      overlapRatio: 0,
      matchedShingles: 0,
      totalShingles: article.hashes.length,
      longestMatchedWords: 0,
      perSource: [],
      reason: !sourceSets.length
        ? "No source fingerprints available; fail-closed"
        : "Article is too short for similarity evaluation",
    };
  }

  const matchedFlags = article.hashes.map((hash) => sourceSets.some((row) => row.hashes.has(hash)));
  const matchedShingles = matchedFlags.filter(Boolean).length;
  const overlapRatio = matchedShingles / article.hashes.length;
  let longestRun = 0;
  let currentRun = 0;
  for (const matched of matchedFlags) {
    if (matched) {
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);
    } else {
      currentRun = 0;
    }
  }
  const longestMatchedWords = longestRun > 0 ? longestRun + shingleSize - 1 : 0;

  const perSource = sourceSets.map((row) => {
    const hits = article.hashes.filter((hash) => row.hashes.has(hash)).length;
    return {
      domain: row.domain,
      matched_shingles: hits,
      overlap_ratio: Math.round((hits / article.hashes.length) * 10000) / 10000,
    };
  });

  const ratioFailed = overlapRatio > settings.originalityMaxOverlapRatio && matchedShingles >= 8;
  const phraseFailed = longestMatchedWords >= settings.originalityMaxPhraseWords;
  const passed = !ratioFailed && !phraseFailed;
  const penalty = Math.min(100, overlapRatio * 550 + Math.max(0, longestMatchedWords - shingleSize) * 2.5);
  const score = Math.max(0, Math.round(100 - penalty));

  return {
    passed,
    evaluable: true,
    score,
    overlapRatio: Math.round(overlapRatio * 10000) / 10000,
    matchedShingles,
    totalShingles: article.hashes.length,
    longestMatchedWords,
    perSource,
    reason: passed
      ? "No excessive exact phrase overlap detected"
      : phraseFailed
        ? `Exact phrase overlap reached about ${longestMatchedWords} consecutive words`
        : `Exact ${shingleSize}-word phrase overlap ratio ${(overlapRatio * 100).toFixed(1)}% exceeded threshold`,
  };
}

async function rewriteArticleForOriginality(env, settings, generated, story, safeFacts, constraints, attempt) {
  const prompt = `
Rewrite the draft below into genuinely original editorial prose for Aura Digital Intelligence.

NON-NEGOTIABLE RULES:
- Preserve ONLY the verified SAFE FACTS listed below.
- Change sentence structure, paragraph structure, transitions and wording substantially.
- Do not imitate, paraphrase closely, quote, or reproduce publisher wording.
- Do not add new facts, dates, numbers, names, technical details, causes or impacts.
- Keep factual claims conservative; analysis must be clearly framed as analysis.
- Do not add a Sources section.
- This is originality rewrite attempt ${attempt}.

ORIGINAL STORY TITLE:
${story.title}

SAFE FACTS:
${safeFacts.map((fact, index) => `${index + 1}. ${fact}`).join("\n")}

WRITING CONSTRAINTS:
${constraints.length ? constraints.map((item) => `- ${item}`).join("\n") : "- None beyond safe-fact rules."}

DRAFT TO REWRITE:
TITLE: ${generated.title || ""}
SUBTITLE: ${generated.subtitle || ""}
EXCERPT: ${generated.excerpt || ""}
CONTENT:\n${String(generated.content || "").slice(0, 12000)}

Return the complete rewritten article package.
`;

  const result = await aiJson(
    env,
    settings,
    "writer",
    "You are an originality editor. Produce independent wording from verified facts only. Never copy or closely paraphrase source prose. Return one JSON object matching the requested article fields.",
    prompt,
    ARTICLE_SCHEMA,
    { maxTokens: 2200, temperature: 0.45 }
  );

  return { ...result.data, _provider: result.provider, _model: result.model };
}

async function enqueueArticleJob(env, storyId, priority = 70) {
  const existing = await sb(
    env,
    `jobs?select=id&job_type=eq.write_article&story_id=eq.${encodeURIComponent(storyId)}&status=in.(queued,processing,completed)&limit=1`
  );

  if (existing.ok && (await existing.json()).length) return false;

  const articleExisting = await sb(
    env,
    `articles?select=id&story_id=eq.${encodeURIComponent(storyId)}&limit=1`
  );
  if (articleExisting.ok && (await articleExisting.json()).length) return false;

  const response = await sb(env, "jobs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      job_type: "write_article",
      status: "queued",
      priority: Math.max(1, Math.min(100, Math.round(Number(priority) || 70))),
      story_id: storyId,
      payload: { reason: "fact check approved" },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Article queue insert failed (${response.status}): ${(await response.text()).slice(0, 300)}`
    );
  }
  return true;
}

async function getQueuedArticleJobs(env, limit) {
  const query = new URLSearchParams({
    select:
      "id,story_id,priority,attempts,max_attempts,next_attempt_at,stories(id,source_url,title,description,category,published_at,priority_score,verification_status,verification_confidence)",
    job_type: "eq.write_article",
    status: "eq.queued",
    or: `(next_attempt_at.is.null,next_attempt_at.lte.${new Date().toISOString()})`,
    order: "priority.desc,created_at.asc",
    limit: String(limit),
  });

  const response = await sb(env, `jobs?${query.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Article queue fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`
    );
  }
  return response.json();
}

async function getApprovedFactCheck(env, storyId) {
  const response = await sb(
    env,
    `fact_checks?select=id,verdict,confidence,independent_source_count,summary,claim_checks,evidence_sources,source_phrase_fingerprints,conflicts,missing_evidence,safe_facts,writing_constraints&story_id=eq.${encodeURIComponent(storyId)}&limit=1`
  );
  if (!response.ok) {
    throw new Error(
      `Approved fact-check fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`
    );
  }
  const rows = await response.json();
  return rows[0] || null;
}

async function getDefaultAuthorId(env) {
  const response = await sb(
    env,
    "authors?select=id&slug=eq.aura-digital-intelligence&limit=1"
  );
  if (!response.ok) return null;
  const rows = await response.json();
  return rows[0]?.id || null;
}

function articleQualityScore(article, factCheck) {
  const safeFacts = asStringArray(factCheck?.safe_facts);
  const sourceCount = Number(factCheck?.independent_source_count || 0);
  const confidence = Number(factCheck?.confidence || 0);
  const content = String(article.content || "");
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const hasFijiSection = /##\s+(What this means for Fiji|Fiji business|Fiji and the Pacific)/i.test(content);
  const hasActionSection = /##\s+(What businesses should do|What you should do|Practical steps)/i.test(content);
  let score = 0;

  if (factCheck?.verdict === "approve") score += 25;
  score += Math.min(20, Math.round(confidence * 0.2));
  if (sourceCount >= 2) score += 10;
  if (safeFacts.length >= 2) score += 10;
  else if (safeFacts.length === 1) score += 5;
  if (String(article.title || "").length >= 25 && String(article.title || "").length <= 85) score += 5;
  if (String(article.seo_title || "").length > 0 && String(article.seo_title || "").length <= 65) score += 5;
  const seoLen = String(article.seo_description || "").length;
  if (seoLen >= 110 && seoLen <= 170) score += 5;
  if (words >= 400 && words <= 950) score += 10;
  if (hasFijiSection) score += 5;
  if (hasActionSection) score += 5;

  return { score: Math.min(100, score), wordCount: words, hasFijiSection, hasActionSection };
}

function appendDeterministicSources(content, evidenceSources) {
  const sources = Array.isArray(evidenceSources) ? evidenceSources : [];
  const lines = sources
    .filter((source) => source && typeof source === "object" && source.url)
    .slice(0, 5)
    .map((source, index) => {
      const name = String(source.source_name || source.domain || `Source ${index + 1}`).replace(/\s+/g, " ").trim();
      const title = String(source.title || "Independent coverage").replace(/\s+/g, " ").trim();
      return `${index + 1}. [${name} — ${title}](${source.url})`;
    });

  if (!lines.length) return String(content || "").trim();
  const base = String(content || "").replace(/\n##\s+Sources[\s\S]*$/i, "").trim();
  return `${base}\n\n## Sources\n${lines.join("\n")}`;
}

function pexelsSearchQuery(story, generated) {
  const category = String(generated?.category || story?.category || "technology").toLowerCase();
  if (/cyber|security|privacy/.test(category)) return "cybersecurity business technology";
  if (/artificial intelligence|\bai\b/.test(category)) return "artificial intelligence business technology";
  if (/cloud|hosting|infrastructure/.test(category)) return "cloud computing data center business";
  if (/ecommerce|commerce|retail|payment/.test(category)) return "ecommerce online business technology";
  if (/mobile|app/.test(category)) return "mobile app technology business";
  if (/marketing|seo/.test(category)) return "digital marketing business technology";
  return "business technology digital transformation";
}

async function fetchPexelsImage(env, story, generated) {
  if (!env.PEXELS_API_KEY) return null;
  try {
    const query = pexelsSearchQuery(story, generated);
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("size", "large");
    url.searchParams.set("per_page", "8");
    const response = await fetch(url.toString(), {
      headers: { Authorization: env.PEXELS_API_KEY },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const photos = Array.isArray(payload?.photos) ? payload.photos : [];
    if (!photos.length) return null;
    const seed = String(story?.id || "").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const photo = photos[seed % photos.length];
    const imageUrl = photo?.src?.large2x || photo?.src?.large || photo?.src?.landscape;
    if (!imageUrl) return null;
    return {
      url: imageUrl,
      credit: `Photo by ${photo.photographer || "Pexels contributor"} on Pexels`,
      sourceUrl: photo.url || "https://www.pexels.com",
      alt: `${generated?.category || story?.category || "Technology"} illustration for ${generated?.title || story?.title || "Aura Digital Intelligence"}`.slice(0, 240),
    };
  } catch {
    return null;
  }
}

async function writeArticle(env, job, settings) {
  const story = job.stories;
  await updateJob(env, job.id, {
    status: "processing",
    attempts: Number(job.attempts || 0) + 1,
    started_at: new Date().toISOString(),
    error_message: null,
    deferred_reason: null,
  });

  try {
    const factCheck = await getApprovedFactCheck(env, story.id);
    if (!factCheck) throw new Error("No fact check found for article writer");
    if (factCheck.verdict !== "approve") {
      throw new Error(`Article writer blocked: fact-check verdict is ${factCheck.verdict}`);
    }
    if (Number(factCheck.confidence || 0) < settings.articleMinFactConfidence) {
      throw new Error(`Article writer blocked: confidence ${factCheck.confidence} is below ${settings.articleMinFactConfidence}`);
    }
    const conflicts = asStringArray(factCheck.conflicts);
    if (conflicts.length) throw new Error("Article writer blocked: unresolved fact-check conflicts exist");

    const safeFacts = asStringArray(factCheck.safe_facts);
    if (!safeFacts.length) throw new Error("Article writer blocked: no verified safe facts available");
    const constraints = asStringArray(factCheck.writing_constraints);
    const evidenceSources = Array.isArray(factCheck.evidence_sources) ? factCheck.evidence_sources : [];
    const sourceList = evidenceSources
      .slice(0, 5)
      .map((source, index) => `SOURCE ${index + 1}: ${source.source_name || source.domain || "Publisher"} — ${source.title || "Coverage"}`)
      .join("\n");

    const prompt = `
Write a high-value, original Aura Digital Intelligence article for business readers in Fiji and the Pacific.

EDITORIAL PURPOSE:
This is not a generic rewrite. Turn a verified global technology development into useful, practical intelligence for Fiji businesses. The reader should understand what happened, why it matters, and what action is sensible.

FACT RULES — FAIL CLOSED:
- SAFE FACTS are the complete fact bank for the news event. Every event-specific factual sentence must be directly supported by one or more SAFE FACTS.
- SOURCE LABELS are names only. Never use them as permission to introduce an extra fact.
- Never invent or infer dates, numbers, names, attack methods, targets, causes, quotes, outcomes, law-enforcement activity or technical details unless they appear in SAFE FACTS.
- If the SAFE FACTS are narrow, keep the factual reporting narrow. Do not fill gaps.
- Fiji implications may add analysis and recommendations, but clearly frame them as analysis: “For Fiji businesses, this means…”, “This suggests…”, or “A practical response is…”.
- Never invent Fiji statistics, adoption rates, local incidents or customer impact.
- Recommendations may be general professional guidance, not claims about what happened in the event.
- Do not copy, imitate or closely paraphrase publisher wording.
- Do not discuss the production process or automation inside the article body.
- Do not include a Sources section; verified citations are appended by application code.

REQUIRED STRUCTURE:
A concise lead based only on SAFE FACTS. Do not add a heading called “Opening”.
## What happened
## Why it matters
## What this means for Fiji businesses
## What businesses should do now

In the Fiji section, be genuinely useful even when direct local impact is limited: explain which kinds of Fiji organisations should pay attention and why, without pretending the event happened locally.
Use numbered or bulleted recommendations when that improves readability.
Aim for 500–800 words, but never pad weak evidence. Prefer a shorter accurate article over invented detail.
Tone: authoritative, plain English, business-focused, no hype, no clickbait.
Headline: factual, specific, preferably 55–82 characters, and naturally communicate the Fiji/business angle when relevant.
CATEGORY must be one of: Cybersecurity, Artificial Intelligence, Cloud, Business, Ecommerce, Fiji + Pacific, Technology. Security incidents, hacking, breaches, phishing, malware and threat intelligence belong in Cybersecurity.

ORIGINAL STORY TITLE:\n${story.title}
CATEGORY:\n${story.category || "Technology"}

VERIFIED SAFE FACTS:\n${safeFacts.map((fact, index) => `${index + 1}. ${fact}`).join("\n")}

WRITING CONSTRAINTS:\n${constraints.length ? constraints.map((item) => `- ${item}`).join("\n") : "- None beyond the safe-fact rule."}

INDEPENDENT SOURCE LABELS (context only, not permission to add facts):\n${sourceList || "No source labels supplied"}

Return one JSON object with a headline, subtitle, excerpt, Markdown body, category, SEO title, SEO description, and comma-separated keywords. The headline should be compelling but factual and preferably communicate the Fiji/business angle when natural.
`;

    const generatedResult = await aiJson(
      env,
      settings,
      "writer",
      "You are the senior editor of Aura Digital Intelligence, a verification-first technology publication for Fiji businesses. Produce original, evidence-bounded journalism with practical local analysis. Return exactly the requested JSON structure.",
      prompt,
      ARTICLE_SCHEMA,
      { maxTokens: 2600, temperature: 0.25 }
    );

    let generated = { ...generatedResult.data, _provider: generatedResult.provider, _model: generatedResult.model };
    const sourceFingerprints = Array.isArray(factCheck.source_phrase_fingerprints)
      ? factCheck.source_phrase_fingerprints
      : [];
    let originality = evaluateOriginality(generated.content, sourceFingerprints, settings);
    let originalityRewriteCount = 0;

    while (
      settings.originalityGuardEnabled &&
      !originality.passed &&
      originality.evaluable &&
      originalityRewriteCount < settings.originalityMaxRewrites
    ) {
      originalityRewriteCount += 1;
      generated = await rewriteArticleForOriginality(
        env,
        settings,
        generated,
        story,
        safeFacts,
        constraints,
        originalityRewriteCount
      );
      originality = evaluateOriginality(generated.content, sourceFingerprints, settings);
    }

    const title = String(generated.title || story.title).replace(/\s+/g, " ").trim().slice(0, 120);
    const slug = await buildUniqueArticleSlug(env, title, story.id);
    const content = appendDeterministicSources(generated.content, evidenceSources);
    const normalizedArticle = {
      title,
      subtitle: String(generated.subtitle || "").trim().slice(0, 260),
      excerpt: String(generated.excerpt || "").trim().slice(0, 500),
      content,
      category: inferArticleCategory(story, generated),
      seo_title: String(generated.seo_title || title).replace(/\s+/g, " ").trim().slice(0, 70),
      seo_description: String(generated.seo_description || generated.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 180),
      keywords: String(generated.keywords || "").replace(/\s+/g, " ").trim().slice(0, 500),
    };

    const quality = articleQualityScore(normalizedArticle, factCheck);
    const authorId = await getDefaultAuthorId(env);
    const image = await fetchPexelsImage(env, story, normalizedArticle);
    const status = quality.score >= 85 && originality.passed ? "review" : "draft";
    const now = new Date().toISOString();
    const generationProvider = generated._provider || generatedResult.provider;
    const generationModel = generated._model || generatedResult.model;
    const articlePayload = {
      story_id: story.id,
      author_id: authorId,
      slug,
      title: normalizedArticle.title,
      subtitle: normalizedArticle.subtitle || null,
      excerpt: normalizedArticle.excerpt || null,
      content: normalizedArticle.content,
      category: normalizedArticle.category,
      seo_title: normalizedArticle.seo_title || normalizedArticle.title,
      seo_description: normalizedArticle.seo_description || normalizedArticle.excerpt || null,
      featured_image_url: image?.url || null,
      featured_image_credit: image?.credit || null,
      featured_image_source_url: image?.sourceUrl || null,
      featured_image_alt: image?.alt || null,
      status,
      quality_score: quality.score,
      originality_score: originality.score,
      originality_passed: originality.passed,
      originality_checked_at: now,
      originality_rewrite_count: originalityRewriteCount,
      originality_notes: {
        engine: "hashed-source-shingles-v1",
        evaluable: originality.evaluable,
        overlap_ratio: originality.overlapRatio,
        matched_shingles: originality.matchedShingles,
        total_shingles: originality.totalShingles,
        longest_matched_words: originality.longestMatchedWords,
        source_results: originality.perSource,
        reason: originality.reason,
        max_overlap_ratio: settings.originalityMaxOverlapRatio,
        max_phrase_words: settings.originalityMaxPhraseWords,
      },
      quality_notes: {
        fact_check_confidence: Number(factCheck.confidence || 0),
        independent_source_count: Number(factCheck.independent_source_count || 0),
        safe_fact_count: safeFacts.length,
        word_count: quality.wordCount,
        fiji_section: quality.hasFijiSection,
        action_section: quality.hasActionSection,
        writer: "free-acquisition-engine-v2",
        provider: generationProvider,
        model: generationModel,
        originality_passed: originality.passed,
        originality_score: originality.score,
        originality_rewrite_count: originalityRewriteCount,
      },
      seo_keywords: normalizedArticle.keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12),
      fact_check_id: factCheck.id,
      generation_model: `${generationProvider}:${generationModel}`,
      generated_at: now,
      updated_at: now,
    };

    const save = await sb(env, "articles?on_conflict=story_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(articlePayload),
    });
    if (!save.ok) {
      throw new Error(`Article save failed (${save.status}): ${(await save.text()).slice(0, 400)}`);
    }
    const savedRows = await save.json();
    const article = savedRows[0];

    if (article?.id && evidenceSources.length) {
      await sb(env, `article_sources?article_id=eq.${encodeURIComponent(article.id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
      const sourceRows = evidenceSources
        .filter((source) => source?.url)
        .slice(0, 8)
        .map((source) => ({
          article_id: article.id,
          source_url: source.url,
          source_name: String(source.source_name || source.domain || "Independent source").slice(0, 180),
          source_type: "fact-check-evidence",
          citation_text: String(source.title || "Independent coverage").slice(0, 300),
        }));
      if (sourceRows.length) {
        const sourcesSave = await sb(env, "article_sources", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(sourceRows),
        });
        if (!sourcesSave.ok) {
          throw new Error(`Article source save failed (${sourcesSave.status}): ${(await sourcesSave.text()).slice(0, 300)}`);
        }
      }
    }

    await sb(env, `stories?id=eq.${encodeURIComponent(story.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "draft" }),
    });

    await updateJob(env, job.id, {
      status: "completed",
      article_id: article?.id || null,
      result: {
        articleId: article?.id || null,
        slug,
        status,
        qualityScore: quality.score,
        wordCount: quality.wordCount,
        safeFactCount: safeFacts.length,
        sourceCount: Number(factCheck.independent_source_count || 0),
        originalityPassed: originality.passed,
        originalityScore: originality.score,
        originalityRewriteCount,
        provider: generationProvider,
        model: generationModel,
        imageProvider: image ? "pexels" : "branded-fallback",
      },
      error_message: null,
      finished_at: now,
      next_attempt_at: null,
      deferred_reason: null,
    });

    return {
      storyId: story.id,
      articleId: article?.id || null,
      title: normalizedArticle.title,
      slug,
      status,
      qualityScore: quality.score,
      wordCount: quality.wordCount,
      safeFactCount: safeFacts.length,
      independentSourceCount: Number(factCheck.independent_source_count || 0),
      originalityPassed: originality.passed,
      originalityScore: originality.score,
      provider: generationProvider,
      model: generationModel,
      featuredImage: Boolean(image),
    };
  } catch (error) {
    if (isAIUnavailable(error)) {
      return deferAIJob(env, job, error, 60);
    }
    const message = error instanceof Error ? error.message : String(error);
    try {
      await updateJob(env, job.id, {
        status: "failed",
        error_message: message,
        finished_at: new Date().toISOString(),
      });
    } catch {}
    throw error;
  }
}

async function getFinalQualityCandidates(env, limit) {
  const query = new URLSearchParams({
    select: "id,story_id,fact_check_id,slug,title,excerpt,content,seo_title,seo_description,status,quality_score,quality_notes,originality_score,originality_passed,originality_notes,originality_rewrite_count,final_quality_checked_at",
    status: "in.(draft,review)",
    final_quality_checked_at: "is.null",
    order: "created_at.asc",
    limit: String(limit),
  });
  const response = await sb(env, `articles?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Final quality queue fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
  return response.json();
}

async function getFactCheckForQualityGate(env, article) {
  const filter = article.fact_check_id
    ? `id=eq.${encodeURIComponent(article.fact_check_id)}`
    : `story_id=eq.${encodeURIComponent(article.story_id)}`;
  const response = await sb(
    env,
    `fact_checks?select=id,verdict,confidence,independent_source_count,safe_facts,conflicts,missing_evidence&${filter}&limit=1`
  );
  if (!response.ok) {
    throw new Error(`Final quality fact-check fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
  const rows = await response.json();
  return rows[0] || null;
}

async function getArticleSourceCount(env, articleId) {
  const response = await sb(
    env,
    `article_sources?select=id&article_id=eq.${encodeURIComponent(articleId)}`
  );
  if (!response.ok) return 0;
  return (await response.json()).length;
}

function deterministicFinalQuality(article, factCheck, sourceCount, settings) {
  const failures = [];
  const safeFacts = asStringArray(factCheck?.safe_facts);
  const conflicts = asStringArray(factCheck?.conflicts);
  const confidence = Number(factCheck?.confidence || 0);
  const writerScore = Number(article?.quality_score || 0);
  const content = String(article?.content || "").trim();
  const words = content.split(/\s+/).filter(Boolean).length;
  const title = String(article?.title || "").trim();
  const seoTitle = String(article?.seo_title || "").trim();
  const seoDescription = String(article?.seo_description || "").trim();
  const hasSourceSection = /##\s+Sources/i.test(content);
  const suspiciousPlaceholder = /\b(TODO|TBD|undefined|null)\b/i.test(content);
  const hasFijiSection = /##\s+(What this means for Fiji|Fiji business|Fiji and the Pacific)/i.test(content);
  const hasActionSection = /##\s+(What businesses should do|What you should do|Practical steps)/i.test(content);
  const originalityPassed = article?.originality_passed === true;
  const originalityScore = Number(article?.originality_score || 0);

  if (factCheck?.verdict !== "approve") failures.push("Fact-check verdict is not APPROVE");
  if (confidence < settings.articleMinFactConfidence) failures.push(`Fact-check confidence ${confidence} is below ${settings.articleMinFactConfidence}`);
  if (sourceCount < settings.minimumSourceCount) failures.push(`Only ${sourceCount} article sources; minimum is ${settings.minimumSourceCount}`);
  if (safeFacts.length < 1) failures.push("No verified safe facts are available");
  if (conflicts.length > 0) failures.push("Unresolved fact-check conflicts remain");
  if (writerScore < 85) failures.push(`Writer quality score ${writerScore} is below 85`);
  if (words < 250) failures.push(`Article is too short (${words} words)`);
  if (words > 1400) failures.push(`Article is too long (${words} words)`);
  if (title.length < 20 || title.length > 100) failures.push("Headline length is outside the safe range");
  if (!seoTitle || seoTitle.length > 70) failures.push("SEO title is missing or too long");
  if (seoDescription.length < 90 || seoDescription.length > 180) failures.push("SEO description length is outside the safe range");
  if (!hasSourceSection) failures.push("Verified Sources section is missing");
  if (suspiciousPlaceholder) failures.push("Placeholder text was detected");
  if (!hasFijiSection) failures.push("Fiji business analysis section is missing");
  if (!hasActionSection) failures.push("Practical business action section is missing");
  if (settings.originalityGuardEnabled && !originalityPassed) failures.push("Copyright/originality guard has not passed");

  let score = 0;
  if (factCheck?.verdict === "approve") score += 20;
  score += Math.min(20, Math.max(0, confidence * 0.2));
  if (sourceCount >= settings.minimumSourceCount) score += 15;
  score += Math.min(15, Math.max(0, writerScore * 0.15));
  if (safeFacts.length >= 1) score += 10;
  if (words >= 250 && words <= 1400) score += 10;
  if (seoTitle && seoTitle.length <= 70 && seoDescription.length >= 90 && seoDescription.length <= 180) score += 5;
  if (hasSourceSection) score += 3;
  if (hasFijiSection) score += 1;
  if (hasActionSection) score += 1;
  score = Math.min(100, Math.round(score * 100) / 100);

  const passed = failures.length === 0 && score >= settings.minimumQualityScore;
  return {
    passed,
    score,
    notes: {
      engine: "deterministic-publication-gate-v1",
      failures,
      fact_check_confidence: confidence,
      writer_quality_score: writerScore,
      source_count: sourceCount,
      safe_fact_count: safeFacts.length,
      word_count: words,
      minimum_quality_score: settings.minimumQualityScore,
      originality_passed: originalityPassed,
      originality_score: originalityScore,
      originality_engine: objOrEmpty(article?.originality_notes).engine || null,
      fiji_section: hasFijiSection,
      action_section: hasActionSection,
      checked_at: new Date().toISOString(),
    },
  };
}

async function runFinalQualityGate(env, settings) {
  if (!settings.finalQualityGateEnabled) return [];
  const articles = await getFinalQualityCandidates(env, settings.finalQualityBatchSize);
  const results = [];

  for (const article of articles) {
    try {
      const [factCheck, sourceCount] = await Promise.all([
        getFactCheckForQualityGate(env, article),
        getArticleSourceCount(env, article.id),
      ]);
      if (!factCheck) throw new Error("No fact check found for final quality gate");

      const quality = deterministicFinalQuality(article, factCheck, sourceCount, settings);
      const now = new Date().toISOString();
      const response = await sb(env, `articles?id=eq.${encodeURIComponent(article.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          final_quality_score: quality.score,
          final_quality_passed: quality.passed,
          final_quality_notes: quality.notes,
          final_quality_checked_at: now,
          status: quality.passed ? "approved" : "review",
          updated_at: now,
        }),
      });
      if (!response.ok) {
        throw new Error(`Final quality save failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
      }

      await sb(env, "audit_logs", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          action: quality.passed ? "article.quality_passed" : "article.quality_failed",
          entity: "article",
          entity_id: article.id,
          metadata: quality.notes,
        }),
      });

      results.push({ articleId: article.id, storyId: article.story_id, passed: quality.passed, score: quality.score, failures: quality.notes.failures });
    } catch (error) {
      results.push({ articleId: article.id, storyId: article.story_id, passed: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return results;
}

async function getPublishableArticles(env, settings) {
  const now = new Date().toISOString();
  const dueScheduled = await sb(
    env,
    `articles?select=id,story_id,slug,title,scheduled_for,first_published_at&status=eq.approved&final_quality_passed=eq.true&originality_passed=eq.true&scheduled_for=not.is.null&scheduled_for=lte.${encodeURIComponent(now)}&order=scheduled_for.asc&limit=${settings.maxPublishPerRun}`
  );
  const scheduled = dueScheduled.ok ? await dueScheduled.json() : [];
  if (scheduled.length >= settings.maxPublishPerRun || settings.publishingMode !== "automatic") return scheduled.slice(0, settings.maxPublishPerRun);

  const remaining = settings.maxPublishPerRun - scheduled.length;
  const automatic = await sb(
    env,
    `articles?select=id,story_id,slug,title,scheduled_for,first_published_at&status=eq.approved&final_quality_passed=eq.true&originality_passed=eq.true&scheduled_for=is.null&order=final_quality_checked_at.asc&limit=${remaining}`
  );
  const autoRows = automatic.ok ? await automatic.json() : [];
  return [...scheduled, ...autoRows].slice(0, settings.maxPublishPerRun);
}

async function publishEligibleArticles(env, settings) {
  const { start, end } = fijiDayBounds();
  const alreadyPublishedResponse = await sb(
    env,
    `articles?select=id&status=eq.published&published_at=gte.${encodeURIComponent(start)}&published_at=lt.${encodeURIComponent(end)}&limit=20`
  );
  const alreadyPublished = alreadyPublishedResponse.ok ? (await alreadyPublishedResponse.json()).length : 0;
  const remainingDaily = Math.max(0, settings.dailyArticleTarget - alreadyPublished);
  if (remainingDaily <= 0) return [];

  const effectiveSettings = {
    ...settings,
    maxPublishPerRun: Math.min(settings.maxPublishPerRun, remainingDaily),
  };
  const articles = await getPublishableArticles(env, effectiveSettings);
  const published = [];

  for (const article of articles.slice(0, remainingDaily)) {
    const now = new Date().toISOString();
    const reason = article.scheduled_for ? "scheduled publication" : "automatic publication after verification, originality and quality gates";
    const response = await sb(env, `articles?id=eq.${encodeURIComponent(article.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "published",
        published_at: now,
        first_published_at: article.first_published_at || now,
        scheduled_for: null,
        unpublished_at: null,
        publication_reason: reason,
        updated_at: now,
      }),
    });
    if (!response.ok) {
      throw new Error(`Article publish failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
    }

    if (article.story_id) {
      await sb(env, `stories?id=eq.${encodeURIComponent(article.story_id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "published" }),
      });
    }

    await sb(env, "audit_logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        action: article.scheduled_for ? "article.scheduled_published" : "article.auto_published",
        entity: "article",
        entity_id: article.id,
        metadata: { reason, slug: article.slug, fiji_daily_target: settings.dailyArticleTarget },
      }),
    });

    published.push({ articleId: article.id, storyId: article.story_id, slug: article.slug, title: article.title, reason });
  }

  return published;
}

function holdRetryDelayMinutes(retryCount, baseMinutes) {
  return Math.min(2880, Math.max(60, baseMinutes) * Math.pow(2, Math.max(0, retryCount)));
}

async function scheduleHoldRetry(env, storyId, settings) {
  if (!settings.holdRetryEnabled || settings.holdRetryMax <= 0) return;
  const response = await sb(
    env,
    `fact_checks?select=id,retry_count&story_id=eq.${encodeURIComponent(storyId)}&limit=1`
  );
  if (!response.ok) return;
  const rows = await response.json();
  const row = rows[0];
  if (!row) return;
  const retryCount = Number(row.retry_count || 0);
  if (retryCount >= settings.holdRetryMax) return;
  const delay = holdRetryDelayMinutes(retryCount, settings.holdRetryMinutes);
  const next = new Date(Date.now() + delay * 60 * 1000).toISOString();
  await sb(env, `fact_checks?id=eq.${encodeURIComponent(row.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ next_retry_at: next }),
  });
}

async function clearHoldRetry(env, storyId) {
  await sb(env, `fact_checks?story_id=eq.${encodeURIComponent(storyId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ next_retry_at: null }),
  });
}

async function queueDueHoldRetries(env, settings) {
  if (!settings.holdRetryEnabled || settings.holdRetryMax <= 0) return [];
  const now = new Date().toISOString();
  const response = await sb(
    env,
    `fact_checks?select=id,story_id,retry_count,confidence&verdict=eq.hold&next_retry_at=lte.${encodeURIComponent(now)}&retry_count=lt.${settings.holdRetryMax}&order=next_retry_at.asc&limit=${DEFAULT_HOLD_RETRY_BATCH}`
  );
  if (!response.ok) return [];
  const rows = await response.json();
  const queued = [];

  for (const row of rows) {
    const active = await sb(
      env,
      `jobs?select=id&job_type=eq.fact_check_story&story_id=eq.${encodeURIComponent(row.story_id)}&status=in.(queued,processing)&limit=1`
    );
    if (active.ok && (await active.json()).length) continue;

    const insert = await sb(env, "jobs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        job_type: "fact_check_story",
        status: "queued",
        priority: 75,
        story_id: row.story_id,
        payload: { reason: "automatic hold retry", retry_number: Number(row.retry_count || 0) + 1 },
      }),
    });
    if (!insert.ok) continue;

    const nextRetryCount = Number(row.retry_count || 0) + 1;
    await sb(env, `fact_checks?id=eq.${encodeURIComponent(row.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        retry_count: nextRetryCount,
        last_retry_at: now,
        next_retry_at: null,
      }),
    });
    queued.push({ storyId: row.story_id, retryCount: nextRetryCount });
  }
  return queued;
}

async function researchStory(
  env,
  job
) {
  const story =
    job.stories;

  await updateJob(
    env,
    job.id,

    {
      status:
        "processing",

      attempts: Number(job.attempts || 0) + 1,

      started_at:
        new Date().toISOString(),
    }
  );

  try {
    const page =
      await fetchSourceText(
        story.source_url
      );

    const evidence =
      page ||
      `${story.title}
${story.description ?? ""}`;

    const prompt = `
Build a preliminary research package for Aura Digital Intelligence.

Use only the supplied source material.

This is NOT final fact-checking.

Do not invent corroboration.

Treat source claims as source claims.

If the Fiji/Pacific angle is weak or nonexistent, say so plainly.

Story:
${story.title}

URL:
${story.source_url}

Category:
${story.category ?? "Unknown"}

Source material:
${evidence.slice(
  0,
  9000
)}
`;

    const raw =
      await env.AI.run(
        env.AI_MODEL ||
          DEFAULT_MODEL,

        {
          messages: [
            {
              role:
                "system",

              content:
                "You are a cautious research assistant. Never invent evidence or claim verification not present in the supplied material.",
            },

            {
              role:
                "user",

              content:
                prompt,
            },
          ],

          response_format: {
            type:
              "json_schema",

            json_schema:
              RESEARCH_SCHEMA,
          },

          max_tokens: 750,

          temperature: 0.1,
        }
      );

    const pkg =
      parseStructured(raw);

    pkg.confidence =
      clampScore(
        pkg.confidence
      );

    const existing =
      await sb(
        env,

        `research?select=id&story_id=eq.${encodeURIComponent(
          story.id
        )}&source_type=eq.ai-research-package&limit=1`
      );

    const rows =
      existing.ok
        ? await existing.json()
        : [];

    const payload = {
      story_id:
        story.id,

      source_url:
        story.source_url,

      source_name:
        story.sources
          ?.name ??
        "Original source",

      source_type:
        "ai-research-package",

      key_facts:
        pkg,

      source_date:
        story.published_at,

      credibility:
        pkg.confidence,

      notes:
        String(
          pkg.summary ||
            "Preliminary AI research package"
        ).slice(
          0,
          1500
        ),
    };

    const save =
      rows.length
        ? await sb(
            env,

            `research?id=eq.${rows[0].id}`,

            {
              method:
                "PATCH",

              headers: {
                Prefer:
                  "return=minimal",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          )
        : await sb(
            env,
            "research",

            {
              method:
                "POST",

              headers: {
                Prefer:
                  "return=minimal",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

    if (!save.ok) {
      throw new Error(
        `Research save failed (${save.status}): ${(await save.text()).slice(
          0,
          300
        )}`
      );
    }

    await enqueueFactCheck(
      env,
      story.id,
      Number(job.priority ?? 50)
    );

    await updateJob(
      env,
      job.id,

      {
        status:
          "completed",

        result: pkg,

        error_message:
          null,

        finished_at:
          new Date().toISOString(),
      }
    );

    return {
      storyId:
        story.id,

      title:
        story.title,

      confidence:
        pkg.confidence,

      sourceFetched:
        Boolean(page),
    };

  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : String(e);

    try {
      await updateJob(
        env,
        job.id,

        {
          status:
            "failed",

          error_message:
            message,

          finished_at:
            new Date().toISOString(),
        }
      );
    } catch {}

    throw e;
  }
}


function decodeXml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(value) {
  return decodeXml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeSearchTitle(value) {
  return String(value || "")
    .replace(/â€™|â€˜/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/â€“|â€”/g, "-")
    .replace(/Â/g, "")
    .replace(/[^\p{L}\p{N}\s'\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function samePublisherDomain(a, b) {
  const left = hostnameOf(a);
  const right = hostnameOf(b);
  if (!left || !right) return false;
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`);
}

function buildSearchQuery(title) {
  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with",
    "is", "are", "was", "were", "be", "as", "at", "by", "from", "it", "its", "this",
    "that", "says", "new", "just", "about", "into", "after", "before", "how", "why",
  ]);

  const words = normalizeSearchTitle(title)
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stop.has(word));

  return [...new Set(words)].slice(0, 9).join(" ");
}

function significantTitleTokens(title) {
  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with",
    "is", "are", "was", "were", "be", "as", "at", "by", "from", "it", "its", "this",
    "that", "says", "new", "just", "about", "into", "after", "before", "how", "why",
    "reportedly", "latest", "could", "would", "will", "can", "may",
  ]);

  return [...new Set(
    normalizeSearchTitle(title)
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
      .filter((word) => word.length > 2 && !stop.has(word))
  )];
}

function titleSimilarity(a, b) {
  const left = significantTitleTokens(a);
  const right = new Set(significantTitleTokens(b));
  if (!left.length || !right.size) return 0;

  const shared = left.filter((token) => right.has(token)).length;
  const denom = Math.max(2, Math.min(left.length, right.size));
  return shared / denom;
}

function evidenceMatchesStory(text, storyTitle, candidateTitle) {
  const haystack = normalizeSearchTitle(text).toLowerCase();
  const tokens = significantTitleTokens(storyTitle);
  if (!haystack || !tokens.length) return false;

  const matches = tokens.filter((token) => haystack.includes(token)).length;
  const required = tokens.length >= 7 ? 3 : 2;

  return matches >= required || titleSimilarity(storyTitle, candidateTitle) >= 0.45;
}

async function gdeltSearchQuery(query, timespan = "1month", maxRecords = 20) {
  if (!query) return [];

  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("maxrecords", String(maxRecords));
  url.searchParams.set("format", "json");
  url.searchParams.set("sort", "HybridRel");
  url.searchParams.set("timespan", timespan);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "AuraDigitalIntelligence/1.0 (+fact-check)",
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const articles = Array.isArray(data?.articles) ? data.articles : [];

    return articles
      .filter((item) => typeof item?.url === "string" && typeof item?.title === "string")
      .map((item) => ({
        title: String(item.title),
        url: String(item.url),
        source_name: String(item.domain || hostnameOf(item.url) || "Independent source"),
        domain: String(item.domain || hostnameOf(item.url) || "").toLowerCase(),
        published_at: item.seendate ? String(item.seendate) : null,
        discovery: "gdelt",
      }));
  } catch {
    return [];
  }
}

async function searchGdelt(title) {
  const normalized = normalizeSearchTitle(title);
  const keywords = buildSearchQuery(title);
  if (!normalized && !keywords) return [];

  const exactPhrase = normalized.length > 8 ? `"${normalized.slice(0, 180)}"` : "";
  const keyTokens = significantTitleTokens(title).slice(0, 6);
  const nearQuery = keyTokens.length >= 3 ? `near20:"${keyTokens.join(" ")}"` : keywords;

  const searches = await Promise.all([
    exactPhrase ? gdeltSearchQuery(exactPhrase, "1month", 15) : Promise.resolve([]),
    keywords ? gdeltSearchQuery(keywords, "1month", 25) : Promise.resolve([]),
    nearQuery ? gdeltSearchQuery(nearQuery, "1month", 20) : Promise.resolve([]),
  ]);

  const merged = [];
  const seen = new Set();

  for (const list of searches) {
    for (const item of list) {
      if (!item.url || seen.has(item.url)) continue;
      if (titleSimilarity(title, item.title) < 0.20) continue;
      seen.add(item.url);
      merged.push(item);
    }
  }

  return merged.sort(
    (a, b) => titleSimilarity(title, b.title) - titleSimilarity(title, a.title)
  );
}

async function searchGoogleNews(title) {
  const normalized = normalizeSearchTitle(title);
  const keywords = buildSearchQuery(title);
  if (!normalized && !keywords) return [];

  const queries = [
    normalized ? `"${normalized.slice(0, 180)}"` : "",
    keywords,
  ].filter(Boolean);

  const results = [];
  const seen = new Set();

  for (const query of queries) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "AuraDigitalIntelligence/1.0 (+fact-check)",
        },
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 15);

      for (const match of items) {
        const block = match[1];
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
        const sourceMatch = block.match(/<source(?:\s+url="([^"]+)")?[^>]*>([\s\S]*?)<\/source>/i);
        const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

        const itemUrl = decodeXml(linkMatch?.[1] || "").trim();
        const sourceUrl = decodeXml(sourceMatch?.[1] || "").trim();
        const itemTitle = stripTags(titleMatch?.[1] || "");
        const domain = hostnameOf(sourceUrl) || hostnameOf(itemUrl);

        if (!itemUrl || !itemTitle || seen.has(itemUrl)) continue;
        if (titleSimilarity(title, itemTitle) < 0.20) continue;

        seen.add(itemUrl);
        results.push({
          title: itemTitle,
          url: itemUrl,
          source_name: stripTags(sourceMatch?.[2] || domain || "News source"),
          domain,
          published_at: stripTags(dateMatch?.[1] || "") || null,
          discovery: "google-news-rss",
        });
      }
    } catch {
      // Try next search variant.
    }
  }

  return results.sort(
    (a, b) => titleSimilarity(title, b.title) - titleSimilarity(title, a.title)
  );
}


function unwrapBingNewsUrl(value) {
  const raw = decodeXml(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const domain = hostnameOf(raw);

    if (
      (domain === "bing.com" || domain.endsWith(".bing.com")) &&
      parsed.pathname.toLowerCase().includes("/news/apiclick.aspx")
    ) {
      const target = parsed.searchParams.get("url");
      if (target) return target;
    }

    return raw;
  } catch {
    return raw;
  }
}

async function searchBingNews(title) {
  const normalized = normalizeSearchTitle(title);
  const keywords = buildSearchQuery(title);
  if (!normalized && !keywords) return [];

  const queries = [
    normalized ? `"${normalized.slice(0, 180)}"` : "",
    keywords,
  ].filter(Boolean);

  const results = [];
  const seen = new Set();

  for (const query of queries) {
    const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=RSS&setlang=en-US`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; AuraDigitalIntelligence/1.0; +fact-check)",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        redirect: "follow",
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 20);

      for (const match of items) {
        const block = match[1];
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
        const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        const sourceMatch =
          block.match(/<(?:News:Source|source)[^>]*>([\s\S]*?)<\/(?:News:Source|source)>/i);

        const itemTitle = stripTags(titleMatch?.[1] || "");
        const directUrl = unwrapBingNewsUrl(linkMatch?.[1] || "");
        const domain = hostnameOf(directUrl);

        if (!itemTitle || !directUrl || !domain || seen.has(directUrl)) continue;
        if (!usablePublisherLink(directUrl)) continue;
        if (titleSimilarity(title, itemTitle) < 0.16) continue;

        seen.add(directUrl);
        results.push({
          title: itemTitle,
          url: directUrl,
          source_name: stripTags(sourceMatch?.[1] || domain || "Independent source"),
          domain,
          published_at: stripTags(dateMatch?.[1] || "") || null,
          discovery: "bing-news-rss",
        });
      }
    } catch {
      // Try next query variant.
    }
  }

  return results.sort(
    (a, b) => titleSimilarity(title, b.title) - titleSimilarity(title, a.title)
  );
}

async function resolvePublisherCandidateWithGdelt(storyTitle, candidate) {
  if (!candidate?.domain || candidate.domain === "news.google.com") return candidate;

  const keywords = buildSearchQuery(storyTitle);
  if (!keywords) return candidate;

  const domainQuery = `${keywords} domainis:${candidate.domain}`;
  const matches = await gdeltSearchQuery(domainQuery, "1month", 10);

  const best = matches
    .filter((item) => !samePublisherDomain(item.url, "https://news.google.com"))
    .sort(
      (a, b) => titleSimilarity(storyTitle, b.title) - titleSimilarity(storyTitle, a.title)
    )[0];

  if (!best || titleSimilarity(storyTitle, best.title) < 0.25) return candidate;

  return {
    ...best,
    source_name: candidate.source_name || best.source_name,
    discovery: "google-news-domain-via-gdelt",
  };
}

function browserRunAvailable(env) {
  return Boolean(env?.BROWSER && typeof env.BROWSER.quickAction === "function");
}

async function parseBrowserQuickAction(response) {
  if (!response) return null;

  try {
    const text = await response.text();
    if (!response.ok) {
      console.log(
        "Browser Run Quick Action failed:",
        response.status,
        text.slice(0, 500)
      );
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: true,
        result: text,
      };
    }
  } catch (error) {
    console.log(
      "Browser Run Quick Action parse failed:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

function usablePublisherLink(url) {
  const domain = hostnameOf(url);
  if (!domain) return false;

  const blocked = [
    "news.google.com",
    "google.com",
    "accounts.google.com",
    "support.google.com",
    "gstatic.com",
    "googleusercontent.com",
    "youtube.com",
    "youtu.be",
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "x.com",
    "twitter.com",
  ];

  if (blocked.some((item) => domain === item || domain.endsWith(`.${item}`))) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

async function browserResolveGoogleNewsUrl(env, candidate) {
  if (!candidate?.url || hostnameOf(candidate.url) !== "news.google.com") {
    return candidate;
  }

  if (!browserRunAvailable(env)) {
    return candidate;
  }

  try {
    const response = await env.BROWSER.quickAction("links", {
      url: candidate.url,
      visibleLinksOnly: false,
      gotoOptions: {
        waitUntil: "networkidle2",
      },
    });

    const payload = await parseBrowserQuickAction(response);
    const links = Array.isArray(payload?.result)
      ? payload.result.filter((value) => typeof value === "string")
      : [];

    if (!links.length) return candidate;

    const preferredDomain = String(candidate.domain || "").toLowerCase();
    const usable = [...new Set(links.filter(usablePublisherLink))];

    let best = null;

    if (preferredDomain && preferredDomain !== "news.google.com") {
      best = usable.find((url) => {
        const domain = hostnameOf(url);
        return (
          domain === preferredDomain ||
          domain.endsWith(`.${preferredDomain}`) ||
          preferredDomain.endsWith(`.${domain}`)
        );
      });
    }

    if (!best) {
      const tokens = significantTitleTokens(candidate.title || "").slice(0, 5);

      best = usable
        .map((url) => {
          const path = (() => {
            try {
              return decodeURIComponent(new URL(url).pathname).toLowerCase();
            } catch {
              return "";
            }
          })();

          const score = tokens.filter((token) => path.includes(token)).length;
          return { url, score, pathLength: path.length };
        })
        .filter((item) => item.pathLength > 5)
        .sort((a, b) => b.score - a.score || b.pathLength - a.pathLength)[0]?.url;
    }

    if (!best) return candidate;

    return {
      ...candidate,
      url: best,
      domain: hostnameOf(best),
      discovery: "google-news-browser-resolved",
    };
  } catch (error) {
    console.log(
      "Browser Run Google News resolution failed:",
      error instanceof Error ? error.message : String(error)
    );
    return candidate;
  }
}

async function fetchBrowserMarkdown(env, url) {
  if (!url || !browserRunAvailable(env)) return "";

  try {
    const response = await env.BROWSER.quickAction("markdown", {
      url,
      gotoOptions: {
        waitUntil: "networkidle2",
      },
    });

    const payload = await parseBrowserQuickAction(response);
    const markdown = typeof payload?.result === "string" ? payload.result : "";

    return markdown
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 12000);
  } catch (error) {
    console.log(
      "Browser Run markdown fetch failed:",
      error instanceof Error ? error.message : String(error)
    );
    return "";
  }
}

async function fetchJinaReaderText(url) {
  if (!url) return "";

  try {
    const readerUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(readerUrl, {
      headers: {
        Accept: "text/plain",
        "User-Agent": "AuraDigitalIntelligence/1.0 (+fact-check-reader)",
      },
      redirect: "follow",
    });

    if (!response.ok) return "";

    const text = (await response.text())
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return text.slice(0, 12000);
  } catch {
    return "";
  }
}

async function fetchEvidenceText(env, candidate, story) {
  let resolvedCandidate = candidate;

  if (hostnameOf(resolvedCandidate.url) === "news.google.com") {
    resolvedCandidate = await browserResolveGoogleNewsUrl(env, resolvedCandidate);
  }

  const isGoogleNews = hostnameOf(resolvedCandidate.url) === "news.google.com";

  if (!isGoogleNews) {
    const direct = await fetchSourceText(resolvedCandidate.url);
    if (
      direct &&
      direct.length >= 350 &&
      evidenceMatchesStory(direct, story.title, resolvedCandidate.title)
    ) {
      return {
        text: direct,
        fetch_method: "direct",
        candidate: resolvedCandidate,
      };
    }
  }

  if (!isGoogleNews) {
    const reader = await fetchJinaReaderText(resolvedCandidate.url);
    if (
      reader &&
      reader.length >= 350 &&
      evidenceMatchesStory(reader, story.title, resolvedCandidate.title)
    ) {
      return {
        text: reader,
        fetch_method: "jina-reader",
        candidate: resolvedCandidate,
      };
    }
  }

  if (!isGoogleNews) {
    const browserText = await fetchBrowserMarkdown(env, resolvedCandidate.url);
    if (
      browserText &&
      browserText.length >= 350 &&
      evidenceMatchesStory(browserText, story.title, resolvedCandidate.title)
    ) {
      return {
        text: browserText,
        fetch_method: "browser-run-markdown",
        candidate: resolvedCandidate,
      };
    }
  }

  return {
    text: "",
    fetch_method: "none",
    candidate: resolvedCandidate,
  };
}

async function discoverVerificationSources(story) {
  const originalUrl = story.source_url;
  const originalDomain = hostnameOf(originalUrl);

  const [gdelt, google, bing] = await Promise.all([
    searchGdelt(story.title),
    searchGoogleNews(story.title),
    searchBingNews(story.title),
  ]);

  // Bing News RSS often exposes the publisher target directly (or through a
  // simple apiclick URL that we can unwrap), so prefer these direct candidates
  // alongside GDELT before falling back to Google News resolution.
  const candidates = [...gdelt, ...bing];

  // Google News gives excellent publisher hints but its RSS URLs are JS-mediated.
  // Try to turn the strongest publisher hints into direct GDELT URLs first.
  const googleDomains = new Set();
  for (const item of google) {
    if (candidates.length >= 15) break;
    if (!item.domain || googleDomains.has(item.domain)) continue;
    if (item.domain === originalDomain) continue;
    googleDomains.add(item.domain);

    const resolved = await resolvePublisherCandidateWithGdelt(story.title, item);
    candidates.push(resolved);
  }

  const unique = [];
  const seenDomains = new Set();
  const seenUrls = new Set();

  for (const item of candidates) {
    if (!item.url || seenUrls.has(item.url)) continue;
    if (samePublisherDomain(item.url, originalUrl)) continue;

    const domain = item.domain || hostnameOf(item.url);
    if (!domain || domain === originalDomain || seenDomains.has(domain)) continue;
    if (titleSimilarity(story.title, item.title) < 0.20) continue;

    seenUrls.add(item.url);
    seenDomains.add(domain);
    unique.push({
      ...item,
      domain,
      similarity: Math.round(titleSimilarity(story.title, item.title) * 100),
    });

    if (unique.length >= 8) break;
  }

  return unique;
}

async function collectIndependentEvidence(env, story) {
  const candidates = await discoverVerificationSources(story);
  const evidence = [];
  const acceptedDomains = new Set();
  const attempts = [];

  for (const candidate of candidates) {
    if (evidence.length >= 3) break;

    const fetched = await fetchEvidenceText(env, candidate, story);
    const finalCandidate = fetched.candidate || candidate;
    const finalDomain = finalCandidate.domain || hostnameOf(finalCandidate.url);

    attempts.push({
      title: finalCandidate.title,
      domain: finalDomain || "",
      url: finalCandidate.url,
      discovery: finalCandidate.discovery,
      fetch_method: fetched.fetch_method,
      accepted: Boolean(fetched.text),
    });

    if (!fetched.text) continue;
    if (!finalDomain) continue;
    if (samePublisherDomain(finalCandidate.url, story.source_url)) continue;
    if (acceptedDomains.has(finalDomain)) continue;

    acceptedDomains.add(finalDomain);

    evidence.push({
      index: evidence.length + 1,
      title: finalCandidate.title,
      url: finalCandidate.url,
      source_name: finalCandidate.source_name,
      domain: finalDomain,
      published_at: finalCandidate.published_at,
      discovery: finalCandidate.discovery,
      fetch_method: fetched.fetch_method,
      similarity:
        finalCandidate.similarity ??
        Math.round(titleSimilarity(story.title, finalCandidate.title) * 100),
      excerpt: fetched.text.slice(0, 5000),
    });
  }

  return {
    evidence,
    diagnostics: {
      browserAvailable: browserRunAvailable(env),
      candidateCount: candidates.length,
      candidateDomains: candidates.map((item) => item.domain || hostnameOf(item.url)).filter(Boolean),
      candidateDiscovery: candidates.map((item) => item.discovery || "unknown"),
      attempts,
    },
  };
}


async function getDailyPipelineStats(env, settings) {
  const { start, end, key } = fijiDayBounds();
  const [checksResponse, articlesResponse, qualityResponse, publishedResponse, activeFactResponse, writerResponse] = await Promise.all([
    sb(env, `fact_checks?select=id,verdict,confidence,checked_at&checked_at=gte.${encodeURIComponent(start)}&checked_at=lt.${encodeURIComponent(end)}&limit=80`),
    sb(env, `articles?select=id,status,generated_at,published_at&generated_at=gte.${encodeURIComponent(start)}&generated_at=lt.${encodeURIComponent(end)}&limit=30`),
    sb(env, `articles?select=id,status,final_quality_checked_at&final_quality_passed=eq.true&final_quality_checked_at=gte.${encodeURIComponent(start)}&final_quality_checked_at=lt.${encodeURIComponent(end)}&limit=30`),
    sb(env, `articles?select=id,status,published_at&status=eq.published&published_at=gte.${encodeURIComponent(start)}&published_at=lt.${encodeURIComponent(end)}&limit=30`),
    sb(env, "jobs?select=id&job_type=eq.fact_check_story&status=in.(queued,processing)&limit=10"),
    sb(env, "jobs?select=id&job_type=eq.write_article&status=in.(queued,processing)&limit=10"),
  ]);

  const checks = checksResponse.ok ? await checksResponse.json() : [];
  const articles = articlesResponse.ok ? await articlesResponse.json() : [];
  const qualityPassed = qualityResponse.ok ? await qualityResponse.json() : [];
  const published = publishedResponse.ok ? await publishedResponse.json() : [];
  const activeFactJobs = activeFactResponse.ok ? await activeFactResponse.json() : [];
  const writerJobs = writerResponse.ok ? await writerResponse.json() : [];

  return {
    fijiDate: key,
    factChecksToday: checks.length,
    approvalsToday: checks.filter((row) => row.verdict === "approve").length,
    articlesGeneratedToday: articles.length,
    qualityPassedToday: qualityPassed.length,
    articlesPublishedToday: published.length,
    activeFactJobs: activeFactJobs.length,
    activeWriterJobs: writerJobs.length,
    articleTarget: settings.dailyArticleTarget,
    candidateCap: settings.maxAiCandidatesPerDay,
  };
}

async function queueBestDailyCandidate(env, settings) {
  const stats = await getDailyPipelineStats(env, settings);
  if (stats.articlesPublishedToday >= settings.dailyArticleTarget || stats.qualityPassedToday >= settings.dailyArticleTarget) {
    return { queued: false, reason: "daily-publishable-target-reached", ...stats };
  }
  if (stats.factChecksToday >= settings.maxAiCandidatesPerDay) {
    return { queued: false, reason: "daily-ai-candidate-cap-reached", ...stats };
  }
  if (stats.activeWriterJobs > 0) {
    return { queued: false, reason: "writer-has-priority", ...stats };
  }
  if (stats.activeFactJobs > 0) {
    return { queued: false, reason: "fact-check-already-active", ...stats };
  }

  const q = new URLSearchParams({
    select: "id,title,priority_score,published_at,category,source_url",
    decision: "eq.research",
    verification_status: "is.null",
    priority_score: `gte.${settings.candidateMinPriority}`,
    order: "priority_score.desc,published_at.desc",
    limit: "8",
  });
  const response = await sb(env, `stories?${q.toString()}`);
  if (!response.ok) {
    throw new Error(`Daily candidate fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
  const candidates = await response.json();
  if (!candidates.length) {
    return { queued: false, reason: "no-qualified-candidate", ...stats };
  }

  const candidate = candidates[0];
  await enqueueFactCheck(env, candidate.id, candidate.priority_score || 70);
  await sb(env, `stories?id=eq.${encodeURIComponent(candidate.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "researching" }),
  });

  return {
    queued: true,
    storyId: candidate.id,
    title: candidate.title,
    priority: candidate.priority_score,
    reason: "top-qualified-candidate",
    ...stats,
  };
}

async function enqueueFactCheck(env, storyId, priority) {
  const check = await sb(
    env,
    `jobs?select=id&job_type=eq.fact_check_story&story_id=eq.${encodeURIComponent(
      storyId
    )}&status=in.(queued,processing,completed)&limit=1`
  );

  if (check.ok && (await check.json()).length) return;

  const response = await sb(env, "jobs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      job_type: "fact_check_story",
      status: "queued",
      priority: Math.max(1, Math.min(100, Math.round(Number(priority) || 50))),
      story_id: storyId,
      payload: { reason: "free acquisition engine candidate" },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Fact-check queue insert failed (${response.status}): ${(await response.text()).slice(0, 300)}`
    );
  }
}

async function getQueuedFactCheckJobs(env, limit) {
  const query = new URLSearchParams({
    select:
      "id,story_id,priority,attempts,max_attempts,next_attempt_at,stories(id,source_url,title,description,category,published_at,priority_score,sources(name,trust_score,country,category,source_type))",
    job_type: "eq.fact_check_story",
    status: "eq.queued",
    or: `(next_attempt_at.is.null,next_attempt_at.lte.${new Date().toISOString()})`,
    order: "priority.desc,created_at.asc",
    limit: String(limit),
  });

  const response = await sb(env, `jobs?${query.toString()}`);

  if (!response.ok) {
    throw new Error(
      `Fact-check queue fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`
    );
  }

  return response.json();
}

async function getResearchPackage(env, storyId) {
  const response = await sb(
    env,
    `research?select=id,key_facts,notes,credibility,source_url,source_name,created_at&story_id=eq.${encodeURIComponent(
      storyId
    )}&source_type=eq.ai-research-package&order=created_at.desc&limit=1`
  );

  if (!response.ok) {
    throw new Error(
      `Research package fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`
    );
  }

  const rows = await response.json();
  return rows[0] || null;
}

function sentenceCandidates(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.replace(/^[-–—•\s]+|\s+$/g, "").trim())
    .filter((item) => item.length >= 28 && item.length <= 320)
    .filter((item) => !/^(click|subscribe|sign up|advertisement|cookie|privacy|terms)\b/i.test(item));
}

function buildDeterministicClaims(story, sourceText = "") {
  const title = normalizeSearchTitle(story?.title || "");
  const description = String(story?.description || "").replace(/\s+/g, " ").trim();
  const titleTokens = new Set(significantTitleTokens(title));
  const candidates = [];

  if (title.length >= 20) candidates.push(title);
  candidates.push(...sentenceCandidates(description).slice(0, 3));

  // Pull only original-source sentences that clearly overlap the headline topic.
  // This replaces the expensive AI research stage; it does not treat the source
  // as verified. Independent publishers still have to corroborate every claim.
  for (const sentence of sentenceCandidates(String(sourceText || "").slice(0, 4500))) {
    const tokens = significantTitleTokens(sentence);
    const overlap = tokens.filter((token) => titleTokens.has(token)).length;
    if (overlap >= Math.min(2, Math.max(1, titleTokens.size))) candidates.push(sentence);
    if (candidates.length >= 10) break;
  }

  const seen = new Set();
  const claims = [];
  for (const raw of candidates) {
    const claim = String(raw || "")
      .replace(/\s+/g, " ")
      .replace(/^[-–—:;,.\s]+|[-–—:;,\s]+$/g, "")
      .trim();
    if (claim.length < 20 || claim.length > 320) continue;
    const key = claim.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    if (claims.some((existing) => {
      const a = significantTitleTokens(existing);
      const b = significantTitleTokens(claim);
      if (!a.length || !b.length) return false;
      const overlap = a.filter((token) => b.includes(token)).length / Math.min(a.length, b.length);
      return overlap > 0.9;
    })) continue;
    seen.add(key);
    claims.push(claim);
    if (claims.length >= 3) break;
  }

  return claims.length ? claims : [title || "The reported technology development occurred as described by the source headline."];
}

function normalizeSourceIndexes(values, evidenceCount) {
  if (!Array.isArray(values)) return [];
  return [
    ...new Set(
      values
        .map((value) => Number(value))
        .filter(
          (value) =>
            Number.isInteger(value) &&
            value >= 1 &&
            value <= evidenceCount
        )
    ),
  ].sort((a, b) => a - b);
}

function normalizeClaimCheck(claim, rawCheck, evidenceCount, claimIndex) {
  const sourceIndexes = normalizeSourceIndexes(
    rawCheck?.source_indexes,
    evidenceCount
  );

  let status = FACT_CHECK_STATUS_VALUES.includes(
    String(rawCheck?.status || "").toLowerCase()
  )
    ? String(rawCheck.status).toLowerCase()
    : "unverified";

  // A model label can never override the evidence-linkage rules.
  // Full support requires two independent sources. One source is partial.
  if (status === "supported" && sourceIndexes.length < 2) {
    status = sourceIndexes.length === 1 ? "partial" : "unverified";
  }

  if (status === "partial" && sourceIndexes.length === 0) {
    status = "unverified";
  }

  if (status === "conflicted" && sourceIndexes.length === 0) {
    status = "unverified";
  }

  const fallbackExplanation =
    status === "unverified"
      ? "No sufficient independent evidence was linked to this claim."
      : "Verification result generated from the retrieved independent evidence.";

  return {
    claim_index: claimIndex + 1,
    claim,
    status,
    explanation: String(rawCheck?.explanation || fallbackExplanation).slice(0, 1200),
    source_indexes: sourceIndexes,
  };
}

function normalizeFactCheckPackage(rawPackage, claims, evidenceCount) {
  const verification =
    rawPackage?.verification && typeof rawPackage.verification === "object"
      ? rawPackage.verification
      : {};

  const missingClaimIndexes = [];
  const claimChecks = claims.map((claim, index) => {
    const key = `claim_${index + 1}`;
    const rawCheck = verification[key];
    if (!rawCheck || typeof rawCheck !== "object") {
      missingClaimIndexes.push(index);
    }
    return normalizeClaimCheck(claim, rawCheck, evidenceCount, index);
  });

  const conflicts = Array.isArray(rawPackage?.conflicts)
    ? rawPackage.conflicts.map((value) => String(value)).filter(Boolean).slice(0, 8)
    : [];

  return {
    summary: String(rawPackage?.summary || "Fact-check completed").slice(0, 2000),
    claim_checks: claimChecks,
    conflicts,
    missingClaimIndexes,
  };
}

async function runFactCheckAI(env, settings, claims, prompt) {
  const result = await aiJson(
    env,
    settings,
    "verification",
    "You are a conservative independent newsroom fact checker. Verify only the supplied claims against only the supplied independent publisher evidence. Never invent facts, sources, source numbers, or Fiji impact. Return the exact requested JSON structure.",
    prompt,
    buildFactCheckSchema(claims.length),
    { maxTokens: 1400, temperature: 0 }
  );
  return { ...result.data, _provider: result.provider, _model: result.model };
}

async function repairSingleClaim(env, settings, claim, evidenceText, claimNumber) {
  const result = await aiJson(
    env,
    settings,
    "verification",
    "Verify exactly one factual claim against only the supplied independent evidence. Use only source numbers present in the evidence. Full support requires two independent publishers. If support is insufficient, return unverified.",
    `CLAIM ${claimNumber}: ${claim}\n\nEVIDENCE:\n${evidenceText.slice(0, 10000)}`,
    buildSingleClaimSchema(),
    { maxTokens: 400, temperature: 0 }
  );
  return { ...result.data, _provider: result.provider, _model: result.model };
}

function finalizeFactCheckPackage(basePackage, evidenceCount) {
  const checks = Array.isArray(basePackage.claim_checks)
    ? basePackage.claim_checks
    : [];

  // Safe facts are not accepted directly from the model. They are derived only
  // from claims that survived our deterministic evidence-linkage rules.
  const safeFacts = checks
    .filter(
      (check) =>
        check.status === "supported" &&
        Array.isArray(check.source_indexes) &&
        check.source_indexes.length >= 2
    )
    .map((check) => check.claim);

  const missingEvidence = checks
    .filter((check) => check.status === "unverified")
    .map((check) => `Unverified claim: ${check.claim}`);

  const writingConstraints = [];
  for (const check of checks) {
    if (check.status === "unverified") {
      writingConstraints.push(`Do not state as fact: ${check.claim}`);
    }
    if (check.status === "conflicted") {
      writingConstraints.push(`Do not publish without resolving conflict: ${check.claim}`);
    }
    if (check.status === "partial") {
      writingConstraints.push(`Qualify or omit partially supported claim: ${check.claim}`);
    }
  }

  return {
    summary: basePackage.summary,
    claim_checks: checks,
    conflicts: Array.isArray(basePackage.conflicts) ? basePackage.conflicts : [],
    missing_evidence: missingEvidence,
    safe_facts: safeFacts,
    writing_constraints: writingConstraints,
    evidence_count: evidenceCount,
  };
}

function calculateVerificationConfidence(aiPackage, independentSourceCount) {
  const checks = Array.isArray(aiPackage.claim_checks) ? aiPackage.claim_checks : [];
  const conflicts = Array.isArray(aiPackage.conflicts) ? aiPackage.conflicts : [];

  if (!checks.length) {
    return {
      confidence: 0,
      supported: 0,
      partial: 0,
      conflicted: 0,
      unverified: 0,
      linkedClaims: 0,
      totalClaims: 0,
      supportRatio: 0,
      sourceFactor: Math.min(1, independentSourceCount / 3),
      linkageRatio: 0,
    };
  }

  let supported = 0;
  let partial = 0;
  let conflicted = 0;
  let unverified = 0;
  let linkedClaims = 0;
  let weightedSupport = 0;

  for (const check of checks) {
    const status = String(check?.status || "unverified").toLowerCase();
    const sourceIndexes = normalizeSourceIndexes(
      check?.source_indexes,
      independentSourceCount
    );

    if (status === "supported") {
      supported += 1;
      weightedSupport += sourceIndexes.length >= 2 ? 1 : 0;
    } else if (status === "partial") {
      partial += 1;
      weightedSupport += sourceIndexes.length >= 1 ? 0.5 : 0;
    } else if (status === "conflicted") {
      conflicted += 1;
    } else {
      unverified += 1;
    }

    if (sourceIndexes.length > 0) linkedClaims += 1;
  }

  const totalClaims = checks.length;
  const supportRatio = weightedSupport / totalClaims;
  const sourceFactor = Math.min(1, independentSourceCount / 3);
  const linkageRatio = linkedClaims / totalClaims;

  // Deterministic score only. The model no longer supplies a confidence value
  // and therefore cannot approve a story by itself.
  let confidence =
    supportRatio * 80 +
    sourceFactor * 10 +
    linkageRatio * 10;

  confidence -= Math.min(40, conflicted * 20);
  confidence -= Math.min(20, conflicts.length * 10);
  confidence = clampScore(confidence);

  return {
    confidence,
    supported,
    partial,
    conflicted,
    unverified,
    linkedClaims,
    totalClaims,
    supportRatio: Math.round(supportRatio * 100) / 100,
    sourceFactor: Math.round(sourceFactor * 100) / 100,
    linkageRatio: Math.round(linkageRatio * 100) / 100,
  };
}

function finalFactCheckVerdict(aiPackage, independentSourceCount, settings) {
  const metrics = calculateVerificationConfidence(aiPackage, independentSourceCount);
  const conflicts = Array.isArray(aiPackage.conflicts) ? aiPackage.conflicts : [];
  const minimumSupportedClaims = Math.max(1, Math.ceil(metrics.totalClaims * 0.6));

  let verdict = "hold";

  if (
    independentSourceCount >= settings.factCheckMinSources &&
    metrics.confidence >= settings.factCheckApproveConfidence &&
    metrics.supported >= minimumSupportedClaims &&
    metrics.conflicted === 0 &&
    conflicts.length === 0
  ) {
    verdict = "approve";
  }

  return {
    verdict,
    confidence: metrics.confidence,
    confidenceMetrics: metrics,
    aiVerdict: "deterministic-v7",
  };
}

async function saveFactCheck(env, story, researchPackage, evidence, aiPackage, settings) {
  const final = finalFactCheckVerdict(aiPackage, evidence.length, settings);

  const payload = {
    story_id: story.id,
    research_id: researchPackage?.id ?? null,
    verdict: final.verdict,
    confidence: final.confidence,
    independent_source_count: evidence.length,
    summary: String(aiPackage.summary || "Fact-check completed").slice(0, 2000),
    claim_checks: Array.isArray(aiPackage.claim_checks) ? aiPackage.claim_checks : [],
    evidence_sources: evidence.map(({ excerpt, ...source }) => source),
    source_phrase_fingerprints: buildSourceFingerprints(evidence, settings.originalityShingleSize),
    conflicts: Array.isArray(aiPackage.conflicts) ? aiPackage.conflicts : [],
    missing_evidence: Array.isArray(aiPackage.missing_evidence) ? aiPackage.missing_evidence : [],
    safe_facts: Array.isArray(aiPackage.safe_facts) ? aiPackage.safe_facts : [],
    writing_constraints: Array.isArray(aiPackage.writing_constraints)
      ? aiPackage.writing_constraints
      : [],
    checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = await sb(
    env,
    `fact_checks?select=id&story_id=eq.${encodeURIComponent(story.id)}&limit=1`
  );

  const rows = existing.ok ? await existing.json() : [];

  const save = rows.length
    ? await sb(env, `fact_checks?id=eq.${rows[0].id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(payload),
      })
    : await sb(env, "fact_checks", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(payload),
      });

  if (!save.ok) {
    throw new Error(
      `Fact-check save failed (${save.status}): ${(await save.text()).slice(0, 300)}`
    );
  }

  const storyStatus =
    final.verdict === "approve" ? "approved" : final.verdict === "reject" ? "rejected" : "review";

  const storyUpdate = await sb(env, `stories?id=eq.${encodeURIComponent(story.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      verification_status: final.verdict,
      verification_confidence: final.confidence,
      verification_source_count: evidence.length,
      verification_summary: payload.summary,
      verified_at: payload.checked_at,
      status: storyStatus,
    }),
  });

  if (!storyUpdate.ok) {
    throw new Error(
      `Story verification update failed (${storyUpdate.status}): ${(await storyUpdate.text()).slice(0, 300)}`
    );
  }

  if (final.verdict === "approve") {
    await clearHoldRetry(env, story.id);
    if (settings.articleWriterEnabled && final.confidence >= settings.articleMinFactConfidence) {
      await enqueueArticleJob(env, story.id, story.priority_score ?? 75);
    }
  } else if (final.verdict === "hold") {
    await scheduleHoldRetry(env, story.id, settings);
  } else {
    await clearHoldRetry(env, story.id);
  }

  return {
    verdict: final.verdict,
    confidence: final.confidence,
    independentSourceCount: evidence.length,
    confidenceMetrics: final.confidenceMetrics,
    aiVerdict: final.aiVerdict,
  };
}

async function factCheckStory(env, job, settings) {
  const story = job.stories;

  await updateJob(env, job.id, {
    status: "processing",
    attempts: Number(job.attempts || 0) + 1,
    started_at: new Date().toISOString(),
    error_message: null,
    deferred_reason: null,
  });

  try {
    const [retrieval, originalText] = await Promise.all([
      collectIndependentEvidence(env, story),
      fetchSourceText(story.source_url),
    ]);
    const evidence = retrieval.evidence;
    const retrievalDiagnostics = retrieval.diagnostics;
    const evidenceText = evidence.length
      ? evidence
          .map(
            (source) => `SOURCE ${source.index}\nPublisher: ${source.source_name}\nURL: ${source.url}\nTitle: ${source.title}\nEvidence: ${source.excerpt}`
          )
          .join("\n\n---\n\n")
      : "No usable independent source text could be retrieved.";

    if (evidence.length < settings.factCheckMinSources) {
      const insufficientPackage = {
        summary:
          evidence.length === 0
            ? "Held because no usable independent publisher evidence could be retrieved."
            : `Held because only ${evidence.length} independent publisher source was retrievable; ${settings.factCheckMinSources} are required.`,
        claim_checks: [],
        conflicts: [],
        missing_evidence: [
          `At least ${settings.factCheckMinSources} independent publisher sources are required before approval.`,
        ],
        safe_facts: [],
        writing_constraints: [
          "Do not publish automatically until the minimum independent-source requirement is met.",
        ],
      };
      const saved = await saveFactCheck(env, story, null, evidence, insufficientPackage, settings);
      await updateJob(env, job.id, {
        status: "completed",
        result: {
          ...saved,
          aiVerdict: "not-run-insufficient-sources",
          acquisitionEngine: "free-v2",
          retrievalDiagnostics,
        },
        finished_at: new Date().toISOString(),
        next_attempt_at: null,
        deferred_reason: null,
      });
      return {
        storyId: story.id,
        title: story.title,
        ...saved,
        candidateCount: retrievalDiagnostics.candidateCount,
        browserAvailable: retrievalDiagnostics.browserAvailable,
        retrievalDiagnostics,
      };
    }

    const claimsToVerify = buildDeterministicClaims(story, originalText);
    const numberedClaims = claimsToVerify
      .map((claim, index) => `CLAIM ${index + 1}: ${claim}`)
      .join("\n");

    const prompt = `
Verify each numbered claim using ONLY the independent evidence below.

Rules:
- supported = at least TWO independent SOURCE numbers directly support the whole claim
- partial = one source supports it, or multiple sources support only part of it
- conflicted = credible sources materially disagree
- unverified = the supplied evidence does not support it
- Do not treat the original story as independent evidence.
- Do not infer Fiji impact or add background knowledge.
- Use source_indexes only from the SOURCE numbers below.

CLAIMS:\n${numberedClaims}

INDEPENDENT EVIDENCE (${evidence.length} publishers):\n${evidenceText.slice(0, 12000)}
`;

    const rawPackage = await runFactCheckAI(env, settings, claimsToVerify, prompt);
    const normalized = normalizeFactCheckPackage(rawPackage, claimsToVerify, evidence.length);
    let claimRepairCount = 0;
    let claimRepairFailures = 0;

    for (const claimIndex of normalized.missingClaimIndexes) {
      try {
        const repaired = await repairSingleClaim(
          env,
          settings,
          claimsToVerify[claimIndex],
          evidenceText,
          claimIndex + 1
        );
        normalized.claim_checks[claimIndex] = normalizeClaimCheck(
          claimsToVerify[claimIndex],
          repaired,
          evidence.length,
          claimIndex
        );
        claimRepairCount += 1;
      } catch (repairError) {
        if (isAIUnavailable(repairError)) throw repairError;
        claimRepairFailures += 1;
      }
    }

    const aiPackage = finalizeFactCheckPackage(normalized, evidence.length);
    const saved = await saveFactCheck(env, story, null, evidence, aiPackage, settings);
    const provider = rawPackage._provider || "unknown";
    const model = rawPackage._model || "unknown";

    await updateJob(env, job.id, {
      status: "completed",
      result: {
        ...saved,
        factCheckEngine: "free-v2-deterministic-claims",
        provider,
        model,
        claimRepairCount,
        claimRepairFailures,
        claimCheckCount: aiPackage.claim_checks.length,
        retrievalMethods: evidence.map((item) => item.fetch_method),
        evidenceDomains: evidence.map((item) => item.domain),
        retrievalDiagnostics,
      },
      error_message: null,
      finished_at: new Date().toISOString(),
      next_attempt_at: null,
      deferred_reason: null,
    });

    return {
      storyId: story.id,
      title: normalizeSearchTitle(story.title),
      ...saved,
      factCheckEngine: "free-v2-deterministic-claims",
      provider,
      model,
      claimRepairCount,
      claimRepairFailures,
      claimCheckCount: aiPackage.claim_checks.length,
      candidateCount: retrievalDiagnostics.candidateCount,
      browserAvailable: retrievalDiagnostics.browserAvailable,
    };
  } catch (error) {
    if (isAIUnavailable(error)) {
      return deferAIJob(env, job, error, 60);
    }

    const message = error instanceof Error ? error.message : String(error);
    try {
      await updateJob(env, job.id, {
        status: "failed",
        error_message: message,
        finished_at: new Date().toISOString(),
      });
    } catch {}
    throw error;
  }
}

async function recoverStaleJobs(env) {
  const staleMinutes = Math.max(
    20,
    Math.min(120, Number(env.JOB_STALE_MINUTES || 30) || 30)
  );
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString();
  const query = new URLSearchParams({
    select: "id,story_id,job_type,status,attempts,max_attempts,started_at",
    status: "eq.processing",
    started_at: `lt.${cutoff}`,
    job_type: "in.(research_story,fact_check_story,write_article)",
    order: "started_at.asc",
    limit: "20",
  });

  const response = await sb(env, `jobs?${query.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Stale job watchdog fetch failed (${response.status}): ${(await response.text()).slice(0, 300)}`
    );
  }

  const rows = await response.json();
  const recovered = [];

  for (const job of rows) {
    const attempts = Number(job.attempts || 0);
    const maxAttempts = Math.max(1, Number(job.max_attempts || 3));

    if (attempts >= maxAttempts) {
      await updateJob(env, job.id, {
        status: "failed",
        error_message: `Automatic watchdog stopped this job after ${attempts}/${maxAttempts} attempts. The previous Worker invocation ended before the job could finish.`,
        finished_at: new Date().toISOString(),
      });
      recovered.push({
        jobId: job.id,
        storyId: job.story_id,
        jobType: job.job_type,
        action: "failed-max-attempts",
        attempts,
      });
      continue;
    }

    await updateJob(env, job.id, {
      status: "queued",
      started_at: null,
      finished_at: null,
      error_message: `Recovered automatically after being stuck in processing for more than ${staleMinutes} minutes.`,
    });
    recovered.push({
      jobId: job.id,
      storyId: job.story_id,
      jobType: job.job_type,
      action: "requeued",
      attempts,
    });
  }

  return recovered;
}

async function backfillOneMissingArticleImage(env) {
  if (!env.PEXELS_API_KEY) return null;
  const response = await sb(
    env,
    "articles?select=id,story_id,title,category,featured_image_url,stories(id,title,description,category)&featured_image_url=is.null&status=in.(review,approved,published)&order=created_at.desc&limit=1"
  );
  if (!response.ok) return null;
  const rows = await response.json();
  const article = rows[0];
  if (!article) return null;
  const story = article.stories || { id: article.story_id, title: article.title, category: article.category };
  const image = await fetchPexelsImage(env, story, { title: article.title, category: article.category });
  if (!image?.url) return { articleId: article.id, updated: false };
  const save = await sb(env, `articles?id=eq.${encodeURIComponent(article.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      featured_image_url: image.url,
      featured_image_credit: image.credit,
      featured_image_source_url: image.sourceUrl,
      featured_image_alt: image.alt,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!save.ok) return { articleId: article.id, updated: false };
  return { articleId: article.id, updated: true };
}

async function processQueuedArticles(env, thresholds, failures) {
  if (!thresholds.articleWriterEnabled) return [];
  const articleJobs = await getQueuedArticleJobs(env, thresholds.maxArticles);
  const articlesWritten = [];

  for (const job of articleJobs) {
    try {
      articlesWritten.push(await writeArticle(env, job, thresholds));
    } catch (e) {
      failures.push({
        storyId: job.story_id,
        stage: "article-writer",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return articlesWritten;
}

async function runCycle(env) {
  const thresholds = await getSettings(env);
  const failures = [];

  let staleJobsRecovered = [];
  try {
    staleJobsRecovered = await recoverStaleJobs(env);
  } catch (e) {
    failures.push({ stage: "job-watchdog", error: e instanceof Error ? e.message : String(e) });
  }

  // Approved stories always get first access to free AI providers.
  const articlesWrittenFirst = await processQueuedArticles(env, thresholds, failures);

  let discovery = null;
  try {
    discovery = await runDiscovery(env);
  } catch (e) {
    failures.push({ stage: "discovery", error: e instanceof Error ? e.message : String(e) });
  }

  const stories = await getUnscoredStories(env);
  const decisions = [];
  for (const story of stories) {
    try {
      const scores = await scoreStory(env, story); // deterministic: zero AI cost
      const result = await saveDecision(env, story, scores, thresholds);
      decisions.push({ storyId: story.id, title: story.title, ...scores, ...result });
    } catch (e) {
      failures.push({ storyId: story.id, title: story.title, stage: "deterministic-scoring", error: e instanceof Error ? e.message : String(e) });
    }
  }

  let dailyCandidate = null;
  try {
    dailyCandidate = await queueBestDailyCandidate(env, thresholds);
  } catch (e) {
    failures.push({ stage: "daily-candidate-selector", error: e instanceof Error ? e.message : String(e) });
  }

  // HOLD retries are disabled by default in the free acquisition architecture.
  // If an operator explicitly re-enables them, the existing bounded scheduler remains available.
  const holdRetriesQueued = await queueDueHoldRetries(env, thresholds);

  const factCheckJobs = await getQueuedFactCheckJobs(env, thresholds.maxFactChecks);
  const factChecked = [];
  for (const job of factCheckJobs) {
    try {
      factChecked.push(await factCheckStory(env, job, thresholds));
    } catch (e) {
      failures.push({ storyId: job.story_id, stage: "fact-check", error: e instanceof Error ? e.message : String(e) });
    }
  }

  // A fact check can approve and queue a writer in this same cycle. Process it
  // immediately instead of waiting another 15 minutes, while still respecting
  // max article jobs per run and the daily publication cap.
  const articlesWrittenSecond = await processQueuedArticles(env, thresholds, failures);
  const articleMap = new Map();
  for (const item of [...articlesWrittenFirst, ...articlesWrittenSecond]) {
    const key = item.articleId || item.storyId || JSON.stringify(item);
    articleMap.set(key, item);
  }
  const articlesWritten = [...articleMap.values()];

  let qualityGateResults = [];
  try {
    qualityGateResults = await runFinalQualityGate(env, thresholds);
  } catch (e) {
    failures.push({ stage: "final-quality-gate", error: e instanceof Error ? e.message : String(e) });
  }

  let articleImageBackfill = null;
  try {
    articleImageBackfill = await backfillOneMissingArticleImage(env);
  } catch (e) {
    failures.push({ stage: "article-image-backfill", error: e instanceof Error ? e.message : String(e) });
  }

  let publishedArticles = [];
  try {
    publishedArticles = await publishEligibleArticles(env, thresholds);
  } catch (e) {
    failures.push({ stage: "publishing-engine", error: e instanceof Error ? e.message : String(e) });
  }

  let dailyStats = null;
  try {
    dailyStats = await getDailyPipelineStats(env, thresholds);
  } catch {}

  return {
    ok: failures.length === 0,
    architecture: "free-acquisition-engine-v2",
    staleJobsRecovered,
    discovery,
    scoredCount: decisions.length,
    decisions,
    routineScoringAIRequests: 0,
    researchProcessed: 0,
    researched: [],
    dailyCandidate,
    factCheckProcessed: factChecked.length,
    factChecked,
    holdRetriesQueued,
    articlesProcessed: articlesWritten.length,
    articlesWritten,
    qualityGateProcessed: qualityGateResults.length,
    qualityGateResults,
    articleImageBackfill,
    publishedCount: publishedArticles.length,
    publishedArticles,
    dailyStats,
    providers: providerStatus(env, thresholds),
    failedCount: failures.length,
    failures,
    thresholds,
  };
}

export default {
  async fetch(
    request,
    env
  ) {
    const url =
      new URL(
        request.url
      );

    if (
      url.pathname ===
      "/health"
    ) {
      return Response.json({
        ok: true,

        service:
          "aura-intelligence-automation",

        stage:
          "free-acquisition-engine-v2-framer-v1-stable",

        architecture: "deterministic-first-ai-last",
        geminiConfigured: Boolean(env.GEMINI_API_KEY),
        groqConfigured: Boolean(env.GROQ_API_KEY),
        pexelsConfigured: Boolean(env.PEXELS_API_KEY),
        cloudflareAIFallbackDefault: false,
      });
    }

    if (
      url.pathname ===
        "/run" &&
      request.method ===
        "POST"
    ) {
      if (
        request.headers.get(
          "authorization"
        ) !==
        `Bearer ${env.CRON_SECRET}`
      ) {
        return Response.json(
          {
            ok: false,
            error:
              "Unauthorized",
          },

          {
            status: 401,
          }
        );
      }

      try {
        return Response.json(
          await runCycle(
            env
          )
        );

      } catch (e) {
        return Response.json(
          {
            ok: false,

            error:
              e instanceof Error
                ? e.message
                : String(e),
          },

          {
            status: 500,
          }
        );
      }
    }

    return Response.json({
      ok: true,

      service:
        "Aura Digital Intelligence automation",

      stage:
        "free-acquisition-engine-v2-framer-v1-stable",

      endpoints: [
        "GET /health",
        "POST /run",
      ],
    });
  },

  async scheduled(
    controller,
    env,
    ctx
  ) {
    ctx.waitUntil(
      runCycle(env).catch(
        (e) =>
          console.error(
            "Scheduled cycle failed:",
            e
          )
      )
    );
  },
};