"use server";

import { revalidatePath } from "next/cache";

import {
  applyCreditUsage,
  computeCreditEntitlement,
  evaluateRequirementGate,
  planAmortization,
  planSettlement,
  type AmortizationMode,
  type CreditStatus,
} from "@/lib/consortium-engine/index.ts";
import { getCreditWorkspace } from "@/lib/data/consortium-credit";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Pós-contemplação: crédito, documentação, garantias, utilização,
 * amortização e quitação. Contemplação ≠ crédito liberado ≠ quitação —
 * cada passo é explícito, humano e fica no razão.
 */

export type CreditActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; errors: string[] };

const OPERATE = ["admin", "manager", "operations", "advisor", "compliance", "finance"];
const GOVERN = ["admin", "manager", "compliance"];

async function guard(kind: "operate" | "govern") {
  const m = await requireActiveMembership();
  if (!(kind === "operate" ? OPERATE : GOVERN).includes(m.role)) {
    throw new Error(kind === "operate" ? "Seu papel não permite operar crédito de consórcio." : "Esta ação exige papel de governança.");
  }
  return m;
}

async function run<T>(fn: () => Promise<CreditActionResult<T>>): Promise<CreditActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    const message = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e);
    return { ok: false, errors: [message] };
  }
}

function revalidateCredit(id?: string) {
  revalidatePath("/consorcios/motor");
  revalidatePath("/consorcios/motor/credito");
  if (id) revalidatePath(`/consorcios/motor/credito/${id}`);
}

async function loadOp(organizationId: string, id: string) {
  const ws = await getCreditWorkspace(organizationId, id);
  if (!ws) throw new Error("Operação de crédito não encontrada.");
  return ws;
}

/** Abre o direito ao crédito a partir de uma contemplação HOMOLOGADA. */
export async function openCreditOperation(
  contemplationId: string,
  input: { updatedCredit: number | null; notes: string },
): Promise<CreditActionResult<{ id: string }>> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const supabase = await createClient();
    const { data: cont, error } = await supabase
      .from("consortium_contemplations")
      .select("id, quota_id, status, credit_amount, bid_id, method")
      .eq("id", contemplationId)
      .eq("organization_id", organizationId)
      .single();
    if (error) throw error;
    if (cont.status !== "HOMOLOGATED") return { ok: false, errors: ["Só contemplação homologada gera direito ao crédito."] };
    if (cont.credit_amount === null) return { ok: false, errors: ["Contemplação sem valor de crédito registrado."] };

    let bidAmount = 0;
    let embedded = 0;
    if (cont.bid_id) {
      const { data: bid, error: bidError } = await supabase
        .from("consortium_bids")
        .select("bid_amount, bid_percentage, embedded_amount")
        .eq("id", cont.bid_id)
        .single();
      if (bidError) throw bidError;
      bidAmount = Number(bid.bid_amount ?? (Number(bid.bid_percentage ?? 0) / 100) * Number(cont.credit_amount));
      embedded = Number(bid.embedded_amount ?? 0);
    }
    const entitlement = computeCreditEntitlement({
      contractedCredit: Number(cont.credit_amount),
      updatedCredit: input.updatedCredit,
      bidAmount,
      embeddedBidAmount: embedded,
    });

    let contractId: string | null = null;
    if (cont.quota_id) {
      const { data: q } = await supabase.from("consortium_quotas").select("contract_id").eq("id", cont.quota_id).maybeSingle();
      contractId = (q?.contract_id as string | null) ?? null;
    }

    const { data, error: insError } = await supabase
      .from("consortium_credit_operations")
      .insert({
        organization_id: organizationId,
        contemplation_id: contemplationId,
        quota_id: cont.quota_id,
        contract_id: contractId,
        contracted_credit: entitlement.contractedCredit,
        updated_credit: entitlement.updatedCredit,
        bid_amount: entitlement.bidAmount,
        embedded_bid_amount: entitlement.embeddedBidAmount,
        notes: input.notes.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (insError) {
      if (insError.code === "23505") return { ok: false, errors: ["Esta contemplação já tem operação de crédito."] };
      throw insError;
    }
    await supabase.from("consortium_engine_events").insert({
      organization_id: organizationId,
      entity_type: "credit_operation",
      entity_id: data.id,
      event_type: "CREDIT_OPENED",
      payload: { contemplationId, ...entitlement },
    });
    revalidateCredit();
    return { ok: true, data: { id: data.id as string }, message: entitlement.explanation.join(" ") };
  });
}

export async function addCreditRequirement(
  operationId: string,
  input: {
    stage: string;
    classification: string;
    applies: boolean;
    title: string;
    description: string;
    legalBasis: string;
  },
): Promise<CreditActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    if (!input.title.trim()) return { ok: false, errors: ["Informe o requisito."] };
    const supabase = await createClient();
    const { error } = await supabase.from("consortium_credit_requirements").insert({
      organization_id: organizationId,
      credit_operation_id: operationId,
      stage: input.stage,
      classification: input.classification,
      applies: input.applies,
      title: input.title.trim(),
      description: input.description.trim() || null,
      legal_basis: input.legalBasis.trim() || null,
    });
    if (error) throw error;
    revalidateCredit(operationId);
    return { ok: true };
  });
}

export async function decideCreditRequirement(
  operationId: string,
  requirementId: string,
  input: { status: string; applies: boolean; notes: string },
): Promise<CreditActionResult> {
  return run(async () => {
    const { organizationId, userId, role } = await guard("operate");
    if (["APPROVED", "WAIVED"].includes(input.status) && !GOVERN.includes(role)) {
      return { ok: false, errors: ["Aprovar ou dispensar requisito exige papel de governança."] };
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("consortium_credit_requirements")
      .update({ status: input.status, applies: input.applies, notes: input.notes.trim() || null, decided_by: userId, decided_at: new Date().toISOString() })
      .eq("id", requirementId)
      .eq("organization_id", organizationId);
    if (error) throw error;
    await supabase.from("consortium_engine_events").insert({
      organization_id: organizationId,
      entity_type: "credit_requirement",
      entity_id: requirementId,
      event_type: `REQUIREMENT_${input.status}`,
      payload: { operationId, applies: input.applies, notes: input.notes },
    });
    revalidateCredit(operationId);
    return { ok: true };
  });
}

/** Cria uma solicitação no fluxo de documentos existente (sem armazenamento paralelo). */
export async function requestRequirementDocument(operationId: string, requirementId: string): Promise<CreditActionResult> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const ws = await loadOp(organizationId, operationId);
    const req = ws.requirements.find((r) => r.id === requirementId);
    if (!req) return { ok: false, errors: ["Requisito não encontrado."] };
    if (req.documentRequestId) return { ok: false, errors: ["Documento já solicitado."] };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("document_requests")
      .insert({
        organization_id: organizationId,
        client_id: ws.contract?.clientId ?? null,
        category: "consorcio",
        title: req.title,
        description: `Contemplação — cota ${ws.operation.quotaLabel ?? "?"}, grupo ${ws.operation.groupCode ?? "?"}. Etapa: ${req.stage}.`,
        responsible_role: "cliente",
        requested_by: userId,
        status: "solicitado",
        entity_type: "consortium_credit_requirement",
        entity_id: requirementId,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: upError } = await supabase
      .from("consortium_credit_requirements")
      .update({ document_request_id: data.id })
      .eq("id", requirementId);
    if (upError) throw upError;
    revalidateCredit(operationId);
    revalidatePath("/documentos/documentos");
    return { ok: true, message: "Solicitação criada no Centro de Documentos." };
  });
}

export async function addGuarantee(
  operationId: string,
  input: { guaranteeType: string; required: boolean; assetDescription: string; appraisalValue: number | null; appraisalDate: string | null; validUntil: string | null; pendingNotes: string },
): Promise<CreditActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const supabase = await createClient();
    const { error } = await supabase.from("consortium_guarantees").insert({
      organization_id: organizationId,
      credit_operation_id: operationId,
      guarantee_type: input.guaranteeType,
      required: input.required,
      asset_description: input.assetDescription.trim() || null,
      appraisal_value: input.appraisalValue,
      appraisal_date: input.appraisalDate,
      valid_until: input.validUntil,
      pending_notes: input.pendingNotes.trim() || null,
    });
    if (error) throw error;
    revalidateCredit(operationId);
    return { ok: true };
  });
}

export async function decideGuarantee(operationId: string, guaranteeId: string, status: string, notes: string): Promise<CreditActionResult> {
  return run(async () => {
    const { organizationId, userId } = await guard(["APPROVED", "REJECTED", "RELEASED"].includes(status) ? "govern" : "operate");
    const supabase = await createClient();
    const { error } = await supabase
      .from("consortium_guarantees")
      .update({
        status,
        pending_notes: notes.trim() || null,
        ...(status === "APPROVED" ? { approved_by: userId, approved_at: new Date().toISOString() } : {}),
      })
      .eq("id", guaranteeId)
      .eq("organization_id", organizationId);
    if (error) throw error;
    await supabase.from("consortium_engine_events").insert({
      organization_id: organizationId,
      entity_type: "guarantee",
      entity_id: guaranteeId,
      event_type: `GUARANTEE_${status}`,
      payload: { operationId, notes },
    });
    revalidateCredit(operationId);
    return { ok: true };
  });
}

/** Avança o crédito no fluxo. Documentação/garantia obrigatórias são checadas aqui E no banco. */
export async function transitionCredit(operationId: string, to: CreditStatus): Promise<CreditActionResult> {
  return run(async () => {
    const { organizationId, userId } = await guard(["APPROVED", "AVAILABLE", "CANCELLED"].includes(to) ? "govern" : "operate");
    const ws = await loadOp(organizationId, operationId);
    if (to === "APPROVED" || to === "AVAILABLE") {
      const gate = evaluateRequirementGate(ws.requirements, to);
      if (!gate.canAdvance) {
        return { ok: false, errors: gate.blocking.map((r) => `Requisito obrigatório pendente: ${r.title}.`) };
      }
      if (to === "AVAILABLE") {
        const pending = ws.guarantees.filter((g) => g.required && g.status !== "APPROVED");
        if (pending.length) return { ok: false, errors: pending.map((g) => `Garantia exigida sem aprovação: ${g.assetDescription ?? g.guaranteeType}.`) };
      }
    }
    const supabase = await createClient();
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status: to };
    if (to === "APPROVED") Object.assign(patch, { approved_by: userId, approved_at: now });
    if (to === "AVAILABLE") patch.available_at = now;
    if (to === "CLOSED") patch.closed_at = now;
    const { error } = await supabase.from("consortium_credit_operations").update(patch).eq("id", operationId).eq("organization_id", organizationId);
    if (error) throw error;
    await supabase.from("consortium_engine_events").insert({
      organization_id: organizationId,
      entity_type: "credit_operation",
      entity_id: operationId,
      event_type: `CREDIT_${to}`,
      payload: { from: ws.operation.status, to },
    });
    revalidateCredit(operationId);
    const warnings = to === "APPROVED" || to === "AVAILABLE" ? evaluateRequirementGate(ws.requirements, to).warnings : [];
    return { ok: true, message: warnings.length ? `Avançado com alerta: ${warnings.map((w) => w.title).join(", ")} (recomendado).` : undefined };
  });
}

export async function recordCreditMovement(
  operationId: string,
  input: { type: "CREDIT_USAGE" | "CREDIT_USAGE_REVERSAL" | "CREDIT_UPDATE"; amount: number; effectiveDate: string; reference: string; description: string },
): Promise<CreditActionResult> {
  return run(async () => {
    const { organizationId } = await guard(input.type === "CREDIT_UPDATE" ? "govern" : "operate");
    const ws = await loadOp(organizationId, operationId);
    const op = ws.operation;
    let details: Record<string, unknown> = { description: input.description };
    if (input.type === "CREDIT_USAGE") {
      const usage = applyCreditUsage({ netAvailableCredit: op.netAvailableCredit, usedCredit: op.usedCredit, amount: input.amount });
      details = { ...details, ...usage };
    }
    if (input.type === "CREDIT_UPDATE") {
      const ent = computeCreditEntitlement({ contractedCredit: op.contractedCredit, updatedCredit: input.amount, bidAmount: op.bidAmount, embeddedBidAmount: op.embeddedBidAmount });
      details = { ...details, explanation: ent.explanation };
    }
    const supabase = await createClient();
    const { error } = await supabase.rpc("consortium_record_credit_movement", {
      p_credit_operation_id: operationId,
      p_movement_type: input.type,
      p_amount: input.amount,
      p_effective_date: input.effectiveDate,
      p_reference: input.reference,
      p_details: details,
      p_expected_used: op.usedCredit,
      p_expected_updated: op.updatedCredit,
    });
    if (error) throw error;
    revalidateCredit(operationId);
    return { ok: true };
  });
}

async function installmentsFor(contractId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consortium_installments")
    .select("id, installment_number, due_date, amount, status")
    .eq("consortium_contract_id", contractId)
    .order("installment_number");
  if (error) throw error;
  return (data ?? []).map((i) => ({
    id: i.id as string,
    number: i.installment_number as number,
    dueDate: i.due_date as string,
    amount: Number(i.amount),
    status: i.status as "pending",
  }));
}

/** Amortização — o motor calcula, a função SQL aplica tudo-ou-nada. */
export async function recordAmortization(
  contractId: string,
  input: { amount: number; mode: AmortizationMode; effectiveDate: string; reference: string; creditOperationId: string | null },
): Promise<CreditActionResult> {
  return run(async () => {
    await guard("operate");
    const installments = await installmentsFor(contractId);
    const plan = planAmortization(installments, input.amount, input.mode);
    const supabase = await createClient();
    const { error } = await supabase.rpc("consortium_apply_installment_plan", {
      p_contract_id: contractId,
      p_changes: plan.changes,
      p_movement: {
        movement_type: "AMORTIZATION",
        amount: plan.applied,
        details: plan,
        reference: input.reference,
        effective_date: input.effectiveDate,
        credit_operation_id: input.creditOperationId ?? "",
        description: plan.explanation.join(" "),
      },
    });
    if (error) throw error;
    revalidateCredit(input.creditOperationId ?? undefined);
    revalidatePath(`/consorcios/contratos/${contractId}`);
    revalidatePath("/consorcios/parcelas");
    return { ok: true, message: plan.explanation.join(" ") };
  });
}

/** Quitação parcial (reduz prazo) ou total (encerra saldo; contrato vira quitado). */
export async function recordSettlement(
  contractId: string,
  input: { amount: number; effectiveDate: string; reference: string; creditOperationId: string | null },
): Promise<CreditActionResult> {
  return run(async () => {
    await guard("operate");
    const installments = await installmentsFor(contractId);
    const plan = planSettlement(installments, input.amount);
    const changes =
      plan.kind === "SETTLEMENT_TOTAL"
        ? installments
            .filter((i) => plan.installmentIds.includes(i.id))
            .map((i) => ({ id: i.id, number: i.number, before: { amount: i.amount, status: i.status }, after: { amount: i.amount, status: "paid" } }))
        : plan.plan!.changes;
    const supabase = await createClient();
    const { error } = await supabase.rpc("consortium_apply_installment_plan", {
      p_contract_id: contractId,
      p_changes: changes,
      p_movement: {
        movement_type: plan.kind,
        amount: input.amount,
        details: plan,
        reference: input.reference,
        effective_date: input.effectiveDate,
        credit_operation_id: input.creditOperationId ?? "",
        description: plan.explanation.join(" "),
      },
      p_contract_patch: plan.kind === "SETTLEMENT_TOTAL" ? { status: "settled" } : {},
    });
    if (error) throw error;
    revalidateCredit(input.creditOperationId ?? undefined);
    revalidatePath(`/consorcios/contratos/${contractId}`);
    revalidatePath("/consorcios/parcelas");
    return { ok: true, message: plan.explanation.join(" ") };
  });
}
