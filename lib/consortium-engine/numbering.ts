import type { GroupNumbering } from "./types.ts";

/**
 * Number Generation & Allocation Engine.
 *
 * Valor numérico (inteiro) e representação (texto com zeros à esquerda)
 * são coisas diferentes: a cota guarda o inteiro, a tela sempre usa
 * `formatQuotaNumber`. "001" nunca vira "1" na apresentação, e um grupo
 * 001→1000 exibe "1000" sem truncar.
 */

export function buildNumbering(input: {
  quotaCount: number;
  numberStart?: number;
  displayDigits?: number;
}): GroupNumbering {
  const numberStart = input.numberStart ?? 1;
  if (!Number.isInteger(input.quotaCount) || input.quotaCount <= 0) {
    throw new Error("Quantidade de cotas deve ser um inteiro positivo.");
  }
  if (!Number.isInteger(numberStart) || numberStart < 0) {
    throw new Error("Número inicial deve ser um inteiro maior ou igual a zero.");
  }
  const numberEnd = numberStart + input.quotaCount - 1;
  // Padrão: largura suficiente pro maior número "cheio" do grupo
  // (1000 cotas → 3 dígitos: 001…999, e 1000 aparece como "1000").
  const displayDigits = input.displayDigits ?? Math.max(String(numberEnd - (numberEnd % 10 === 0 && numberEnd >= 10 ? 1 : 0)).length, 1);
  if (!Number.isInteger(displayDigits) || displayDigits < 1 || displayDigits > 8) {
    throw new Error("Quantidade de dígitos de exibição deve estar entre 1 e 8.");
  }
  return { numberStart, numberEnd, displayDigits };
}

export function quotaCount(numbering: GroupNumbering): number {
  return numbering.numberEnd - numbering.numberStart + 1;
}

export function isInRange(numbering: GroupNumbering, value: number): boolean {
  return Number.isInteger(value) && value >= numbering.numberStart && value <= numbering.numberEnd;
}

export function formatQuotaNumber(value: number, displayDigits: number): string {
  return String(value).padStart(displayDigits, "0");
}

/** "001" → 1. Rejeita qualquer coisa que não seja só dígitos. */
export function parseQuotaNumber(text: string): number {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) throw new Error(`Número de cota inválido: "${text}".`);
  return Number.parseInt(trimmed, 10);
}

/** Lista a numeração completa do grupo — use só quando realmente precisar de todas. */
export function enumerateQuotaNumbers(numbering: GroupNumbering): number[] {
  const out: number[] = [];
  for (let n = numbering.numberStart; n <= numbering.numberEnd; n += 1) out.push(n);
  return out;
}

/**
 * Faixas de agrupamento (centenas, milhares) pra análise/visualização —
 * ex.: 0001–0100, 0101–0200… Não altera a numeração, só a lê.
 */
export function numberingBlocks(numbering: GroupNumbering, blockSize: number) {
  if (!Number.isInteger(blockSize) || blockSize <= 0) throw new Error("Tamanho de bloco inválido.");
  const blocks: { from: number; to: number; label: string }[] = [];
  for (let from = numbering.numberStart; from <= numbering.numberEnd; from += blockSize) {
    const to = Math.min(from + blockSize - 1, numbering.numberEnd);
    blocks.push({
      from,
      to,
      label: `${formatQuotaNumber(from, numbering.displayDigits)}–${formatQuotaNumber(to, numbering.displayDigits)}`,
    });
  }
  return blocks;
}
