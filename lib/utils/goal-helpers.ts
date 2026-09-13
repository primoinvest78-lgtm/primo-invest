import type { GoalDetail } from "@/lib/data/wealth";
import type { WealthAlert } from "@/lib/utils/wealth-helpers";

export type GoalStatus = "em_dia" | "atencao" | "em_risco" | "concluida";

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  em_dia: "Em dia",
  atencao: "Atenção",
  em_risco: "Em risco",
  concluida: "Concluída",
};

const DAY_MS = 1000 * 60 * 60 * 24;

export function progressPct(goal: Pick<GoalDetail, "targetAmount" | "currentAmount">): number {
  const target = Number(goal.targetAmount ?? 0);
  if (target <= 0) return 0;
  return Math.min((Number(goal.currentAmount ?? 0) / target) * 100, 100);
}

export function remainingAmount(goal: Pick<GoalDetail, "targetAmount" | "currentAmount">): number {
  const target = Number(goal.targetAmount ?? 0);
  return Math.max(target - Number(goal.currentAmount ?? 0), 0);
}

export function daysRemaining(goal: Pick<GoalDetail, "targetDate">): number | null {
  if (!goal.targetDate) return null;
  return Math.round((new Date(goal.targetDate).getTime() - Date.now()) / DAY_MS);
}

/**
 * Aporte mensal necessário pra atingir a meta no prazo, no ritmo
 * linear restante — SEMPRE uma projeção matemática simples a partir
 * de valor restante ÷ meses restantes, nunca um valor garantido.
 * Retorna null quando não há prazo, a meta já foi atingida, ou o
 * prazo já passou (nesses casos não existe divisão válida).
 */
export function requiredMonthlyContribution(
  goal: Pick<GoalDetail, "targetAmount" | "currentAmount" | "targetDate">,
): number | null {
  const days = daysRemaining(goal);
  if (days === null || days <= 0) return null;
  const remaining = remainingAmount(goal);
  if (remaining <= 0) return null;
  const months = days / 30.44;
  if (months < 1) return remaining;
  return remaining / months;
}

/**
 * Status calculado a partir de dado real: progresso atual vs. o
 * progresso esperado pelo tempo já decorrido entre a criação da meta
 * e o prazo-alvo (ritmo linear). Sem prazo cadastrado, cai pra uma
 * régua só de progresso. Nunca um status arbitrário.
 */
export function computeGoalStatus(goal: GoalDetail): GoalStatus {
  const target = Number(goal.targetAmount ?? 0);
  const current = Number(goal.currentAmount ?? 0);

  if (target > 0 && current >= target) return "concluida";
  if (goal.status.toLowerCase().includes("conclu") || goal.status.toLowerCase().includes("achiev")) {
    return "concluida";
  }

  const days = daysRemaining(goal);
  const actualPct = progressPct(goal);

  if (days !== null && days < 0 && goal.status === "active") return "em_risco";

  if (goal.status !== "active") return "em_risco";

  let base: GoalStatus;

  if (days === null) {
    base = actualPct >= 90 ? "em_dia" : actualPct >= 60 ? "atencao" : "em_risco";
  } else {
    const totalDays = Math.max((new Date(goal.targetDate as string).getTime() - new Date(goal.createdAt).getTime()) / DAY_MS, 1);
    const elapsedDays = Math.min(Math.max((Date.now() - new Date(goal.createdAt).getTime()) / DAY_MS, 0), totalDays);
    const expectedPct = (elapsedDays / totalDays) * 100;
    const gap = expectedPct - actualPct;

    base = gap <= 5 ? "em_dia" : gap <= 20 ? "atencao" : "em_risco";

    if (days <= 90 && actualPct < 100 && base === "em_dia") base = "atencao";
  }

  return base;
}

export type GoalFilters = {
  search: string;
  goalType: string;
  clientId: string;
  status: GoalStatus | "all";
};

export const DEFAULT_GOAL_FILTERS: GoalFilters = {
  search: "",
  goalType: "all",
  clientId: "all",
  status: "all",
};

export function hasActiveGoalFilters(filters: GoalFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "search") return value !== "";
    return value !== "all";
  });
}

export function applyGoalFilters(
  goals: GoalDetail[],
  filters: GoalFilters,
  statusOf: (goal: GoalDetail) => GoalStatus,
): GoalDetail[] {
  const term = filters.search.trim().toLowerCase();

  return goals.filter((goal) => {
    if (term) {
      const haystack = [goal.name, goal.goalType, goal.clientName].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.goalType !== "all" && goal.goalType !== filters.goalType) return false;
    if (filters.clientId !== "all" && (goal.clientId ?? "none") !== filters.clientId) return false;
    if (filters.status !== "all" && statusOf(goal) !== filters.status) return false;
    return true;
  });
}

/**
 * Alertas do módulo de metas — só os que têm base direta em dado real
 * (prazo, progresso vs. ritmo esperado, status). Não gera alerta de
 * "aporte abaixo do planejado" porque não existe campo de aporte
 * planejado no schema — inventar uma referência pra comparar seria
 * fabricar o próprio alerta.
 */
export function computeGoalAlerts(goals: GoalDetail[]): WealthAlert[] {
  const alerts: WealthAlert[] = [];

  for (const goal of goals) {
    const status = computeGoalStatus(goal);
    if (status === "concluida") continue;

    const label = goal.name;
    const days = daysRemaining(goal);
    const pct = progressPct(goal);

    if (days !== null && days < 0) {
      alerts.push({
        id: `overdue-${goal.id}`,
        severity: "danger",
        message: `Meta atrasada: "${label}" passou do prazo (${formatOverdue(days)}) com ${pct.toFixed(0)}% concluído.`,
      });
    } else if (days !== null && days <= 90) {
      alerts.push({
        id: `due-soon-${goal.id}`,
        severity: status === "em_risco" ? "danger" : "warning",
        message: `Prazo próximo: "${label}" vence em ${days} ${days === 1 ? "dia" : "dias"} — ${pct.toFixed(0)}% concluído.`,
      });
    }

    if (status === "em_risco" && !(days !== null && days <= 90)) {
      alerts.push({
        id: `at-risk-${goal.id}`,
        severity: "danger",
        message: `Meta em risco: "${label}" está bem abaixo do ritmo esperado (${pct.toFixed(0)}% concluído).`,
      });
    } else if (status === "atencao") {
      alerts.push({
        id: `behind-pace-${goal.id}`,
        severity: "warning",
        message: `Progresso abaixo do esperado: "${label}" está com ${pct.toFixed(0)}% concluído, atrás do ritmo ideal pro prazo.`,
      });
    }
  }

  return alerts;
}

function formatOverdue(days: number): string {
  const abs = Math.abs(days);
  return `${abs} ${abs === 1 ? "dia" : "dias"} atrás`;
}
