"use server";

import { revalidatePath } from "next/cache";

import {
  buildEligibilitySnapshot,
  compareRuns,
  computeRuleHash,
  detectDuplicateContest,

  hashOf,
  lotteryContentHash,
  parseQuotaNumber,
  runBids,
  runDraw,
  validateLotteryForAssembly,
  validateLotteryResult,
  validateRetificationRequest,
  validateRuleConfig,
  type BidInput,
  type DrawRule,
  type EligibilitySnapshot,
  type LotteryResult,
  type QuotaRecord,
  type RuleConfig,
  type RuleStatus,
  type RunOutput,
} from "@/lib/consortium-engine/index.ts";
import type { DrawInput } from "@/lib/consortium-engine/draw.ts";
import {
  getAssemblyWorkspace,
  getEngineGroup,
  getEngineRule,
  latestSnapshot,
  mapLottery,
  type AssemblySnapshot,
  type AssemblyWorkspace,
  type DrawRunRecord,
} from "@/lib/data/consortium-engine";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Server Actions do motor de consórcios.
 *
 * Padrão: (1) lê do banco, (2) congela em snapshot, (3) roda o motor
 * PURO sobre o snapshot, (4) persiste tudo-ou-nada via função SQL.
 * Nenhuma regra de cálculo mora aqui — só orquestração.
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;
export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; errors: string[] };

const OPERATOR_ROLES = ["admin", "manager", "operations", "advisor"];
const GOVERNANCE_ROLES = ["admin", "manager", "compliance"];

function fail(...errors: string[]): { ok: false; errors: string[] } {
  return { ok: false, errors };
}

function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

async function guard(kind: "operate" | "govern") {
  const membership = await requireActiveMembership();
  const allowed = kind === "operate" ? [...OPERATOR_ROLES, ...GOVERNANCE_ROLES] : GOVERNANCE_ROLES;
  if (!allowed.includes(membership.role)) {
    throw new Error(
      kind === "operate"
        ? "Seu papel não permite operar o motor de consórcios."
        : "Esta ação exige papel de governança (admin, gestor ou compliance).",
    );
  }
  return membership;
}

/** Envolve a action: erro vira mensagem legível, nunca tela quebrada. */
async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    return fail(errorMessage(e));
  }
}

async function logEvent(
  supabase: Supabase,
  organizationId: string,
  event: {
    groupId?: string | null;
    assemblyId?: string | null;
    entityType: string;
    entityId?: string | null;
    eventType: string;
    payload?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("consortium_engine_events").insert({
    organization_id: organizationId,
    group_id: event.groupId ?? null,
    assembly_id: event.assemblyId ?? null,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    event_type: event.eventType,
    payload: event.payload ?? {},
  });
  if (error) throw error;
}

function revalidateEngine(extra: string[] = []) {
  revalidatePath("/consorcios/motor");
  for (const p of extra) revalidatePath(p);
}

// ═══════════════════════════════════════════════════════════════
// GRUPOS E COTAS
// ═══════════════════════════════════════════════════════════════

export async function createEngineGroup(input: {
  administratorName: string;
  groupCode: string;
  productType: string;
  quotaCount: number;
  numberStart: number;
  displayDigits: number;
  creditAmount: number | null;
  regulationReference: string;
  notes: string;
  constitutedAt: string | null;
  participantsCount: number | null;
  termMonths: number | null;
  installmentAmount: number | null;
  adjustmentIndex: string;
  adminFeePercentage: number | null;
  reserveFundPercentage: number | null;
  insuranceRequired: boolean;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    if (!input.administratorName.trim() || !input.groupCode.trim()) return fail("Administradora e código do grupo são obrigatórios.");
    if (!Number.isInteger(input.quotaCount) || input.quotaCount <= 0) return fail("Quantidade de cotas inválida.");
    const numberEnd = input.numberStart + input.quotaCount - 1;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("consortium_groups")
      .insert({
        organization_id: organizationId,
        administrator_name: input.administratorName.trim(),
        group_code: input.groupCode.trim(),
        product_type: input.productType.trim() || null,
        quota_count: input.quotaCount,
        number_start: input.numberStart,
        number_end: numberEnd,
        display_digits: input.displayDigits,
        credit_amount: input.creditAmount,
        regulation_reference: input.regulationReference.trim() || null,
        notes: input.notes.trim() || null,
        constituted_at: input.constitutedAt,
        participants_count: input.participantsCount,
        term_months: input.termMonths,
        installment_amount: input.installmentAmount,
        adjustment_index: input.adjustmentIndex.trim() || null,
        admin_fee_percentage: input.adminFeePercentage,
        reserve_fund_percentage: input.reserveFundPercentage,
        insurance_required: input.insuranceRequired,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") return fail("Já existe um grupo com esse código nessa administradora.");
      throw error;
    }
    await logEvent(supabase, organizationId, {
      groupId: data.id,
      entityType: "group",
      entityId: data.id,
      eventType: "GROUP_CREATED",
      payload: { groupCode: input.groupCode, quotaCount: input.quotaCount, numberStart: input.numberStart, numberEnd },
    });
    revalidateEngine();
    return { ok: true, data: { id: data.id as string } };
  });
}

export async function updateEngineGroup(
  groupId: string,
  input: { status: string; creditAmount: number | null; regulationReference: string; notes: string },
): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const supabase = await createClient();
    const { error } = await supabase
      .from("consortium_groups")
      .update({
        status: input.status,
        credit_amount: input.creditAmount,
        regulation_reference: input.regulationReference.trim() || null,
        notes: input.notes.trim() || null,
      })
      .eq("id", groupId)
      .eq("organization_id", organizationId);
    if (error) throw error;
    await logEvent(supabase, organizationId, {
      groupId,
      entityType: "group",
      entityId: groupId,
      eventType: "GROUP_UPDATED",
      payload: input,
    });
    revalidateEngine([`/consorcios/motor/grupos/${groupId}`]);
    return { ok: true };
  });
}

const STATUS_WORDS: Record<string, QuotaRecord["status"]> = {
  ativa: "ACTIVE",
  ativo: "ACTIVE",
  cancelada: "CANCELLED",
  cancelado: "CANCELLED",
  excluida: "EXCLUDED",
  excluída: "EXCLUDED",
  disponivel: "AVAILABLE",
  disponível: "AVAILABLE",
};
const PAYMENT_WORDS: Record<string, QuotaRecord["paymentStatus"]> = {
  "em dia": "UP_TO_DATE",
  adimplente: "UP_TO_DATE",
  inadimplente: "DELINQUENT",
  atrasada: "DELINQUENT",
  desconhecido: "UNKNOWN",
  "": "UNKNOWN",
};

/**
 * Importa situação de cotas (lista publicada pela administradora ou
 * conferência manual). Uma linha por cota:
 *   número;situação;pagamento;contemplada
 *   450;ativa;em dia;não
 * Cotas vinculadas a contrato NÃO são sobrescritas — a verdade delas
 * vem do contrato/parcelas.
 */
export async function importQuotaStatuses(groupId: string, text: string): Promise<ActionResult<{ imported: number }>> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const group = await getEngineGroup(organizationId, groupId);
    if (!group) return fail("Grupo não encontrado.");

    const errors: string[] = [];
    const rows: Record<string, unknown>[] = [];
    const seen = new Set<number>();
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .forEach((line, i) => {
        const [numRaw, statusRaw = "ativa", payRaw = "", contRaw = "não"] = line.split(/[;,\t]/).map((s) => s.trim().toLowerCase());
        let quotaNumber: number;
        try {
          quotaNumber = parseQuotaNumber(numRaw);
        } catch {
          errors.push(`Linha ${i + 1}: número de cota inválido ("${numRaw}").`);
          return;
        }
        if (quotaNumber < group.numbering.numberStart || quotaNumber > group.numbering.numberEnd) {
          errors.push(`Linha ${i + 1}: cota ${numRaw} fora da faixa do grupo.`);
          return;
        }
        if (seen.has(quotaNumber)) {
          errors.push(`Linha ${i + 1}: cota ${numRaw} repetida.`);
          return;
        }
        const status = STATUS_WORDS[statusRaw];
        const payment = PAYMENT_WORDS[payRaw];
        if (!status) errors.push(`Linha ${i + 1}: situação "${statusRaw}" não reconhecida (use ativa, cancelada, excluída ou disponível).`);
        if (!payment) errors.push(`Linha ${i + 1}: pagamento "${payRaw}" não reconhecido (use em dia, inadimplente ou desconhecido).`);
        if (!status || !payment) return;
        seen.add(quotaNumber);
        rows.push({
          organization_id: organizationId,
          group_id: groupId,
          quota_number: quotaNumber,
          status,
          payment_status: payment,
          contemplated_at: ["sim", "s", "contemplada"].includes(contRaw) ? "1900-01-01" : null,
          contemplation_method: ["sim", "s", "contemplada"].includes(contRaw) ? "IMPORTED" : null,
          eligibility_source: "IMPORTED",
        });
      });
    if (errors.length) return fail(...errors.slice(0, 20));
    if (rows.length === 0) return fail("Nenhuma linha para importar.");

    const supabase = await createClient();
    const { data: linked, error: linkedError } = await supabase
      .from("consortium_quotas")
      .select("quota_number")
      .eq("group_id", groupId)
      .eq("eligibility_source", "CONTRACT");
    if (linkedError) throw linkedError;
    const protectedNumbers = new Set((linked ?? []).map((r) => r.quota_number as number));
    const toWrite = rows.filter((r) => !protectedNumbers.has(r.quota_number as number));

    for (let i = 0; i < toWrite.length; i += 500) {
      const { error } = await supabase
        .from("consortium_quotas")
        .upsert(toWrite.slice(i, i + 500), { onConflict: "group_id,quota_number" });
      if (error) throw error;
    }
    await logEvent(supabase, organizationId, {
      groupId,
      entityType: "group",
      entityId: groupId,
      eventType: "QUOTAS_IMPORTED",
      payload: { imported: toWrite.length, skippedLinkedToContract: rows.length - toWrite.length, sourceHash: hashOf(text) },
    });
    revalidateEngine([`/consorcios/motor/grupos/${groupId}`]);
    return {
      ok: true,
      data: { imported: toWrite.length },
      message:
        rows.length - toWrite.length > 0
          ? `${toWrite.length} cota(s) importada(s); ${rows.length - toWrite.length} ignorada(s) por estarem vinculadas a contrato.`
          : `${toWrite.length} cota(s) importada(s).`,
    };
  });
}

/**
 * Vincula as cotas dos contratos de clientes (mesma administradora e
 * grupo) — a situação dessas cotas passa a vir do contrato/parcelas.
 */
export async function linkContractQuotas(groupId: string): Promise<ActionResult<{ linked: number }>> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const group = await getEngineGroup(organizationId, groupId);
    if (!group) return fail("Grupo não encontrado.");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("consortium_contracts")
      .select("id, administrator_name, group_number, quota_number, status, contemplated_at, client:clients!consortium_contracts_client_id_fkey(full_name)")
      .eq("organization_id", organizationId)
      .eq("group_number", group.groupCode)
      .ilike("administrator_name", group.administratorName);
    if (error) throw error;

    type Raw = { id: string; quota_number: string | null; status: string; contemplated_at: string | null; client: { full_name: string } | null };
    const contracts = (data ?? []) as unknown as Raw[];
    const skipped: string[] = [];
    const rows: Record<string, unknown>[] = [];
    for (const c of contracts) {
      let quotaNumber: number;
      try {
        quotaNumber = parseQuotaNumber(c.quota_number ?? "");
      } catch {
        skipped.push(`contrato ${c.id.slice(0, 8)} sem número de cota válido`);
        continue;
      }
      if (quotaNumber < group.numbering.numberStart || quotaNumber > group.numbering.numberEnd) {
        skipped.push(`cota ${c.quota_number} fora da faixa do grupo`);
        continue;
      }
      rows.push({
        organization_id: organizationId,
        group_id: groupId,
        quota_number: quotaNumber,
        contract_id: c.id,
        holder_label: c.client?.full_name ?? null,
        status: c.status === "cancelled" ? "CANCELLED" : "ACTIVE",
        contemplated_at: c.contemplated_at,
        eligibility_source: "CONTRACT",
      });
    }
    if (rows.length) {
      const { error: upsertError } = await supabase.from("consortium_quotas").upsert(rows, { onConflict: "group_id,quota_number" });
      if (upsertError) throw upsertError;
    }
    await logEvent(supabase, organizationId, {
      groupId,
      entityType: "group",
      entityId: groupId,
      eventType: "CONTRACT_QUOTAS_LINKED",
      payload: { linked: rows.length, skipped },
    });
    revalidateEngine([`/consorcios/motor/grupos/${groupId}`]);
    return {
      ok: true,
      data: { linked: rows.length },
      message: `${rows.length} cota(s) de clientes vinculada(s).${skipped.length ? ` Ignoradas: ${skipped.join("; ")}.` : ""}`,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// REGRAS
// ═══════════════════════════════════════════════════════════════

type RuleForm = {
  ruleKey: string;
  name: string;
  administratorName: string;
  productType: string;
  groupId: string | null;
  effectiveFrom: string;
  effectiveUntil: string | null;
  source: DrawRule["source"];
  regulationReference: string;
  config: RuleConfig;
};

export async function createRuleDraft(input: RuleForm): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const key = input.ruleKey.trim().toUpperCase();
    if (!key || !input.name.trim() || !input.administratorName.trim()) return fail("Chave, nome e administradora são obrigatórios.");
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("consortium_draw_rules")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("rule_key", key)
      .limit(1);
    if (existing && existing.length > 0) return fail(`Já existe regra com a chave ${key}. Crie uma nova versão a partir dela.`);

    const { data, error } = await supabase
      .from("consortium_draw_rules")
      .insert({
        organization_id: organizationId,
        rule_key: key,
        version: 1,
        name: input.name.trim(),
        administrator_name: input.administratorName.trim(),
        product_type: input.productType.trim() || null,
        group_id: input.groupId,
        effective_from: input.effectiveFrom,
        effective_until: input.effectiveUntil,
        source: input.source,
        regulation_reference: input.regulationReference.trim() || null,
        config: input.config,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    await logEvent(supabase, organizationId, {
      groupId: input.groupId,
      entityType: "rule",
      entityId: data.id,
      eventType: "RULE_CREATED",
      payload: { ruleKey: key, version: 1 },
    });
    revalidateEngine();
    return { ok: true, data: { id: data.id as string } };
  });
}

export async function updateRuleDraft(ruleId: string, input: RuleForm): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const rule = await getEngineRule(organizationId, ruleId);
    if (!rule) return fail("Regra não encontrada.");
    if (rule.status !== "DRAFT") return fail("Só regras em rascunho podem ser editadas. Crie uma nova versão.");
    const supabase = await createClient();
    const { error } = await supabase
      .from("consortium_draw_rules")
      .update({
        name: input.name.trim(),
        administrator_name: input.administratorName.trim(),
        product_type: input.productType.trim() || null,
        group_id: input.groupId,
        effective_from: input.effectiveFrom,
        effective_until: input.effectiveUntil,
        source: input.source,
        regulation_reference: input.regulationReference.trim() || null,
        config: input.config,
      })
      .eq("id", ruleId)
      .eq("organization_id", organizationId);
    if (error) throw error;
    await logEvent(supabase, organizationId, {
      groupId: input.groupId,
      entityType: "rule",
      entityId: ruleId,
      eventType: "RULE_DRAFT_UPDATED",
      payload: { ruleKey: rule.ruleKey, version: rule.version, before: rule.config, after: input.config },
    });
    revalidateEngine([`/consorcios/motor/regras/${ruleId}`]);
    return { ok: true };
  });
}

export async function createRuleVersion(ruleId: string): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const rule = await getEngineRule(organizationId, ruleId);
    if (!rule) return fail("Regra não encontrada.");
    const supabase = await createClient();
    const { data: maxRow, error: maxError } = await supabase
      .from("consortium_draw_rules")
      .select("version")
      .eq("organization_id", organizationId)
      .eq("rule_key", rule.ruleKey)
      .order("version", { ascending: false })
      .limit(1)
      .single();
    if (maxError) throw maxError;
    const version = (maxRow.version as number) + 1;
    const { data, error } = await supabase
      .from("consortium_draw_rules")
      .insert({
        organization_id: organizationId,
        rule_key: rule.ruleKey,
        version,
        name: rule.name,
        administrator_name: rule.administratorName,
        product_type: rule.productType,
        group_id: rule.groupId,
        effective_from: rule.effectiveFrom,
        effective_until: null,
        source: rule.source,
        regulation_reference: rule.regulationReference,
        config: rule.config,
        previous_version_id: rule.id,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    await logEvent(supabase, organizationId, {
      groupId: rule.groupId,
      entityType: "rule",
      entityId: data.id,
      eventType: "RULE_VERSION_CREATED",
      payload: { ruleKey: rule.ruleKey, version, fromVersion: rule.version },
    });
    revalidateEngine();
    return { ok: true, data: { id: data.id as string } };
  });
}

/**
 * Ciclo de vida. REVIEW congela o hash; APPROVED/PUBLISHED exigem
 * governança (também checado no trigger); PUBLISHED substitui a versão
 * publicada anterior da mesma chave.
 */
export async function transitionRule(ruleId: string, to: RuleStatus): Promise<ActionResult> {
  return run(async () => {
    const membership = await guard(to === "APPROVED" || to === "PUBLISHED" ? "govern" : "operate");
    const { organizationId, userId } = membership;
    const rule = await getEngineRule(organizationId, ruleId);
    if (!rule) return fail("Regra não encontrada.");
    const supabase = await createClient();
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status: to };

    if (to === "REVIEW") {
      const errors = validateRuleConfig(rule.config);
      if (errors.length) return fail(...errors);
      // Hash é gravado ainda em DRAFT (única fase editável) e só então muda o status.
      const { error: hashError } = await supabase
        .from("consortium_draw_rules")
        .update({ rule_hash: computeRuleHash(rule) })
        .eq("id", ruleId);
      if (hashError) throw hashError;
    }
    if (to === "DRAFT" && rule.status === "REVIEW") {
      patch.rule_hash = null;
    }
    if (to === "APPROVED") Object.assign(patch, { approved_by: userId, approved_at: now, reviewed_by: userId, reviewed_at: now });
    if (to === "PUBLISHED") Object.assign(patch, { published_by: userId, published_at: now });

    if (to === "DRAFT" && rule.status === "REVIEW") {
      // Voltar pra rascunho: primeiro o status (hash só pode mudar em DRAFT).
      const { error: e1 } = await supabase.from("consortium_draw_rules").update({ status: "DRAFT" }).eq("id", ruleId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("consortium_draw_rules").update({ rule_hash: null }).eq("id", ruleId);
      if (e2) throw e2;
    } else {
      const { error } = await supabase.from("consortium_draw_rules").update(patch).eq("id", ruleId).eq("organization_id", organizationId);
      if (error) throw error;
    }

    let superseded: string[] = [];
    if (to === "PUBLISHED") {
      const { data: previous, error: prevError } = await supabase
        .from("consortium_draw_rules")
        .select("id, version, effective_until")
        .eq("organization_id", organizationId)
        .eq("rule_key", rule.ruleKey)
        .eq("status", "PUBLISHED")
        .neq("id", ruleId);
      if (prevError) throw prevError;
      const dayBefore = new Date(Date.parse(`${rule.effectiveFrom}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
      for (const p of previous ?? []) {
        const until = p.effective_until && (p.effective_until as string) < dayBefore ? p.effective_until : dayBefore;
        const { error: supError } = await supabase
          .from("consortium_draw_rules")
          .update({ status: "SUPERSEDED", effective_until: until })
          .eq("id", p.id);
        if (supError) throw supError;
        superseded = [...superseded, `v${p.version}`];
      }
    }

    await logEvent(supabase, organizationId, {
      groupId: rule.groupId,
      entityType: "rule",
      entityId: ruleId,
      eventType: `RULE_${to}`,
      payload: { ruleKey: rule.ruleKey, version: rule.version, from: rule.status, to, superseded, ruleHash: to === "REVIEW" ? computeRuleHash(rule) : rule.ruleHash },
    });
    revalidateEngine([`/consorcios/motor/regras/${ruleId}`]);
    return { ok: true, message: superseded.length ? `Publicada. Substituiu ${superseded.join(", ")}.` : undefined };
  });
}

export async function deleteRuleDraft(ruleId: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const supabase = await createClient();
    const { error } = await supabase.from("consortium_draw_rules").delete().eq("id", ruleId).eq("organization_id", organizationId);
    if (error) throw error;
    await logEvent(supabase, organizationId, { entityType: "rule", entityId: ruleId, eventType: "RULE_DRAFT_DELETED" });
    revalidateEngine();
    return { ok: true };
  });
}

// ═══════════════════════════════════════════════════════════════
// RESULTADO OFICIAL
// ═══════════════════════════════════════════════════════════════

export async function importLotteryResult(input: {
  source: LotteryResult["source"];
  contestNumber: string;
  drawDate: string;
  prizes: string[];
  prizeDigits: number;
  sourceReference: string;
  evidenceNotes: string;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const result: LotteryResult = {
      source: input.source,
      contestNumber: input.contestNumber.trim(),
      drawDate: input.drawDate,
      prizes: input.prizes.map((p) => p.trim()),
    };
    const today = new Date().toISOString().slice(0, 10);
    const validation = validateLotteryResult(result, { prizeDigits: input.prizeDigits, prizeCount: result.prizes.length || 5 }, today);
    const supabase = await createClient();

    const { data: same, error: sameError } = await supabase
      .from("consortium_lottery_results")
      .select("id, source, contest_number, draw_date, prizes, prize_digits, source_reference, retrieved_at, evidence_notes, verification_status, validation_errors, content_hash, verified_by, verified_at, created_at")
      .eq("organization_id", organizationId)
      .eq("source", result.source)
      .eq("contest_number", result.contestNumber);
    if (sameError) throw sameError;
    const existing = (same ?? []).map((r) => mapLottery(r as Parameters<typeof mapLottery>[0]));
    const dup = detectDuplicateContest(existing, result);
    if (dup?.kind === "IDENTICAL") return fail(`Concurso ${result.contestNumber} já importado com os mesmos prêmios.`);
    if (dup?.kind === "CONFLICT") {
      await logEvent(supabase, organizationId, {
        entityType: "lottery_result",
        entityId: (dup.existing as { id?: string }).id ?? null,
        eventType: "SOURCE_CONFLICT_DETECTED",
        payload: { contestNumber: result.contestNumber, stored: dup.existing.prizes, attempted: result.prizes, sourceReference: input.sourceReference },
      });
      return fail(
        `Concurso ${result.contestNumber} já existe com prêmios DIFERENTES (${dup.existing.prizes.join(", ")}). Fonte divergente — revise antes de qualquer apuração. O evento foi registrado na auditoria.`,
      );
    }

    const { data, error } = await supabase
      .from("consortium_lottery_results")
      .insert({
        organization_id: organizationId,
        source: result.source,
        contest_number: result.contestNumber,
        draw_date: result.drawDate,
        prizes: result.prizes,
        prize_digits: input.prizeDigits,
        source_reference: input.sourceReference.trim() || null,
        retrieved_at: new Date().toISOString(),
        evidence_notes: input.evidenceNotes.trim() || null,
        verification_status: validation.status === "VALID" ? "PENDING" : "INVALID",
        validation_errors: validation.errors,
        content_hash: lotteryContentHash(result),
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    await logEvent(supabase, organizationId, {
      entityType: "lottery_result",
      entityId: data.id,
      eventType: validation.status === "VALID" ? "LOTTERY_IMPORTED" : "LOTTERY_IMPORTED_INVALID",
      payload: { contestNumber: result.contestNumber, contentHash: lotteryContentHash(result), errors: validation.errors },
    });
    revalidateEngine();
    if (validation.status !== "VALID") {
      return { ok: true, data: { id: data.id as string }, message: `Registrado como INVÁLIDO: ${validation.errors.join(" ")}` };
    }
    return { ok: true, data: { id: data.id as string }, message: "Resultado importado. Aguarda verificação por governança." };
  });
}

/** Verificação humana contra a fonte oficial — congela o resultado. */
export async function verifyLotteryResult(resultId: string, confirmation: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId, userId } = await guard("govern");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("consortium_lottery_results")
      .select("id, source, contest_number, draw_date, prizes, prize_digits, source_reference, retrieved_at, evidence_notes, verification_status, validation_errors, content_hash, verified_by, verified_at, created_at")
      .eq("id", resultId)
      .eq("organization_id", organizationId)
      .single();
    if (error) throw error;
    const lottery = mapLottery(data as Parameters<typeof mapLottery>[0]);
    if (lottery.verificationStatus !== "PENDING") return fail("Só resultados pendentes podem ser verificados.");
    if (confirmation.trim() !== lottery.prizes[0]) {
      return fail("Digite o 1º prêmio exatamente como consta na fonte oficial para confirmar a conferência.");
    }
    if (lotteryContentHash(lottery) !== lottery.contentHash) return fail("Hash do resultado não confere — conteúdo alterado desde a importação.");
    const today = new Date().toISOString().slice(0, 10);
    const validation = validateLotteryResult(lottery, { prizeDigits: lottery.prizeDigits, prizeCount: lottery.prizes.length }, today);
    if (validation.status !== "VALID") return fail(...validation.errors);

    const { error: upError } = await supabase
      .from("consortium_lottery_results")
      .update({ verification_status: "VERIFIED", verified_by: userId, verified_at: new Date().toISOString() })
      .eq("id", resultId);
    if (upError) throw upError;
    await logEvent(supabase, organizationId, {
      entityType: "lottery_result",
      entityId: resultId,
      eventType: "LOTTERY_VERIFIED",
      payload: { contestNumber: lottery.contestNumber, contentHash: lottery.contentHash },
    });
    revalidateEngine();
    return { ok: true };
  });
}

export async function markLotteryInvalid(resultId: string, reason: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("govern");
    if (reason.trim().length < 5) return fail("Informe o motivo.");
    const supabase = await createClient();
    const { error } = await supabase
      .from("consortium_lottery_results")
      .update({ verification_status: "INVALID", validation_errors: [reason.trim()] })
      .eq("id", resultId)
      .eq("organization_id", organizationId)
      .neq("verification_status", "VERIFIED");
    if (error) throw error;
    await logEvent(supabase, organizationId, { entityType: "lottery_result", entityId: resultId, eventType: "LOTTERY_MARKED_INVALID", payload: { reason } });
    revalidateEngine();
    return { ok: true };
  });
}

// ═══════════════════════════════════════════════════════════════
// ASSEMBLEIAS
// ═══════════════════════════════════════════════════════════════

export async function createAssembly(input: {
  groupId: string;
  assemblyNumber: number;
  assemblyDate: string;
  plannedDrawContemplations: number;
  notes: string;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const group = await getEngineGroup(organizationId, input.groupId);
    if (!group) return fail("Grupo não encontrado.");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("consortium_assemblies")
      .insert({
        organization_id: organizationId,
        group_id: input.groupId,
        assembly_number: input.assemblyNumber,
        assembly_date: input.assemblyDate,
        planned_draw_contemplations: input.plannedDrawContemplations,
        credit_amount: group.creditAmount,
        notes: input.notes.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") return fail(`Já existe a assembleia nº ${input.assemblyNumber} neste grupo.`);
      throw error;
    }
    await logEvent(supabase, organizationId, {
      groupId: input.groupId,
      assemblyId: data.id,
      entityType: "assembly",
      entityId: data.id,
      eventType: "ASSEMBLY_CREATED",
      payload: { assemblyNumber: input.assemblyNumber, assemblyDate: input.assemblyDate },
    });
    revalidateEngine([`/consorcios/motor/grupos/${input.groupId}`]);
    return { ok: true, data: { id: data.id as string } };
  });
}

async function setAssemblyStatus(
  supabase: Supabase,
  organizationId: string,
  ws: AssemblyWorkspace,
  to: string,
  extra: Record<string, unknown> = {},
) {
  const { error } = await supabase
    .from("consortium_assemblies")
    .update({ status: to, ...extra })
    .eq("id", ws.assembly.id)
    .eq("organization_id", organizationId);
  if (error) throw error;
  await logEvent(supabase, organizationId, {
    groupId: ws.group.id,
    assemblyId: ws.assembly.id,
    entityType: "assembly",
    entityId: ws.assembly.id,
    eventType: "STATUS_CHANGED",
    payload: { from: ws.assembly.status, to },
  });
}

async function loadWorkspace(organizationId: string, assemblyId: string): Promise<AssemblyWorkspace> {
  const ws = await getAssemblyWorkspace(organizationId, assemblyId);
  if (!ws) throw new Error("Assembleia não encontrada.");
  return ws;
}

function revalidateAssembly(ws: AssemblyWorkspace) {
  revalidateEngine([`/consorcios/motor/assembleias/${ws.assembly.id}`, `/consorcios/motor/grupos/${ws.group.id}`]);
}

export async function startAssemblyPreparation(assemblyId: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (ws.assembly.status !== "SCHEDULED") return fail("A assembleia não está agendada.");
    const supabase = await createClient();
    await setAssemblyStatus(supabase, organizationId, ws, "PREPARING");
    revalidateAssembly(ws);
    return { ok: true };
  });
}

/**
 * Estado das cotas NA DATA da assembleia: cotas de contrato derivam de
 * contrato/parcelas; as demais vêm do cadastro/importação. Contemplação
 * só conta se anterior à assembleia (a própria não se "auto-exclui").
 */
async function collectQuotaRecords(supabase: Supabase, ws: AssemblyWorkspace): Promise<QuotaRecord[]> {
  const date = ws.assembly.assemblyDate;
  const { data: quotas, error } = await supabase
    .from("consortium_quotas")
    .select("quota_number, contract_id, status, payment_status, contemplated_at, eligibility_source")
    .eq("group_id", ws.group.id);
  if (error) throw error;
  type RawQ = { quota_number: number; contract_id: string | null; status: QuotaRecord["status"]; payment_status: QuotaRecord["paymentStatus"]; contemplated_at: string | null; eligibility_source: string };
  const rows = (quotas ?? []) as RawQ[];

  const contractIds = rows.filter((r) => r.eligibility_source === "CONTRACT" && r.contract_id).map((r) => r.contract_id as string);
  const contracts = new Map<string, { status: string; contemplated_at: string | null }>();
  const delinquent = new Set<string>();
  const withInstallments = new Set<string>();
  if (contractIds.length) {
    const [cRes, iRes] = await Promise.all([
      supabase.from("consortium_contracts").select("id, status, contemplated_at").in("id", contractIds),
      supabase
        .from("consortium_installments")
        .select("consortium_contract_id, status, due_date")
        .in("consortium_contract_id", contractIds)
        .lt("due_date", date),
    ]);
    if (cRes.error) throw cRes.error;
    if (iRes.error) throw iRes.error;
    for (const c of (cRes.data ?? []) as { id: string; status: string; contemplated_at: string | null }[]) contracts.set(c.id, c);
    for (const i of (iRes.data ?? []) as { consortium_contract_id: string; status: string }[]) {
      withInstallments.add(i.consortium_contract_id);
      if (["overdue", "pending"].includes(i.status)) delinquent.add(i.consortium_contract_id);
    }
  }

  return rows.map((r) => {
    const before = (d: string | null) => Boolean(d && d < date);
    if (r.eligibility_source === "CONTRACT" && r.contract_id && contracts.has(r.contract_id)) {
      const c = contracts.get(r.contract_id)!;
      return {
        quotaNumber: r.quota_number,
        status: c.status === "cancelled" ? "CANCELLED" : "ACTIVE",
        paymentStatus: delinquent.has(r.contract_id) ? "DELINQUENT" : withInstallments.has(r.contract_id) ? "UP_TO_DATE" : "UNKNOWN",
        contemplated: before(c.contemplated_at) || before(r.contemplated_at),
        contractId: r.contract_id,
      } satisfies QuotaRecord;
    }
    return {
      quotaNumber: r.quota_number,
      status: r.status,
      paymentStatus: r.payment_status,
      contemplated: before(r.contemplated_at),
      contractId: r.contract_id,
    } satisfies QuotaRecord;
  });
}

async function lockSnapshot(
  supabase: Supabase,
  assemblyId: string,
  kind: AssemblySnapshot["kind"],
  payload: unknown,
  expectedStatus: string,
  nextStatus: string | null,
  completeness: "COMPLETE" | "PARTIAL" | null = null,
  patch: Record<string, unknown> = {},
): Promise<string> {
  const { data, error } = await supabase.rpc("consortium_lock_snapshot", {
    p_assembly_id: assemblyId,
    p_kind: kind,
    p_payload: payload,
    p_hash: hashOf(payload),
    p_completeness: completeness,
    p_expected_status: expectedStatus,
    p_next_status: nextStatus,
    p_patch: patch,
  });
  if (error) throw error;
  return data as string;
}

/** ELIGIBILITY LOCK — escolhe a regra e congela a elegibilidade. */
export async function lockAssemblyEligibility(assemblyId: string, ruleId: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (ws.assembly.status !== "PREPARING") return fail("Trave a elegibilidade com a assembleia em preparação.");
    const rule = await getEngineRule(organizationId, ruleId);
    if (!rule) return fail("Regra não encontrada.");
    if (rule.status !== "PUBLISHED") return fail("Só regras publicadas podem ser usadas numa assembleia.");
    const supabase = await createClient();
    const records = await collectQuotaRecords(supabase, ws);
    const snapshot = buildEligibilitySnapshot(ws.group.numbering, records, rule.config.eligibility);
    await lockSnapshot(
      supabase,
      assemblyId,
      "ELIGIBILITY",
      { ruleId, snapshot },
      "PREPARING",
      "ELIGIBILITY_LOCKED",
      snapshot.completeness,
      { rule_id: ruleId },
    );
    revalidateAssembly(ws);
    return {
      ok: true,
      message:
        snapshot.completeness === "PARTIAL"
          ? `Elegibilidade travada com base PARCIAL (${snapshot.entries.length} de ${ws.group.quotaCount} cotas com dado).`
          : "Elegibilidade travada com base completa.",
    };
  });
}

/** LOTTERY LOCK — só resultado VERIFICADO e válido pra esta assembleia/regra. */
export async function lockAssemblyLottery(assemblyId: string, lotteryResultId: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (ws.assembly.status !== "ELIGIBILITY_LOCKED") return fail("Trave a elegibilidade antes do resultado oficial.");
    if (!ws.rule) return fail("Assembleia sem regra definida.");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("consortium_lottery_results")
      .select("id, source, contest_number, draw_date, prizes, prize_digits, source_reference, retrieved_at, evidence_notes, verification_status, validation_errors, content_hash, verified_by, verified_at, created_at")
      .eq("id", lotteryResultId)
      .eq("organization_id", organizationId)
      .single();
    if (error) throw error;
    const lottery = mapLottery(data as Parameters<typeof mapLottery>[0]);
    if (lottery.verificationStatus !== "VERIFIED") return fail("Resultado oficial ainda não verificado por governança.");
    const validation = validateLotteryForAssembly(lottery, ws.rule.config, ws.rule.source, ws.assembly.assemblyDate);
    if (validation.status !== "VALID") return fail(...validation.errors);

    const payload = {
      lotteryResultId,
      contentHash: lottery.contentHash,
      lottery: { source: lottery.source, contestNumber: lottery.contestNumber, drawDate: lottery.drawDate, prizes: lottery.prizes },
    };
    await lockSnapshot(supabase, assemblyId, "LOTTERY", payload, "ELIGIBILITY_LOCKED", "LOTTERY_LOCKED", null, {
      lottery_result_id: lotteryResultId,
    });
    revalidateAssembly(ws);
    return { ok: true };
  });
}

/** DRAW READY — congela regra (com hash) e recursos. */
export async function prepareAssemblyDraw(
  assemblyId: string,
  input: { commonFundBalance: number | null; reserveFundBalance: number | null; reserveFundUsable: boolean; creditAmount: number | null; plannedDrawContemplations: number },
): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (ws.assembly.status !== "LOTTERY_LOCKED") return fail("Trave o resultado oficial antes de preparar a apuração.");
    if (!ws.rule) return fail("Assembleia sem regra.");
    const elig = latestSnapshot(ws.snapshots, "ELIGIBILITY");
    if (!elig || (elig.payload as { ruleId: string }).ruleId !== ws.rule.id) {
      return fail("A regra da assembleia não é a mesma usada no snapshot de elegibilidade.");
    }
    if (!ws.rule.ruleHash || computeRuleHash(ws.rule) !== ws.rule.ruleHash) {
      return fail("Hash da regra não confere com o registrado na aprovação — regra possivelmente alterada.");
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("consortium_assemblies")
      .update({
        common_fund_balance: input.commonFundBalance,
        reserve_fund_balance: input.reserveFundBalance,
        reserve_fund_usable: input.reserveFundUsable,
        credit_amount: input.creditAmount,
        planned_draw_contemplations: input.plannedDrawContemplations,
      })
      .eq("id", assemblyId);
    if (error) throw error;

    const rule: DrawRule = {
      id: ws.rule.id,
      ruleKey: ws.rule.ruleKey,
      version: ws.rule.version,
      name: ws.rule.name,
      administratorName: ws.rule.administratorName,
      productType: ws.rule.productType,
      groupId: ws.rule.groupId,
      effectiveFrom: ws.rule.effectiveFrom,
      effectiveUntil: ws.rule.effectiveUntil,
      status: ws.rule.status,
      source: ws.rule.source,
      regulationReference: ws.rule.regulationReference,
      config: ws.rule.config,
    };
    await lockSnapshot(supabase, assemblyId, "RULE", { rule, ruleHash: ws.rule.ruleHash }, "LOTTERY_LOCKED", null);
    const context = {
      assembly: {
        id: ws.assembly.id,
        number: ws.assembly.assemblyNumber,
        date: ws.assembly.assemblyDate,
        plannedDrawContemplations: input.plannedDrawContemplations,
      },
      group: {
        id: ws.group.id,
        code: ws.group.groupCode,
        administratorName: ws.group.administratorName,
        status: ws.group.status,
        numbering: ws.group.numbering,
      },
      resources: {
        commonFundBalance: input.commonFundBalance,
        reserveFundBalance: input.reserveFundBalance,
        reserveFundUsable: input.reserveFundUsable,
        creditAmount: input.creditAmount,
      },
    };
    await lockSnapshot(supabase, assemblyId, "RESOURCES", context, "LOTTERY_LOCKED", "DRAW_READY");
    revalidateAssembly(ws);
    return { ok: true };
  });
}

type SnapshotSet = { eligibility: AssemblySnapshot; rule: AssemblySnapshot; lottery: AssemblySnapshot; resources: AssemblySnapshot };

function snapshotsById(ws: AssemblyWorkspace, ids: Record<string, string>): SnapshotSet | null {
  const find = (id: string | undefined) => ws.snapshots.find((s) => s.id === id);
  const eligibility = find(ids.eligibility);
  const rule = find(ids.rule);
  const lottery = find(ids.lottery);
  const resources = find(ids.resources);
  if (!eligibility || !rule || !lottery || !resources) return null;
  return { eligibility, rule, lottery, resources };
}

function latestSet(ws: AssemblyWorkspace): SnapshotSet | null {
  const eligibility = latestSnapshot(ws.snapshots, "ELIGIBILITY");
  const rule = latestSnapshot(ws.snapshots, "RULE");
  const lottery = latestSnapshot(ws.snapshots, "LOTTERY");
  const resources = latestSnapshot(ws.snapshots, "RESOURCES");
  if (!eligibility || !rule || !lottery || !resources) return null;
  return { eligibility, rule, lottery, resources };
}

/** Monta o input do motor SÓ a partir dos snapshots — nunca do estado atual. */
function drawInputFromSnapshots(set: SnapshotSet): DrawInput {
  const rulePayload = set.rule.payload as { rule: DrawRule; ruleHash: string };
  const context = set.resources.payload as Pick<DrawInput, "assembly" | "group" | "resources">;
  return {
    assembly: context.assembly,
    group: context.group,
    rule: rulePayload.rule,
    frozenRuleHash: rulePayload.ruleHash,
    lottery: (set.lottery.payload as { lottery: LotteryResult }).lottery,
    eligibility: (set.eligibility.payload as { snapshot: EligibilitySnapshot }).snapshot,
    resources: context.resources,
  };
}

function runPayload(out: RunOutput, extra: { ruleId: string; lotteryResultId: string | null; snapshotIds: Record<string, string>; parentRunId?: string | null }) {
  return {
    phase: out.phase,
    engine_version: out.engineVersion,
    parent_run_id: extra.parentRunId ?? "",
    rule_id: extra.ruleId,
    lottery_result_id: extra.lotteryResultId ?? "",
    snapshot_ids: extra.snapshotIds,
    input_hash: out.hashes.inputHash,
    rule_hash: out.hashes.ruleHash,
    eligibility_hash: out.hashes.eligibilityHash,
    calculation_hash: out.hashes.calculationHash,
    result_hash: out.hashes.resultHash,
    trace: out.trace,
    result: {
      status: out.status,
      errors: out.errors,
      official: out.official,
      remainingResources: out.remainingResources,
      resources: out.resources,
      contemplations: out.contemplations,
    },
  };
}

function contemplationsPayload(out: RunOutput) {
  return out.contemplations.map((c) => ({
    quota_number: c.quotaNumber,
    method: c.method,
    sequence: c.sequence,
    candidate_raw: c.candidateRaw ?? "",
    bid_id: c.bidId ?? "",
    credit_amount: c.creditAmount,
  }));
}

function numbersPayload(out: RunOutput) {
  return out.attempts.map((n) => ({
    attempt: n.attempt,
    number_text: n.numberText,
    number_type: n.numberType,
    candidate_order: n.candidateOrder ?? "",
    quota_number: n.quotaNumber ?? "",
    outcome: n.outcome,
    reason: n.reason ?? "",
  }));
}

/** DRAW — executa o motor sobre os snapshots e grava atomicamente. */
export async function executeAssemblyDraw(assemblyId: string): Promise<ActionResult<{ contemplated: number[] }>> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (ws.assembly.status !== "DRAW_READY") return fail("A assembleia não está pronta para apuração.");
    const set = latestSet(ws);
    if (!set) return fail("Snapshots incompletos.");
    const input = drawInputFromSnapshots(set);
    const out = runDraw(input);
    const supabase = await createClient();

    if (out.status !== "COMPLETED") {
      await logEvent(supabase, organizationId, {
        groupId: ws.group.id,
        assemblyId,
        entityType: "assembly",
        entityId: assemblyId,
        eventType: "CALCULATION_FAILED",
        payload: { status: out.status, errors: out.errors, calculationHash: out.hashes.calculationHash },
      });
      revalidateAssembly(ws);
      return fail(`Apuração interrompida (${out.status}).`, ...out.errors);
    }

    const snapshotIds = { eligibility: set.eligibility.id, rule: set.rule.id, lottery: set.lottery.id, resources: set.resources.id };
    const { error } = await supabase.rpc("consortium_record_run", {
      p_assembly_id: assemblyId,
      p_run: runPayload(out, { ruleId: input.rule.id, lotteryResultId: ws.assembly.lotteryResultId, snapshotIds }),
      p_contemplations: contemplationsPayload(out),
      p_numbers: numbersPayload(out),
      p_expected_status: "DRAW_READY",
      p_status_path: ["DRAWING", "DRAW_COMPLETED"],
    });
    if (error) throw error;
    revalidateAssembly(ws);
    return { ok: true, data: { contemplated: out.contemplations.map((c) => c.quotaNumber) } };
  });
}

const BID_TYPE_MAP: Record<string, BidInput["type"]> = {
  livre: "FREE_BID",
  fixo: "FIXED_BID",
  embutido: "EMBEDDED_BID",
  free: "FREE_BID",
  fixed: "FIXED_BID",
  embedded: "EMBEDDED_BID",
};

function bidsFromWorkspace(ws: AssemblyWorkspace): { bids: BidInput[]; errors: string[] } {
  const errors: string[] = [];
  const bids: BidInput[] = [];
  for (const b of ws.bids) {
    const quotaNumber = ws.quotaByContract[b.contractId];
    const type = BID_TYPE_MAP[b.bidType?.toLowerCase() ?? ""];
    if (quotaNumber === undefined) {
      errors.push(`Lance ${b.id.slice(0, 8)}: contrato sem cota vinculada a este grupo.`);
      continue;
    }
    if (!type) {
      errors.push(`Lance ${b.id.slice(0, 8)}: modalidade "${b.bidType}" desconhecida.`);
      continue;
    }
    bids.push({
      id: b.id,
      quotaNumber,
      type,
      percentage: b.bidPercentage,
      amount: b.bidAmount,
      embeddedAmount: b.embeddedAmount,
      submittedAt: b.createdAt,
    });
  }
  return { bids, errors };
}

function currentRun(ws: AssemblyWorkspace, phase: "DRAW" | "BIDS"): DrawRunRecord | null {
  return ws.runs.find((r) => r.phase === phase && r.status === "CURRENT") ?? null;
}

function bidsInputFor(ws: AssemblyWorkspace, set: SnapshotSet, drawRun: { contemplations: { quotaNumber: number }[]; resultHash: string; remaining: number }, bids: BidInput[]) {
  const draw = drawInputFromSnapshots(set);
  return {
    assembly: { id: draw.assembly.id, number: draw.assembly.number, date: draw.assembly.date },
    group: { id: draw.group.id, numbering: draw.group.numbering },
    rule: draw.rule,
    lottery: draw.lottery,
    eligibility: draw.eligibility,
    drawContemplatedQuotas: drawRun.contemplations.map((c) => c.quotaNumber),
    drawResultHash: drawRun.resultHash,
    remainingResources: drawRun.remaining,
    creditAmount: draw.resources.creditAmount ?? 0,
    bids,
  };
}

/** BID PROCESSING — congela os lances da assembleia e apura. */
export async function executeAssemblyBids(assemblyId: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (ws.assembly.status !== "DRAW_COMPLETED") return fail("Lances só são apurados depois do sorteio (Res. BCB 285, art. 12).");
    const drawRun = currentRun(ws, "DRAW");
    const set = latestSet(ws);
    if (!drawRun || !set) return fail("Sorteio não encontrado.");
    const { bids, errors } = bidsFromWorkspace(ws);
    if (errors.length) return fail(...errors);
    const supabase = await createClient();
    const bidsSnapshotId = await lockSnapshot(supabase, assemblyId, "BIDS", { bids }, "DRAW_COMPLETED", null);
    const out = runBids(
      bidsInputFor(ws, set, { contemplations: drawRun.result.contemplations, resultHash: drawRun.hashes.resultHash, remaining: drawRun.result.remainingResources }, bids),
    );
    const { error } = await supabase.rpc("consortium_record_run", {
      p_assembly_id: assemblyId,
      p_run: runPayload(out, {
        ruleId: drawRun.ruleId,
        lotteryResultId: drawRun.lotteryResultId,
        snapshotIds: { ...drawRun.snapshotIds, bids: bidsSnapshotId },
        parentRunId: drawRun.id,
      }),
      p_contemplations: contemplationsPayload(out),
      p_expected_status: "DRAW_COMPLETED",
      p_status_path: ["BID_PROCESSING"],
    });
    if (error) throw error;
    revalidateAssembly(ws);
    return { ok: true };
  });
}

export async function sendAssemblyToHomologation(assemblyId: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (!["DRAW_COMPLETED", "BID_PROCESSING"].includes(ws.assembly.status)) return fail("Nada a enviar para homologação.");
    if (ws.assembly.status === "DRAW_COMPLETED" && ws.rule?.config.bids.enabled && ws.bids.length > 0) {
      return fail("Há lances vinculados e a regra habilita lances — apure os lances antes.");
    }
    const supabase = await createClient();
    await setAssemblyStatus(supabase, organizationId, ws, "HOMOLOGATION");
    revalidateAssembly(ws);
    return { ok: true };
  });
}

/** HOMOLOGATION — decisão humana de governança. Não libera crédito. */
export async function homologateAssembly(assemblyId: string): Promise<ActionResult<{ count: number }>> {
  return run(async () => {
    const { organizationId } = await guard("govern");
    const ws = await loadWorkspace(organizationId, assemblyId);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("consortium_homologate", { p_assembly_id: assemblyId });
    if (error) throw error;
    revalidateAssembly(ws);
    revalidatePath("/consorcios/contratos");
    return { ok: true, data: { count: data as number } };
  });
}

export async function lockAssembly(assemblyId: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("govern");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (ws.assembly.status !== "COMPLETED") return fail("Só assembleias homologadas podem ser travadas.");
    const supabase = await createClient();
    await setAssemblyStatus(supabase, organizationId, ws, "LOCKED", { locked_at: new Date().toISOString() });
    revalidateAssembly(ws);
    return { ok: true };
  });
}

// ═══════════════════════════════════════════════════════════════
// REPRODUÇÃO E RETIFICAÇÃO
// ═══════════════════════════════════════════════════════════════

export type ReproductionReport = {
  runId: string;
  phase: "DRAW" | "BIDS";
  identical: boolean;
  hashDiffs: string[];
  added: number[];
  removed: number[];
  storedResultHash: string;
  reproducedResultHash: string;
};

/**
 * Reproduz um cálculo gravado usando EXATAMENTE os snapshots que ele
 * usou. Divergência = anomalia crítica (registrada na auditoria).
 */
export async function reproduceRun(assemblyId: string, runId: string): Promise<ActionResult<ReproductionReport>> {
  return run(async () => {
    const { organizationId } = await requireActiveMembership();
    const ws = await loadWorkspace(organizationId, assemblyId);
    const report = reproduceInWorkspace(ws, runId);
    if (!report) return fail("Snapshots do cálculo não encontrados.");
    const supabase = await createClient();
    await logEvent(supabase, organizationId, {
      groupId: ws.group.id,
      assemblyId,
      entityType: "draw_run",
      entityId: runId,
      eventType: report.identical ? "REPRODUCTION_VERIFIED" : "REPRODUCTION_MISMATCH",
      payload: report,
    });
    revalidateAssembly(ws);
    return { ok: true, data: report };
  });
}

/** Parte pura da reprodução (sem escrita) — reaproveitada pela inteligência. */
export async function reproduceInWorkspaceAction(assemblyId: string, runId: string) {
  const { organizationId } = await requireActiveMembership();
  const ws = await loadWorkspace(organizationId, assemblyId);
  return reproduceInWorkspace(ws, runId);
}

function reproduceInWorkspace(ws: AssemblyWorkspace, runId: string): ReproductionReport | null {
  const stored = ws.runs.find((r) => r.id === runId);
  if (!stored) return null;
  const set = snapshotsById(ws, stored.snapshotIds);
  if (!set) return null;
  let out: RunOutput;
  if (stored.phase === "DRAW") {
    out = runDraw(drawInputFromSnapshots(set));
  } else {
    const parent = ws.runs.find((r) => r.id === stored.parentRunId);
    const bidsSnap = ws.snapshots.find((s) => s.id === stored.snapshotIds.bids);
    if (!parent || !bidsSnap) return null;
    out = runBids(
      bidsInputFor(
        ws,
        set,
        { contemplations: parent.result.contemplations, resultHash: parent.hashes.resultHash, remaining: parent.result.remainingResources },
        (bidsSnap.payload as { bids: BidInput[] }).bids,
      ),
    );
  }
  const cmp = compareRuns({ hashes: stored.hashes, contemplations: stored.result.contemplations }, out);
  return {
    runId,
    phase: stored.phase,
    identical: cmp.identical,
    hashDiffs: cmp.hashDiffs,
    added: cmp.added,
    removed: cmp.removed,
    storedResultHash: stored.hashes.resultHash,
    reproducedResultHash: out.hashes.resultHash,
  };
}

export async function requestRetification(
  assemblyId: string,
  input: { reason: string; evidenceNotes: string },
): Promise<ActionResult> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (!["COMPLETED", "LOCKED"].includes(ws.assembly.status)) return fail("Retificação só se aplica a assembleia homologada.");
    const drawRun = currentRun(ws, "DRAW");
    if (!drawRun) return fail("Nenhum cálculo vigente.");
    if (ws.retifications.some((r) => r.status === "REQUESTED" || r.status === "APPROVED")) {
      return fail("Já existe uma retificação em andamento.");
    }
    const errors = validateRetificationRequest({ reason: input.reason, requestedBy: userId, hasEvidence: input.evidenceNotes.trim().length > 0 });
    if (errors.length) return fail(...errors);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("consortium_retifications")
      .insert({
        organization_id: organizationId,
        assembly_id: assemblyId,
        original_run_id: drawRun.id,
        original_result_hash: drawRun.hashes.resultHash,
        reason: input.reason.trim(),
        evidence_notes: input.evidenceNotes.trim(),
        requested_by: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    await logEvent(supabase, organizationId, {
      groupId: ws.group.id,
      assemblyId,
      entityType: "retification",
      entityId: data.id,
      eventType: "RETIFICATION_REQUESTED",
      payload: { reason: input.reason, originalRunId: drawRun.id },
    });
    revalidateAssembly(ws);
    return { ok: true };
  });
}

export async function decideRetification(retificationId: string, approve: boolean, notes: string): Promise<ActionResult> {
  return run(async () => {
    const { organizationId, userId } = await guard("govern");
    const supabase = await createClient();
    const { data: ret, error } = await supabase
      .from("consortium_retifications")
      .select("id, assembly_id, requested_by, status")
      .eq("id", retificationId)
      .eq("organization_id", organizationId)
      .single();
    if (error) throw error;
    if (ret.status !== "REQUESTED") return fail("Retificação não está aguardando decisão.");
    if (ret.requested_by === userId) return fail("Quem solicitou a retificação não pode decidi-la (duas pessoas).");
    const { error: upError } = await supabase
      .from("consortium_retifications")
      .update({ status: approve ? "APPROVED" : "REJECTED", approved_by: userId, approved_at: new Date().toISOString(), decision_notes: notes.trim() || null })
      .eq("id", retificationId);
    if (upError) throw upError;
    await logEvent(supabase, organizationId, {
      assemblyId: ret.assembly_id as string,
      entityType: "retification",
      entityId: retificationId,
      eventType: approve ? "RETIFICATION_APPROVED" : "RETIFICATION_REJECTED",
      payload: { notes },
    });
    revalidateEngine([`/consorcios/motor/assembleias/${ret.assembly_id}`]);
    return { ok: true };
  });
}

/**
 * Aplica retificação aprovada: ORIGINAL fica SUPERSEDED (nunca apagado),
 * novo snapshot de elegibilidade (se pedido) e NOVO cálculo. O novo
 * resultado ainda passa por homologação humana.
 */
export async function applyRetification(retificationId: string, refreshEligibility: boolean): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("govern");
    const supabase = await createClient();
    const { data: ret, error } = await supabase
      .from("consortium_retifications")
      .select("id, assembly_id, status")
      .eq("id", retificationId)
      .eq("organization_id", organizationId)
      .single();
    if (error) throw error;
    if (ret.status !== "APPROVED") return fail("A retificação precisa estar aprovada.");
    let ws = await loadWorkspace(organizationId, ret.assembly_id as string);
    if (!["COMPLETED", "LOCKED"].includes(ws.assembly.status)) return fail("Estado da assembleia não permite retificação.");

    await setAssemblyStatus(supabase, organizationId, ws, "RETIFIED");
    ws = await loadWorkspace(organizationId, ws.assembly.id);

    if (refreshEligibility) {
      const set = latestSet(ws);
      const rulePayload = set?.rule.payload as { rule: DrawRule } | undefined;
      if (!rulePayload) return fail("Snapshot de regra não encontrado.");
      const records = await collectQuotaRecords(supabase, ws);
      const snapshot = buildEligibilitySnapshot(ws.group.numbering, records, rulePayload.rule.config.eligibility);
      await lockSnapshot(supabase, ws.assembly.id, "ELIGIBILITY", { ruleId: rulePayload.rule.id, snapshot }, "RETIFIED", null, snapshot.completeness);
      ws = await loadWorkspace(organizationId, ws.assembly.id);
    }

    const set = latestSet(ws);
    if (!set) return fail("Snapshots incompletos.");
    const input = drawInputFromSnapshots(set);
    const drawOut = runDraw(input);
    if (drawOut.status !== "COMPLETED") return fail(`Novo cálculo falhou (${drawOut.status}).`, ...drawOut.errors);
    const snapshotIds = { eligibility: set.eligibility.id, rule: set.rule.id, lottery: set.lottery.id, resources: set.resources.id };
    const { data: newDrawId, error: drawError } = await supabase.rpc("consortium_record_run", {
      p_assembly_id: ws.assembly.id,
      p_run: runPayload(drawOut, { ruleId: input.rule.id, lotteryResultId: ws.assembly.lotteryResultId, snapshotIds }),
      p_contemplations: contemplationsPayload(drawOut),
      p_numbers: numbersPayload(drawOut),
      p_expected_status: "RETIFIED",
      p_status_path: null,
      p_retification_id: retificationId,
    });
    if (drawError) throw drawError;

    const previousBids = currentRun(ws, "BIDS");
    if (previousBids) {
      const bidsSnap = ws.snapshots.find((s) => s.id === previousBids.snapshotIds.bids);
      const bids = (bidsSnap?.payload as { bids: BidInput[] } | undefined)?.bids ?? [];
      const bidsOut = runBids(
        bidsInputFor(ws, set, { contemplations: drawOut.contemplations, resultHash: drawOut.hashes.resultHash, remaining: drawOut.remainingResources }, bids),
      );
      const { error: bidsError } = await supabase.rpc("consortium_record_run", {
        p_assembly_id: ws.assembly.id,
        p_run: runPayload(bidsOut, {
          ruleId: input.rule.id,
          lotteryResultId: ws.assembly.lotteryResultId,
          snapshotIds: { ...snapshotIds, bids: previousBids.snapshotIds.bids },
          parentRunId: newDrawId as string,
        }),
        p_contemplations: contemplationsPayload(bidsOut),
        p_expected_status: "RETIFIED",
        p_status_path: null,
        p_retification_id: retificationId,
      });
      if (bidsError) throw bidsError;
    }
    revalidateAssembly(ws);
    return { ok: true, message: "Novo cálculo gerado. Revise e homologue a retificação." };
  });
}

// ═══════════════════════════════════════════════════════════════
// LANCES VINCULADOS À ASSEMBLEIA
// ═══════════════════════════════════════════════════════════════

/** Associa lances já registrados (módulo Lances) a esta assembleia. */
export async function attachBidsToAssembly(assemblyId: string, bidIds: string[]): Promise<ActionResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const ws = await loadWorkspace(organizationId, assemblyId);
    if (!["SCHEDULED", "PREPARING", "ELIGIBILITY_LOCKED", "LOTTERY_LOCKED", "DRAW_READY", "DRAW_COMPLETED"].includes(ws.assembly.status)) {
      return fail("Os lances desta assembleia já foram apurados.");
    }
    const supabase = await createClient();
    const { error } = await supabase.from("consortium_bids").update({ assembly_id: assemblyId }).in("id", bidIds);
    if (error) throw error;
    await logEvent(supabase, organizationId, {
      groupId: ws.group.id,
      assemblyId,
      entityType: "assembly",
      entityId: assemblyId,
      eventType: "BIDS_ATTACHED",
      payload: { bidIds },
    });
    revalidateAssembly(ws);
    return { ok: true };
  });
}

