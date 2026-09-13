import type { OpportunityCard } from "@/lib/data/opportunities";

export const OPPORTUNITY_TYPES = [
  { value: "investimento", label: "Investimento" },
  { value: "aporte", label: "Aporte" },
  { value: "consorcio", label: "Consórcio" },
  { value: "planejamento", label: "Planejamento" },
  { value: "previdencia", label: "Previdência" },
  { value: "seguros", label: "Seguros" },
  { value: "credito", label: "Crédito" },
  { value: "outro", label: "Outro produto" },
] as const;

export const PRIORITY_LABEL: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const PRIORITY_BADGE_CLASS: Record<string, string> = {
  low: "border-border bg-muted text-muted-foreground",
  normal: "border-accent/30 bg-accent/10 text-accent",
  high: "border-warning/40 bg-warning/15 text-warning",
  urgent: "border-destructive/40 bg-destructive/10 text-destructive",
};

const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / DAY_MS;
}

export function effectiveProbability(
  opportunity: Pick<OpportunityCard, "probability">,
  stageProbability: number | null,
): number | null {
  return opportunity.probability ?? stageProbability;
}

export function isOpenOpportunity(status: string): boolean {
  return status !== "won" && status !== "lost" && status !== "cancelled";
}

export type OpportunityPriorities = {
  highValue: OpportunityCard[];
  highProbability: OpportunityCard[];
  closingSoon: OpportunityCard[];
  stalled: OpportunityCard[];
  noNextAction: OpportunityCard[];
};

/**
 * "Oportunidades prioritárias" — derivadas 100% de dado real já
 * carregado (valor, probabilidade, previsão, última atividade, tarefa
 * pendente). Nenhum critério inventado.
 */
export function computeOpportunityPriorities(opportunities: OpportunityCard[]): OpportunityPriorities {
  const open = opportunities.filter((o) => isOpenOpportunity(o.status));

  const highValue = [...open]
    .filter((o) => o.estimatedValue !== null)
    .sort((a, b) => Number(b.estimatedValue) - Number(a.estimatedValue))
    .slice(0, 8);

  const highProbability = open
    .filter((o) => o.probability !== null && o.probability >= 70)
    .sort((a, b) => Number(b.probability) - Number(a.probability));

  const closingSoon = open
    .filter((o) => {
      if (!o.expectedCloseDate) return false;
      const daysUntil = (new Date(o.expectedCloseDate).getTime() - Date.now()) / DAY_MS;
      return daysUntil >= 0 && daysUntil <= 14;
    })
    .sort((a, b) => (a.expectedCloseDate ?? "").localeCompare(b.expectedCloseDate ?? ""));

  const stalled = open
    .filter((o) => daysSince(o.lastActivityAt ?? o.createdAt) > 20)
    .sort(
      (a, b) =>
        daysSince(b.lastActivityAt ?? b.createdAt) - daysSince(a.lastActivityAt ?? a.createdAt),
    );

  const noNextAction = open.filter((o) => o.nextTask === null);

  return { highValue, highProbability, closingSoon, stalled, noNextAction };
}
