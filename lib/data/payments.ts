import { createClient } from "@/lib/supabase/server";
import { getConsortiumInstallments } from "@/lib/data/consortiums";
import type { MatchableClient, MatchableInstallment } from "@/lib/payments/matching";
import type {
  PaymentConfidence,
  PaymentEvidence,
  PaymentEvidenceDetail,
  PaymentExceptionRecord,
  PaymentExceptionType,
  PaymentMatchCandidate,
  PaymentOrigin,
  PaymentStatus,
  PaymentTransactionRecord,
} from "@/lib/payments/types";

/** Clientes ativos com CPF/CNPJ — a única fonte de identificação de cliente do motor. */
export async function listMatchableClients(organizationId: string): Promise<MatchableClient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, document_number")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    documentNumber: row.document_number,
  }));
}

/** Parcelas — mesmo leitor do módulo de Consórcios, sem segunda fonte. */
export async function listMatchableInstallments(organizationId: string): Promise<MatchableInstallment[]> {
  const installments = await getConsortiumInstallments(organizationId);
  return installments.map((i) => ({
    id: i.id,
    installmentNumber: i.installmentNumber,
    dueDate: i.dueDate,
    amount: i.amount,
    status: i.status,
    contractId: i.contractId,
    contractLabel: i.contractLabel,
    clientId: i.clientId,
    clientName: i.clientName,
  }));
}

/**
 * `excludeEvidenceId` é obrigatório na prática: a evidência atual já
 * existe na tabela (foi inserida antes do matching rodar), então sem
 * excluir o próprio id TODO comprovante com identificador de transação
 * seria "duplicado" já na primeira vez — ela sempre bate consigo mesma.
 */
export async function isTransactionIdDuplicate(
  organizationId: string,
  transactionId: string,
  excludeEvidenceId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("payment_evidences")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("extracted_transaction_id", transactionId)
    .neq("id", excludeEvidenceId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

type RawEvidence = {
  id: string;
  document_id: string | null;
  origin: string;
  status: string;
  extracted_amount: number | null;
  extracted_date: string | null;
  extracted_time: string | null;
  extracted_method: string | null;
  extracted_bank: string | null;
  extracted_beneficiary: string | null;
  extracted_transaction_id: string | null;
  client_hint: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  uploaded_by_profile: { full_name: string | null } | null;
  documents: { name: string; storage_path: string } | null;
};

const EVIDENCE_SELECT = `
  id, document_id, origin, status, extracted_amount, extracted_date, extracted_time,
  extracted_method, extracted_bank, extracted_beneficiary, extracted_transaction_id,
  client_hint, notes, rejection_reason, created_at, updated_at,
  uploaded_by_profile:profiles!payment_evidences_uploaded_by_fkey(full_name),
  documents(name, storage_path)
`;

function mapEvidence(row: RawEvidence): PaymentEvidence {
  return {
    id: row.id,
    documentId: row.document_id,
    documentStoragePath: row.documents?.storage_path ?? null,
    origin: row.origin as PaymentOrigin,
    status: row.status as PaymentStatus,
    extractedAmount: row.extracted_amount,
    extractedDate: row.extracted_date,
    extractedTime: row.extracted_time,
    extractedMethod: row.extracted_method,
    extractedBank: row.extracted_bank,
    extractedBeneficiary: row.extracted_beneficiary,
    extractedTransactionId: row.extracted_transaction_id,
    clientHint: row.client_hint,
    notes: row.notes,
    rejectionReason: row.rejection_reason,
    uploadedByName: row.uploaded_by_profile?.full_name ?? null,
    documentName: row.documents?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPaymentEvidences(organizationId: string): Promise<PaymentEvidence[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_evidences")
    .select(EVIDENCE_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as RawEvidence[]).map(mapEvidence);
}

type RawMatch = {
  id: string;
  client_id: string | null;
  consortium_contract_id: string | null;
  consortium_installment_id: string | null;
  score: number;
  confidence: string;
  score_breakdown: Record<string, number>;
  reasons: string[];
  divergences: string[];
  is_selected: boolean;
  clients: { full_name: string } | null;
  consortium_contracts: { administrator_name: string | null; contract_number: string | null } | null;
  consortium_installments: { installment_number: number } | null;
};

function mapMatch(row: RawMatch): PaymentMatchCandidate {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.clients?.full_name ?? null,
    consortiumContractId: row.consortium_contract_id,
    contractLabel: row.consortium_contracts
      ? [row.consortium_contracts.administrator_name, row.consortium_contracts.contract_number].filter(Boolean).join(" · ")
      : null,
    consortiumInstallmentId: row.consortium_installment_id,
    installmentLabel: row.consortium_installments ? `Parcela ${row.consortium_installments.installment_number}` : null,
    score: row.score,
    confidence: row.confidence as PaymentConfidence,
    scoreBreakdown: row.score_breakdown,
    reasons: row.reasons,
    divergences: row.divergences,
    isSelected: row.is_selected,
  };
}

type RawException = {
  id: string;
  evidence_id: string;
  exception_type: string;
  details: string | null;
  status: string;
  resolved_at: string | null;
  created_at: string;
  resolved_by_profile: { full_name: string | null } | null;
};

function mapException(row: RawException): PaymentExceptionRecord {
  return {
    id: row.id,
    evidenceId: row.evidence_id,
    exceptionType: row.exception_type as PaymentExceptionType,
    details: row.details,
    status: row.status as "aberta" | "resolvida",
    resolvedByName: row.resolved_by_profile?.full_name ?? null,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

type RawTransaction = {
  id: string;
  evidence_id: string;
  client_id: string;
  consortium_contract_id: string | null;
  consortium_installment_id: string | null;
  amount: number;
  status: string;
  auto_confirmed: boolean;
  confirmed_at: string;
  clients: { full_name: string } | null;
  consortium_contracts: { administrator_name: string | null; contract_number: string | null } | null;
  confirmed_by_profile: { full_name: string | null } | null;
};

function mapTransaction(row: RawTransaction): PaymentTransactionRecord {
  return {
    id: row.id,
    evidenceId: row.evidence_id,
    clientId: row.client_id,
    clientName: row.clients?.full_name ?? null,
    consortiumContractId: row.consortium_contract_id,
    contractLabel: row.consortium_contracts
      ? [row.consortium_contracts.administrator_name, row.consortium_contracts.contract_number].filter(Boolean).join(" · ")
      : null,
    consortiumInstallmentId: row.consortium_installment_id,
    amount: row.amount,
    status: row.status as "conciliado" | "revertido",
    autoConfirmed: row.auto_confirmed,
    confirmedByName: row.confirmed_by_profile?.full_name ?? null,
    confirmedAt: row.confirmed_at,
  };
}

export async function getPaymentEvidenceDetail(organizationId: string, evidenceId: string): Promise<PaymentEvidenceDetail | null> {
  const supabase = await createClient();

  const [evidenceResult, matchesResult, exceptionsResult, transactionResult] = await Promise.all([
    supabase.from("payment_evidences").select(EVIDENCE_SELECT).eq("organization_id", organizationId).eq("id", evidenceId).maybeSingle(),
    supabase
      .from("payment_matches")
      .select(
        `id, client_id, consortium_contract_id, consortium_installment_id, score, confidence, score_breakdown, reasons, divergences, is_selected,
         clients(full_name), consortium_contracts(administrator_name, contract_number), consortium_installments(installment_number)`,
      )
      .eq("organization_id", organizationId)
      .eq("evidence_id", evidenceId)
      .order("score", { ascending: false }),
    supabase
      .from("payment_exceptions")
      .select("id, evidence_id, exception_type, details, status, resolved_at, created_at, resolved_by_profile:profiles!payment_exceptions_resolved_by_fkey(full_name)")
      .eq("organization_id", organizationId)
      .eq("evidence_id", evidenceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payment_transactions")
      .select(
        `id, evidence_id, client_id, consortium_contract_id, consortium_installment_id, amount, status, auto_confirmed, confirmed_at,
         clients(full_name), consortium_contracts(administrator_name, contract_number),
         confirmed_by_profile:profiles!payment_transactions_confirmed_by_fkey(full_name)`,
      )
      .eq("organization_id", organizationId)
      .eq("evidence_id", evidenceId)
      .maybeSingle(),
  ]);

  if (evidenceResult.error) throw evidenceResult.error;
  if (!evidenceResult.data) return null;
  if (matchesResult.error) throw matchesResult.error;
  if (exceptionsResult.error) throw exceptionsResult.error;
  if (transactionResult.error) throw transactionResult.error;

  return {
    evidence: mapEvidence(evidenceResult.data as unknown as RawEvidence),
    matches: ((matchesResult.data ?? []) as unknown as RawMatch[]).map(mapMatch),
    exceptions: ((exceptionsResult.data ?? []) as unknown as RawException[]).map(mapException),
    transaction: transactionResult.data ? mapTransaction(transactionResult.data as unknown as RawTransaction) : null,
  };
}

export type PaymentDashboardData = {
  received: number;
  reconciled: number;
  awaitingReview: number;
  exceptions: number;
  duplicates: number;
  reconciledAmount: number;
  automationRate: number;
};

export async function getPaymentDashboardData(organizationId: string): Promise<PaymentDashboardData> {
  const supabase = await createClient();

  const [evidences, transactionsResult] = await Promise.all([
    listPaymentEvidences(organizationId),
    supabase.from("payment_transactions").select("amount, auto_confirmed").eq("organization_id", organizationId),
  ]);

  if (transactionsResult.error) throw transactionsResult.error;
  const transactions = transactionsResult.data ?? [];

  const received = evidences.length;
  const reconciled = evidences.filter((e) => e.status === "conciliado").length;
  const awaitingReview = evidences.filter((e) => e.status === "aguardando_revisao").length;
  const exceptions = evidences.filter((e) => e.status === "excecao").length;
  const duplicates = evidences.filter((e) => e.status === "duplicado").length;
  const reconciledAmount = transactions.reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
  const autoCount = transactions.filter((t) => t.auto_confirmed).length;
  const automationRate = transactions.length > 0 ? Math.round((autoCount / transactions.length) * 100) : 0;

  return { received, reconciled, awaitingReview, exceptions, duplicates, reconciledAmount, automationRate };
}
