import { createClient } from "@/lib/supabase/server";
import type {
  DrawRule,
  EligibilitySnapshot,
  GroupNumbering,
  LotteryResult,
  RuleConfig,
  RuleStatus,
  RunHashes,
  TraceStep,
} from "@/lib/consortium-engine/index.ts";
import type { AssemblyStatus } from "@/lib/consortium-engine/state-machine.ts";

/**
 * Leitura do motor de consórcios. Sem embeds implícitos do PostgREST
 * entre tabelas com mais de um caminho de FK (ver incidente da segunda
 * FK): cada consulta busca uma tabela e junta em memória por id.
 */

export type EngineGroup = {
  id: string;
  administratorName: string;
  groupCode: string;
  productType: string | null;
  quotaCount: number;
  numbering: GroupNumbering;
  creditAmount: number | null;
  status: "FORMING" | "ACTIVE" | "SUSPENDED" | "CLOSED" | "CANCELLED" | "ARCHIVED";
  constitutedAt: string | null;
  participantsCount: number | null;
  termMonths: number | null;
  installmentAmount: number | null;
  adjustmentIndex: string | null;
  adminFeePercentage: number | null;
  reserveFundPercentage: number | null;
  insuranceRequired: boolean;
  regulationReference: string | null;
  notes: string | null;
  createdAt: string;
};

type RawGroup = {
  id: string;
  administrator_name: string;
  group_code: string;
  product_type: string | null;
  quota_count: number;
  number_start: number;
  number_end: number;
  display_digits: number;
  credit_amount: number | null;
  status: EngineGroup["status"];
  regulation_reference: string | null;
  notes: string | null;
  created_at: string;
  constituted_at: string | null;
  participants_count: number | null;
  term_months: number | null;
  installment_amount: number | null;
  adjustment_index: string | null;
  admin_fee_percentage: number | null;
  reserve_fund_percentage: number | null;
  insurance_required: boolean;
};

const GROUP_SELECT =
  "id, administrator_name, group_code, product_type, quota_count, number_start, number_end, display_digits, credit_amount, status, regulation_reference, notes, created_at, constituted_at, participants_count, term_months, installment_amount, adjustment_index, admin_fee_percentage, reserve_fund_percentage, insurance_required";

export function mapGroup(r: RawGroup): EngineGroup {
  return {
    id: r.id,
    administratorName: r.administrator_name,
    groupCode: r.group_code,
    productType: r.product_type,
    quotaCount: r.quota_count,
    numbering: { numberStart: r.number_start, numberEnd: r.number_end, displayDigits: r.display_digits },
    creditAmount: r.credit_amount === null ? null : Number(r.credit_amount),
    status: r.status,
    regulationReference: r.regulation_reference,
    notes: r.notes,
    createdAt: r.created_at,
    constitutedAt: r.constituted_at,
    participantsCount: r.participants_count,
    termMonths: r.term_months,
    installmentAmount: r.installment_amount === null ? null : Number(r.installment_amount),
    adjustmentIndex: r.adjustment_index,
    adminFeePercentage: r.admin_fee_percentage === null ? null : Number(r.admin_fee_percentage),
    reserveFundPercentage: r.reserve_fund_percentage === null ? null : Number(r.reserve_fund_percentage),
    insuranceRequired: r.insurance_required,
  };
}

export async function listEngineGroups(organizationId: string): Promise<EngineGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_groups")
    .select(GROUP_SELECT)
    .eq("organization_id", organizationId)
    .order("administrator_name")
    .order("group_code");
  if (error) throw error;
  return ((data ?? []) as RawGroup[]).map(mapGroup);
}

export async function getEngineGroup(organizationId: string, groupId: string): Promise<EngineGroup | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_groups")
    .select(GROUP_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGroup(data as RawGroup) : null;
}

export type EngineQuota = {
  id: string;
  quotaNumber: number;
  contractId: string | null;
  holderLabel: string | null;
  status: "ACTIVE" | "CANCELLED" | "EXCLUDED" | "AVAILABLE";
  paymentStatus: "UP_TO_DATE" | "DELINQUENT" | "UNKNOWN";
  contemplatedAt: string | null;
  contemplationMethod: string | null;
  eligibilitySource: "CONTRACT" | "IMPORTED" | "MANUAL";
  notes: string | null;
};

export async function listGroupQuotas(organizationId: string, groupId: string): Promise<EngineQuota[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_quotas")
    .select("id, quota_number, contract_id, holder_label, status, payment_status, contemplated_at, contemplation_method, eligibility_source, notes")
    .eq("organization_id", organizationId)
    .eq("group_id", groupId)
    .order("quota_number");
  if (error) throw error;
  type Raw = {
    id: string;
    quota_number: number;
    contract_id: string | null;
    holder_label: string | null;
    status: EngineQuota["status"];
    payment_status: EngineQuota["paymentStatus"];
    contemplated_at: string | null;
    contemplation_method: string | null;
    eligibility_source: EngineQuota["eligibilitySource"];
    notes: string | null;
  };
  return ((data ?? []) as Raw[]).map((r) => ({
    id: r.id,
    quotaNumber: r.quota_number,
    contractId: r.contract_id,
    holderLabel: r.holder_label,
    status: r.status,
    paymentStatus: r.payment_status,
    contemplatedAt: r.contemplated_at,
    contemplationMethod: r.contemplation_method,
    eligibilitySource: r.eligibility_source,
    notes: r.notes,
  }));
}

// ── Regras ───────────────────────────────────────────────────────

export type EngineRule = DrawRule & {
  ruleHash: string | null;
  previousVersionId: string | null;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const RULE_SELECT =
  "id, rule_key, version, name, administrator_name, product_type, group_id, effective_from, effective_until, status, source, regulation_reference, config, rule_hash, previous_version_id, created_by, approved_by, approved_at, published_by, published_at, created_at, updated_at";

type RawRule = {
  id: string;
  rule_key: string;
  version: number;
  name: string;
  administrator_name: string;
  product_type: string | null;
  group_id: string | null;
  effective_from: string;
  effective_until: string | null;
  status: RuleStatus;
  source: DrawRule["source"];
  regulation_reference: string | null;
  config: RuleConfig;
  rule_hash: string | null;
  previous_version_id: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export function mapRule(r: RawRule): EngineRule {
  return {
    id: r.id,
    ruleKey: r.rule_key,
    version: r.version,
    name: r.name,
    administratorName: r.administrator_name,
    productType: r.product_type,
    groupId: r.group_id,
    effectiveFrom: r.effective_from,
    effectiveUntil: r.effective_until,
    status: r.status,
    source: r.source,
    regulationReference: r.regulation_reference,
    config: r.config,
    ruleHash: r.rule_hash,
    previousVersionId: r.previous_version_id,
    createdBy: r.created_by,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at,
    publishedBy: r.published_by,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listEngineRules(organizationId: string): Promise<EngineRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_draw_rules")
    .select(RULE_SELECT)
    .eq("organization_id", organizationId)
    .order("rule_key")
    .order("version", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as RawRule[]).map(mapRule);
}

export async function getEngineRule(organizationId: string, ruleId: string): Promise<EngineRule | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_draw_rules")
    .select(RULE_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", ruleId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRule(data as RawRule) : null;
}

// ── Resultados oficiais ──────────────────────────────────────────

export type EngineLotteryResult = LotteryResult & {
  id: string;
  prizeDigits: number;
  sourceReference: string | null;
  retrievedAt: string | null;
  evidenceNotes: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "INVALID";
  validationErrors: string[];
  contentHash: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

const LOTTERY_SELECT =
  "id, source, contest_number, draw_date, prizes, prize_digits, source_reference, retrieved_at, evidence_notes, verification_status, validation_errors, content_hash, verified_by, verified_at, created_at";

type RawLottery = {
  id: string;
  source: LotteryResult["source"];
  contest_number: string;
  draw_date: string;
  prizes: string[];
  prize_digits: number;
  source_reference: string | null;
  retrieved_at: string | null;
  evidence_notes: string | null;
  verification_status: EngineLotteryResult["verificationStatus"];
  validation_errors: string[];
  content_hash: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

export function mapLottery(r: RawLottery): EngineLotteryResult {
  return {
    id: r.id,
    source: r.source,
    contestNumber: r.contest_number,
    drawDate: r.draw_date,
    prizes: r.prizes,
    prizeDigits: r.prize_digits,
    sourceReference: r.source_reference,
    retrievedAt: r.retrieved_at,
    evidenceNotes: r.evidence_notes,
    verificationStatus: r.verification_status,
    validationErrors: r.validation_errors ?? [],
    contentHash: r.content_hash,
    verifiedBy: r.verified_by,
    verifiedAt: r.verified_at,
    createdAt: r.created_at,
  };
}

export async function listLotteryResults(organizationId: string): Promise<EngineLotteryResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_lottery_results")
    .select(LOTTERY_SELECT)
    .eq("organization_id", organizationId)
    .order("draw_date", { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as RawLottery[]).map(mapLottery);
}

// ── Assembleias ──────────────────────────────────────────────────

export type EngineAssembly = {
  id: string;
  groupId: string;
  assemblyNumber: number;
  assemblyDate: string;
  status: AssemblyStatus;
  ruleId: string | null;
  lotteryResultId: string | null;
  plannedDrawContemplations: number;
  commonFundBalance: number | null;
  reserveFundBalance: number | null;
  reserveFundUsable: boolean;
  creditAmount: number | null;
  resourcesStatus: string | null;
  homologatedBy: string | null;
  homologatedAt: string | null;
  lockedAt: string | null;
  notes: string | null;
  createdAt: string;
};

const ASSEMBLY_SELECT =
  "id, group_id, assembly_number, assembly_date, status, rule_id, lottery_result_id, planned_draw_contemplations, common_fund_balance, reserve_fund_balance, reserve_fund_usable, credit_amount, resources_status, homologated_by, homologated_at, locked_at, notes, created_at";

type RawAssembly = {
  id: string;
  group_id: string;
  assembly_number: number;
  assembly_date: string;
  status: AssemblyStatus;
  rule_id: string | null;
  lottery_result_id: string | null;
  planned_draw_contemplations: number;
  common_fund_balance: number | null;
  reserve_fund_balance: number | null;
  reserve_fund_usable: boolean;
  credit_amount: number | null;
  resources_status: string | null;
  homologated_by: string | null;
  homologated_at: string | null;
  locked_at: string | null;
  notes: string | null;
  created_at: string;
};

const numOrNull = (v: number | string | null) => (v === null ? null : Number(v));

export function mapAssembly(r: RawAssembly): EngineAssembly {
  return {
    id: r.id,
    groupId: r.group_id,
    assemblyNumber: r.assembly_number,
    assemblyDate: r.assembly_date,
    status: r.status,
    ruleId: r.rule_id,
    lotteryResultId: r.lottery_result_id,
    plannedDrawContemplations: r.planned_draw_contemplations,
    commonFundBalance: numOrNull(r.common_fund_balance),
    reserveFundBalance: numOrNull(r.reserve_fund_balance),
    reserveFundUsable: r.reserve_fund_usable,
    creditAmount: numOrNull(r.credit_amount),
    resourcesStatus: r.resources_status,
    homologatedBy: r.homologated_by,
    homologatedAt: r.homologated_at,
    lockedAt: r.locked_at,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export async function listAssemblies(organizationId: string, groupId?: string): Promise<EngineAssembly[]> {
  const supabase = await createClient();
  let query = supabase
    .from("consortium_assemblies")
    .select(ASSEMBLY_SELECT)
    .eq("organization_id", organizationId)
    .order("assembly_date", { ascending: false })
    .limit(200);
  if (groupId) query = query.eq("group_id", groupId);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as RawAssembly[]).map(mapAssembly);
}

export async function getAssembly(organizationId: string, assemblyId: string): Promise<EngineAssembly | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_assemblies")
    .select(ASSEMBLY_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", assemblyId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAssembly(data as RawAssembly) : null;
}

export type AssemblySnapshot = {
  id: string;
  kind: "ELIGIBILITY" | "RULE" | "LOTTERY" | "RESOURCES" | "BIDS";
  sequence: number;
  payload: unknown;
  payloadHash: string;
  completeness: "COMPLETE" | "PARTIAL" | null;
  createdBy: string | null;
  createdAt: string;
};

export type DrawRunRecord = {
  id: string;
  phase: "DRAW" | "BIDS";
  runNumber: number;
  runKind: "ORIGINAL" | "RETIFICATION";
  status: "CURRENT" | "SUPERSEDED";
  engineVersion: string;
  parentRunId: string | null;
  ruleId: string;
  lotteryResultId: string | null;
  snapshotIds: Record<string, string>;
  hashes: RunHashes;
  trace: TraceStep[];
  result: {
    status: string;
    errors: string[];
    official: boolean;
    remainingResources: number;
    resources: unknown;
    contemplations: { sequence: number; quotaNumber: number; quotaLabel: string; method: string; via: string; candidateRaw: string | null; bidId: string | null; creditAmount: number }[];
  };
  createdBy: string | null;
  createdAt: string;
};

export type ContemplationRecord = {
  id: string;
  runId: string;
  quotaId: string | null;
  quotaNumber: number;
  method: string;
  sequence: number;
  candidateRaw: string | null;
  bidId: string | null;
  creditAmount: number | null;
  status: "PENDING" | "SELECTED" | "HOMOLOGATED" | "CANCELLED" | "RETAINED" | "RETIRED";
  homologatedAt: string | null;
  statusReason: string | null;
};

export type RetificationRecord = {
  id: string;
  originalRunId: string;
  newRunId: string | null;
  originalResultHash: string;
  newResultHash: string | null;
  reason: string;
  evidenceNotes: string | null;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "APPLIED";
  requestedBy: string | null;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  decisionNotes: string | null;
};

export type EngineEvent = {
  id: string;
  groupId: string | null;
  assemblyId: string | null;
  entityType: string;
  entityId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  actorName: string | null;
  prevHash: string | null;
  eventHash: string;
  createdAt: string;
};

export type AssemblyBid = {
  id: string;
  contractId: string;
  bidType: string;
  bidAmount: number | null;
  bidPercentage: number | null;
  embeddedAmount: number | null;
  bidDate: string;
  result: string | null;
  createdAt: string;
};

export type AssemblyWorkspace = {
  assembly: EngineAssembly;
  group: EngineGroup;
  rule: EngineRule | null;
  lottery: EngineLotteryResult | null;
  snapshots: AssemblySnapshot[];
  runs: DrawRunRecord[];
  contemplations: ContemplationRecord[];
  retifications: RetificationRecord[];
  events: EngineEvent[];
  bids: AssemblyBid[];
  /** Cotas conhecidas → contrato, pra associar lance (contrato) ↔ cota. */
  quotaByContract: Record<string, number>;
};

/**
 * Tudo que a tela de uma assembleia precisa, em consultas paralelas
 * (nenhuma N+1: cada tabela é lida uma vez).
 */
export async function getAssemblyWorkspace(organizationId: string, assemblyId: string): Promise<AssemblyWorkspace | null> {
  const assembly = await getAssembly(organizationId, assemblyId);
  if (!assembly) return null;
  const supabase = await createClient();

  const [group, ruleRes, lotteryRes, snapRes, runRes, contRes, retRes, evRes, bidRes, quotaRes] = await Promise.all([
    getEngineGroup(organizationId, assembly.groupId),
    assembly.ruleId
      ? supabase.from("consortium_draw_rules").select(RULE_SELECT).eq("id", assembly.ruleId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    assembly.lotteryResultId
      ? supabase.from("consortium_lottery_results").select(LOTTERY_SELECT).eq("id", assembly.lotteryResultId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("consortium_assembly_snapshots")
      .select("id, kind, sequence, payload, payload_hash, completeness, created_by, created_at")
      .eq("assembly_id", assemblyId)
      .order("created_at"),
    supabase
      .from("consortium_draw_runs")
      .select(
        "id, phase, run_number, run_kind, status, engine_version, parent_run_id, rule_id, lottery_result_id, snapshot_ids, input_hash, rule_hash, eligibility_hash, calculation_hash, result_hash, trace, result, created_by, created_at",
      )
      .eq("assembly_id", assemblyId)
      .order("created_at"),
    supabase
      .from("consortium_contemplations")
      .select("id, run_id, quota_id, quota_number, method, sequence, candidate_raw, bid_id, credit_amount, status, homologated_at, status_reason")
      .eq("assembly_id", assemblyId)
      .order("created_at"),
    supabase
      .from("consortium_retifications")
      .select(
        "id, original_run_id, new_run_id, original_result_hash, new_result_hash, reason, evidence_notes, status, requested_by, requested_at, approved_by, approved_at, decision_notes",
      )
      .eq("assembly_id", assemblyId)
      .order("requested_at", { ascending: false }),
    listEngineEvents(organizationId, { assemblyId, limit: 200 }),
    supabase
      .from("consortium_bids")
      .select("id, consortium_contract_id, bid_type, bid_amount, bid_percentage, embedded_amount, bid_date, result, created_at")
      .eq("assembly_id", assemblyId)
      .order("created_at"),
    supabase.from("consortium_quotas").select("quota_number, contract_id").eq("group_id", assembly.groupId).not("contract_id", "is", null),
  ]);

  for (const r of [ruleRes, lotteryRes, snapRes, runRes, contRes, retRes, bidRes, quotaRes]) {
    if (r.error) throw r.error;
  }
  if (!group) return null;

  type RawSnap = { id: string; kind: AssemblySnapshot["kind"]; sequence: number; payload: unknown; payload_hash: string; completeness: AssemblySnapshot["completeness"]; created_by: string | null; created_at: string };
  type RawRun = {
    id: string; phase: DrawRunRecord["phase"]; run_number: number; run_kind: DrawRunRecord["runKind"]; status: DrawRunRecord["status"];
    engine_version: string; parent_run_id: string | null; rule_id: string; lottery_result_id: string | null; snapshot_ids: Record<string, string>;
    input_hash: string; rule_hash: string; eligibility_hash: string; calculation_hash: string; result_hash: string;
    trace: TraceStep[]; result: DrawRunRecord["result"]; created_by: string | null; created_at: string;
  };
  type RawCont = { id: string; run_id: string; quota_id: string | null; quota_number: number; method: string; sequence: number; candidate_raw: string | null; bid_id: string | null; credit_amount: number | null; status: ContemplationRecord["status"]; homologated_at: string | null; status_reason: string | null };
  type RawRet = { id: string; original_run_id: string; new_run_id: string | null; original_result_hash: string; new_result_hash: string | null; reason: string; evidence_notes: string | null; status: RetificationRecord["status"]; requested_by: string | null; requested_at: string; approved_by: string | null; approved_at: string | null; decision_notes: string | null };
  type RawBid = { id: string; consortium_contract_id: string; bid_type: string; bid_amount: number | null; bid_percentage: number | null; embedded_amount: number | null; bid_date: string; result: string | null; created_at: string };

  const quotaByContract: Record<string, number> = {};
  for (const q of (quotaRes.data ?? []) as { quota_number: number; contract_id: string }[]) quotaByContract[q.contract_id] = q.quota_number;

  return {
    assembly,
    group,
    rule: ruleRes.data ? mapRule(ruleRes.data as RawRule) : null,
    lottery: lotteryRes.data ? mapLottery(lotteryRes.data as RawLottery) : null,
    snapshots: ((snapRes.data ?? []) as RawSnap[]).map((s) => ({
      id: s.id, kind: s.kind, sequence: s.sequence, payload: s.payload, payloadHash: s.payload_hash,
      completeness: s.completeness, createdBy: s.created_by, createdAt: s.created_at,
    })),
    runs: ((runRes.data ?? []) as RawRun[]).map((r) => ({
      id: r.id, phase: r.phase, runNumber: r.run_number, runKind: r.run_kind, status: r.status, engineVersion: r.engine_version,
      parentRunId: r.parent_run_id, ruleId: r.rule_id, lotteryResultId: r.lottery_result_id, snapshotIds: r.snapshot_ids ?? {},
      hashes: { inputHash: r.input_hash, ruleHash: r.rule_hash, eligibilityHash: r.eligibility_hash, calculationHash: r.calculation_hash, resultHash: r.result_hash },
      trace: r.trace, result: r.result, createdBy: r.created_by, createdAt: r.created_at,
    })),
    contemplations: ((contRes.data ?? []) as RawCont[]).map((c) => ({
      id: c.id, runId: c.run_id, quotaId: c.quota_id, quotaNumber: c.quota_number, method: c.method, sequence: c.sequence,
      candidateRaw: c.candidate_raw, bidId: c.bid_id, creditAmount: numOrNull(c.credit_amount), status: c.status,
      homologatedAt: c.homologated_at, statusReason: c.status_reason,
    })),
    retifications: ((retRes.data ?? []) as RawRet[]).map((r) => ({
      id: r.id, originalRunId: r.original_run_id, newRunId: r.new_run_id, originalResultHash: r.original_result_hash,
      newResultHash: r.new_result_hash, reason: r.reason, evidenceNotes: r.evidence_notes, status: r.status,
      requestedBy: r.requested_by, requestedAt: r.requested_at, approvedBy: r.approved_by, approvedAt: r.approved_at,
      decisionNotes: r.decision_notes,
    })),
    events: evRes,
    bids: ((bidRes.data ?? []) as RawBid[]).map((b) => ({
      id: b.id, contractId: b.consortium_contract_id, bidType: b.bid_type, bidAmount: numOrNull(b.bid_amount),
      bidPercentage: numOrNull(b.bid_percentage), embeddedAmount: numOrNull(b.embedded_amount), bidDate: b.bid_date,
      result: b.result, createdAt: b.created_at,
    })),
    quotaByContract,
  };
}

// ── Auditoria de domínio ─────────────────────────────────────────

export async function listEngineEvents(
  organizationId: string,
  filters: { assemblyId?: string; groupId?: string; entityId?: string; limit?: number } = {},
): Promise<EngineEvent[]> {
  const supabase = await createClient();
  let query = supabase
    .from("consortium_engine_events")
    .select("id, group_id, assembly_id, entity_type, entity_id, event_type, payload, actor_id, prev_hash, event_hash, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);
  if (filters.assemblyId) query = query.eq("assembly_id", filters.assemblyId);
  if (filters.groupId) query = query.eq("group_id", filters.groupId);
  if (filters.entityId) query = query.eq("entity_id", filters.entityId);
  const { data, error } = await query;
  if (error) throw error;

  type Raw = { id: string; group_id: string | null; assembly_id: string | null; entity_type: string; entity_id: string | null; event_type: string; payload: Record<string, unknown>; actor_id: string | null; prev_hash: string | null; event_hash: string; created_at: string };
  const rows = (data ?? []) as Raw[];
  const names = await profileNames(rows.map((r) => r.actor_id));
  return rows.map((r) => ({
    id: r.id, groupId: r.group_id, assemblyId: r.assembly_id, entityType: r.entity_type, entityId: r.entity_id,
    eventType: r.event_type, payload: r.payload ?? {}, actorId: r.actor_id,
    actorName: r.actor_id ? (names[r.actor_id] ?? null) : null,
    prevHash: r.prev_hash, eventHash: r.event_hash, createdAt: r.created_at,
  }));
}

/** Nome de quem executou — uma consulta pra todos os ids (sem N+1). */
export async function profileNames(ids: (string | null)[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", unique);
  const out: Record<string, string> = {};
  for (const p of (data ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
    out[p.id] = p.full_name ?? p.email ?? p.id;
  }
  return out;
}

/** Snapshot mais recente de um tipo (o vigente pra próxima execução). */
export function latestSnapshot(snapshots: AssemblySnapshot[], kind: AssemblySnapshot["kind"]): AssemblySnapshot | null {
  return snapshots.filter((s) => s.kind === kind).sort((a, b) => b.sequence - a.sequence)[0] ?? null;
}

export type { EligibilitySnapshot };
