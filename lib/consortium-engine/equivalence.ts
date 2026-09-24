import { formatQuotaNumber, isInRange, quotaCount } from "./numbering.ts";
import type { GroupNumbering, RuleConfig } from "./types.ts";

/**
 * Equivalence Engine — responde "como este número bruto virou uma cota
 * existente?".
 *
 * Garantia de tipo: o retorno distingue PRIMARY_QUOTA (o número bruto
 * JÁ é a cota), EQUIVALENT_NUMBER (o número bruto é só uma
 * REPRESENTAÇÃO que aponta pra uma cota primária) e ELIMINATED. Um
 * número equivalente nunca é persistido como cota — o banco só tem
 * `consortium_quotas`, com faixa checada por trigger.
 */

export type EquivalenceResult =
  | { kind: "PRIMARY_QUOTA"; raw: string; numericValue: number; quotaNumber: number; explanation: string }
  | {
      kind: "EQUIVALENT_NUMBER";
      raw: string;
      numericValue: number;
      /** A cota primária que este número representa. */
      quotaNumber: number;
      explanation: string;
    }
  | { kind: "ELIMINATED"; raw: string; numericValue: number; quotaNumber: null; explanation: string };

export function applyEquivalence(
  raw: string,
  numbering: GroupNumbering,
  equivalence: RuleConfig["equivalence"],
): EquivalenceResult {
  const numericValue = Number.parseInt(raw, 10);
  const label = (n: number) => formatQuotaNumber(n, numbering.displayDigits);
  const size = quotaCount(numbering);

  const primaryOrEliminated = (value: number, reasonIfOut: string): EquivalenceResult =>
    isInRange(numbering, value)
      ? { kind: "PRIMARY_QUOTA", raw, numericValue, quotaNumber: value, explanation: `${raw} corresponde diretamente à cota ${label(value)}.` }
      : { kind: "ELIMINATED", raw, numericValue, quotaNumber: null, explanation: reasonIfOut };

  const equivalent = (quota: number, how: string): EquivalenceResult =>
    quota === numericValue && isInRange(numbering, quota)
      ? { kind: "PRIMARY_QUOTA", raw, numericValue, quotaNumber: quota, explanation: `${raw} corresponde diretamente à cota ${label(quota)}.` }
      : isInRange(numbering, quota)
        ? { kind: "EQUIVALENT_NUMBER", raw, numericValue, quotaNumber: quota, explanation: `${raw} é equivalente à cota ${label(quota)} (${how}).` }
        : { kind: "ELIMINATED", raw, numericValue, quotaNumber: null, explanation: `${raw} não corresponde a cota existente após ${how}.` };

  const outOfRange = `${raw} está fora da faixa do grupo (${label(numbering.numberStart)} a ${label(numbering.numberEnd)}) e a regra não prevê equivalência.`;

  switch (equivalence.method) {
    case "NONE":
      return primaryOrEliminated(numericValue, outOfRange);

    case "ZERO_AS_MAX":
      if (numericValue === 0) return equivalent(numbering.numberEnd, "número zerado representa a última cota do grupo");
      return primaryOrEliminated(numericValue, outOfRange);

    case "MODULO": {
      const offset = (((numericValue - numbering.numberStart) % size) + size) % size;
      return equivalent(numbering.numberStart + offset, `resto da divisão pelo tamanho do grupo, ${size} cotas`);
    }

    case "SUBTRACT_GROUP_SIZE": {
      if (isInRange(numbering, numericValue)) return primaryOrEliminated(numericValue, outOfRange);
      let value = numericValue;
      while (value > numbering.numberEnd) value -= size;
      return equivalent(value, `subtração sucessiva de ${size} cotas`);
    }

    case "EXPLICIT_MAP": {
      const mapped = equivalence.map?.[raw];
      if (mapped === undefined) return primaryOrEliminated(numericValue, outOfRange);
      return equivalent(mapped, "tabela de equivalência da regra");
    }
  }
}
