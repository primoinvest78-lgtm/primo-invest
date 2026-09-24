import {
  settlementPosition,
  type CreditStatus,
  type InstallmentState,
  type SettlementPosition,
} from "@/lib/consortium-engine/index.ts";
import { createClient } from "@/lib/supabase/server";

/**
 * Leitura do pós-contemplação: crédito, documentação, garantias,
 * razão financeiro e posição de quitação. Consultas separadas por
 * tabela (sem embed ambíguo), juntadas em memória.
 */

export type CreditOperation = {
  id: string;
  contemplationId: string;
  quotaId: string | null;
  contractId: string | null;
  contractedCredit: number;
  updatedCredit: number;
  bidAmount: number;
  embeddedBidAmount: number;
  netAvailableCredit: number;
  usedCredit: number;
  remainingCredit: number;
  status: CreditStatus;
  approvedAt: string | null;
  availableAt: string | null;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
  // contexto
  quotaNumber: number | null;
  quotaLabel: string | null;
  groupCode: string | null;
  administratorName: string | null;
  assemblyId: string | null;
  assemblyNumber: number | null;
  assemblyDate: string | null;
  contemplationMethod: string | null;
  holderLabel: string | null;
};

type RawOp = {
  id: string;
  contemplation_id: string;
  quota_id: string | null;
  contract_id: string | null;
  contracted_credit: number;
  updated_credit: number;
  bid_amount: number;
  embedded_bid_amount: number;
  net_available_credit: number;
  used_credit: number;
  remaining_credit: number;
  status: CreditStatus;
  approved_at: string | null;
  available_at: string | null;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
};

const OP_SELECT =
  "id, contemplation_id, quota_id, contract_id, contracted_credit, updated_credit, bid_amount, embedded_bid_amount, net_available_credit, used_credit, remaining_credit, status, approved_at, available_at, closed_at, notes, created_at";

async function withContext(rows: RawOp[]): Promise<CreditOperation[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const contemplationIds = rows.map((r) => r.contemplation_id);
  const { data: conts, error } = await supabase
    .from("consortium_contemplations")
    .select("id, assembly_id, quota_number, method")
    .in("id", contemplationIds);
  if (error) throw error;
  const contById = new Map((conts ?? []).map((c) => [c.id as string, c as { id: string; assembly_id: string; quota_number: number; method: string }]));
  const assemblyIds = [...new Set([...contById.values()].map((c) => c.assembly_id))];
  const quotaIds = rows.map((r) => r.quota_id).filter((id): id is string => Boolean(id));
  const [asmRes, quotaRes] = await Promise.all([
    supabase.from("consortium_assemblies").select("id, assembly_number, assembly_date, group_id").in("id", assemblyIds),
    quotaIds.length
      ? supabase.from("consortium_quotas").select("id, holder_label").in("id", quotaIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (asmRes.error) throw asmRes.error;
  if (quotaRes.error) throw quotaRes.error;
  const asmById = new Map((asmRes.data ?? []).map((a) => [a.id as string, a as { id: string; assembly_number: number; assembly_date: string; group_id: string }]));
  const groupIds = [...new Set([...asmById.values()].map((a) => a.group_id))];
  const { data: groups, error: gError } = await supabase
    .from("consortium_groups")
    .select("id, group_code, administrator_name, display_digits")
    .in("id", groupIds);
  if (gError) throw gError;
  const groupById = new Map((groups ?? []).map((g) => [g.id as string, g as { id: string; group_code: string; administrator_name: string; display_digits: number }]));
  const holderById = new Map(((quotaRes.data ?? []) as { id: string; holder_label: string | null }[]).map((q) => [q.id, q.holder_label]));

  return rows.map((r) => {
    const c = contById.get(r.contemplation_id);
    const a = c ? asmById.get(c.assembly_id) : undefined;
    const g = a ? groupById.get(a.group_id) : undefined;
    return {
      id: r.id,
      contemplationId: r.contemplation_id,
      quotaId: r.quota_id,
      contractId: r.contract_id,
      contractedCredit: Number(r.contracted_credit),
      updatedCredit: Number(r.updated_credit),
      bidAmount: Number(r.bid_amount),
      embeddedBidAmount: Number(r.embedded_bid_amount),
      netAvailableCredit: Number(r.net_available_credit),
      usedCredit: Number(r.used_credit),
      remainingCredit: Number(r.remaining_credit),
      status: r.status,
      approvedAt: r.approved_at,
      availableAt: r.available_at,
      closedAt: r.closed_at,
      notes: r.notes,
      createdAt: r.created_at,
      quotaNumber: c?.quota_number ?? null,
      quotaLabel: c && g ? String(c.quota_number).padStart(g.display_digits, "0") : null,
      groupCode: g?.group_code ?? null,
      administratorName: g?.administrator_name ?? null,
      assemblyId: a?.id ?? null,
      assemblyNumber: a?.assembly_number ?? null,
      assemblyDate: a?.assembly_date ?? null,
      contemplationMethod: c?.method ?? null,
      holderLabel: r.quota_id ? (holderById.get(r.quota_id) ?? null) : null,
    };
  });
}

export async function listCreditOperations(organizationId: string): Promise<CreditOperation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_credit_operations")
    .select(OP_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return withContext((data ?? []) as RawOp[]);
}

export type CreditRequirement = {
  id: string;
  stage: "CONTEMPLATION" | "ANALYSIS" | "GUARANTEE" | "RELEASE";
  classification: "MANDATORY" | "CONDITIONAL" | "RECOMMENDED" | "INFORMATIVE";
  applies: boolean;
  title: string;
  description: string | null;
  legalBasis: string | null;
  status: "PENDING" | "RECEIVED" | "APPROVED" | "REJECTED" | "WAIVED";
  documentId: string | null;
  documentRequestId: string | null;
  decidedAt: string | null;
  notes: string | null;
};

export type Guarantee = {
  id: string;
  guaranteeType: string;
  required: boolean;
  assetDescription: string | null;
  appraisalValue: number | null;
  appraisalDate: string | null;
  validUntil: string | null;
  status: "PENDING" | "UNDER_ANALYSIS" | "APPROVED" | "REJECTED" | "EXPIRED" | "RELEASED";
  pendingNotes: string | null;
  approvedAt: string | null;
};

export type FinancialMovement = {
  id: string;
  contractId: string | null;
  creditOperationId: string | null;
  movementType: string;
  amount: number;
  details: Record<string, unknown>;
  reference: string | null;
  effectiveDate: string;
  createdBy: string | null;
  createdAt: string;
};

export type CreditWorkspace = {
  operation: CreditOperation;
  requirements: CreditRequirement[];
  guarantees: Guarantee[];
  movements: FinancialMovement[];
  installments: InstallmentState[];
  contract: { id: string; status: string; clientId: string | null; contemplatedAt: string | null; label: string } | null;
  position: SettlementPosition | null;
};

export async function getCreditWorkspace(organizationId: string, operationId: string): Promise<CreditWorkspace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_credit_operations")
    .select(OP_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", operationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [operation] = await withContext([data as RawOp]);

  const contractId = operation.contractId;
  const [reqRes, guarRes, movRes, contractRes, instRes] = await Promise.all([
    supabase
      .from("consortium_credit_requirements")
      .select("id, stage, classification, applies, title, description, legal_basis, status, document_id, document_request_id, decided_at, notes")
      .eq("credit_operation_id", operationId)
      .order("created_at"),
    supabase
      .from("consortium_guarantees")
      .select("id, guarantee_type, required, asset_description, appraisal_value, appraisal_date, valid_until, status, pending_notes, approved_at")
      .eq("credit_operation_id", operationId)
      .order("created_at"),
    contractId
      ? supabase
          .from("consortium_financial_movements")
          .select("id, contract_id, credit_operation_id, movement_type, amount, details, reference, effective_date, created_by, created_at")
          .or(`credit_operation_id.eq.${operationId},contract_id.eq.${contractId}`)
          .order("created_at", { ascending: false })
      : supabase
          .from("consortium_financial_movements")
          .select("id, contract_id, credit_operation_id, movement_type, amount, details, reference, effective_date, created_by, created_at")
          .eq("credit_operation_id", operationId)
          .order("created_at", { ascending: false }),
    contractId
      ? supabase
          .from("consortium_contracts")
          .select("id, status, client_id, contemplated_at, administrator_name, contract_number")
          .eq("id", contractId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    contractId
      ? supabase
          .from("consortium_installments")
          .select("id, installment_number, due_date, amount, status")
          .eq("consortium_contract_id", contractId)
          .order("installment_number")
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const r of [reqRes, guarRes, movRes, contractRes, instRes]) if (r.error) throw r.error;

  type RawReq = { id: string; stage: CreditRequirement["stage"]; classification: CreditRequirement["classification"]; applies: boolean; title: string; description: string | null; legal_basis: string | null; status: CreditRequirement["status"]; document_id: string | null; document_request_id: string | null; decided_at: string | null; notes: string | null };
  type RawG = { id: string; guarantee_type: string; required: boolean; asset_description: string | null; appraisal_value: number | null; appraisal_date: string | null; valid_until: string | null; status: Guarantee["status"]; pending_notes: string | null; approved_at: string | null };
  type RawM = { id: string; contract_id: string | null; credit_operation_id: string | null; movement_type: string; amount: number; details: Record<string, unknown>; reference: string | null; effective_date: string; created_by: string | null; created_at: string };
  type RawC = { id: string; status: string; client_id: string | null; contemplated_at: string | null; administrator_name: string | null; contract_number: string | null };
  type RawI = { id: string; installment_number: number; due_date: string; amount: number; status: InstallmentState["status"] };

  const installments = ((instRes.data ?? []) as RawI[]).map((i) => ({
    id: i.id,
    number: i.installment_number,
    dueDate: i.due_date,
    amount: Number(i.amount),
    status: i.status,
  }));
  const contractRow = contractRes.data as RawC | null;
  const movements = ((movRes.data ?? []) as RawM[]).map((m) => ({
    id: m.id,
    contractId: m.contract_id,
    creditOperationId: m.credit_operation_id,
    movementType: m.movement_type,
    amount: Number(m.amount),
    details: m.details ?? {},
    reference: m.reference,
    effectiveDate: m.effective_date,
    createdBy: m.created_by,
    createdAt: m.created_at,
  }));

  return {
    operation,
    requirements: ((reqRes.data ?? []) as RawReq[]).map((r) => ({
      id: r.id, stage: r.stage, classification: r.classification, applies: r.applies, title: r.title,
      description: r.description, legalBasis: r.legal_basis, status: r.status, documentId: r.document_id,
      documentRequestId: r.document_request_id, decidedAt: r.decided_at, notes: r.notes,
    })),
    guarantees: ((guarRes.data ?? []) as RawG[]).map((g) => ({
      id: g.id, guaranteeType: g.guarantee_type, required: g.required, assetDescription: g.asset_description,
      appraisalValue: g.appraisal_value === null ? null : Number(g.appraisal_value), appraisalDate: g.appraisal_date,
      validUntil: g.valid_until, status: g.status, pendingNotes: g.pending_notes, approvedAt: g.approved_at,
    })),
    movements,
    installments,
    contract: contractRow
      ? {
          id: contractRow.id,
          status: contractRow.status,
          clientId: contractRow.client_id,
          contemplatedAt: contractRow.contemplated_at,
          label: [contractRow.administrator_name, contractRow.contract_number].filter(Boolean).join(" · "),
        }
      : null,
    position: contractRow
      ? settlementPosition({
          installments,
          contemplated: Boolean(contractRow.contemplated_at),
          contractStatus: contractRow.status,
          asOf: new Date().toISOString().slice(0, 10),
          settledTotal: movements.some((m) => m.movementType === "SETTLEMENT_TOTAL"),
        })
      : null,
  };
}

/** Contemplações homologadas que ainda não abriram operação de crédito. */
export async function listContemplationsWithoutCredit(organizationId: string) {
  const supabase = await createClient();
  const [contRes, opRes] = await Promise.all([
    supabase
      .from("consortium_contemplations")
      .select("id, assembly_id, quota_number, method, credit_amount, homologated_at")
      .eq("organization_id", organizationId)
      .eq("status", "HOMOLOGATED")
      .order("homologated_at", { ascending: false })
      .limit(200),
    supabase.from("consortium_credit_operations").select("contemplation_id").eq("organization_id", organizationId),
  ]);
  if (contRes.error) throw contRes.error;
  if (opRes.error) throw opRes.error;
  const opened = new Set((opRes.data ?? []).map((o) => o.contemplation_id as string));
  return ((contRes.data ?? []) as { id: string; assembly_id: string; quota_number: number; method: string; credit_amount: number | null; homologated_at: string | null }[])
    .filter((c) => !opened.has(c.id))
    .map((c) => ({
      id: c.id,
      assemblyId: c.assembly_id,
      quotaNumber: c.quota_number,
      method: c.method,
      creditAmount: c.credit_amount === null ? null : Number(c.credit_amount),
      homologatedAt: c.homologated_at,
    }));
}
