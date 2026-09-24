import { isInRange, quotaCount } from "./numbering.ts";
import type {
  EligibilityEntry,
  EligibilitySnapshot,
  GroupNumbering,
  IneligibilityReason,
  QuotaRecord,
  RuleConfig,
} from "./types.ts";

/**
 * Eligibility Snapshot Engine.
 *
 * O snapshot é gerado UMA vez, antes do sorteio, a partir do estado das
 * cotas naquele momento, e congelado com hash. O cálculo (e qualquer
 * reprodução histórica) lê SÓ o snapshot — nunca o estado atual.
 *
 * O PRIMO não é a administradora: normalmente só conhece as cotas dos
 * próprios clientes. Cotas sem dado seguem `unknownPolicy` da regra e
 * marcam o snapshot como PARTIAL (apuração de conferência, não oficial).
 */

export function evaluateQuotaRecord(record: QuotaRecord, rules: RuleConfig["eligibility"]): EligibilityEntry {
  const base = {
    quotaNumber: record.quotaNumber,
    active: record.status === "ACTIVE",
    paidUp: record.paymentStatus === "UNKNOWN" ? null : record.paymentStatus === "UP_TO_DATE",
    delinquent: record.paymentStatus === "UNKNOWN" ? null : record.paymentStatus === "DELINQUENT",
    alreadyContemplated: record.contemplated,
    excluded: record.status === "EXCLUDED",
    cancelled: record.status === "CANCELLED",
  };
  let reason: IneligibilityReason | null = null;
  if (record.status === "EXCLUDED") reason = "EXCLUDED";
  else if (record.status === "AVAILABLE") reason = "NOT_ALLOCATED";
  else if (rules.excludeContemplated && record.contemplated) reason = "ALREADY_CONTEMPLATED";
  else if (record.status === "ACTIVE" && rules.requireUpToDate && record.paymentStatus === "DELINQUENT") reason = "DELINQUENT";
  else if (record.status === "ACTIVE" && rules.requireUpToDate && record.paymentStatus === "UNKNOWN") reason = "PAYMENT_UNKNOWN";
  // Cota cancelada fica fora do sorteio de ativas; o sorteio de
  // canceladas (quando a regra prevê) reavalia em `isEligibleFor`.
  else if (record.status === "CANCELLED") reason = "CANCELLED";
  return { ...base, eligible: reason === null, reason };
}

export function buildEligibilitySnapshot(
  numbering: GroupNumbering,
  records: QuotaRecord[],
  rules: RuleConfig["eligibility"],
): EligibilitySnapshot {
  const byNumber = new Map<number, QuotaRecord>();
  for (const r of records) {
    if (!isInRange(numbering, r.quotaNumber)) {
      throw new Error(`Cota ${r.quotaNumber} fora da faixa do grupo — dado de origem inconsistente.`);
    }
    if (byNumber.has(r.quotaNumber)) throw new Error(`Cota ${r.quotaNumber} duplicada na origem.`);
    byNumber.set(r.quotaNumber, r);
  }
  const entries = [...byNumber.values()]
    .sort((a, b) => a.quotaNumber - b.quotaNumber)
    .map((r) => evaluateQuotaRecord(r, rules));
  const hasPaymentUnknown = entries.some((e) => e.reason === "PAYMENT_UNKNOWN");
  const completeness = entries.length === quotaCount(numbering) && !hasPaymentUnknown ? "COMPLETE" : "PARTIAL";
  return { numbering, unknownPolicy: rules.unknownPolicy, completeness, entries };
}

export type EligibilityLookup = {
  /** Resultado da checagem de UMA cota pro pool indicado. */
  check(quotaNumber: number, pool: "ACTIVE" | "CANCELLED"): {
    eligible: boolean;
    reason: IneligibilityReason | null;
    presumed: boolean;
  };
};

/** Índice O(1) sobre o snapshot — evita varrer a lista a cada candidato. */
export function eligibilityLookup(snapshot: EligibilitySnapshot): EligibilityLookup {
  const index = new Map<number, EligibilityEntry>();
  for (const e of snapshot.entries) index.set(e.quotaNumber, e);

  return {
    check(quotaNumber, pool) {
      if (!isInRange(snapshot.numbering, quotaNumber)) return { eligible: false, reason: "NOT_EXISTS", presumed: false };
      const entry = index.get(quotaNumber);
      if (!entry) {
        if (snapshot.unknownPolicy === "ASSUME_ELIGIBLE" && pool === "ACTIVE") return { eligible: true, reason: null, presumed: true };
        return { eligible: false, reason: "UNKNOWN", presumed: snapshot.unknownPolicy !== "BLOCK" };
      }
      if (pool === "CANCELLED") {
        if (!entry.cancelled) return { eligible: false, reason: "NOT_CANCELLED", presumed: false };
        if (entry.alreadyContemplated) return { eligible: false, reason: "ALREADY_CONTEMPLATED", presumed: false };
        return { eligible: true, reason: null, presumed: false };
      }
      return { eligible: entry.eligible, reason: entry.reason, presumed: false };
    },
  };
}

export const INELIGIBILITY_LABEL: Record<IneligibilityReason, string> = {
  NOT_EXISTS: "cota inexistente no grupo",
  NOT_ALLOCATED: "cota não comercializada",
  CANCELLED: "cota cancelada",
  NOT_CANCELLED: "cota não está cancelada",
  EXCLUDED: "cota excluída",
  DELINQUENT: "inadimplente",
  PAYMENT_UNKNOWN: "situação de pagamento desconhecida",
  ALREADY_CONTEMPLATED: "já contemplada",
  UNKNOWN: "sem dado de elegibilidade no snapshot",
  ALREADY_SELECTED: "já contemplada nesta apuração",
};
