"use server";

import { buildEligibilitySnapshot, computeRuleHash, runDraw, type DrawAttempt, type Contemplation, type DrawRule } from "@/lib/consortium-engine/index.ts";
import { DEMO_GROUP, DEMO_NUMBERING, demoQuotaRecords, demoRuleConfig } from "@/lib/consortium-engine/demo.ts";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Demonstração da roleta: roda o MOTOR REAL de apuração sobre o grupo
 * fictício, com os números que a roleta da tela sorteou. Não lê nem
 * grava nada no banco — só exige usuário logado.
 */

export type DemoDrawResult =
  | { ok: true; status: string; errors: string[]; contemplations: Contemplation[]; attempts: DrawAttempt[] }
  | { ok: false; errors: string[] };

export async function runDemoDraw(prizes: string[], date: string): Promise<DemoDrawResult> {
  await requireActiveMembership();
  if (!Array.isArray(prizes) || prizes.length !== 5 || prizes.some((p) => typeof p !== "string" || !/^\d{5}$/.test(p))) {
    return { ok: false, errors: ["A demonstração precisa de 5 números de 5 algarismos."] };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, errors: ["Data inválida."] };

  const config = demoRuleConfig();
  const rule: DrawRule = {
    id: "demo-rule",
    ruleKey: "DEMO",
    version: 1,
    name: "Regra de demonstração",
    administratorName: DEMO_GROUP.administratorName,
    productType: null,
    groupId: null,
    effectiveFrom: "2026-01-01",
    effectiveUntil: null,
    status: "PUBLISHED",
    source: "OWN_DRAW",
    regulationReference: "Demonstração: contrato prevê sorteio próprio",
    config,
  };
  const out = runDraw({
    assembly: { id: "demo-assembly", number: 1, date, plannedDrawContemplations: DEMO_GROUP.plannedContemplations },
    group: { id: "demo-group", code: DEMO_GROUP.code, administratorName: DEMO_GROUP.administratorName, status: "ACTIVE", numbering: DEMO_NUMBERING },
    rule,
    frozenRuleHash: computeRuleHash(rule),
    lottery: { source: "OWN_DRAW", contestNumber: `SP-${date.replaceAll("-", "")}-1`, drawDate: date, prizes },
    eligibility: buildEligibilitySnapshot(DEMO_NUMBERING, demoQuotaRecords(), config.eligibility),
    resources: {
      commonFundBalance: DEMO_GROUP.commonFundBalance,
      reserveFundBalance: null,
      reserveFundUsable: false,
      creditAmount: DEMO_GROUP.creditAmount,
    },
  });
  return { ok: true, status: out.status, errors: out.errors, contemplations: out.contemplations, attempts: out.attempts };
}
