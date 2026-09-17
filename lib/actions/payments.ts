"use server";

import { revalidatePath } from "next/cache";

import { createTask } from "@/lib/actions/tasks";
import { recordVaultDocument } from "@/lib/actions/documents";
import { getPaymentEvidenceDetail, isTransactionIdDuplicate, listMatchableClients, listMatchableInstallments } from "@/lib/data/payments";
import { buildMatchCandidates } from "@/lib/payments/matching";
import { getActiveExtractionProvider, type ExtractedPaymentData } from "@/lib/payments/extraction";
import { canAccessPayments } from "@/lib/payments/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

function revalidatePayments() {
  revalidatePath("/pagamentos");
}

export async function fetchEvidenceDetail(evidenceId: string) {
  const { organizationId, role } = await requireActiveMembership();
  assertAccess(role);
  return getPaymentEvidenceDetail(organizationId, evidenceId);
}

function assertAccess(role: string) {
  if (!canAccessPayments(role)) {
    throw new Error("Seu perfil não tem acesso ao motor de pagamentos. Fale com a administração.");
  }
}

/**
 * Recebimento -> classificação -> extração -> identificação -> matching
 * -> score -> validação -> baixa (quando alta confiança) — tudo numa
 * única ação porque cada etapa depende do resultado da anterior e o
 * comprovante já está armazenado no Cofre Digital (nenhum storage
 * paralelo).
 */
export async function submitPaymentEvidence(input: {
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  amount: number | null;
  date: string | null;
  time: string | null;
  method: string | null;
  bank: string | null;
  beneficiary: string | null;
  transactionId: string | null;
  clientHint: string | null;
  notes: string | null;
}) {
  const { organizationId, userId, role } = await requireActiveMembership();
  assertAccess(role);
  const supabase = await createClient();

  // Recebimento: o comprovante É um documento comum do Cofre Digital.
  const { id: documentId } = await recordVaultDocument({
    name: `Comprovante de pagamento — ${input.fileName}`,
    documentType: input.mimeType,
    storagePath: input.storagePath,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    clientId: null,
    consortiumContractId: null,
    category: "financeiro",
    expiresAt: null,
    tags: ["comprovante-pagamento"],
  });

  // Classificação + extração: hoje só o provedor manual existe (ver
  // lib/payments/extraction.ts) — repassa o que a pessoa digitou.
  const manualEntry: ExtractedPaymentData = {
    amount: input.amount,
    date: input.date,
    time: input.time,
    method: input.method,
    bank: input.bank,
    beneficiary: input.beneficiary,
    transactionId: input.transactionId,
    clientHint: input.clientHint,
  };
  const extraction = await getActiveExtractionProvider().extract({
    fileName: input.fileName,
    mimeType: input.mimeType,
    manualEntry,
  });
  const extracted = extraction.data;

  const { data: evidenceRow, error: evidenceError } = await supabase
    .from("payment_evidences")
    .insert({
      organization_id: organizationId,
      document_id: documentId,
      origin: "upload",
      status: "processando",
      extracted_amount: extracted.amount,
      extracted_date: extracted.date,
      extracted_time: extracted.time,
      extracted_method: extracted.method,
      extracted_bank: extracted.bank,
      extracted_beneficiary: extracted.beneficiary,
      extracted_transaction_id: extracted.transactionId,
      client_hint: extracted.clientHint,
      notes: input.notes,
      uploaded_by: userId,
    })
    .select("id")
    .single();
  if (evidenceError) throw evidenceError;

  const evidenceId = evidenceRow.id as string;
  const result = await runMatchingAndDecide(organizationId, evidenceId, extracted);

  revalidatePayments();
  return { evidenceId, ...result };
}

/**
 * Identificação -> matching -> score -> decisão. Separado de
 * `submitPaymentEvidence` pra também poder ser chamado de novo (ex.:
 * "reprocessar") sem reenviar o arquivo.
 */
async function runMatchingAndDecide(organizationId: string, evidenceId: string, extracted: ExtractedPaymentData) {
  const supabase = await createClient();

  const isDuplicateTransaction = extracted.transactionId
    ? await isTransactionIdDuplicate(organizationId, extracted.transactionId, evidenceId)
    : false;

  if (isDuplicateTransaction) {
    await supabase.from("payment_evidences").update({ status: "duplicado" }).eq("id", evidenceId);
    await supabase.from("payment_exceptions").insert({
      organization_id: organizationId,
      evidence_id: evidenceId,
      exception_type: "comprovante_duplicado",
      details: `Identificador de transação "${extracted.transactionId}" já usado em outro comprovante.`,
    });
    return { status: "duplicado" as const, confidence: null };
  }

  const [clients, installments] = await Promise.all([
    listMatchableClients(organizationId),
    listMatchableInstallments(organizationId),
  ]);

  const candidates = buildMatchCandidates({
    extracted,
    isTransactionIdDuplicate: false,
    clients,
    installments,
  });

  const matchRows = candidates.map((c) => ({
    organization_id: organizationId,
    evidence_id: evidenceId,
    client_id: c.clientId,
    consortium_contract_id: c.consortiumContractId,
    consortium_installment_id: c.consortiumInstallmentId,
    score: c.score,
    confidence: c.confidence,
    score_breakdown: c.scoreBreakdown,
    reasons: c.reasons,
    divergences: c.divergences,
  }));

  const { data: insertedMatches, error: matchError } = await supabase
    .from("payment_matches")
    .insert(matchRows)
    .select("id, client_id, consortium_contract_id, consortium_installment_id, score, confidence, divergences");
  if (matchError) throw matchError;

  const top = candidates[0];
  const topRow = insertedMatches?.[0];

  const canAutoConfirm =
    top &&
    top.confidence === "alta" &&
    top.divergences.length === 0 &&
    top.clientId !== null &&
    top.consortiumInstallmentId !== null &&
    extracted.amount !== null;

  if (canAutoConfirm && topRow) {
    const { data: confirmResult, error: confirmError } = await supabase.rpc("confirm_payment", {
      p_evidence_id: evidenceId,
      p_client_id: top.clientId,
      p_consortium_contract_id: top.consortiumContractId,
      p_consortium_installment_id: top.consortiumInstallmentId,
      p_amount: extracted.amount,
      p_match_id: topRow.id,
      p_auto_confirmed: true,
    });
    if (confirmError) throw confirmError;
    if (confirmResult === "confirmed") {
      return { status: "conciliado" as const, confidence: top.confidence };
    }
    // Corrida rara (parcela pago entre o cálculo e a confirmação) — cai pra revisão em vez de falhar.
  }

  if (!top || top.confidence === "baixa") {
    await supabase.from("payment_evidences").update({ status: "excecao" }).eq("id", evidenceId);
    const exceptionType = top?.divergences[0] ?? "transacao_nao_encontrada";
    await supabase.from("payment_exceptions").insert({
      organization_id: organizationId,
      evidence_id: evidenceId,
      exception_type: exceptionType,
      details: top?.reasons.join(" ") ?? "Nenhum candidato de correspondência foi encontrado.",
    });
    return { status: "excecao" as const, confidence: top?.confidence ?? "baixa" };
  }

  await supabase.from("payment_evidences").update({ status: "aguardando_revisao" }).eq("id", evidenceId);
  return { status: "aguardando_revisao" as const, confidence: top.confidence };
}

/** Confirmar manualmente um candidato específico gerado pelo motor. */
export async function confirmPaymentMatch(input: { evidenceId: string; matchId: string; amount: number }) {
  const { role } = await requireActiveMembership();
  assertAccess(role);
  const supabase = await createClient();

  const { data: match, error: matchError } = await supabase
    .from("payment_matches")
    .select("client_id, consortium_contract_id, consortium_installment_id")
    .eq("id", input.matchId)
    .single();
  if (matchError) throw matchError;

  const { data, error } = await supabase.rpc("confirm_payment", {
    p_evidence_id: input.evidenceId,
    p_client_id: match.client_id,
    p_consortium_contract_id: match.consortium_contract_id,
    p_consortium_installment_id: match.consortium_installment_id,
    p_amount: input.amount,
    p_match_id: input.matchId,
    p_auto_confirmed: false,
  });
  if (error) throw error;

  revalidatePayments();
  return { status: data as string };
}

/** Vincular manualmente — o operador escolhe cliente/contrato/parcela sem depender de um candidato gerado. */
export async function confirmManualLink(input: {
  evidenceId: string;
  clientId: string;
  consortiumContractId: string | null;
  consortiumInstallmentId: string | null;
  amount: number;
}) {
  const { role } = await requireActiveMembership();
  assertAccess(role);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("confirm_payment", {
    p_evidence_id: input.evidenceId,
    p_client_id: input.clientId,
    p_consortium_contract_id: input.consortiumContractId,
    p_consortium_installment_id: input.consortiumInstallmentId,
    p_amount: input.amount,
    p_match_id: null,
    p_auto_confirmed: false,
  });
  if (error) throw error;

  revalidatePayments();
  return { status: data as string };
}

export async function rejectPaymentEvidence(evidenceId: string, reason: string) {
  const { role } = await requireActiveMembership();
  assertAccess(role);
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_evidences")
    .update({ status: "rejeitado", rejection_reason: reason })
    .eq("id", evidenceId);
  if (error) throw error;

  revalidatePayments();
}

export async function markPaymentDuplicate(evidenceId: string, details: string) {
  const { organizationId, role } = await requireActiveMembership();
  assertAccess(role);
  const supabase = await createClient();

  const { error } = await supabase.from("payment_evidences").update({ status: "duplicado" }).eq("id", evidenceId);
  if (error) throw error;

  const { error: exError } = await supabase.from("payment_exceptions").insert({
    organization_id: organizationId,
    evidence_id: evidenceId,
    exception_type: "pagamento_duplicado",
    details,
  });
  if (exError) throw exError;

  revalidatePayments();
}

export async function resolvePaymentException(exceptionId: string) {
  const { userId, role } = await requireActiveMembership();
  assertAccess(role);
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_exceptions")
    .update({ status: "resolvida", resolved_by: userId, resolved_at: new Date().toISOString() })
    .eq("id", exceptionId);
  if (error) throw error;

  revalidatePayments();
}

/** Cria uma tarefa real de acompanhamento a partir de uma exceção — reaproveita a action de Tarefas, não duplica. */
export async function createTaskFromPaymentException(input: {
  title: string;
  description: string;
  clientId: string | null;
}) {
  const { role } = await requireActiveMembership();
  assertAccess(role);

  await createTask({
    title: input.title,
    description: input.description,
    dueAt: null,
    priority: "high",
    clientId: input.clientId ?? undefined,
  });

  revalidatePayments();
  revalidatePath("/tarefas");
}
