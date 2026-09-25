import { buildNumbering } from "./numbering.ts";
import { blankRuleConfig, expandCandidatePlan } from "./rule-config.ts";
import type { QuotaRecord, RuleConfig } from "./types.ts";

/**
 * Grupo FICTÍCIO da demonstração da roleta. Nada aqui existe no banco:
 * serve para apresentar o fluxo completo (selo → sorteio → apuração →
 * conferência) sem tocar em dado real. O padrão de inadimplência e de
 * cotas já contempladas é fixo, para que a substituição de cota inapta
 * apareça com frequência na apresentação.
 */

export const DEMO_GROUP = {
  code: "DEMO-001",
  administratorName: "Administradora Demonstração",
  quotaCount: 1000,
  plannedContemplations: 2,
  creditAmount: 100_000,
  commonFundBalance: 300_000,
} as const;

export const DEMO_NUMBERING = buildNumbering({ quotaCount: DEMO_GROUP.quotaCount });

export function demoRuleConfig(): RuleConfig {
  return {
    ...blankRuleConfig(),
    prizeCount: 5,
    prizeDigits: 5,
    // Os três últimos algarismos de cada prêmio, do 1º ao 5º.
    candidatePlan: expandCandidatePlan([1, 2, 3, 4, 5], [[3, 4, 5]], "PRIZE_MAJOR"),
    // "000" vale a cota 1000.
    equivalence: { method: "ZERO_AS_MAX" },
    // Cota inapta: tenta as seguintes, até 10 passos, voltando ao início.
    approximation: { method: "NEXT_HIGHER", maxSteps: 10, wrapAround: true },
    fallback: { method: "NEXT_HIGHER", wrapAround: true },
    eligibility: { requireUpToDate: true, excludeContemplated: true, unknownPolicy: "BLOCK" },
    contingency: { method: "MANUAL_REVIEW", maxDaysBeforeAssembly: 7 },
  };
}

export type DemoQuotaSituation = "UP_TO_DATE" | "DELINQUENT" | "CONTEMPLATED";

/** Situação fixa de cada cota fictícia: 1 em 6 inadimplente, 1 em 9 já contemplada. */
export function demoSituation(n: number): DemoQuotaSituation {
  if (n % 9 === 4) return "CONTEMPLATED";
  if (n % 6 === 1) return "DELINQUENT";
  return "UP_TO_DATE";
}

export function demoQuotaRecords(): QuotaRecord[] {
  const out: QuotaRecord[] = [];
  for (let n = DEMO_NUMBERING.numberStart; n <= DEMO_NUMBERING.numberEnd; n += 1) {
    const s = demoSituation(n);
    out.push({ quotaNumber: n, status: "ACTIVE", paymentStatus: s === "DELINQUENT" ? "DELINQUENT" : "UP_TO_DATE", contemplated: s === "CONTEMPLATED" });
  }
  return out;
}

export function demoSummary() {
  let delinquent = 0;
  let contemplated = 0;
  for (let n = 1; n <= DEMO_GROUP.quotaCount; n += 1) {
    const s = demoSituation(n);
    if (s === "DELINQUENT") delinquent += 1;
    if (s === "CONTEMPLATED") contemplated += 1;
  }
  return { total: DEMO_GROUP.quotaCount, delinquent, contemplated, eligible: DEMO_GROUP.quotaCount - delinquent - contemplated };
}
