import { formatQuotaNumber } from "@/lib/consortium-engine/numbering.ts";
import type { EligibilitySnapshot, TraceStep } from "@/lib/consortium-engine/types.ts";
import { REASON_LABEL, VIA_LABEL, CONTEMPLATION_METHOD_LABEL } from "@/lib/consortium-engine/labels.ts";
import {
  getAssemblyWorkspace,
  latestSnapshot,
  listDrawNumbers,
  listEngineEvents,
  listEngineRules,
  listAssemblies,
  profileNames,
  type AssemblyWorkspace,
} from "@/lib/data/consortium-engine";
import { getCreditWorkspace } from "@/lib/data/consortium-credit";
import { reproduceInWorkspace } from "@/lib/data/consortium-replay";
import { createClient } from "@/lib/supabase/server";

import type { FindingEvidence } from "./findings";

/**
 * Ferramentas da inteligência. Cada uma: acesso LIMITADO e tipado aos
 * dados (nunca consulta livre ao banco), sempre retornando a evidência
 * (fonte, regra, versão, cálculo, dado). São as mesmas que um modelo de
 * linguagem futuro receberia via tool use (esquemas em agents.ts).
 */

export type ToolResult<T> = { data: T; evidence: FindingEvidence[] };

async function ws(organizationId: string, assemblyId: string): Promise<AssemblyWorkspace> {
  const w = await getAssemblyWorkspace(organizationId, assemblyId);
  if (!w) throw new Error("Assembleia não encontrada.");
  return w;
}

function ruleEvidence(w: AssemblyWorkspace): FindingEvidence {
  return w.rule ? { rule: `${w.rule.name} (${w.rule.ruleKey})`, version: w.rule.version, source: w.rule.regulationReference ?? undefined } : {};
}

function lotteryEvidence(w: AssemblyWorkspace): FindingEvidence {
  return w.lottery ? { source: `Loteria Federal · concurso ${w.lottery.contestNumber} de ${w.lottery.drawDate} (hash ${w.lottery.contentHash.slice(0, 12)}…)` } : {};
}

export async function getAssembly(organizationId: string, assemblyId: string) {
  const w = await ws(organizationId, assemblyId);
  const draw = w.runs.find((r) => r.phase === "DRAW" && r.status === "CURRENT");
  const bids = w.runs.find((r) => r.phase === "BIDS" && r.status === "CURRENT");
  const resources = (draw?.result.resources ?? null) as { available: number; capacity: number; drawSlots: number; creditAmount: number; status: string; justification: string[] } | null;
  return {
    data: {
      workspace: w,
      drawRun: draw ?? null,
      bidsRun: bids ?? null,
      resources,
      activeContemplations: w.contemplations.filter((c) => c.status !== "CANCELLED"),
    },
    evidence: [
      { ...ruleEvidence(w), calculation: draw ? `cálculo ${draw.runNumber} (hash ${draw.hashes.resultHash.slice(0, 12)}…)` : undefined },
      lotteryEvidence(w),
    ],
  };
}

export async function getEligibilitySnapshot(organizationId: string, assemblyId: string) {
  const w = await ws(organizationId, assemblyId);
  const s = latestSnapshot(w.snapshots, "ELIGIBILITY");
  const snapshot = (s?.payload as { snapshot?: EligibilitySnapshot } | undefined)?.snapshot ?? null;
  return {
    data: { snapshot, snapshotId: s?.id ?? null, sequence: s?.sequence ?? null, group: w.group },
    evidence: [{ calculation: s ? `snapshot de elegibilidade nº ${s.sequence} (hash ${s.payloadHash.slice(0, 12)}…)` : undefined, ...ruleEvidence(w) }],
  };
}

export async function getCalculationTrace(organizationId: string, assemblyId: string, phase: "DRAW" | "BIDS" = "DRAW") {
  const w = await ws(organizationId, assemblyId);
  const run = w.runs.find((r) => r.phase === phase && r.status === "CURRENT") ?? null;
  return {
    data: { run, trace: (run?.trace ?? []) as TraceStep[], group: w.group },
    evidence: [{ ...ruleEvidence(w), calculation: run ? `cálculo ${run.runNumber}, hashes entrada ${run.hashes.inputHash.slice(0, 10)}… / resultado ${run.hashes.resultHash.slice(0, 10)}…` : undefined }, lotteryEvidence(w)],
  };
}

/** "Por que a cota X (não) foi contemplada?" — tentativas + snapshot + contemplação. */
export async function explainQuota(organizationId: string, assemblyId: string, quotaNumber: number) {
  const w = await ws(organizationId, assemblyId);
  const d = w.group.numbering.displayDigits;
  const label = formatQuotaNumber(quotaNumber, d);
  const draw = w.runs.find((r) => r.phase === "DRAW" && r.status === "CURRENT") ?? null;
  const bidsRun = w.runs.find((r) => r.phase === "BIDS" && r.status === "CURRENT") ?? null;
  const numbers = draw ? (await listDrawNumbers(organizationId, [draw.id])).filter((n) => n.quotaNumber === quotaNumber) : [];
  const s = latestSnapshot(w.snapshots, "ELIGIBILITY");
  const snapshot = (s?.payload as { snapshot?: EligibilitySnapshot } | undefined)?.snapshot ?? null;
  const entry = snapshot?.entries.find((e) => e.quotaNumber === quotaNumber) ?? null;
  const contemplation = [...(draw?.result.contemplations ?? []), ...(bidsRun?.result.contemplations ?? [])].find((c) => c.quotaNumber === quotaNumber) ?? null;
  const bidSteps = (bidsRun?.trace ?? []).filter((t) => (t.data as { quotaNumber?: number } | undefined)?.quotaNumber === quotaNumber || t.message.includes(`cota ${label}`));
  const inRange = quotaNumber >= w.group.numbering.numberStart && quotaNumber <= w.group.numbering.numberEnd;
  return {
    data: { label, inRange, entry, presumedPolicy: snapshot?.unknownPolicy ?? null, attempts: numbers, contemplation, bidSteps, drawRun: draw, group: w.group },
    evidence: [
      { ...ruleEvidence(w), calculation: draw ? `cálculo ${draw.runNumber} (resultado ${draw.hashes.resultHash.slice(0, 12)}…)` : undefined },
      lotteryEvidence(w),
      { calculation: s ? `snapshot de elegibilidade nº ${s.sequence}` : undefined, data: entry ? { ...entry } : { semDado: true } },
    ],
  };
}

export async function getRuleVersions(organizationId: string, ruleKey: string) {
  const [rules, assemblies] = await Promise.all([listEngineRules(organizationId), listAssemblies(organizationId)]);
  const versions = rules.filter((r) => r.ruleKey === ruleKey).sort((a, b) => a.version - b.version);
  const names = await profileNames(versions.flatMap((v) => [v.createdBy, v.approvedBy, v.publishedBy]));
  return {
    data: versions.map((v) => ({
      ...v,
      createdByName: v.createdBy ? names[v.createdBy] ?? null : null,
      approvedByName: v.approvedBy ? names[v.approvedBy] ?? null : null,
      publishedByName: v.publishedBy ? names[v.publishedBy] ?? null : null,
      usedBy: assemblies.filter((a) => a.ruleId === v.id).map((a) => ({ id: a.id, number: a.assemblyNumber, date: a.assemblyDate, status: a.status })),
    })),
    evidence: [{ rule: ruleKey, source: "consortium_draw_rules + consortium_assemblies" }],
  };
}

export async function getAuditTrail(organizationId: string, filters: { entityId?: string; assemblyId?: string }) {
  const events = await listEngineEvents(organizationId, { ...filters, limit: 100 });
  return { data: events, evidence: [{ source: "consortium_engine_events (encadeados por hash)", data: { eventos: events.length } }] };
}

export async function getFindings(organizationId: string, assemblyId?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("consortium_intelligence_findings")
    .select("id, code, category, severity, confidence, title, explanation, evidence, detector, requires_human_review, status, last_detected_at")
    .eq("organization_id", organizationId)
    .in("status", ["OPEN", "ACKNOWLEDGED"])
    .order("last_detected_at", { ascending: false })
    .limit(50);
  if (assemblyId) q = q.eq("assembly_id", assemblyId);
  const { data, error } = await q;
  if (error) throw error;
  return { data: data ?? [], evidence: [{ source: "motor de anomalias (regras determinísticas)" }] };
}

export async function getCreditPosition(organizationId: string, creditOperationId: string) {
  const w = await getCreditWorkspace(organizationId, creditOperationId);
  if (!w) throw new Error("Operação de crédito não encontrada.");
  return { data: w, evidence: [{ source: "consortium_credit_operations + consortium_financial_movements + parcelas", calculation: "crédito líquido = atualizado − embutido; saldo devedor = parcelas em aberto" }] };
}

export async function reproduceCalculation(organizationId: string, assemblyId: string, runId: string) {
  const w = await ws(organizationId, assemblyId);
  const report = reproduceInWorkspace(w, runId);
  return { data: report, evidence: [{ ...ruleEvidence(w), calculation: `reexecução do cálculo ${runId.slice(0, 8)} com os mesmos snapshots` }] };
}

export const EXPLAIN = {
  reason: (r: string | null) => (r ? (REASON_LABEL[r] ?? r) : ""),
  via: (v: string) => VIA_LABEL[v] ?? v,
  method: (m: string) => CONTEMPLATION_METHOD_LABEL[m] ?? m,
};
