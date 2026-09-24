import { buildEligibilitySnapshot } from "../eligibility.ts";
import { buildNumbering } from "../numbering.ts";
import { blankRuleConfig, computeRuleHash, expandCandidatePlan } from "../rules.ts";
import type { DrawInput } from "../draw.ts";
import type { DrawRule, GroupNumbering, QuotaRecord, RuleConfig } from "../types.ts";

/**
 * Fixtures dos testes. Os padrões de plano abaixo (3 centenas por
 * prêmio; 10 centenas alternando [3,4,5]/[2,3,4]) são EXEMPLOS DE
 * CONFIGURAÇÃO inspirados em regulamentos públicos — não existem no
 * código do motor.
 */

export function config(overrides: Partial<RuleConfig> = {}): RuleConfig {
  return {
    ...blankRuleConfig(),
    candidatePlan: expandCandidatePlan([1, 2, 3, 4, 5], [[3, 4, 5], [2, 3, 4], [1, 2, 3]], "PRIZE_MAJOR"),
    eligibility: { requireUpToDate: true, excludeContemplated: true, unknownPolicy: "ASSUME_ELIGIBLE" },
    ...overrides,
  };
}

export function rule(cfg: RuleConfig, overrides: Partial<DrawRule> = {}): DrawRule {
  return {
    id: "rule-1",
    ruleKey: "RULE-001",
    version: 3,
    name: "XYZ",
    administratorName: "Administradora Teste",
    productType: "imovel",
    groupId: null,
    effectiveFrom: "2026-01-01",
    effectiveUntil: null,
    status: "PUBLISHED",
    source: "FEDERAL_LOTTERY",
    regulationReference: "Regulamento do grupo, cláusula 12",
    config: cfg,
    ...overrides,
  };
}

/** Todas as cotas da faixa aptas, exceto as sobrescritas. */
export function fullRecords(numbering: GroupNumbering, overrides: Record<number, Partial<QuotaRecord>> = {}): QuotaRecord[] {
  const out: QuotaRecord[] = [];
  for (let n = numbering.numberStart; n <= numbering.numberEnd; n += 1) {
    out.push({ quotaNumber: n, status: "ACTIVE", paymentStatus: "UP_TO_DATE", contemplated: false, ...overrides[n] });
  }
  return out;
}

export function drawInput(args: {
  cfg?: RuleConfig;
  ruleOverrides?: Partial<DrawRule>;
  quotaCount?: number;
  displayDigits?: number;
  prizes?: string[];
  records?: QuotaRecord[];
  overrides?: Record<number, Partial<QuotaRecord>>;
  planned?: number;
  commonFund?: number | null;
  credit?: number | null;
  reserveFund?: number | null;
  reserveUsable?: boolean;
  assemblyDate?: string;
  drawDate?: string;
  frozenRuleHash?: string;
}): DrawInput {
  const cfg = args.cfg ?? config();
  const r = rule(cfg, args.ruleOverrides);
  const numbering = buildNumbering({ quotaCount: args.quotaCount ?? 1000, displayDigits: args.displayDigits });
  const records = args.records ?? fullRecords(numbering, args.overrides);
  return {
    assembly: { id: "asm-1", number: 12, date: args.assemblyDate ?? "2026-09-23", plannedDrawContemplations: args.planned ?? 1 },
    group: { id: "grp-1", code: "G-100", administratorName: "Administradora Teste", status: "ACTIVE", numbering },
    rule: r,
    frozenRuleHash: args.frozenRuleHash ?? computeRuleHash(r),
    lottery: {
      source: "FEDERAL_LOTTERY",
      contestNumber: "6102",
      drawDate: args.drawDate ?? "2026-09-20",
      prizes: args.prizes ?? ["32940", "89423", "12345", "54321", "22334"],
    },
    eligibility: buildEligibilitySnapshot(numbering, records, cfg.eligibility),
    resources: {
      commonFundBalance: args.commonFund === undefined ? 500_000 : args.commonFund,
      reserveFundBalance: args.reserveFund ?? null,
      reserveFundUsable: args.reserveUsable ?? false,
      creditAmount: args.credit === undefined ? 100_000 : args.credit,
    },
  };
}
