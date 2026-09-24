import type { AttemptRow } from "@/lib/consortium-intelligence/number-analysis";
import { profileNames } from "@/lib/data/consortium-engine";
import { createClient } from "@/lib/supabase/server";

export type FindingRow = {
  id: string;
  code: string;
  category: "ANOMALY" | "RISK" | "PATTERN" | "INCONSISTENCY" | "OPPORTUNITY" | "ALERT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  explanation: string;
  evidence: Record<string, unknown>;
  detector: string;
  requiresHumanReview: boolean;
  assemblyId: string | null;
  groupId: string | null;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
  occurrences: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
};

export async function listFindings(organizationId: string): Promise<FindingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_intelligence_findings")
    .select("id, code, category, severity, confidence, title, explanation, evidence, detector, requires_human_review, assembly_id, group_id, status, occurrences, first_detected_at, last_detected_at, reviewed_by, reviewed_at, review_notes")
    .eq("organization_id", organizationId)
    .order("last_detected_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  type Raw = Record<string, unknown> & { reviewed_by: string | null };
  const rows = (data ?? []) as Raw[];
  const names = await profileNames(rows.map((r) => r.reviewed_by));
  return rows.map((r) => ({
    id: r.id as string,
    code: r.code as string,
    category: r.category as FindingRow["category"],
    severity: r.severity as FindingRow["severity"],
    confidence: r.confidence as FindingRow["confidence"],
    title: r.title as string,
    explanation: r.explanation as string,
    evidence: (r.evidence ?? {}) as Record<string, unknown>,
    detector: r.detector as string,
    requiresHumanReview: r.requires_human_review as boolean,
    assemblyId: r.assembly_id as string | null,
    groupId: r.group_id as string | null,
    status: r.status as FindingRow["status"],
    occurrences: r.occurrences as number,
    firstDetectedAt: r.first_detected_at as string,
    lastDetectedAt: r.last_detected_at as string,
    reviewedByName: r.reviewed_by ? (names[r.reviewed_by] ?? null) : null,
    reviewedAt: r.reviewed_at as string | null,
    reviewNotes: r.review_notes as string | null,
  }));
}

export type SimulationRow = {
  id: string;
  assemblyId: string | null;
  title: string;
  scenario: Record<string, unknown>;
  result: { status: string; errors: string[]; contemplations: { quotaNumber: number; quotaLabel: string; method: string; via: string }[]; resources: { available: number; capacity: number; drawSlots: number; status: string } | null; notes: string[] };
  comparison: { identical: boolean; added: number[]; removed: number[]; hashDiffs: string[] } | null;
  resultHash: string;
  createdByName: string | null;
  createdAt: string;
};

export async function listSimulations(organizationId: string): Promise<SimulationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_simulations")
    .select("id, assembly_id, title, scenario, result, comparison, result_hash, created_by, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  type Raw = { id: string; assembly_id: string | null; title: string; scenario: Record<string, unknown>; result: SimulationRow["result"]; comparison: SimulationRow["comparison"]; result_hash: string; created_by: string | null; created_at: string };
  const rows = (data ?? []) as Raw[];
  const names = await profileNames(rows.map((r) => r.created_by));
  return rows.map((r) => ({
    id: r.id,
    assemblyId: r.assembly_id,
    title: r.title,
    scenario: r.scenario,
    result: r.result,
    comparison: r.comparison,
    resultHash: r.result_hash,
    createdByName: r.created_by ? (names[r.created_by] ?? null) : null,
    createdAt: r.created_at,
  }));
}

export type AutomationRow = {
  id: string;
  job: string;
  triggerKind: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  summary: string;
  details: Record<string, unknown>;
  startedAt: string;
  finishedAt: string;
  createdByName: string | null;
};

export async function listAutomationRuns(organizationId: string): Promise<AutomationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_automation_runs")
    .select("id, job, trigger_kind, status, summary, details, started_at, finished_at, created_by")
    .eq("organization_id", organizationId)
    .order("started_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  type Raw = { id: string; job: string; trigger_kind: string; status: AutomationRow["status"]; summary: string; details: Record<string, unknown>; started_at: string; finished_at: string; created_by: string | null };
  const rows = (data ?? []) as Raw[];
  const names = await profileNames(rows.map((r) => r.created_by));
  return rows.map((r) => ({
    id: r.id,
    job: r.job,
    triggerKind: r.trigger_kind,
    status: r.status,
    summary: r.summary,
    details: r.details ?? {},
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    createdByName: r.created_by ? (names[r.created_by] ?? null) : null,
  }));
}

/** Tentativas dos cálculos VIGENTES de sorteio de um grupo (histórico). */
export async function listAttemptRowsForGroup(organizationId: string, groupId: string): Promise<AttemptRow[]> {
  const supabase = await createClient();
  const { data: asm, error } = await supabase.from("consortium_assemblies").select("id").eq("organization_id", organizationId).eq("group_id", groupId);
  if (error) throw error;
  const assemblyIds = (asm ?? []).map((a) => a.id as string);
  if (!assemblyIds.length) return [];
  const { data: runs, error: runError } = await supabase
    .from("consortium_draw_runs")
    .select("id")
    .in("assembly_id", assemblyIds)
    .eq("phase", "DRAW")
    .eq("status", "CURRENT");
  if (runError) throw runError;
  const runIds = (runs ?? []).map((r) => r.id as string);
  if (!runIds.length) return [];
  const { data: nums, error: numError } = await supabase
    .from("consortium_draw_numbers")
    .select("assembly_id, number_text, number_type, quota_number, outcome, reason, candidate_order, attempt")
    .in("run_id", runIds)
    .order("assembly_id")
    .order("attempt")
    .limit(20_000);
  if (numError) throw numError;
  return ((nums ?? []) as { assembly_id: string; number_text: string; number_type: string; quota_number: number | null; outcome: string; reason: string | null; candidate_order: number | null }[]).map((n) => ({
    assemblyId: n.assembly_id,
    numberText: n.number_text,
    numberType: n.number_type,
    quotaNumber: n.quota_number,
    outcome: n.outcome,
    reason: n.reason,
    candidateOrder: n.candidate_order,
  }));
}
