import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, SearchCheck, ShieldAlert, XCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EvidenceSource = {
  title?: string;
  url?: string;
  source_name?: string;
  domain?: string;
};

type ClaimCheck = {
  claim?: string;
  status?: string;
  explanation?: string;
  source_indexes?: number[];
};

type FactCheckRow = {
  id: string;
  story_id: string;
  verdict: string;
  confidence: number;
  independent_source_count: number;
  summary: string | null;
  claim_checks: unknown;
  evidence_sources: unknown;
  conflicts: unknown;
  missing_evidence: unknown;
  safe_facts: unknown;
  writing_constraints: unknown;
  checked_at: string;
  stories: {
    title: string;
    source_url: string;
    priority_score: number | null;
    verification_status: string | null;
  } | null;
};

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function evidence(value: unknown) {
  return Array.isArray(value) ? (value.filter((item) => item && typeof item === "object") as EvidenceSource[]) : [];
}

function claims(value: unknown) {
  return Array.isArray(value) ? (value.filter((item) => item && typeof item === "object") as ClaimCheck[]) : [];
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const style = verdict === "approve"
    ? "bg-emerald-100 text-emerald-800"
    : verdict === "reject"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";

  const Icon = verdict === "approve" ? CheckCircle2 : verdict === "reject" ? XCircle : ShieldAlert;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${style}`}>
      <Icon size={12} /> {verdict}
    </span>
  );
}

export default async function FactChecksPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fact_checks")
    .select("id,story_id,verdict,confidence,independent_source_count,summary,claim_checks,evidence_sources,conflicts,missing_evidence,safe_facts,writing_constraints,checked_at,stories(title,source_url,priority_score,verification_status)")
    .order("checked_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as unknown as FactCheckRow[];
  const approved = rows.filter((row) => row.verdict === "approve").length;
  const held = rows.filter((row) => row.verdict === "hold").length;
  const rejected = rows.filter((row) => row.verdict === "reject").length;

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#101114]">
      <header className="border-b border-[#e5e1db] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5">
          <Link href="/admin/dashboard" className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e1db] hover:bg-[#f7f5f2]" aria-label="Back to dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Quality gate</p>
            <h1 className="mt-1 text-xl font-black">Fact Checks</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Checked" value={rows.length} />
          <Stat label="Approved" value={approved} />
          <Stat label="On hold" value={held} />
          <Stat label="Rejected" value={rejected} />
        </div>

        <div className="mt-6 rounded-3xl border border-[#e5e1db] bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Multi-source verification</p>
              <h2 className="mt-1 text-2xl font-black">Claim-level evidence review</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-gray-500">
              APPROVE requires multiple independent sources and the configured confidence threshold. Weak or conflicting evidence is automatically held back from writing.
            </p>
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error.message}</p>}

          <div className="mt-6 divide-y divide-[#eeeae4]">
            {rows.map((row) => {
              const sources = evidence(row.evidence_sources);
              const claimRows = claims(row.claim_checks);
              const conflicts = arrayOfStrings(row.conflicts);
              const missing = arrayOfStrings(row.missing_evidence);
              const safeFacts = arrayOfStrings(row.safe_facts);
              const constraints = arrayOfStrings(row.writing_constraints);

              return (
                <article key={row.id} className="py-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <VerdictBadge verdict={row.verdict} />
                    <span className="text-xs font-black text-gray-600">Confidence {Math.round(Number(row.confidence))}</span>
                    <span className="text-xs font-black text-gray-600">Independent sources {row.independent_source_count}</span>
                    <span className="text-xs font-black text-gray-600">Priority {row.stories?.priority_score == null ? "—" : Math.round(Number(row.stories.priority_score))}</span>
                  </div>

                  <h3 className="mt-3 text-lg font-black">{row.stories?.title ?? "Unknown story"}</h3>
                  {row.summary && <p className="mt-2 max-w-5xl text-sm leading-6 text-gray-600">{row.summary}</p>}

                  {claimRows.length > 0 && (
                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                      {claimRows.slice(0, 8).map((claim, index) => (
                        <div key={index} className="rounded-2xl border border-[#e9e4dd] bg-[#fbfaf8] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Claim {index + 1}</p>
                            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-gray-700">{claim.status ?? "unknown"}</span>
                          </div>
                          <p className="mt-2 text-sm font-bold leading-5">{claim.claim ?? "Unnamed claim"}</p>
                          {claim.explanation && <p className="mt-2 text-xs leading-5 text-gray-500">{claim.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {sources.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-500">Independent evidence</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sources.map((source, index) => (
                          <a key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs font-black hover:bg-[#f7f5f2]">
                            {source.source_name || source.domain || `Source ${index + 1}`} <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {(conflicts.length > 0 || missing.length > 0 || constraints.length > 0) && (
                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                      <InfoList title="Conflicts" items={conflicts} />
                      <InfoList title="Missing evidence" items={missing} />
                      <InfoList title="Writing constraints" items={constraints} />
                    </div>
                  )}

                  {safeFacts.length > 0 && (
                    <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Safe facts for the future writer</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-emerald-950">
                        {safeFacts.slice(0, 8).map((item, index) => <li key={index}>• {item}</li>)}
                      </ul>
                    </div>
                  )}

                  {row.stories?.source_url && (
                    <a href={row.stories.source_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-gray-600 hover:text-black">
                      Original story <ExternalLink size={12} />
                    </a>
                  )}
                </article>
              );
            })}

            {!rows.length && !error && (
              <div className="py-14 text-center text-gray-500">
                <SearchCheck className="mx-auto" />
                <p className="mt-3 font-black text-[#101114]">No fact checks yet</p>
                <p className="mt-1 text-sm">Completed research packages will be verified automatically.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[#e5e1db] bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-[#e9e4dd] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">{title}</p>
      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-gray-600">
        {items.slice(0, 6).map((item, index) => <li key={index}>• {item}</li>)}
      </ul>
    </div>
  );
}
