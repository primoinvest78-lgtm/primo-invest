/**
 * Motor de matching — 100% determinístico, sem IA e sem OCR. Cruza o
 * que foi digitado/extraído do comprovante contra clientes, contratos
 * e parcelas REAIS já carregados (nenhuma consulta nova é feita aqui,
 * é função pura sobre arrays já buscados).
 *
 * Pontuação (máximo 100):
 *   cliente identificado sem ambiguidade .......... 35
 *   valor bate com uma parcela em aberto ........... até 35
 *   data compatível com o vencimento ............... até 20
 *   identificador de transação presente e único .... 10
 *
 * Confiança:
 *   ALTA  (score >= 85, sem divergência)  -> baixa automática
 *   MÉDIA (score >= 50)                   -> revisão humana
 *   BAIXA (score < 50)                    -> exceção
 */

import type { ExtractedPaymentData } from "@/lib/payments/extraction";
import type { PaymentConfidence } from "@/lib/payments/types";

export type MatchableClient = {
  id: string;
  fullName: string;
  documentNumber: string | null;
};

export type MatchableInstallment = {
  id: string;
  installmentNumber: number;
  dueDate: string | null;
  amount: number | null;
  status: string;
  contractId: string;
  contractLabel: string;
  clientId: string | null;
  clientName: string | null;
};

export type MatchCandidate = {
  clientId: string | null;
  clientName: string | null;
  consortiumContractId: string | null;
  contractLabel: string | null;
  consortiumInstallmentId: string | null;
  installmentLabel: string | null;
  score: number;
  confidence: PaymentConfidence;
  scoreBreakdown: Record<string, number>;
  reasons: string[];
  divergences: string[];
};

const DAY_MS = 1000 * 60 * 60 * 24;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Resolve UM cliente a partir do texto digitado — CPF/CNPJ (só
 * dígitos) tem prioridade por ser inequívoco; senão tenta nome. Mais
 * de um cliente batendo por nome = ambíguo, não resolve (evita
 * escolher errado por coincidência de nome parecido).
 */
export function resolveClientFromHint(hint: string, clients: MatchableClient[]): { client: MatchableClient | null; ambiguous: boolean } {
  const trimmed = hint.trim();
  if (!trimmed) return { client: null, ambiguous: false };

  const digits = onlyDigits(trimmed);
  if (digits.length === 11 || digits.length === 14) {
    const byDoc = clients.filter((c) => c.documentNumber && onlyDigits(c.documentNumber) === digits);
    if (byDoc.length === 1) return { client: byDoc[0], ambiguous: false };
    if (byDoc.length > 1) return { client: null, ambiguous: true };
  }

  const normalizedHint = normalizeName(trimmed);
  const byName = clients.filter((c) => {
    const normalizedName = normalizeName(c.fullName);
    return normalizedName === normalizedHint || normalizedName.includes(normalizedHint) || normalizedHint.includes(normalizedName);
  });

  if (byName.length === 1) return { client: byName[0], ambiguous: false };
  if (byName.length > 1) return { client: null, ambiguous: true };
  return { client: null, ambiguous: false };
}

function scoreValue(extracted: number, installmentAmount: number | null): { points: number; divergence: boolean } {
  if (installmentAmount === null || installmentAmount <= 0) return { points: 0, divergence: false };
  const diffPct = Math.abs(extracted - installmentAmount) / installmentAmount;
  if (diffPct <= 0.005) return { points: 35, divergence: false };
  if (diffPct <= 0.03) return { points: 20, divergence: false };
  if (diffPct <= 0.08) return { points: 10, divergence: true };
  return { points: 0, divergence: true };
}

function scoreDate(extracted: string, dueDate: string | null): { points: number; divergence: boolean } {
  if (!dueDate) return { points: 0, divergence: false };
  const diffDays = Math.abs((new Date(extracted).getTime() - new Date(dueDate).getTime()) / DAY_MS);
  if (diffDays <= 3) return { points: 20, divergence: false };
  if (diffDays <= 10) return { points: 12, divergence: false };
  if (diffDays <= 25) return { points: 5, divergence: false };
  return { points: 0, divergence: true };
}

function confidenceFor(score: number, hasBlockingDivergence: boolean): PaymentConfidence {
  if (hasBlockingDivergence) return "baixa";
  if (score >= 85) return "alta";
  if (score >= 50) return "media";
  return "baixa";
}

/**
 * Gera os candidatos de correspondência pra uma evidência — nunca dá
 * baixa sozinho, só produz o material (score, motivo, divergência) pra
 * quem decide (a própria função de auto-confirmação, ou um humano).
 */
export function buildMatchCandidates(input: {
  extracted: ExtractedPaymentData;
  isTransactionIdDuplicate: boolean;
  clients: MatchableClient[];
  installments: MatchableInstallment[];
}): MatchCandidate[] {
  const { client, ambiguous } = input.extracted.clientHint
    ? resolveClientFromHint(input.extracted.clientHint, input.clients)
    : { client: null, ambiguous: false };

  if (!client) {
    const divergences = ambiguous ? ["cliente_divergente"] : ["transacao_nao_encontrada"];
    return [
      {
        clientId: null,
        clientName: null,
        consortiumContractId: null,
        contractLabel: null,
        consortiumInstallmentId: null,
        installmentLabel: null,
        score: 0,
        confidence: "baixa",
        scoreBreakdown: { cliente: 0, valor: 0, data: 0, transacao: 0 },
        reasons: ambiguous ? ["Mais de um cliente corresponde ao texto informado."] : ["Nenhum cliente identificado a partir do texto informado."],
        divergences,
      },
    ];
  }

  const openInstallments = input.installments.filter(
    (i) => i.clientId === client.id && i.status !== "paid" && i.status !== "exempt" && i.status !== "cancelled",
  );

  const transactionPoints = input.extracted.transactionId && !input.isTransactionIdDuplicate ? 10 : 0;

  if (openInstallments.length === 0) {
    return [
      {
        clientId: client.id,
        clientName: client.fullName,
        consortiumContractId: null,
        contractLabel: null,
        consortiumInstallmentId: null,
        installmentLabel: null,
        score: 35 + transactionPoints,
        confidence: "baixa",
        scoreBreakdown: { cliente: 35, valor: 0, data: 0, transacao: transactionPoints },
        reasons: [`Cliente identificado: ${client.fullName}.`],
        divergences: ["contrato_divergente"],
      },
    ];
  }

  return openInstallments
    .map((installment) => {
      const reasons: string[] = [`Cliente identificado: ${client.fullName}.`];
      const divergences: string[] = [];
      let valuePoints = 0;
      let datePoints = 0;

      if (input.extracted.amount !== null) {
        const result = scoreValue(input.extracted.amount, installment.amount);
        valuePoints = result.points;
        if (result.points >= 20) reasons.push("Valor compatível com a parcela.");
        if (result.divergence) divergences.push("valor_divergente");
      }

      if (input.extracted.date !== null) {
        const result = scoreDate(input.extracted.date, installment.dueDate);
        datePoints = result.points;
        if (result.points >= 12) reasons.push("Data compatível com o vencimento.");
        if (result.divergence) divergences.push("data_incompativel");
      }

      if (transactionPoints > 0) reasons.push("Identificador de transação único.");

      const score = Math.min(35 + valuePoints + datePoints + transactionPoints, 100);
      const hasBlockingDivergence = divergences.length > 0;

      return {
        clientId: client.id,
        clientName: client.fullName,
        consortiumContractId: installment.contractId,
        contractLabel: installment.contractLabel,
        consortiumInstallmentId: installment.id,
        installmentLabel: `Parcela ${installment.installmentNumber} — ${installment.contractLabel}`,
        score,
        confidence: confidenceFor(score, hasBlockingDivergence),
        scoreBreakdown: { cliente: 35, valor: valuePoints, data: datePoints, transacao: transactionPoints },
        reasons,
        divergences,
      };
    })
    .sort((a, b) => b.score - a.score);
}
