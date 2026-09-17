import { LEAD_STATUSES } from "@/lib/data/lead-statuses";

export type LeadScorable = {
  id: string;
  status: string;
  interest: string | null;
  productInterest: string | null;
  estimatedNetWorth: number | null;
  interactionsCount: number;
  lastInteractionAt: string | null;
  createdAt: string;
  nextTask: { dueAt: string | null } | null;
};

export type LeadScoreTier = "Quente" | "Morno" | "Frio";

export const LEAD_TIER_BADGE_CLASS: Record<LeadScoreTier, string> = {
  Quente: "border-warning/40 bg-warning/15 text-warning",
  Morno: "border-accent/30 bg-accent/10 text-accent",
  Frio: "border-border bg-muted text-muted-foreground",
};

const DAY_MS = 1000 * 60 * 60 * 24;

export function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / DAY_MS;
}

/**
 * Score de 0 a 100 derivado inteiramente de dado real já carregado do
 * lead — nenhum fator inventado. Pondera estágio no funil, patrimônio
 * estimado, riqueza de qualificação (interesse/produto), engajamento
 * (qtd. de interações) e recência de contato.
 */
export function computeLeadScore(lead: LeadScorable): { score: number; tier: LeadScoreTier } {
  const stageIndex = LEAD_STATUSES.indexOf(lead.status as (typeof LEAD_STATUSES)[number]);
  const openStagesCount = 6; // Novo..Negociação

  let stagePoints = 0;
  if (lead.status === "Convertido") stagePoints = 25;
  else if (stageIndex >= 0 && stageIndex < openStagesCount) {
    stagePoints = (stageIndex / (openStagesCount - 1)) * 25;
  }

  let netWorthPoints = 0;
  const netWorth = lead.estimatedNetWorth ?? 0;
  if (netWorth >= 1_000_000) netWorthPoints = 25;
  else if (netWorth >= 500_000) netWorthPoints = 18;
  else if (netWorth >= 100_000) netWorthPoints = 10;
  else if (netWorth > 0) netWorthPoints = 5;

  const qualificationPoints = (lead.interest ? 10 : 0) + (lead.productInterest ? 10 : 0);

  const engagementPoints = Math.min(lead.interactionsCount * 5, 20);

  const lastActivityIso = lead.lastInteractionAt ?? lead.createdAt;
  const daysSinceContact = daysSince(lastActivityIso);
  let recencyPoints: number;
  if (daysSinceContact <= 3) recencyPoints = 10;
  else if (daysSinceContact <= 7) recencyPoints = 6;
  else if (daysSinceContact <= 14) recencyPoints = 2;
  else if (daysSinceContact <= 30) recencyPoints = 0;
  else if (daysSinceContact <= 60) recencyPoints = -10;
  else recencyPoints = -20;

  const raw = stagePoints + netWorthPoints + qualificationPoints + engagementPoints + recencyPoints;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const tier: LeadScoreTier = score >= 70 ? "Quente" : score >= 40 ? "Morno" : "Frio";

  return { score, tier };
}

export function isTaskDueTodayOrOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return new Date(dueAt).getTime() <= endOfToday.getTime();
}

export type LeadPriorityLabel = "Alta" | "Média" | "Baixa";

export const LEAD_PRIORITY_BADGE_CLASS: Record<LeadPriorityLabel, string> = {
  Alta: "border-destructive/40 bg-destructive/10 text-destructive",
  Média: "border-warning/40 bg-warning/15 text-warning",
  Baixa: "border-border bg-muted text-muted-foreground",
};

/** Prioridade de um lead individual — mesma lógica usada na listagem
 * "Prioridade de hoje", mas resolvida pra um único lead (perfil). */
export function computeLeadPriorityLabel(lead: LeadScorable): LeadPriorityLabel {
  if (lead.status === "Convertido" || lead.status === "Perdido") return "Baixa";

  const { tier } = computeLeadScore(lead);
  const nearConversion = lead.status === "Proposta" || lead.status === "Negociação";
  const actionToday = lead.nextTask !== null && isTaskDueTodayOrOverdue(lead.nextTask.dueAt);

  if (tier === "Quente" || nearConversion || actionToday) return "Alta";
  if (tier === "Morno") return "Média";
  return "Baixa";
}

export type LeadTodayPriorities<T extends LeadScorable> = {
  hot: T[];
  noContact: T[];
  stalled: T[];
  withNextAction: T[];
  nearConversion: T[];
};

/**
 * "Prioridade de Hoje" — listas de ação derivadas do estado real de
 * cada lead aberto (não convertido nem perdido).
 */
export function computeTodayPriorities<T extends LeadScorable>(
  leads: T[],
): LeadTodayPriorities<T> {
  const open = leads.filter((l) => l.status !== "Convertido" && l.status !== "Perdido");

  const hot = open
    .filter((l) => computeLeadScore(l).tier === "Quente")
    .sort((a, b) => computeLeadScore(b).score - computeLeadScore(a).score);

  const noContact = open.filter((l) => l.interactionsCount === 0);

  const stalled = open
    .filter((l) => daysSince(l.lastInteractionAt ?? l.createdAt) > 14)
    .sort(
      (a, b) =>
        daysSince(b.lastInteractionAt ?? b.createdAt) - daysSince(a.lastInteractionAt ?? a.createdAt),
    );

  const withNextAction = open.filter(
    (l) => l.nextTask !== null && isTaskDueTodayOrOverdue(l.nextTask.dueAt),
  );

  const nearConversion = open.filter(
    (l) => l.status === "Proposta" || l.status === "Negociação",
  );

  return { hot, noContact, stalled, withNextAction, nearConversion };
}
