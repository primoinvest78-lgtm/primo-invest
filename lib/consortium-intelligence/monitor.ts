import { hashOf } from "@/lib/consortium-engine/index.ts";
import type { EligibilitySnapshot } from "@/lib/consortium-engine/types.ts";
import {
  getAssemblyWorkspace,
  latestSnapshot,
  listAssemblies,
  listEngineGroups,
  listEngineRules,
  type AssemblyWorkspace,
  type EngineRule,
} from "@/lib/data/consortium-engine";
import { reproduceInWorkspace } from "@/lib/data/consortium-replay";
import { createClient } from "@/lib/supabase/server";

import { detectAssemblyAnomalies, detectOrganizationFindings, verifyEventChain, type AssemblyFacts, type OrgFacts } from "./detectors";
import type { Finding } from "./findings";

/**
 * Intelligent Monitoring — varre assembleias e cadastro, roda os
 * detectores e persiste achados. Tudo registrado em
 * consortium_automation_runs. Nunca altera resultado oficial.
 */

const MAX_ASSEMBLIES = 30;

export function effectiveVersionFor(rules: EngineRule[], ruleKey: string, date: string) {
  const candidates = rules
    .filter((r) => r.ruleKey === ruleKey && ["PUBLISHED", "SUPERSEDED"].includes(r.status))
    .filter((r) => r.effectiveFrom <= date && (!r.effectiveUntil || r.effectiveUntil >= date))
    .sort((a, b) => b.version - a.version);
  return candidates[0] ? { id: candidates[0].id, version: candidates[0].version } : null;
}

export function buildAssemblyFacts(ws: AssemblyWorkspace, rules: EngineRule[], today: string): AssemblyFacts {
  const elig = latestSnapshot(ws.snapshots, "ELIGIBILITY");
  const eligPayload = elig?.payload as { snapshot: EligibilitySnapshot; ruleId: string } | undefined;
  const reproduction: AssemblyFacts["reproduction"] = {};
  for (const r of ws.runs) {
    const rep = reproduceInWorkspace(ws, r.id);
    if (rep) reproduction[r.id] = { identical: rep.identical, hashDiffs: rep.hashDiffs };
  }
  return {
    assembly: { id: ws.assembly.id, number: ws.assembly.assemblyNumber, date: ws.assembly.assemblyDate, status: ws.assembly.status },
    group: { id: ws.group.id, code: ws.group.groupCode, administratorName: ws.group.administratorName, numbering: ws.group.numbering, quotaCount: ws.group.quotaCount },
    rule: ws.rule ? { ...ws.rule, ruleHash: ws.rule.ruleHash } : null,
    effectiveVersion: ws.rule ? effectiveVersionFor(rules, ws.rule.ruleKey, ws.assembly.assemblyDate) : null,
    lottery: ws.lottery
      ? {
          id: ws.lottery.id,
          contestNumber: ws.lottery.contestNumber,
          drawDate: ws.lottery.drawDate,
          prizes: ws.lottery.prizes,
          source: ws.lottery.source,
          contentHash: ws.lottery.contentHash,
          verificationStatus: ws.lottery.verificationStatus,
        }
      : null,
    eligibility: eligPayload && elig ? { snapshot: eligPayload.snapshot, payloadHash: elig.payloadHash, storedHash: elig.payloadHash, ruleId: eligPayload.ruleId } : null,
    runs: ws.runs.map((r) => ({
      id: r.id,
      phase: r.phase,
      status: r.status,
      ruleId: r.ruleId,
      hashes: r.hashes,
      official: r.result.official,
      remainingResources: r.result.remainingResources,
      available: (r.result.resources as { available?: number } | null)?.available ?? null,
      contemplations: r.result.contemplations.map((c) => ({ quotaNumber: c.quotaNumber, method: c.method, creditAmount: c.creditAmount, via: c.via })),
    })),
    reproduction,
    snapshotHashes: ws.snapshots.map((s) => ({ id: s.id, kind: s.kind, payloadHash: s.payloadHash, recomputed: hashOf(s.payload) })),
    pendingRetifications: ws.retifications.filter((r) => r.status === "REQUESTED" || r.status === "APPROVED").length,
    today,
  };
}

async function collectOrgFacts(organizationId: string, rules: EngineRule[], today: string): Promise<OrgFacts> {
  const supabase = await createClient();
  const [groups, assemblies, quotasRes, bidsRes, contRes, eventsRes] = await Promise.all([
    listEngineGroups(organizationId),
    listAssemblies(organizationId),
    supabase.from("consortium_quotas").select("group_id, quota_number, contract_id, status, contemplated_at").eq("organization_id", organizationId).not("contract_id", "is", null),
    supabase.from("consortium_bids").select("id, consortium_contract_id, bid_date, result, consortium_contracts!inner(organization_id)").eq("result", "won").eq("consortium_contracts.organization_id", organizationId),
    supabase.from("consortium_contemplations").select("bid_id").eq("organization_id", organizationId).not("bid_id", "is", null),
    supabase.from("consortium_engine_events").select("id, prev_hash, event_hash, event_type, entity_type, entity_id, payload, created_at").eq("organization_id", organizationId).order("created_at").order("id").limit(5000),
  ]);
  for (const r of [quotasRes, bidsRes, contRes, eventsRes]) if (r.error) throw r.error;

  const groupById = new Map(groups.map((g) => [g.id, g]));
  const quotas = (quotasRes.data ?? []) as { group_id: string; quota_number: number; contract_id: string; status: string; contemplated_at: string | null }[];
  const contractIds = [...new Set(quotas.map((q) => q.contract_id))];
  const contracts = new Map<string, { group_number: string | null; quota_number: string | null; contemplated_at: string | null; status: string }>();
  if (contractIds.length) {
    const { data, error } = await supabase.from("consortium_contracts").select("id, group_number, quota_number, contemplated_at, status").in("id", contractIds);
    if (error) throw error;
    for (const c of (data ?? []) as { id: string; group_number: string | null; quota_number: string | null; contemplated_at: string | null; status: string }[]) contracts.set(c.id, c);
  }
  const quotaIssues: OrgFacts["quotaIssues"] = [];
  for (const q of quotas) {
    const c = contracts.get(q.contract_id);
    const g = groupById.get(q.group_id);
    if (!c || !g) continue;
    const add = (issue: string) => quotaIssues.push({ groupId: g.id, groupCode: g.groupCode, quotaNumber: q.quota_number, issue });
    if (c.group_number !== g.groupCode) add(`contrato aponta grupo "${c.group_number ?? "vazio"}"`);
    if (c.quota_number && Number.parseInt(c.quota_number, 10) !== q.quota_number) add(`contrato aponta cota "${c.quota_number}"`);
    if (c.contemplated_at && !q.contemplated_at) add("contrato contemplado, cota não");
    if (!c.contemplated_at && q.contemplated_at && q.contemplated_at !== "1900-01-01") add("cota contemplada, contrato não");
    if (c.status === "cancelled" && q.status === "ACTIVE") add("contrato cancelado, cota ativa");
  }

  const withContemplation = new Set(((contRes.data ?? []) as { bid_id: string }[]).map((c) => c.bid_id));
  const legacyWonBids = ((bidsRes.data ?? []) as unknown as { id: string; consortium_contract_id: string; bid_date: string | null }[])
    .filter((b) => !withContemplation.has(b.id))
    .map((b) => ({ bidId: b.id, contractId: b.consortium_contract_id, bidDate: b.bid_date }));

  const events = ((eventsRes.data ?? []) as { id: string; prev_hash: string | null; event_hash: string; event_type: string; entity_type: string; entity_id: string | null; payload: unknown; created_at: string }[]).map((e) => ({
    id: e.id, prevHash: e.prev_hash, eventHash: e.event_hash, eventType: e.event_type, entityType: e.entity_type, entityId: e.entity_id, payload: e.payload, createdAt: e.created_at,
  }));

  const upcoming = assemblies
    .filter((a) => ["SCHEDULED", "PREPARING", "ELIGIBILITY_LOCKED", "LOTTERY_LOCKED"].includes(a.status) && a.assemblyDate >= today)
    .map((a) => {
      const g = groupById.get(a.groupId);
      return { id: a.id, number: a.assemblyNumber, date: a.assemblyDate, groupId: a.groupId, groupCode: g?.groupCode ?? "?", administratorName: g?.administratorName ?? "", hasRule: Boolean(a.ruleId) };
    });

  return {
    rules: rules.map((r) => ({ id: r.id, ruleKey: r.ruleKey, version: r.version, name: r.name, administratorName: r.administratorName, status: r.status, effectiveFrom: r.effectiveFrom, effectiveUntil: r.effectiveUntil })),
    upcomingAssemblies: upcoming,
    quotaIssues,
    legacyWonBids,
    sourceChecks: [],
    events,
    chainVerified: verifyEventChain(events),
    today,
  };
}

/** Detectores cobertos por uma varredura normal (fonte oficial é outro job). */
const SCAN_DETECTORS_EXCLUDED = new Set(["conferencia-fonte-oficial"]);

export async function persistFindings(organizationId: string, findings: Finding[], coveredDetectors: Set<string> | null, scanLabel: string) {
  const supabase = await createClient();
  const { data: existingRows, error } = await supabase
    .from("consortium_intelligence_findings")
    .select("id, fingerprint, status, occurrences, requires_human_review, detector")
    .eq("organization_id", organizationId);
  if (error) throw error;
  const existing = new Map((existingRows ?? []).map((r) => [r.fingerprint as string, r as { id: string; fingerprint: string; status: string; occurrences: number; requires_human_review: boolean; detector: string }]));
  const now = new Date().toISOString();
  let inserted = 0;
  let reopened = 0;
  let autoResolved = 0;

  const toInsert = findings
    .filter((f) => !existing.has(f.fingerprint))
    .map((f) => ({
      organization_id: organizationId,
      fingerprint: f.fingerprint,
      category: f.category,
      severity: f.severity,
      confidence: f.confidence,
      code: f.code,
      title: f.title,
      explanation: f.explanation,
      evidence: f.evidence,
      detector: f.detector,
      requires_human_review: f.requiresHumanReview,
      group_id: f.groupId ?? null,
      assembly_id: f.assemblyId ?? null,
      entity_type: f.entityType ?? null,
      entity_id: f.entityId ?? null,
    }));
  if (toInsert.length) {
    const { error: insError } = await supabase.from("consortium_intelligence_findings").insert(toInsert);
    if (insError) throw insError;
    inserted = toInsert.length;
  }

  for (const f of findings) {
    const row = existing.get(f.fingerprint);
    if (!row) continue;
    const patch: Record<string, unknown> = { last_detected_at: now, occurrences: row.occurrences + 1, explanation: f.explanation, evidence: f.evidence, severity: f.severity, title: f.title };
    if (row.status === "RESOLVED") {
      patch.status = "OPEN";
      patch.review_notes = `Reaberto: condição detectada novamente em ${scanLabel}.`;
      reopened += 1;
    }
    const { error: upError } = await supabase.from("consortium_intelligence_findings").update(patch).eq("id", row.id);
    if (upError) throw upError;
  }

  const current = new Set(findings.map((f) => f.fingerprint));
  for (const row of existing.values()) {
    if (current.has(row.fingerprint) || row.status !== "OPEN" || row.requires_human_review) continue;
    if (coveredDetectors && !coveredDetectors.has(row.detector)) continue;
    const { error: resError } = await supabase
      .from("consortium_intelligence_findings")
      .update({ status: "RESOLVED", review_notes: `Resolvido automaticamente: condição não detectada em ${scanLabel}.`, reviewed_at: now })
      .eq("id", row.id);
    if (resError) throw resError;
    autoResolved += 1;
  }
  return { inserted, reopened, autoResolved };
}

export async function logAutomation(
  organizationId: string,
  job: string,
  trigger: "MANUAL" | "ON_VIEW" | "SCHEDULED",
  status: "SUCCESS" | "PARTIAL" | "FAILED",
  summary: string,
  details: Record<string, unknown>,
  startedAt: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("consortium_automation_runs").insert({
    organization_id: organizationId,
    job,
    trigger_kind: trigger,
    status,
    summary,
    details,
    started_at: startedAt,
  });
  if (error) throw error;
}

export async function runMonitoringScan(organizationId: string, trigger: "MANUAL" | "ON_VIEW") {
  const startedAt = new Date().toISOString();
  const today = startedAt.slice(0, 10);
  try {
    const rules = await listEngineRules(organizationId);
    const assemblies = (await listAssemblies(organizationId)).slice(0, MAX_ASSEMBLIES);
    const findings: Finding[] = [];
    const reproductions = { checked: 0, divergent: 0 };
    for (const a of assemblies) {
      const ws = await getAssemblyWorkspace(organizationId, a.id);
      if (!ws) continue;
      const facts = buildAssemblyFacts(ws, rules, today);
      reproductions.checked += Object.keys(facts.reproduction).length;
      reproductions.divergent += Object.values(facts.reproduction).filter((r) => !r.identical).length;
      findings.push(...detectAssemblyAnomalies(facts));
    }
    const orgFacts = await collectOrgFacts(organizationId, rules, today);
    findings.push(...detectOrganizationFindings(orgFacts));

    const covered = new Set(findings.map((f) => f.detector));
    // Detectores que rodaram mas não acharam nada também "cobrem" seus achados antigos.
    for (const d of ["reproducao-deterministica", "integridade-snapshot", "integridade-regra", "versao-vigente", "integridade-fonte", "fonte-verificada", "universo-numerico", "snapshot-vs-resultado", "base-parcial", "regra-snapshot", "duplicidade-contemplacao", "recursos-vs-contemplacoes", "resultado-conferencia", "resultado-pendente", "regra-pendente", "retificacao-pendente", "unicidade-publicacao", "regra-proxima-assembleia", "cadastro-cotas", "lance-sem-apuracao", "cadeia-auditoria", "tentativas-fonte-divergente"]) {
      if (!SCAN_DETECTORS_EXCLUDED.has(d)) covered.add(d);
    }
    const persisted = await persistFindings(organizationId, findings, covered, `varredura de ${today}`);
    const summary = `${assemblies.length} assembleia(s) e cadastro analisados; ${reproductions.checked} cálculo(s) reproduzido(s) (${reproductions.divergent} divergente(s)); ${findings.length} achado(s) — ${persisted.inserted} novo(s), ${persisted.reopened} reaberto(s), ${persisted.autoResolved} resolvido(s) automaticamente.`;
    await logAutomation(organizationId, "MONITORING_SCAN", trigger, "SUCCESS", summary, {
      assemblies: assemblies.length,
      reproductions,
      findings: findings.length,
      ...persisted,
      chain: orgFacts.chainVerified,
    }, startedAt);
    return { ok: true as const, summary, findings: findings.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logAutomation(organizationId, "MONITORING_SCAN", trigger, "FAILED", `Varredura falhou: ${message}`, {}, startedAt).catch(() => undefined);
    return { ok: false as const, summary: message, findings: 0 };
  }
}

const SCAN_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Monitoramento contínuo "ao abrir": reexecuta a varredura se a última
 * tiver mais de 30 minutos. Registrada como ON_VIEW no log.
 */
export async function ensureRecentScan(organizationId: string) {
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("consortium_automation_runs")
    .select("started_at")
    .eq("organization_id", organizationId)
    .eq("job", "MONITORING_SCAN")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last || Date.now() - Date.parse(last.started_at as string) > SCAN_INTERVAL_MS) {
    await runMonitoringScan(organizationId, "ON_VIEW");
  }
}
