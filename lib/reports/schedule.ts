/**
 * Cálculo da próxima emissão de um relatório recorrente.
 *
 * Fica fora de `lib/actions/reports.ts` porque um módulo "use server"
 * só pode exportar funções assíncronas — e esta é síncrona e pura,
 * usada também pela UI para mostrar a data antes de salvar.
 */

import { type ScheduleFrequency } from "@/lib/reports/types";

const FREQUENCY_MONTHS: Record<ScheduleFrequency, number> = {
  mensal: 1,
  trimestral: 3,
  anual: 12,
};

/**
 * Próxima emissão a partir de `from`, respeitando o dia escolhido. O dia
 * é limitado a 28 para que a recorrência caia no mesmo dia em todos os
 * meses, inclusive fevereiro.
 */
export function computeNextRun(
  frequency: ScheduleFrequency,
  dayOfMonth: number,
  from = new Date(),
): string {
  const day = Math.min(Math.max(Math.round(dayOfMonth), 1), 28);
  const step = FREQUENCY_MONTHS[frequency];
  const candidate = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), day));

  if (candidate <= from) {
    candidate.setUTCMonth(candidate.getUTCMonth() + step);
  }
  return candidate.toISOString().slice(0, 10);
}

export function clampDayOfMonth(value: number): number {
  return Math.min(Math.max(Math.round(value) || 1, 1), 28);
}
