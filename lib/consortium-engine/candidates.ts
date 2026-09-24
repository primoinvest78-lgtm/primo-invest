import type { CandidateStep } from "./types.ts";

/**
 * Candidate Generation Engine — resultado oficial + plano da regra →
 * lista ORDENADA de números candidatos (texto, preserva zeros).
 *
 * Posições são 1-indexadas da esquerda: prêmio "32940", posições
 * [3,4,5] → "940"; [2,3,4] → "294"; [2,3,4,5] → "2940". Nenhum padrão
 * fica fixo aqui — tudo vem de `candidatePlan`.
 */

export type Candidate = {
  /** Ordem na apuração, a partir de 1. */
  order: number;
  prize: number;
  prizeValue: string;
  positions: number[];
  raw: string;
};

export function extractDigits(prizeValue: string, positions: number[]): string {
  return positions
    .map((p) => {
      const digit = prizeValue[p - 1];
      if (digit === undefined) throw new Error(`Posição ${p} não existe no prêmio "${prizeValue}".`);
      return digit;
    })
    .join("");
}

export function generateCandidates(prizes: string[], plan: CandidateStep[]): Candidate[] {
  return plan.map((step, index) => {
    const prizeValue = prizes[step.prize - 1];
    if (prizeValue === undefined) throw new Error(`O plano usa o ${step.prize}º prêmio, que não existe no resultado.`);
    return {
      order: index + 1,
      prize: step.prize,
      prizeValue,
      positions: [...step.positions],
      raw: extractDigits(prizeValue, step.positions),
    };
  });
}
