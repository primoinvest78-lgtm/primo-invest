import { generateCandidates, type Candidate } from "./candidates.ts";
import { eligibilityLookup, INELIGIBILITY_LABEL, type EligibilityLookup } from "./eligibility.ts";
import { applyEquivalence } from "./equivalence.ts";
import { hashOf } from "./hash.ts";
import { formatQuotaNumber } from "./numbering.ts";
import { assessResources } from "./resources.ts";
import { computeRuleHash, ruleApplicabilityErrors, validateRuleConfig } from "./rules.ts";
import { fallbackSequence, neighborSequence } from "./sequences.ts";
import { validateLotteryForAssembly } from "./source.ts";
import { TraceBuilder } from "./trace.ts";
import {
  ENGINE_VERSION,
  type Contemplation,
  type DrawAttempt,
  type DrawRule,
  type EligibilitySnapshot,
  type GroupNumbering,
  type LotteryResult,
  type ResourceAssessment,
  type ResourceInput,
  type RunOutput,
  type RunStatus,
} from "./types.ts";

/**
 * Draw Engine — apuração determinística do sorteio.
 *
 * Ordem (spec §14): assembleia → grupo → regra → congelamento da regra
 * → snapshot de elegibilidade → resultado oficial → validação →
 * candidatos → ordenação → mapeamento → elegibilidade → equivalência →
 * aproximação → fallback → recursos → contemplação → trace → hashes.
 *
 * Recursos são AVALIADOS antes do laço (definem quantas contemplações
 * cabem) e registrados no trace; lances NÃO são processados aqui — é
 * outro módulo (bids.ts), chamado depois, com o que sobrar.
 */

export type DrawInput = {
  assembly: { id: string; number: number; date: string; plannedDrawContemplations: number };
  group: {
    id: string;
    code: string;
    administratorName: string;
    status: ResourceInput["groupStatus"];
    numbering: GroupNumbering;
  };
  rule: DrawRule;
  /** Hash registrado quando a regra foi aprovada. Divergência = regra alterada. */
  frozenRuleHash: string;
  lottery: LotteryResult;
  eligibility: EligibilitySnapshot;
  resources: Omit<ResourceInput, "plannedDrawContemplations" | "groupStatus">;
};

type Via = Contemplation["via"];

export function drawInputHash(input: DrawInput): string {
  return hashOf({
    engineVersion: ENGINE_VERSION,
    assembly: input.assembly,
    group: input.group,
    lottery: input.lottery,
    resources: input.resources,
  });
}

function finish(
  input: DrawInput,
  trace: TraceBuilder,
  status: RunStatus,
  errors: string[],
  contemplations: Contemplation[],
  resources: ResourceAssessment | null,
  remaining: number,
  attempts: DrawAttempt[] = [],
): RunOutput {
  const traceArr = trace.toArray();
  return {
    engineVersion: ENGINE_VERSION,
    phase: "DRAW",
    status,
    errors,
    contemplations,
    official: input.eligibility.completeness === "COMPLETE",
    resources,
    remainingResources: remaining,
    trace: traceArr,
    attempts,
    hashes: {
      inputHash: drawInputHash(input),
      ruleHash: computeRuleHash(input.rule),
      eligibilityHash: hashOf(input.eligibility),
      calculationHash: hashOf(traceArr),
      resultHash: hashOf({ status, errors, contemplations }),
    },
  };
}

export function runDraw(input: DrawInput): RunOutput {
  const t = new TraceBuilder();
  const { numbering } = input.group;
  const label = (n: number) => formatQuotaNumber(n, numbering.displayDigits);
  const cfg = input.rule.config;

  // 1–2. Assembleia e grupo
  t.add("ASSEMBLY", `Assembleia nº ${input.assembly.number} de ${input.assembly.date}.`, { assemblyId: input.assembly.id });
  t.add(
    "GROUP",
    `Grupo ${input.group.code} (${input.group.administratorName}) — cotas ${label(numbering.numberStart)} a ${label(numbering.numberEnd)}.`,
    { groupId: input.group.id, numbering },
  );

  // 3–4. Regra: identificação, aplicabilidade e congelamento
  t.add("RULE", `Regra "${input.rule.name}", versão ${input.rule.version} (${input.rule.ruleKey}).`, {
    ruleId: input.rule.id,
    version: input.rule.version,
    regulationReference: input.rule.regulationReference,
  });
  const ruleHash = computeRuleHash(input.rule);
  if (ruleHash !== input.frozenRuleHash) {
    t.add("RULE_HASH_MISMATCH", "O conteúdo da regra não confere com o hash congelado na aprovação — regra alterada.", {
      expected: input.frozenRuleHash,
      actual: ruleHash,
    });
    return finish(input, t, "VALIDATION_FAILED", ["Regra alterada após aprovação (hash divergente)."], [], null, 0);
  }
  const ruleErrors = [
    ...ruleApplicabilityErrors(input.rule, {
      assemblyDate: input.assembly.date,
      groupId: input.group.id,
      administratorName: input.group.administratorName,
    }),
    ...validateRuleConfig(cfg),
  ];
  if (ruleErrors.length) {
    t.add("RULE_REJECTED", "Regra não aplicável a esta assembleia.", { errors: ruleErrors });
    return finish(input, t, "VALIDATION_FAILED", ruleErrors, [], null, 0);
  }
  t.add("RULE_FROZEN", `Regra congelada (hash ${ruleHash.slice(0, 12)}…).`, { ruleHash });

  // 5. Snapshot de elegibilidade
  const lookup = eligibilityLookup(input.eligibility);
  const eligibleCount = input.eligibility.entries.filter((e) => e.eligible).length;
  t.add(
    "ELIGIBILITY_SNAPSHOT",
    `Snapshot de elegibilidade: ${input.eligibility.entries.length} cota(s) com dado, ${eligibleCount} apta(s); base ${input.eligibility.completeness === "COMPLETE" ? "completa" : "parcial"}.`,
    { completeness: input.eligibility.completeness, unknownPolicy: input.eligibility.unknownPolicy },
  );
  if (input.eligibility.completeness === "PARTIAL" && input.eligibility.unknownPolicy === "BLOCK") {
    const msg = "Snapshot parcial e a regra exige elegibilidade completa — apuração bloqueada.";
    t.add("ELIGIBILITY_BLOCKED", msg);
    return finish(input, t, "BLOCKED", [msg], [], null, 0);
  }
  if (input.eligibility.completeness === "PARTIAL") {
    t.add(
      "ELIGIBILITY_PRESUMED",
      input.eligibility.unknownPolicy === "ASSUME_ELIGIBLE"
        ? "Cotas sem dado foram PRESUMIDAS aptas pela regra — resultado é de conferência, não oficial."
        : "Cotas sem dado foram PRESUMIDAS inaptas pela regra — resultado é de conferência, não oficial.",
    );
  }

  // 6–7. Resultado oficial + validação
  t.add(
    "LOTTERY",
    `Resultado oficial: ${input.lottery.source === "FEDERAL_LOTTERY" ? "Loteria Federal" : input.lottery.source}, concurso ${input.lottery.contestNumber} de ${input.lottery.drawDate}.`,
    { prizes: input.lottery.prizes },
  );
  const validation = validateLotteryForAssembly(input.lottery, cfg, input.rule.source, input.assembly.date);
  if (validation.status !== "VALID") {
    t.add(validation.status, "Resultado oficial reprovado na validação — apuração interrompida.", { errors: validation.errors });
    return finish(input, t, validation.status, validation.errors, [], null, 0);
  }
  t.add("LOTTERY_VALIDATED", "Resultado oficial validado (fonte, concurso, data, formato, quantidade, duplicidade, janela).");

  // Recursos (definem quantas contemplações cabem)
  const resources = assessResources(
    { ...input.resources, plannedDrawContemplations: input.assembly.plannedDrawContemplations, groupStatus: input.group.status },
    cfg.resources,
  );
  t.add(`RESOURCES_${resources.status}`, resources.justification.join(" "), {
    available: resources.available,
    capacity: resources.capacity,
    drawSlots: resources.drawSlots,
  });
  if (resources.status === "BLOCKED") {
    return finish(input, t, "BLOCKED", resources.justification, [], resources, 0);
  }

  // 8–9. Candidatos na ordem do plano
  const candidates = generateCandidates(input.lottery.prizes, cfg.candidatePlan);
  t.add(
    "CANDIDATES",
    `${candidates.length} candidato(s) gerados pelo plano da regra: ${candidates.map((c) => c.raw).join(", ")}.`,
    { candidates: candidates.map((c) => ({ order: c.order, prize: c.prize, positions: c.positions, raw: c.raw })) },
  );

  const contemplations: Contemplation[] = [];
  const attempts: DrawAttempt[] = [];
  const selected = new Set<number>();
  let remaining = resources.available;

  const pools: { pool: "ACTIVE" | "CANCELLED"; slots: number; method: Contemplation["method"] }[] = [
    { pool: "ACTIVE", slots: resources.drawSlots, method: "DRAW" },
  ];
  const cancelledCapacity = Math.max(resources.capacity - resources.drawSlots, 0);
  if (cfg.cancelledQuotaDraws > 0) {
    pools.push({ pool: "CANCELLED", slots: Math.min(cfg.cancelledQuotaDraws, cancelledCapacity), method: "DRAW_CANCELLED" });
  }

  for (const { pool, slots, method } of pools) {
    if (slots === 0) {
      t.add("POOL_SKIPPED", `Sorteio de cotas ${pool === "ACTIVE" ? "ativas" : "canceladas"}: nenhuma contemplação cabe nos recursos.`);
      continue;
    }
    t.add("POOL_START", `Sorteio de cotas ${pool === "ACTIVE" ? "ativas" : "canceladas"}: ${slots} contemplação(ões).`);
    const picks = drawPool({ candidates, slots, pool, lookup, selected, input, t, attempts });
    for (const pick of picks) {
      selected.add(pick.quotaNumber);
      remaining -= resources.creditAmount;
      contemplations.push({
        sequence: contemplations.length + 1,
        quotaNumber: pick.quotaNumber,
        quotaLabel: label(pick.quotaNumber),
        method,
        candidateRaw: pick.candidateRaw,
        bidId: null,
        creditAmount: resources.creditAmount,
        via: pick.via,
      });
      t.add("CONTEMPLATED", `Cota ${label(pick.quotaNumber)} CONTEMPLADA por sorteio (${contemplations.length}ª contemplação).`, {
        quotaNumber: pick.quotaNumber,
        via: pick.via,
      });
    }
    if (picks.length < slots) {
      t.add("POOL_EXHAUSTED", `Nenhuma outra cota apta encontrada — ${slots - picks.length} contemplação(ões) não realizada(s).`);
    }
  }

  t.add("RESULT", `Resultado: ${contemplations.length} contemplação(ões) por sorteio.`, {
    quotas: contemplations.map((c) => c.quotaNumber),
    remainingResources: remaining,
  });
  return finish(input, t, "COMPLETED", [], contemplations, resources, remaining, attempts);
}

type Pick = { quotaNumber: number; candidateRaw: string | null; via: Via };

function drawPool(args: {
  candidates: Candidate[];
  slots: number;
  pool: "ACTIVE" | "CANCELLED";
  lookup: EligibilityLookup;
  selected: Set<number>;
  input: DrawInput;
  t: TraceBuilder;
  attempts: DrawAttempt[];
}): Pick[] {
  const { candidates, slots, pool, lookup, selected, input, t, attempts } = args;
  const { numbering } = input.group;
  const cfg = input.rule.config;
  const label = (n: number) => formatQuotaNumber(n, numbering.displayDigits);
  const picks: Pick[] = [];
  const taken = new Set(selected);

  const record = (a: Omit<DrawAttempt, "attempt">) => attempts.push({ attempt: attempts.length + 1, ...a });

  const tryQuota = (
    quota: number,
    context: string,
    meta: { numberText: string; numberType: DrawAttempt["numberType"]; candidateOrder: number | null },
  ): boolean => {
    if (taken.has(quota)) {
      record({ ...meta, quotaNumber: quota, outcome: "INELIGIBLE", reason: "ALREADY_SELECTED" });
      t.add("QUOTA_INELIGIBLE", `${context}: cota ${label(quota)} — ${INELIGIBILITY_LABEL.ALREADY_SELECTED}.`, {
        quotaNumber: quota,
        reason: "ALREADY_SELECTED",
      });
      return false;
    }
    const r = lookup.check(quota, pool);
    if (!r.eligible) {
      record({ ...meta, quotaNumber: quota, outcome: "INELIGIBLE", reason: r.reason });
      t.add("QUOTA_INELIGIBLE", `${context}: cota ${label(quota)} INAPTA — ${INELIGIBILITY_LABEL[r.reason ?? "UNKNOWN"]}.`, {
        quotaNumber: quota,
        reason: r.reason,
      });
      return false;
    }
    record({ ...meta, quotaNumber: quota, outcome: "SELECTED", reason: r.presumed ? "PRESUMED" : null });
    t.add("QUOTA_ELIGIBLE", `${context}: cota ${label(quota)} APTA${r.presumed ? " (presumida)" : ""}.`, {
      quotaNumber: quota,
      presumed: r.presumed,
    });
    return true;
  };

  // Base do fallback: primeira cota existente derivada dos candidatos.
  let fallbackBase: number | null = null;
  let cursor = 0;

  while (picks.length < slots && cursor < candidates.length) {
    const c = candidates[cursor];
    cursor += 1;
    const eq = applyEquivalence(c.raw, numbering, cfg.equivalence);
    t.add(
      "CANDIDATE",
      `Candidato ${c.order}: ${c.prize}º prêmio ${c.prizeValue}, posições ${c.positions.join(",")} → ${c.raw}.`,
      { order: c.order, raw: c.raw },
    );
    t.add(`EQUIVALENCE_${eq.kind}`, eq.explanation, { raw: c.raw, quotaNumber: eq.quotaNumber });
    if (eq.quotaNumber === null) {
      record({ numberText: c.raw, numberType: "CANDIDATE", candidateOrder: c.order, quotaNumber: null, outcome: "ELIMINATED", reason: "OUT_OF_RANGE" });
      continue;
    }
    if (fallbackBase === null) fallbackBase = eq.quotaNumber;

    if (
      tryQuota(eq.quotaNumber, `Candidato ${c.order}`, {
        numberText: c.raw,
        numberType: eq.kind === "EQUIVALENT_NUMBER" ? "EQUIVALENT_NUMBER" : "CANDIDATE",
        candidateOrder: c.order,
      })
    ) {
      picks.push({ quotaNumber: eq.quotaNumber, candidateRaw: c.raw, via: eq.kind === "EQUIVALENT_NUMBER" ? "EQUIVALENCE" : "DIRECT" });
      taken.add(eq.quotaNumber);
      continue;
    }

    if (cfg.approximation.method !== "NONE") {
      const neighbors = neighborSequence(
        eq.quotaNumber,
        cfg.approximation.method,
        numbering,
        cfg.approximation.wrapAround,
        cfg.approximation.maxSteps,
      );
      for (const n of neighbors) {
        if (
          tryQuota(n, `Aproximação a partir de ${label(eq.quotaNumber)}`, {
            numberText: label(n),
            numberType: "APPROXIMATION",
            candidateOrder: c.order,
          })
        ) {
          picks.push({ quotaNumber: n, candidateRaw: c.raw, via: "APPROXIMATION" });
          taken.add(n);
          break;
        }
      }
    }
  }

  if (picks.length < slots) {
    if (cfg.fallback.method === "NONE") {
      t.add("FALLBACK_NONE", "Candidatos esgotados e a regra não prevê fallback.");
      return picks;
    }
    const base = fallbackBase ?? numbering.numberStart;
    t.add(
      "FALLBACK_START",
      `Candidatos esgotados. Fallback "${cfg.fallback.method}" a partir da cota ${label(base)}${cfg.fallback.wrapAround ? ", com volta ao início" : ""}.`,
      { base, method: cfg.fallback.method },
    );
    for (const n of fallbackSequence(base, cfg.fallback, numbering)) {
      if (picks.length >= slots) break;
      if (tryQuota(n, "Fallback", { numberText: label(n), numberType: "FALLBACK", candidateOrder: null })) {
        picks.push({ quotaNumber: n, candidateRaw: null, via: "FALLBACK" });
        taken.add(n);
      }
    }
  }
  return picks;
}

/**
 * Ordem de apuração completa (candidatos → aproximações → fallback),
 * usada como critério de desempate de lances quando a regra manda
 * ("DRAW_ORDER"). Não consulta elegibilidade: é só a ORDEM.
 */
export function apurationOrder(prizes: string[], rule: DrawRule, numbering: GroupNumbering): Map<number, number> {
  const cfg = rule.config;
  const order = new Map<number, number>();
  const push = (n: number) => {
    if (!order.has(n)) order.set(n, order.size + 1);
  };
  let base: number | null = null;
  for (const c of generateCandidates(prizes, cfg.candidatePlan)) {
    const eq = applyEquivalence(c.raw, numbering, cfg.equivalence);
    if (eq.quotaNumber === null) continue;
    base ??= eq.quotaNumber;
    push(eq.quotaNumber);
    if (cfg.approximation.method !== "NONE") {
      for (const n of neighborSequence(eq.quotaNumber, cfg.approximation.method, numbering, cfg.approximation.wrapAround, cfg.approximation.maxSteps)) push(n);
    }
  }
  if (cfg.fallback.method !== "NONE") {
    for (const n of fallbackSequence(base ?? numbering.numberStart, cfg.fallback, numbering)) push(n);
  }
  return order;
}
