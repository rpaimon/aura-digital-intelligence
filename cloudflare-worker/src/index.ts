// @ts-nocheck

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DEFAULT_BATCH = 6;
const DEFAULT_RESEARCH_BATCH = 1;
const DEFAULT_FACT_CHECK_BATCH = 1;
const DEFAULT_ARTICLE_BATCH = 1;
const DEFAULT_HOLD_RETRY_BATCH = 1;

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
    "settings?select=key,value&key=in.(watch_priority_threshold,research_priority_threshold,max_research_per_run,max_fact_checks_per_run,fact_check_min_sources,fact_check_approve_confidence,max_articles_per_run,max_articles_per_day,article_writer_enabled,article_min_fact_confidence,fact_check_hold_retry_enabled,fact_check_hold_retry_max,fact_check_hold_retry_minutes)"
  );

  if (!r.ok) {
    return {
      watch: 50,
      research: 72,
      maxResearch: DEFAULT_RESEARCH_BATCH,
      maxFactChecks: DEFAULT_FACT_CHECK_BATCH,
      factCheckMinSources: 2,
      factCheckApproveConfidence: 75,
      maxArticles: DEFAULT_ARTICLE_BATCH,
      maxArticlesPerDay: 8,
      articleWriterEnabled: true,
      articleMinFactConfidence: 75,
      holdRetryEnabled: true,
      holdRetryMax: 4,
      holdRetryMinutes: 360,
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

    maxResearch: Math.max(
      1,
      Math.min(
        2,
        Number(
          env.MAX_RESEARCH_PER_RUN ??
            map.max_research_per_run ??
            DEFAULT_RESEARCH_BATCH
        ) || DEFAULT_RESEARCH_BATCH
      )
    ),

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
    maxArticlesPerDay: Math.max(
      1,
      Math.min(20, Number(map.max_articles_per_day ?? 8) || 8)
    ),
    articleWriterEnabled: map.article_writer_enabled !== false,
    articleMinFactConfidence: Math.max(
      60,
      Math.min(95, Number(map.article_min_fact_confidence ?? 75) || 75)
    ),
    holdRetryEnabled: map.fact_check_hold_retry_enabled !== false,
    holdRetryMax: Math.max(0, Math.min(6, Number(map.fact_check_hold_retry_max ?? 4) || 4)),
    holdRetryMinutes: Math.max(60, Math.min(2880, Number(map.fact_check_hold_retry_minutes ?? 360) || 360)),
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
      "id,source_url,title,description,category,published_at,discovered_at,sources(name,trust_score)",

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

async function scoreStory(
  env,
  story
) {
  const trust =
    clampScore(
      story.sources
        ?.trust_score ?? 70
    );

  const prompt = `
Score this technology/news story for Aura Digital Intelligence from 0 to 100.

importance:
Global technology/business significance.

fiji_relevance:
Realistic relevance to Fiji or Pacific markets,
organisations, consumers, businesses or regulation.
Do not force a Fiji angle.

business_relevance:
Usefulness to business owners, managers,
entrepreneurs or decision makers.

aura_service_relevance:
Relevance to web development,
ecommerce,
mobile apps,
AI automation,
cybersecurity,
cloud,
SEO,
digital marketing,
or digital transformation.

Source trust:
${trust}/100

Title:
${story.title}

Category:
${story.category ?? "Unknown"}

Description:
${(
  story.description ??
  "No description"
).slice(0, 1800)}
`;

  const raw =
    await env.AI.run(
      env.AI_MODEL ||
        DEFAULT_MODEL,

      {
        messages: [
          {
            role: "system",

            content:
              "You are a conservative technology-news scoring engine. Do not invent facts.",
          },

          {
            role: "user",
            content: prompt,
          },
        ],

        response_format: {
          type: "json_schema",
          json_schema:
            SCORE_SCHEMA,
        },

        max_tokens: 300,

        temperature: 0.1,
      }
    );

  const p =
    parseStructured(raw);

  return {
    importance:
      clampScore(
        p.importance
      ),

    fiji_relevance:
      clampScore(
        p.fiji_relevance
      ),

    business_relevance:
      clampScore(
        p.business_relevance
      ),

    aura_service_relevance:
      clampScore(
        p.aura_service_relevance
      ),

    reason:
      String(
        p.reason ||
          "Scored by Workers AI"
      ).slice(0, 400),
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

  const status =
    d === "ignore"
      ? "rejected"
      : d === "research"
        ? "researching"
        : "scored";

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

  if (
    d === "research"
  ) {
    await enqueueResearch(
      env,
      story.id,
      p
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
        "id,story_id,priority,stories(id,source_url,title,description,category,published_at,sources(name,trust_score))",

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


function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || `story-${Date.now()}`;
}

function asStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
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

async function countArticlesGeneratedToday(env) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const response = await sb(
    env,
    `articles?select=id&generated_at=gte.${encodeURIComponent(start.toISOString())}&limit=100`
  );
  if (!response.ok) return 0;
  const rows = await response.json();
  return Array.isArray(rows) ? rows.length : 0;
}

async function getQueuedArticleJobs(env, limit) {
  const query = new URLSearchParams({
    select:
      "id,story_id,priority,attempts,max_attempts,stories(id,source_url,title,description,category,published_at,priority_score,verification_status,verification_confidence)",
    job_type: "eq.write_article",
    status: "eq.queued",
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
    `fact_checks?select=id,verdict,confidence,independent_source_count,summary,claim_checks,evidence_sources,conflicts,missing_evidence,safe_facts,writing_constraints&story_id=eq.${encodeURIComponent(storyId)}&limit=1`
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
  const words = String(article.content || "").trim().split(/\s+/).filter(Boolean).length;
  let score = 0;

  if (factCheck?.verdict === "approve") score += 30;
  score += Math.min(20, Math.round(confidence * 0.2));
  if (sourceCount >= 2) score += 10;
  if (safeFacts.length >= 2) score += 10;
  else if (safeFacts.length === 1) score += 5;
  if (String(article.title || "").length >= 25 && String(article.title || "").length <= 85) score += 5;
  if (String(article.seo_title || "").length > 0 && String(article.seo_title || "").length <= 65) score += 5;
  const seoLen = String(article.seo_description || "").length;
  if (seoLen >= 110 && seoLen <= 170) score += 5;
  if (words >= 350 && words <= 1000) score += 10;
  if (/##\s+Sources/i.test(String(article.content || ""))) score += 5;

  return { score: Math.min(100, score), wordCount: words };
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

async function writeArticle(env, job, settings) {
  const story = job.stories;
  const currentAttempt = Number(job.attempts || 0) + 1;
  const maxAttempts = Math.max(1, Number(job.max_attempts || 3));
  await updateJob(env, job.id, {
    status: "processing",
    attempts: currentAttempt,
    started_at: new Date().toISOString(),
    error_message: null,
  });

  try {
    const factCheck = await getApprovedFactCheck(env, story.id);
    if (!factCheck) throw new Error("No fact check found for article writer");
    if (factCheck.verdict !== "approve") {
      throw new Error(`Article writer blocked: fact-check verdict is ${factCheck.verdict}`);
    }
    if (Number(factCheck.confidence || 0) < settings.articleMinFactConfidence) {
      throw new Error(
        `Article writer blocked: fact-check confidence ${factCheck.confidence} is below ${settings.articleMinFactConfidence}`
      );
    }
    const conflicts = asStringArray(factCheck.conflicts);
    if (conflicts.length) throw new Error("Article writer blocked: unresolved fact-check conflicts exist");

    const safeFacts = asStringArray(factCheck.safe_facts);
    if (!safeFacts.length) throw new Error("Article writer blocked: no verified safe facts available");
    const constraints = asStringArray(factCheck.writing_constraints);
    const evidenceSources = Array.isArray(factCheck.evidence_sources) ? factCheck.evidence_sources : [];
    const sourceList = evidenceSources
      .slice(0, 5)
      .map((source, index) => `SOURCE ${index + 1}: ${source.source_name || source.domain || "Publisher"} — ${source.title || "Coverage"} — ${source.url || ""}`)
      .join("\n");

    const prompt = `
Write an original Aura Digital Intelligence technology article for business readers in Fiji and the Pacific.

NON-NEGOTIABLE FACT RULES:
- The SAFE FACTS below are the only factual claims you may state as established fact.
- Do not add dates, numbers, names, quotes, causes, technical details, impacts or background facts unless they appear in SAFE FACTS.
- You may explain why the verified facts could matter to businesses, but clearly frame interpretation as analysis, not as additional fact.
- Never claim a Fiji/Pacific impact unless it follows logically from the safe facts; do not invent local relevance.
- Do not copy source wording. Synthesize in original language.
- Do not include a Sources section; application code adds the verified source list automatically.
- Aim for 450-750 words. If the safe facts are too limited, write a shorter, tighter article rather than padding with unsupported material.
- Use Markdown headings. Keep the tone clear, professional and useful, not sensational.

ORIGINAL STORY TITLE:
${story.title}

CATEGORY:
${story.category || "Technology"}

VERIFIED SAFE FACTS:
${safeFacts.map((fact, index) => `${index + 1}. ${fact}`).join("\n")}

WRITING CONSTRAINTS:
${constraints.length ? constraints.map((item) => `- ${item}`).join("\n") : "- None beyond the safe-fact rule."}

INDEPENDENT SOURCE LABELS FOR CONTEXT ONLY:
${sourceList || "No source labels supplied"}

Return a useful headline, subtitle, short excerpt, Markdown article body, category, SEO title, SEO description, and comma-separated keywords.
`;

    const raw = await env.AI.run(env.AI_MODEL || DEFAULT_MODEL, {
      messages: [
        {
          role: "system",
          content:
            "You are a conservative newsroom writer. Factual accuracy is more important than length. Use only verified safe facts as factual claims and never invent details.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: ARTICLE_SCHEMA },
      max_tokens: 2200,
      temperature: 0.2,
    });

    const generated = parseStructured(raw);
    const title = String(generated.title || story.title).replace(/\s+/g, " ").trim().slice(0, 180);
    const slugBase = slugify(title);
    const slug = `${slugBase}-${String(story.id).slice(0, 8)}`;
    const content = appendDeterministicSources(generated.content, evidenceSources);
    const normalizedArticle = {
      title,
      subtitle: String(generated.subtitle || "").trim().slice(0, 260),
      excerpt: String(generated.excerpt || "").trim().slice(0, 500),
      content,
      category: String(generated.category || story.category || "Technology").trim().slice(0, 100),
      seo_title: String(generated.seo_title || title).replace(/\s+/g, " ").trim().slice(0, 70),
      seo_description: String(generated.seo_description || generated.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 180),
      keywords: String(generated.keywords || "").replace(/\s+/g, " ").trim().slice(0, 500),
    };

    const quality = articleQualityScore(normalizedArticle, factCheck);
    const authorId = await getDefaultAuthorId(env);
    const status = quality.score >= 85 ? "review" : "draft";
    const now = new Date().toISOString();
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
      status,
      quality_score: quality.score,
      quality_notes: {
        fact_check_confidence: Number(factCheck.confidence || 0),
        independent_source_count: Number(factCheck.independent_source_count || 0),
        safe_fact_count: safeFacts.length,
        word_count: quality.wordCount,
        writer: "verified-safe-facts-v1",
      },
      seo_keywords: normalizedArticle.keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12),
      fact_check_id: factCheck.id,
      generation_model: env.AI_MODEL || DEFAULT_MODEL,
      generated_at: now,
      updated_at: now,
    };

    const existingArticleResponse = await sb(
      env,
      `articles?select=id&story_id=eq.${encodeURIComponent(story.id)}&limit=1`
    );
    const existingArticleRows = existingArticleResponse.ok
      ? await existingArticleResponse.json()
      : [];
    const save = existingArticleRows.length
      ? await sb(env, `articles?id=eq.${encodeURIComponent(existingArticleRows[0].id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(articlePayload),
        })
      : await sb(env, "articles", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(articlePayload),
        });
    if (!save.ok) {
      throw new Error(
        `Article save failed (${save.status}): ${(await save.text()).slice(0, 400)}`
      );
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
          throw new Error(
            `Article source save failed (${sourcesSave.status}): ${(await sourcesSave.text()).slice(0, 300)}`
          );
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
      },
      finished_at: now,
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
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      await updateJob(env, job.id, {
        status: currentAttempt < maxAttempts ? "queued" : "failed",
        attempts: currentAttempt,
        error_message: message,
        started_at: null,
        finished_at: currentAttempt < maxAttempts ? null : new Date().toISOString(),
      });
    } catch {}
    throw error;
  }
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

      attempts: 1,

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
      payload: { reason: "research package completed" },
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
      "id,story_id,priority,stories(id,source_url,title,description,category,published_at,priority_score,sources(name,trust_score))",
    job_type: "eq.fact_check_story",
    status: "eq.queued",
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

function buildClaimsToVerify(research, story) {
  const candidates = [];

  if (Array.isArray(research?.claims_to_verify)) {
    candidates.push(...research.claims_to_verify);
  }

  if (Array.isArray(research?.key_facts)) {
    candidates.push(...research.key_facts);
  }

  if (!candidates.length && story?.title) {
    candidates.push(story.title);
  }

  const seen = new Set();
  return candidates
    .map((value) => String(value || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    // Five central claims keeps the verification prompt small enough for the
    // free tier while still giving the quality gate enough evidence to decide.
    .slice(0, 5);
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

async function runFactCheckAI(env, claims, prompt) {
  const raw = await env.AI.run(env.AI_MODEL || DEFAULT_MODEL, {
    messages: [
      {
        role: "system",
        content:
          "You are a conservative newsroom fact checker. Verify only the supplied claims against only the supplied independent evidence. Do not rewrite the claims and do not invent facts or sources.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: buildFactCheckSchema(claims.length),
    },
    max_tokens: 1200,
    temperature: 0,
  });

  return parseStructured(raw);
}

async function repairSingleClaim(env, claim, evidenceText, claimNumber) {
  const raw = await env.AI.run(env.AI_MODEL || DEFAULT_MODEL, {
    messages: [
      {
        role: "system",
        content:
          "Verify one factual claim against the supplied independent evidence. Use only source numbers present in the evidence. If support is insufficient, return unverified.",
      },
      {
        role: "user",
        content: `CLAIM ${claimNumber}: ${claim}\n\nEVIDENCE:\n${evidenceText.slice(0, 12000)}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: buildSingleClaimSchema(),
    },
    max_tokens: 350,
    temperature: 0,
  });

  return parseStructured(raw);
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
    attempts: 1,
    started_at: new Date().toISOString(),
    error_message: null,
  });

  try {
    const researchPackage = await getResearchPackage(env, story.id);
    if (!researchPackage) {
      throw new Error("No completed research package found for this story");
    }

    const retrieval = await collectIndependentEvidence(env, story);
    const evidence = retrieval.evidence;
    const retrievalDiagnostics = retrieval.diagnostics;
    const research =
      researchPackage.key_facts && typeof researchPackage.key_facts === "object"
        ? researchPackage.key_facts
        : { summary: researchPackage.notes || "" };

    const evidenceText = evidence.length
      ? evidence
          .map(
            (source) => `SOURCE ${source.index}\nPublisher: ${source.source_name}\nURL: ${source.url}\nTitle: ${source.title}\nEvidence: ${source.excerpt}`
          )
          .join("\n\n---\n\n")
      : "No usable independent source text could be retrieved.";

    // Save free Workers AI quota: if we still do not have the minimum number
    // of independent publishers, HOLD deterministically instead of asking AI
    // to verify claims from insufficient evidence.
    if (evidence.length < settings.factCheckMinSources) {
      const insufficientPackage = {
        verdict: "hold",
        confidence: evidence.length === 0 ? 0 : 30,
        summary:
          evidence.length === 0
            ? "Fact check held because no usable independent publisher evidence could be retrieved."
            : `Fact check held because only ${evidence.length} independent publisher source was retrievable; ${settings.factCheckMinSources} are required.`,
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

      const saved = await saveFactCheck(
        env,
        story,
        researchPackage,
        evidence,
        insufficientPackage,
        settings
      );

      await updateJob(env, job.id, {
        status: "completed",
        result: {
          ...saved,
          aiVerdict: "not-run-insufficient-sources",
          retrievalMethods: evidence.map((item) => item.fetch_method),
          evidenceDomains: evidence.map((item) => item.domain),
          retrievalDiagnostics,
          sourceDiscovery: evidence.map((item) => ({
            title: item.title,
            url: item.url,
            source_name: item.source_name,
            domain: item.domain,
            discovery: item.discovery,
            fetch_method: item.fetch_method,
          })),
        },
        finished_at: new Date().toISOString(),
      });

      return {
        storyId: story.id,
        title: story.title,
        ...saved,
        retrievalMethods: evidence.map((item) => item.fetch_method),
        evidenceDomains: evidence.map((item) => item.domain),
        candidateCount: retrievalDiagnostics.candidateCount,
        browserAvailable: retrievalDiagnostics.browserAvailable,
        retrievalDiagnostics,
      };
    }

    const claimsToVerify = buildClaimsToVerify(research, story);
    const numberedClaims = claimsToVerify
      .map((claim, index) => `CLAIM ${index + 1}: ${claim}`)
      .join("\n");

    // Keep the verification prompt intentionally narrow. The preliminary
    // research package is NOT supplied here because it is unverified and can
    // bias the verifier. The model sees only the claims and independent evidence.
    const prompt = `
Verify each numbered claim using ONLY the independent evidence below.

For each claim:
- supported = at least two independent SOURCE numbers directly support it
- partial = only one source supports it, or the evidence supports only part of it
- conflicted = credible sources materially disagree
- unverified = the supplied evidence does not support it

Use source_indexes only from the SOURCE numbers below. Do not invent sources.

CLAIMS:
${numberedClaims || `CLAIM 1: ${normalizeSearchTitle(story.title)}`}

INDEPENDENT EVIDENCE (${evidence.length} sources):
${evidenceText.slice(0, 12000)}
`;

    const rawPackage = await runFactCheckAI(env, claimsToVerify, prompt);
    const normalized = normalizeFactCheckPackage(
      rawPackage,
      claimsToVerify,
      evidence.length
    );

    let claimRepairCount = 0;
    let claimRepairFailures = 0;

    // Cloudflare documents that JSON Mode is not guaranteed to satisfy every
    // schema in extreme cases. Instead of retrying the whole fact check, repair
    // only any missing fixed claim slot with a tiny schema. If that also fails,
    // the deterministic unverified placeholder remains and the story stays HOLD.
    for (const claimIndex of normalized.missingClaimIndexes) {
      try {
        const repaired = await repairSingleClaim(
          env,
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
      } catch {
        claimRepairFailures += 1;
      }
    }

    const aiPackage = finalizeFactCheckPackage(normalized, evidence.length);
    const saved = await saveFactCheck(
      env,
      story,
      researchPackage,
      evidence,
      aiPackage,
      settings
    );

    await updateJob(env, job.id, {
      status: "completed",
      result: {
        ...saved,
        factCheckEngine: "v7-fixed-claim-slots",
        claimRepairCount,
        claimRepairFailures,
        claimCheckCount: Array.isArray(aiPackage.claim_checks) ? aiPackage.claim_checks.length : 0,
        retrievalMethods: evidence.map((item) => item.fetch_method),
        evidenceDomains: evidence.map((item) => item.domain),
        retrievalDiagnostics,
        sourceDiscovery: evidence.map((item) => ({
          title: item.title,
          url: item.url,
          source_name: item.source_name,
          domain: item.domain,
          discovery: item.discovery,
          fetch_method: item.fetch_method,
        })),
      },
      finished_at: new Date().toISOString(),
    });

    return {
      storyId: story.id,
      title: normalizeSearchTitle(story.title),
      ...saved,
      factCheckEngine: "v7-fixed-claim-slots",
      claimRepairCount,
      claimRepairFailures,
      claimCheckCount: Array.isArray(aiPackage.claim_checks) ? aiPackage.claim_checks.length : 0,
      retrievalMethods: evidence.map((item) => item.fetch_method),
      evidenceDomains: evidence.map((item) => item.domain),
      candidateCount: retrievalDiagnostics.candidateCount,
      browserAvailable: retrievalDiagnostics.browserAvailable,
      retrievalDiagnostics,
    };
  } catch (error) {
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

async function runCycle(env) {
  const thresholds =
    await getSettings(env);

  const discovery =
    await runDiscovery(env);

  const holdRetriesQueued = await queueDueHoldRetries(env, thresholds);

  const stories =
    await getUnscoredStories(
      env
    );

  const decisions = [];
  const failures = [];

  for (
    const story of stories
  ) {
    try {
      const scores =
        await scoreStory(
          env,
          story
        );

      const result =
        await saveDecision(
          env,
          story,
          scores,
          thresholds
        );

      decisions.push({
        storyId:
          story.id,

        title:
          story.title,

        ...scores,
        ...result,
      });

    } catch (e) {
      failures.push({
        storyId:
          story.id,

        title:
          story.title,

        stage:
          "scoring",

        error:
          e instanceof Error
            ? e.message
            : String(e),
      });
    }
  }

  const jobs =
    await getQueuedResearchJobs(
      env,
      thresholds.maxResearch
    );

  const researched = [];

  for (
    const job of jobs
  ) {
    try {
      researched.push(
        await researchStory(
          env,
          job
        )
      );

    } catch (e) {
      failures.push({
        storyId:
          job.story_id,

        stage:
          "research",

        error:
          e instanceof Error
            ? e.message
            : String(e),
      });
    }
  }

  const factCheckJobs =
    await getQueuedFactCheckJobs(
      env,
      thresholds.maxFactChecks
    );

  const factChecked = [];

  for (const job of factCheckJobs) {
    try {
      factChecked.push(
        await factCheckStory(
          env,
          job,
          thresholds
        )
      );
    } catch (e) {
      failures.push({
        storyId: job.story_id,
        stage: "fact-check",
        error:
          e instanceof Error
            ? e.message
            : String(e),
      });
    }
  }

  const articlesGeneratedToday = thresholds.articleWriterEnabled
    ? await countArticlesGeneratedToday(env)
    : 0;
  const remainingDailyArticleCapacity = Math.max(
    0,
    thresholds.maxArticlesPerDay - articlesGeneratedToday
  );
  const articleJobs = thresholds.articleWriterEnabled && remainingDailyArticleCapacity > 0
    ? await getQueuedArticleJobs(
        env,
        Math.min(thresholds.maxArticles, remainingDailyArticleCapacity)
      )
    : [];
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

  return {
    ok:
      failures.length === 0,

    discovery,

    scoredCount:
      decisions.length,

    decisions,

    researchProcessed:
      researched.length,

    researched,

    factCheckProcessed:
      factChecked.length,

    factChecked,

    holdRetriesQueued,

    articlesProcessed: articlesWritten.length,

    articlesWritten,

    articlesGeneratedToday,

    remainingDailyArticleCapacity: Math.max(0, remainingDailyArticleCapacity - articlesWritten.length),

    failedCount:
      failures.length,

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
          "article-writer-v1-safe-facts-hold-retry",

        model:
          env.AI_MODEL ||
          DEFAULT_MODEL,
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
        "article-writer-v1-safe-facts-hold-retry",

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