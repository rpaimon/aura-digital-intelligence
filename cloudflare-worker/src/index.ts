// @ts-nocheck

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DEFAULT_BATCH = 6;
const DEFAULT_RESEARCH_BATCH = 1;

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
    "settings?select=key,value&key=in.(watch_priority_threshold,research_priority_threshold,max_research_per_run)"
  );

  if (!r.ok) {
    return {
      watch: 50,
      research: 72,
      maxResearch: DEFAULT_RESEARCH_BATCH,
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
          "decision-and-research-json-mode",

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
        "decision-and-research-json-mode",

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