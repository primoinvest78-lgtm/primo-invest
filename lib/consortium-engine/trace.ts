import type { TraceStep } from "./types.ts";

/**
 * Calculation Trace — a prova do cálculo. Cada passo tem código
 * estável (pra máquina/IA), mensagem em português (pra pessoa) e dados
 * estruturados. O trace inteiro entra no `calculation_hash`.
 */
export class TraceBuilder {
  private steps: TraceStep[] = [];

  add(code: string, message: string, data?: Record<string, unknown>): void {
    this.steps.push({ step: this.steps.length + 1, code, message, ...(data ? { data } : {}) });
  }

  toArray(): TraceStep[] {
    return this.steps.map((s) => ({ ...s }));
  }
}

/**
 * Formatação de moeda SEM Intl: a saída do Intl muda entre versões do
 * ICU (espaço comum vs. não-quebrável), o que mudaria o texto do trace
 * — e o hash — entre ambientes. Aqui é sempre "R$ 1.234,56".
 */
export function formatBRL(value: number): string {
  const negative = value < 0;
  const cents = Math.round(Math.abs(value) * 100);
  const intPart = Math.floor(cents / 100).toString();
  const decimals = (cents % 100).toString().padStart(2, "0");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}R$ ${grouped},${decimals}`;
}
