import type { RuleConfig } from "./types.ts";

// Sem dependência de node:crypto — seguro pra Client Components.

/**
 * Ponto de partida do formulário — NUNCA aplicado automaticamente.
 * Toda regra real vem do regulamento do grupo e passa por revisão.
 */
export function blankRuleConfig(): RuleConfig {
  return {
    calculationMethod: "LOTTERY_DIGIT_EXTRACTION",
    prizeDigits: 5,
    prizeCount: 5,
    candidatePlan: [],
    equivalence: { method: "NONE" },
    approximation: { method: "NONE", maxSteps: 1, wrapAround: false },
    fallback: { method: "NONE", wrapAround: false },
    eligibility: { requireUpToDate: true, excludeContemplated: true, unknownPolicy: "BLOCK" },
    resources: { reserveFundAllowed: false, bidFundsCountTowardResources: false },
    cancelledQuotaDraws: 0,
    bids: {
      enabled: false,
      order: [],
      fixedPercentage: null,
      minPercentage: null,
      maxPercentage: null,
      embeddedMaxPercentage: null,
      overFixedCompetesAsFree: false,
      tieBreak: "DRAW_ORDER",
      maxContemplations: null,
    },
    contingency: { method: "MANUAL_REVIEW", maxDaysBeforeAssembly: 7 },
  };
}

/** Expande "para cada prêmio, estes padrões de posições" num plano explícito. */
export function expandCandidatePlan(
  prizes: number[],
  patterns: number[][],
  order: "PRIZE_MAJOR" | "PATTERN_MAJOR",
): { prize: number; positions: number[] }[] {
  const plan: { prize: number; positions: number[] }[] = [];
  if (order === "PRIZE_MAJOR") {
    for (const prize of prizes) for (const positions of patterns) plan.push({ prize, positions: [...positions] });
  } else {
    for (const positions of patterns) for (const prize of prizes) plan.push({ prize, positions: [...positions] });
  }
  return plan;
}
