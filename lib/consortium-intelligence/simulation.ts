import { runDraw, type DrawInput } from "../consortium-engine/draw.ts";
import { buildEligibilitySnapshot } from "../consortium-engine/eligibility.ts";
import { hashOf } from "../consortium-engine/hash.ts";
import { buildNumbering } from "../consortium-engine/numbering.ts";
import { compareRuns } from "../consortium-engine/retification.ts";
import { computeRuleHash } from "../consortium-engine/rules.ts";
import type { EligibilityEntry, QuotaRecord, RuleConfig, RunOutput } from "../consortium-engine/types.ts";

/**
 * Simulation / What-if Engine. Roda o MESMO motor do resultado oficial
 * sobre uma CÓPIA do input com o cenário aplicado. Nunca grava nada no
 * resultado oficial; a persistência é em consortium_simulations.
 */

export type Scenario = {
  title?: string;
  /** Troca/ajuste da configuração da regra ("se a regra fosse X"). */
  ruleConfigPatch?: Partial<RuleConfig>;
  /** "Se o grupo tivesse Y cotas" (a partir do mesmo número inicial). */
  quotaCount?: number;
  /** "Se houvesse Z recursos." */
  commonFundBalance?: number;
  resourcesDeltaPercent?: number;
  creditAmount?: number;
  plannedDrawContemplations?: number;
  /** "Se determinada cota estivesse inadimplente / em dia." */
  forceDelinquent?: number[];
  forceUpToDate?: number[];
  forceContemplated?: number[];
  /**
   * "Mais inadimplência": marca inadimplente cada k-ésima cota apta,
   * em ordem crescente de número (determinístico, sem sorteio), até
   * atingir o percentual pedido das cotas aptas conhecidas.
   */
  extraDelinquencyPercent?: number;
};

export type SimulationOutcome = {
  scenario: Scenario;
  input: DrawInput;
  result: RunOutput;
  comparison: ReturnType<typeof compareRuns> | null;
  notes: string[];
  inputHash: string;
  resultHash: string;
};

function entryToRecord(e: EligibilityEntry): QuotaRecord {
  return {
    quotaNumber: e.quotaNumber,
    status: e.excluded ? "EXCLUDED" : e.cancelled ? "CANCELLED" : e.reason === "NOT_ALLOCATED" ? "AVAILABLE" : "ACTIVE",
    paymentStatus: e.paidUp === null ? "UNKNOWN" : e.paidUp ? "UP_TO_DATE" : "DELINQUENT",
    contemplated: e.alreadyContemplated,
  };
}

function deepMerge<T>(base: T, patch: Partial<T> | undefined): T {
  if (!patch) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch)) {
    const cur = out[k];
    out[k] = v && typeof v === "object" && !Array.isArray(v) && cur && typeof cur === "object" && !Array.isArray(cur) ? deepMerge(cur, v as never) : v;
  }
  return out as T;
}

export function simulate(base: DrawInput, scenario: Scenario, official: RunOutput | null): SimulationOutcome {
  const notes: string[] = ["SIMULAÇÃO — não é resultado oficial e não altera nenhum registro."];
  const input: DrawInput = JSON.parse(JSON.stringify(base));

  // Regra hipotética: recebe hash próprio (é outra regra, não a publicada).
  if (scenario.ruleConfigPatch) {
    input.rule = { ...input.rule, name: `${input.rule.name} (hipotética)`, config: deepMerge(input.rule.config, scenario.ruleConfigPatch) };
    input.frozenRuleHash = computeRuleHash(input.rule);
    notes.push("Regra alterada no cenário: o cálculo usa uma regra hipotética, não a versão publicada.");
  }

  // Tamanho do grupo.
  if (scenario.quotaCount && scenario.quotaCount !== input.group.numbering.numberEnd - input.group.numbering.numberStart + 1) {
    input.group.numbering = buildNumbering({ quotaCount: scenario.quotaCount, numberStart: input.group.numbering.numberStart });
    notes.push(`Grupo simulado com ${scenario.quotaCount} cotas (${input.group.numbering.numberStart} a ${input.group.numbering.numberEnd}).`);
  }

  // Recursos.
  if (scenario.commonFundBalance !== undefined) input.resources.commonFundBalance = scenario.commonFundBalance;
  if (scenario.resourcesDeltaPercent && input.resources.commonFundBalance !== null) {
    input.resources.commonFundBalance = Math.round(input.resources.commonFundBalance * (1 + scenario.resourcesDeltaPercent / 100) * 100) / 100;
    notes.push(`Fundo comum ajustado em ${scenario.resourcesDeltaPercent > 0 ? "+" : ""}${scenario.resourcesDeltaPercent}%.`);
  }
  if (scenario.creditAmount !== undefined) input.resources.creditAmount = scenario.creditAmount;
  if (scenario.plannedDrawContemplations !== undefined) input.assembly.plannedDrawContemplations = scenario.plannedDrawContemplations;

  // Elegibilidade: reconstrói o snapshot a partir das entradas + cenário.
  const touchesEligibility =
    scenario.forceDelinquent?.length || scenario.forceUpToDate?.length || scenario.forceContemplated?.length || scenario.extraDelinquencyPercent || scenario.quotaCount || scenario.ruleConfigPatch?.eligibility;
  if (touchesEligibility) {
    const n = input.group.numbering;
    let records = input.eligibility.entries.map(entryToRecord).filter((r) => r.quotaNumber >= n.numberStart && r.quotaNumber <= n.numberEnd);
    const upsert = (q: number, patch: Partial<QuotaRecord>) => {
      if (q < n.numberStart || q > n.numberEnd) {
        notes.push(`Cota ${q} ignorada: fora da faixa simulada.`);
        return;
      }
      const i = records.findIndex((r) => r.quotaNumber === q);
      if (i >= 0) records[i] = { ...records[i], ...patch };
      else records = [...records, { quotaNumber: q, status: "ACTIVE", paymentStatus: "UP_TO_DATE", contemplated: false, ...patch }];
    };
    for (const q of scenario.forceDelinquent ?? []) upsert(q, { paymentStatus: "DELINQUENT" });
    for (const q of scenario.forceUpToDate ?? []) upsert(q, { paymentStatus: "UP_TO_DATE", status: "ACTIVE" });
    for (const q of scenario.forceContemplated ?? []) upsert(q, { contemplated: true });
    if (scenario.extraDelinquencyPercent) {
      const apt = records.filter((r) => r.status === "ACTIVE" && r.paymentStatus === "UP_TO_DATE" && !r.contemplated).sort((a, b) => a.quotaNumber - b.quotaNumber);
      const target = Math.round((apt.length * scenario.extraDelinquencyPercent) / 100);
      const step = target > 0 ? apt.length / target : 0;
      const marked: number[] = [];
      for (let i = 0; i < target; i += 1) marked.push(apt[Math.floor(i * step)].quotaNumber);
      for (const q of marked) upsert(q, { paymentStatus: "DELINQUENT" });
      notes.push(`+${scenario.extraDelinquencyPercent}% de inadimplência: ${marked.length} cota(s) marcadas por espaçamento regular (sem sorteio).`);
    }
    input.eligibility = buildEligibilitySnapshot(n, records, input.rule.config.eligibility);
  }

  const result = runDraw(input);
  const comparison = official ? compareRuns(official, result) : null;
  return {
    scenario,
    input,
    result,
    comparison,
    notes,
    inputHash: hashOf({ input, scenario }),
    resultHash: result.hashes.resultHash,
  };
}

/** "Quantas contemplações seriam possíveis?" para uma faixa de recursos. */
export function contemplationCapacityCurve(creditAmount: number, balances: number[]) {
  return balances.map((b) => ({ balance: b, contemplations: creditAmount > 0 ? Math.floor(b / creditAmount) : 0 }));
}
