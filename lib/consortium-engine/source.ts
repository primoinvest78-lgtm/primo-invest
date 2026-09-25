import { hashOf } from "./hash.ts";
import type { LotteryResult, RuleConfig, SourceValidationStatus } from "./types.ts";

/**
 * Lottery Source Engine — valida e congela o resultado OFICIAL. Nunca
 * gera número: só consome o que a fonte publicou.
 */

const KNOWN_SOURCES = ["FEDERAL_LOTTERY", "OTHER_REGULATED_SOURCE", "OWN_DRAW"];

/** Sorteio próprio é identificado por "SP-AAAAMMDD-nº da assembleia". */
const CONTEST_PATTERN: Record<string, RegExp> = { OWN_DRAW: /^SP-\d{8}-\d{1,6}$/ };
const DEFAULT_CONTEST_PATTERN = /^\d{1,8}$/;

export function lotteryContentHash(result: LotteryResult): string {
  return hashOf({
    source: result.source,
    contestNumber: result.contestNumber.trim(),
    drawDate: result.drawDate,
    prizes: result.prizes,
  });
}

/**
 * Mesmo concurso já importado? IDENTICAL = reimportação inofensiva;
 * CONFLICT = mesmo concurso com prêmios diferentes (fonte divergente —
 * nunca aceitar silenciosamente).
 */
export function detectDuplicateContest(
  existing: LotteryResult[],
  candidate: LotteryResult,
): { kind: "IDENTICAL" | "CONFLICT"; existing: LotteryResult } | null {
  const match = existing.find(
    (e) => e.source === candidate.source && e.contestNumber.trim() === candidate.contestNumber.trim(),
  );
  if (!match) return null;
  return { kind: lotteryContentHash(match) === lotteryContentHash(candidate) ? "IDENTICAL" : "CONFLICT", existing: match };
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

export type SourceValidation = { status: SourceValidationStatus; errors: string[] };

/**
 * Validação estrutural. `asOf` (data de referência pra rejeitar sorteio
 * no futuro) vem de fora pra manter o motor sem relógio.
 */
export function validateLotteryResult(
  result: LotteryResult,
  expected: { prizeDigits: number; prizeCount: number },
  asOf: string,
): SourceValidation {
  if (!KNOWN_SOURCES.includes(result.source)) {
    return { status: "INVALID_SOURCE", errors: [`Fonte "${result.source}" não reconhecida.`] };
  }
  const errors: string[] = [];
  if (!(CONTEST_PATTERN[result.source] ?? DEFAULT_CONTEST_PATTERN).test(result.contestNumber.trim())) errors.push("Número do concurso inválido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.drawDate) || Number.isNaN(Date.parse(result.drawDate))) {
    errors.push("Data do sorteio inválida.");
  } else if (result.drawDate > asOf) {
    errors.push("Data do sorteio está no futuro.");
  }
  if (result.prizes.length !== expected.prizeCount) {
    errors.push(`Esperados ${expected.prizeCount} prêmios, recebidos ${result.prizes.length}.`);
  }
  const pattern = new RegExp(`^\\d{${expected.prizeDigits}}$`);
  result.prizes.forEach((p, i) => {
    if (!pattern.test(p)) errors.push(`${i + 1}º prêmio "${p}" não tem exatamente ${expected.prizeDigits} dígitos.`);
  });
  const seen = new Set<string>();
  result.prizes.forEach((p, i) => {
    if (seen.has(p)) errors.push(`${i + 1}º prêmio repete um bilhete já premiado (${p}) — duplicidade indevida.`);
    seen.add(p);
  });
  return { status: errors.length ? "VALIDATION_FAILED" : "VALID", errors };
}

/** Validação contextual: o resultado serve pra ESTA assembleia com ESTA regra? */
export function validateLotteryForAssembly(
  result: LotteryResult,
  config: RuleConfig,
  ruleSource: string,
  assemblyDate: string,
): SourceValidation {
  const base = validateLotteryResult(
    result,
    { prizeDigits: config.prizeDigits, prizeCount: config.prizeCount },
    assemblyDate,
  );
  if (base.status === "INVALID_SOURCE") return base;
  const errors = [...base.errors];
  if (result.source !== ruleSource) errors.push(`Regra exige fonte ${ruleSource}, resultado é de ${result.source}.`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(result.drawDate)) {
    const gap = daysBetween(result.drawDate, assemblyDate);
    if (gap < 0) errors.push("Extração posterior à assembleia.");
    else if (gap > config.contingency.maxDaysBeforeAssembly) {
      errors.push(
        `Extração ${gap} dias antes da assembleia — acima da janela de ${config.contingency.maxDaysBeforeAssembly} dias da regra.`,
      );
    }
  }
  return { status: errors.length ? "VALIDATION_FAILED" : "VALID", errors };
}
