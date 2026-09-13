import type { WealthHistoryPoint } from "@/lib/data/wealth";

export const WEALTH_PERIODS = [
  { value: "1M", label: "1M", months: 1 },
  { value: "3M", label: "3M", months: 3 },
  { value: "6M", label: "6M", months: 6 },
  { value: "1A", label: "1A", months: 12 },
  { value: "all", label: "Período disponível", months: Infinity },
] as const;

export type WealthPeriodValue = (typeof WEALTH_PERIODS)[number]["value"];

/** Só oferece os períodos que o histórico real cobre — nunca um botão
 * que renderizaria dado que não existe. */
export function availableWealthPeriods(history: WealthHistoryPoint[]) {
  return WEALTH_PERIODS.filter((p) => p.value === "all" || history.length >= Math.min(p.months, 2));
}

export function filterWealthHistoryByPeriod(
  history: WealthHistoryPoint[],
  period: WealthPeriodValue,
): WealthHistoryPoint[] {
  const config = WEALTH_PERIODS.find((p) => p.value === period);
  if (!config || config.months === Infinity) return history;
  return history.slice(-config.months);
}
