# Fact Check v7 — Core Fix

## What was actually broken

The independent-source retrieval layer is no longer the blocker. v4 proved that the worker can discover and extract multiple independent publisher sources (`candidateCount: 8`, `independentSourceCount: 3`, Browser Run available).

The remaining failure was architectural: the fact checker depended on one LLM response containing a non-empty `claim_checks` array. Workers AI JSON Mode is helpful, but Cloudflare explicitly documents that schema compliance is not guaranteed in every case. The model returned a valid-looking object with `safe_facts` and an approve recommendation while still returning `claim_checks: []`. Because confidence was correctly fail-closed, the pipeline stayed at confidence 0 forever.

## v7 solution

v7 removes the brittle empty-array dependency:

1. The application creates the list of claims first (maximum 5 central claims).
2. The LLM does **not** generate the claim list.
3. A dynamic JSON schema creates fixed required keys: `claim_1`, `claim_2`, etc.
4. Code maps those fixed slots back to the original claim text.
5. If a slot is missing, only that single claim is retried with a tiny schema.
6. If the repair still fails, that claim is deterministically marked `unverified` instead of making the entire result structurally empty.
7. `supported` is automatically downgraded unless it links to at least **two** independent evidence sources.
8. Invalid source numbers are discarded.
9. `safe_facts` are derived by code only from fully supported claims; the model cannot invent the safe-facts list.
10. Final confidence and APPROVE/HOLD are calculated by code. The model no longer supplies the final confidence or approval decision.
11. The unverified preliminary research package is removed from the verification prompt so it cannot bias the verifier. The verifier sees only the claims and retrieved independent evidence.

## Safety gate

A story can reach APPROVE only when all of these are true:

- At least the configured minimum number of independent publishers exists (currently 2).
- Deterministic confidence is at least the configured threshold (currently 75).
- At least 60% of checked claims are fully supported.
- A fully supported claim references at least 2 valid independent sources.
- No claim-level conflict remains.

Otherwise the story remains HOLD. Auto-publishing should remain disabled until article-writing quality is tested.

## Free-tier design

The normal path uses one Workers AI verification call per fact-check story. Extra calls happen only for claim slots missing from the structured response. This limits AI usage while making malformed structured outputs recoverable.

## Deployment

1. Copy this package over the current project. Keep `.git` and `.env.local`.
2. Commit/push and wait for Vercel Ready.
3. Copy `cloudflare-worker/src/index.ts` into the live Cloudflare `worker.js` and Deploy.
4. Confirm `/health` says `fact-check-v7-fixed-claim-verification`.
5. Run `supabase/migrations/008_fact_check_v7_fixed_claim_retry.sql` once.
6. Trigger one `/run`.

Expected diagnostics include:

- `factCheckEngine: v7-fixed-claim-slots`
- `claimCheckCount` greater than 0
- `claimRepairCount` (normally 0)
- `claimRepairFailures` (normally 0)
- `confidenceMetrics`
- `independentSourceCount`
- final `confidence` and `verdict`

Do not lower the verification thresholds just to get an approval.
