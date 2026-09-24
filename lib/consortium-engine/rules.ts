import { hashOf } from "./hash.ts";
import {
  APPROXIMATION_METHODS,
  BID_TYPES,
  EQUIVALENCE_METHODS,
  FALLBACK_METHODS,
  TIE_BREAK_METHODS,
  type DrawRule,
  type RuleConfig,
  type RuleStatus,
} from "./types.ts";

/**
 * Rule Engine — regra é DADO declarativo, nunca if/else espalhado.
 * Aqui: validação estrutural, ciclo de vida, vigência e hash.
 */

export const RULE_TRANSITIONS: Record<RuleStatus, RuleStatus[]> = {
  DRAFT: ["REVIEW", "ARCHIVED"],
  REVIEW: ["DRAFT", "APPROVED"],
  APPROVED: ["PUBLISHED"],
  PUBLISHED: ["SUPERSEDED", "ARCHIVED"],
  SUPERSEDED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionRule(from: RuleStatus, to: RuleStatus): boolean {
  return RULE_TRANSITIONS[from].includes(to);
}

export function isRuleEditable(status: RuleStatus): boolean {
  return status === "DRAFT";
}

type HashableRule = Pick<
  DrawRule,
  | "ruleKey"
  | "version"
  | "name"
  | "administratorName"
  | "productType"
  | "groupId"
  | "effectiveFrom"
  | "source"
  | "regulationReference"
  | "config"
>;

/** Conteúdo que define o cálculo — é isso que o hash congela. */
export function ruleHashPayload(rule: HashableRule) {
  return {
    ruleKey: rule.ruleKey,
    version: rule.version,
    name: rule.name,
    administratorName: rule.administratorName,
    productType: rule.productType,
    groupId: rule.groupId,
    effectiveFrom: rule.effectiveFrom,
    source: rule.source,
    regulationReference: rule.regulationReference,
    config: rule.config,
  };
}

export function computeRuleHash(rule: HashableRule): string {
  return hashOf(ruleHashPayload(rule));
}

/** Vigência inclusiva nas duas pontas. Datas AAAA-MM-DD. */
export function isRuleEffective(rule: Pick<DrawRule, "effectiveFrom" | "effectiveUntil">, date: string): boolean {
  if (date < rule.effectiveFrom) return false;
  if (rule.effectiveUntil && date > rule.effectiveUntil) return false;
  return true;
}

/** Motivos (pt-BR) pelos quais a regra NÃO pode ser usada. Vazio = aplicável. */
export function ruleApplicabilityErrors(
  rule: DrawRule,
  context: { assemblyDate: string; groupId: string; administratorName: string },
): string[] {
  const errors: string[] = [];
  if (rule.status !== "PUBLISHED") {
    errors.push(`Regra "${rule.name}" v${rule.version} não está publicada (status ${rule.status}).`);
  }
  if (!isRuleEffective(rule, context.assemblyDate)) {
    errors.push(
      `Regra "${rule.name}" v${rule.version} não está vigente em ${context.assemblyDate} (vigência ${rule.effectiveFrom} a ${rule.effectiveUntil ?? "indeterminado"}).`,
    );
  }
  if (rule.groupId && rule.groupId !== context.groupId) errors.push("Regra pertence a outro grupo.");
  if (rule.administratorName.trim().toLowerCase() !== context.administratorName.trim().toLowerCase()) {
    errors.push(`Regra é da administradora "${rule.administratorName}", o grupo é de "${context.administratorName}".`);
  }
  return errors;
}

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n > 0;
}

function isPct(n: unknown): boolean {
  return n === null || (typeof n === "number" && n >= 0 && n <= 100);
}

/** Validação estrutural completa. Lista vazia = válida. */
export function validateRuleConfig(config: RuleConfig): string[] {
  const e: string[] = [];
  if (config.calculationMethod !== "LOTTERY_DIGIT_EXTRACTION") e.push("Método de cálculo desconhecido.");
  if (!isPositiveInt(config.prizeDigits) || config.prizeDigits < 3 || config.prizeDigits > 8) {
    e.push("Dígitos por prêmio deve estar entre 3 e 8.");
  }
  if (!isPositiveInt(config.prizeCount) || config.prizeCount > 10) e.push("Quantidade de prêmios deve estar entre 1 e 10.");

  if (!Array.isArray(config.candidatePlan) || config.candidatePlan.length === 0) {
    e.push("O plano de candidatos precisa de pelo menos um passo.");
  } else {
    config.candidatePlan.forEach((step, i) => {
      const label = `Passo ${i + 1} do plano`;
      if (!isPositiveInt(step.prize) || step.prize > config.prizeCount) e.push(`${label}: prêmio ${step.prize} inexistente.`);
      if (!Array.isArray(step.positions) || step.positions.length === 0) {
        e.push(`${label}: nenhuma posição informada.`);
      } else {
        if (step.positions.some((p) => !isPositiveInt(p) || p > config.prizeDigits)) {
          e.push(`${label}: posições devem estar entre 1 e ${config.prizeDigits}.`);
        }
        if (new Set(step.positions).size !== step.positions.length) e.push(`${label}: posição repetida.`);
      }
    });
  }

  if (!EQUIVALENCE_METHODS.includes(config.equivalence?.method)) e.push("Método de equivalência inválido.");
  if (config.equivalence?.method === "EXPLICIT_MAP") {
    const map = config.equivalence.map ?? {};
    if (Object.keys(map).length === 0) e.push("Equivalência por tabela exige ao menos um mapeamento.");
    for (const [k, v] of Object.entries(map)) {
      if (!/^\d+$/.test(k) || !Number.isInteger(v)) e.push(`Mapeamento de equivalência inválido: ${k} → ${v}.`);
    }
  }

  if (!APPROXIMATION_METHODS.includes(config.approximation?.method)) e.push("Método de aproximação inválido.");
  if (
    config.approximation?.method !== "NONE" &&
    !(Number.isInteger(config.approximation?.maxSteps) && config.approximation.maxSteps > 0)
  ) {
    e.push("Aproximação exige limite de passos positivo.");
  }

  if (!FALLBACK_METHODS.includes(config.fallback?.method)) e.push("Método de fallback inválido.");
  if (config.fallback?.method === "PREDEFINED_SEQUENCE" && !(config.fallback.sequence && config.fallback.sequence.length > 0)) {
    e.push("Fallback por sequência predefinida exige a sequência.");
  }

  if (!["ASSUME_ELIGIBLE", "ASSUME_INELIGIBLE", "BLOCK"].includes(config.eligibility?.unknownPolicy)) {
    e.push("Política pra cotas sem dado é inválida.");
  }
  if (!(Number.isInteger(config.cancelledQuotaDraws) && config.cancelledQuotaDraws >= 0)) {
    e.push("Sorteios de cotas canceladas deve ser inteiro maior ou igual a zero.");
  }

  const b = config.bids;
  if (b?.enabled) {
    if (!Array.isArray(b.order) || b.order.length === 0) e.push("Lances habilitados exigem a ordem de processamento.");
    if (b.order?.some((t) => !BID_TYPES.includes(t))) e.push("Modalidade de lance inválida na ordem.");
    if (new Set(b.order).size !== b.order?.length) e.push("Modalidade de lance repetida na ordem.");
    if (b.order?.includes("FIXED_BID") && (b.fixedPercentage === null || !isPct(b.fixedPercentage))) {
      e.push("Lance fixo exige percentual fixo entre 0 e 100.");
    }
    if (!isPct(b.minPercentage) || !isPct(b.maxPercentage) || !isPct(b.embeddedMaxPercentage)) {
      e.push("Percentuais de lance devem estar entre 0 e 100.");
    }
    if (b.minPercentage !== null && b.maxPercentage !== null && b.minPercentage > b.maxPercentage) {
      e.push("Percentual mínimo de lance maior que o máximo.");
    }
    if (!TIE_BREAK_METHODS.includes(b.tieBreak)) e.push("Critério de desempate inválido.");
    if (b.maxContemplations !== null && !(Number.isInteger(b.maxContemplations) && b.maxContemplations >= 0)) {
      e.push("Limite de contemplações por lance inválido.");
    }
  }

  if (!["NEXT_EXTRACTION", "MANUAL_REVIEW"].includes(config.contingency?.method)) e.push("Contingência inválida.");
  if (!(Number.isInteger(config.contingency?.maxDaysBeforeAssembly) && config.contingency.maxDaysBeforeAssembly >= 0)) {
    e.push("Janela da contingência deve ser inteiro maior ou igual a zero.");
  }
  return e;
}

export { blankRuleConfig, expandCandidatePlan } from "./rule-config.ts";
