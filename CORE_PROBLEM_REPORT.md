# Aura Digital Intelligence — Fact Check Root Cause Report

## Evidence from the live pipeline

The live v4/v5 run already demonstrated that discovery and evidence retrieval work:

- 8 fact-check candidates found
- 3 usable independent publisher sources extracted
- Browser Run binding available
- zero worker failures

The fact-check still returned confidence 0 because the model output contained an empty `claim_checks` array.

## Root cause

The pipeline treated an LLM-generated array as a required structural control point. That is not sufficiently reliable for a safety gate. Cloudflare Workers AI supports JSON Mode, but Cloudflare documents that it cannot guarantee the model will satisfy the requested JSON Schema in every situation. Therefore `minItems: 1` plus prompting is not enough to make a non-empty model-generated array a dependable production invariant.

The previous prompt also mixed unverified research material with independent evidence. That makes the verifier more vulnerable to confirmation bias because it is shown the claims in narrative form before judging the evidence.

## Correct production pattern

Use the model only for evidence classification, while application code owns structure and policy:

- code defines the claims
- code defines fixed claim slots
- AI classifies each fixed claim against evidence
- code validates source references
- code downgrades unsupported labels
- code derives safe facts
- code calculates confidence
- code decides APPROVE/HOLD

The result is fail-closed without getting stuck on an empty generated array.

## What is intentionally unchanged

The working v4 retrieval chain (GDELT / Google News / Bing News / direct fetch / Jina / Browser Run fallback) is preserved. There is no reason to keep changing source retrieval after it successfully returned 3 independent sources.

## Current platform research used for this fix

Cloudflare Workers AI JSON Mode documentation (updated Sep 14, 2026) states that JSON Mode supports `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, but also explicitly warns that Workers AI cannot guarantee the model will always satisfy the requested JSON Schema. That makes LLM-generated array cardinality unsuitable as the only production invariant for a publishing safety gate.

- https://developers.cloudflare.com/workers-ai/features/json-mode/
- https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/

The free Workers AI allocation is currently 10,000 Neurons per day, so v7 keeps the normal verification path to one AI call and uses small per-claim repair calls only when a fixed slot is missing.

- https://developers.cloudflare.com/workers-ai/platform/pricing/

Browser Run currently includes 10 browser minutes/day on Workers Free. v7 preserves Browser Run only as an evidence-retrieval fallback; it does not add extra browser work.

- https://developers.cloudflare.com/browser-run/pricing/
