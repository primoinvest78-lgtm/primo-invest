import { formatBRL } from "./trace.ts";

/**
 * Credit Engine — contemplação concede DIREITO ao crédito; isso não é
 * liberação nem pagamento. Aqui só a matemática e as regras de
 * transição; a persistência é `consortium_credit_operations` (com as
 * colunas derivadas net_available_credit/remaining_credit no banco).
 */

export const CREDIT_STATUSES = [
  "PENDING_DOCUMENTS",
  "UNDER_ANALYSIS",
  "APPROVED",
  "AVAILABLE",
  "PARTIALLY_USED",
  "USED",
  "CLOSED",
  "CANCELLED",
] as const;
export type CreditStatus = (typeof CREDIT_STATUSES)[number];

export const CREDIT_TRANSITIONS: Record<CreditStatus, CreditStatus[]> = {
  PENDING_DOCUMENTS: ["UNDER_ANALYSIS", "CANCELLED"],
  UNDER_ANALYSIS: ["PENDING_DOCUMENTS", "APPROVED", "CANCELLED"],
  APPROVED: ["AVAILABLE", "CANCELLED"],
  AVAILABLE: ["PARTIALLY_USED", "USED", "CLOSED"],
  PARTIALLY_USED: ["USED", "CLOSED"],
  USED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export const CREDIT_STATUS_LABEL: Record<CreditStatus, string> = {
  PENDING_DOCUMENTS: "Documentação pendente",
  UNDER_ANALYSIS: "Em análise",
  APPROVED: "Aprovado",
  AVAILABLE: "Crédito disponível",
  PARTIALLY_USED: "Parcialmente utilizado",
  USED: "Utilizado",
  CLOSED: "Encerrado",
  CANCELLED: "Cancelado",
};

export type CreditEntitlement = {
  contractedCredit: number;
  updatedCredit: number;
  bidAmount: number;
  embeddedBidAmount: number;
  ownFundsBidAmount: number;
  netAvailableCredit: number;
  explanation: string[];
};

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Crédito líquido: nunca "reduz o crédito" sem registrar a origem.
 *   Carta 500.000, lance 100.000 embutido → bruto 500.000, lance
 *   100.000, embutido 100.000, líquido 400.000.
 */
export function computeCreditEntitlement(input: {
  contractedCredit: number;
  updatedCredit?: number | null;
  bidAmount?: number | null;
  embeddedBidAmount?: number | null;
}): CreditEntitlement {
  const contracted = cents(input.contractedCredit);
  const updated = cents(input.updatedCredit ?? input.contractedCredit);
  const bid = cents(input.bidAmount ?? 0);
  const embedded = cents(input.embeddedBidAmount ?? 0);
  if (contracted < 0 || updated < 0 || bid < 0 || embedded < 0) throw new Error("Valores de crédito não podem ser negativos.");
  if (embedded > bid) throw new Error("Parcela embutida não pode ser maior que o lance.");
  if (embedded > updated) throw new Error("Parcela embutida não pode ser maior que o crédito.");
  const net = cents(updated - embedded);
  const explanation = [
    `Crédito contratado: ${formatBRL(contracted)}.`,
    updated !== contracted ? `Crédito atualizado: ${formatBRL(updated)}.` : "Crédito atualizado igual ao contratado.",
  ];
  if (bid > 0) explanation.push(`Lance: ${formatBRL(bid)} (${formatBRL(cents(bid - embedded))} com recursos próprios, ${formatBRL(embedded)} embutido).`);
  explanation.push(`Crédito líquido disponível: ${formatBRL(updated)} − ${formatBRL(embedded)} embutido = ${formatBRL(net)}.`);
  return {
    contractedCredit: contracted,
    updatedCredit: updated,
    bidAmount: bid,
    embeddedBidAmount: embedded,
    ownFundsBidAmount: cents(bid - embedded),
    netAvailableCredit: net,
    explanation,
  };
}

export type RequirementClassification = "MANDATORY" | "CONDITIONAL" | "RECOMMENDED" | "INFORMATIVE";
export type RequirementStage = "CONTEMPLATION" | "ANALYSIS" | "GUARANTEE" | "RELEASE";
export type RequirementStatus = "PENDING" | "RECEIVED" | "APPROVED" | "REJECTED" | "WAIVED";

export type Requirement = {
  title: string;
  stage: RequirementStage;
  classification: RequirementClassification;
  applies: boolean;
  status: RequirementStatus;
};

export type RequirementGate = {
  blocking: Requirement[];
  warnings: Requirement[];
  informative: Requirement[];
  canAdvance: boolean;
};

/**
 * Compliance by design, não por fricção: só OBRIGATÓRIO (ou
 * CONDICIONAL que se aplica) bloqueia; RECOMENDADO vira alerta;
 * INFORMATIVO só informa. Mesma lógica do trigger do banco.
 */
export function evaluateRequirementGate(requirements: Requirement[], target: "APPROVED" | "AVAILABLE"): RequirementGate {
  const relevant = requirements.filter((r) => target === "AVAILABLE" || r.stage !== "RELEASE");
  const done = (r: Requirement) => r.status === "APPROVED" || r.status === "WAIVED";
  const blocking = relevant.filter(
    (r) => (r.classification === "MANDATORY" || (r.classification === "CONDITIONAL" && r.applies)) && r.applies && !done(r),
  );
  const warnings = relevant.filter((r) => r.classification === "RECOMMENDED" && !done(r));
  const informative = relevant.filter((r) => r.classification === "INFORMATIVE");
  return { blocking, warnings, informative, canAdvance: blocking.length === 0 };
}

/** Uso do crédito: nunca ultrapassa o líquido; define o próximo status. */
export function applyCreditUsage(input: { netAvailableCredit: number; usedCredit: number; amount: number }) {
  const amount = cents(input.amount);
  if (amount <= 0) throw new Error("Valor de utilização deve ser positivo.");
  const remainingBefore = cents(input.netAvailableCredit - input.usedCredit);
  if (amount > remainingBefore + 0.001) {
    throw new Error(`Utilização de ${formatBRL(amount)} maior que o saldo de crédito ${formatBRL(remainingBefore)}.`);
  }
  const usedAfter = cents(input.usedCredit + amount);
  const remainingAfter = cents(input.netAvailableCredit - usedAfter);
  const status: CreditStatus = remainingAfter <= 0.001 ? "USED" : "PARTIALLY_USED";
  return { usedAfter, remainingBefore, remainingAfter, status };
}
