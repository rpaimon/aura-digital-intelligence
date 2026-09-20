// @ts-nocheck

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DEFAULT_BATCH = 6;
const DEFAULT_RESEARCH_BATCH = 1;
const DEFAULT_FACT_CHECK_BATCH = 1;

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
    "settings?select=key,value&key=in.(watch_priority_threshold,research_priority_threshold,max_research_per_run,max_fact_checks_per_run,fact_check_min_sources,fact_check_approve_confidence)"
  );

  if (!r.ok) {
    return {
      watch: 50,
      research: 72,
      maxResearch: DEFAULT_RESEARCH_BATCH,
      maxFactChecks: DEFAULT_FACT_CHECK_BATCH,
      factCheckMinSources: 2,
      factCheckApproveConfidence: 75,
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


const FACT_CHECK_SCHEMA = {
  type: "object",

  properties: {
    verdict: {
      type: "string",
      enum: ["approve", "hold", "reject"],
    },

    confidence: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },

    summary: {
      type: "string",
    },

    claim_checks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          status: {
            type: "string",
            enum: ["supported", "partial", "conflicted", "unverified"],
          },
          explanation: { type: "string" },
          source_indexes: {
            type: "array",
            items: { type: "number" },
          },
        },
        required: ["claim", "status", "explanation", "source_indexes"],
      },
    },

    conflicts: {
      type: "array",
      items: { type: "string" },
    },

    missing_evidence: {
      type: "array",
      items: { type: "string" },
    },

    safe_facts: {
      type: "array",
      items: { type: "string" },
    },

    writing_constraints: {
      type: "array",
      items: { type: "string" },
    },
  },

  required: [
    "verdict",
    "confidence",
    "summary",
    "claim_checks",
    "conflicts",
    "missing_evidence",
    "safe_facts",
    "writing_constraints",
  ],
};

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

  const [gdelt, google] = await Promise.all([
    searchGdelt(story.title),
    searchGoogleNews(story.title),
  ]);

  const candidates = [...gdelt];

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

  for (const candidate of candidates) {
    if (evidence.length >= 3) break;

    const fetched = await fetchEvidenceText(env, candidate, story);
    if (!fetched.text) continue;

    const finalCandidate = fetched.candidate || candidate;
    const finalDomain = finalCandidate.domain || hostnameOf(finalCandidate.url);

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

  return evidence;
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

function finalFactCheckVerdict(aiPackage, independentSourceCount, settings) {
  let verdict = ["approve", "hold", "reject"].includes(aiPackage.verdict)
    ? aiPackage.verdict
    : "hold";

  const confidence = clampScore(aiPackage.confidence);
  const conflicts = Array.isArray(aiPackage.conflicts) ? aiPackage.conflicts : [];

  if (
    verdict === "approve" &&
    (independentSourceCount < settings.factCheckMinSources ||
      confidence < settings.factCheckApproveConfidence ||
      conflicts.length > 0)
  ) {
    verdict = "hold";
  }

  return { verdict, confidence };
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

  return {
    verdict: final.verdict,
    confidence: final.confidence,
    independentSourceCount: evidence.length,
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

    const evidence = await collectIndependentEvidence(env, story);
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
      };
    }

    const prompt = `
Fact-check this researched technology story for Aura Digital Intelligence.

Your task is claim-by-claim verification, not rewriting.

Rules:
- Treat the original research package as claims that need verification.
- Independent evidence is listed as SOURCE 1, SOURCE 2, etc.
- Never claim verification from a source that does not actually support the claim.
- If evidence is insufficient, mark the claim unverified and choose HOLD.
- If credible sources materially contradict the central claim, choose REJECT or HOLD.
- APPROVE only when the central claims are supported by multiple independent sources.
- Do not invent Fiji/Pacific relevance or facts.

Original story title:
${normalizeSearchTitle(story.title)}

Original URL:
${story.source_url}

Preliminary research package:
${JSON.stringify(research).slice(0, 9000)}

Independent evidence (${evidence.length} usable sources):
${evidenceText.slice(0, 15000)}
`;

    const raw = await env.AI.run(env.AI_MODEL || DEFAULT_MODEL, {
      messages: [
        {
          role: "system",
          content:
            "You are a conservative newsroom fact checker. Verify only what the supplied evidence supports. Output the requested JSON schema exactly.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: FACT_CHECK_SCHEMA,
      },
      max_tokens: 1100,
      temperature: 0.1,
    });

    const aiPackage = parseStructured(raw);
    aiPackage.confidence = clampScore(aiPackage.confidence);

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
        aiVerdict: aiPackage.verdict,
        retrievalMethods: evidence.map((item) => item.fetch_method),
        evidenceDomains: evidence.map((item) => item.domain),
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
          "fact-check-retrieval-v3-browser-run-json-mode",

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
        "fact-check-retrieval-v3-browser-run-json-mode",

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