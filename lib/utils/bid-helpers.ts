import type { ConsortiumBid, ConsortiumContract } from "@/lib/data/consortiums";
import type { WealthAlert } from "@/lib/utils/wealth-helpers";

export const BID_RESULT_LABEL: Record<string, string> = {
  pending: "Ofertado",
  analyzing: "Em análise",
  won: "Contemplado",
  lost: "Não contemplado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

export const BID_RESULT_OPTIONS = ["pending", "analyzing", "won", "lost", "cancelled", "expired"] as const;

export const BID_RESULT_VARIANT: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  pending: "outline",
  analyzing: "outline",
  won: "default",
  lost: "destructive",
  cancelled: "destructive",
  expired: "secondary",
};

export function bidResultLabel(result: string): string {
  return BID_RESULT_LABEL[result] ?? result;
}

export const DEFAULT_MODALITY_OPTIONS = ["livre", "fixo", "embutido", "misto"] as const;

export const MODALITY_LABEL: Record<string, string> = {
  livre: "Lance Livre",
  fixo: "Lance Fixo",
  embutido: "Lance Embutido",
  misto: "Lance Misto",
};

export function modalityLabel(modality: string): string {
  return MODALITY_LABEL[modality] ?? modality;
}

/**
 * Regras do grupo/contrato pra lances — tudo opcional, tudo lido do
 * campo bid_rules (jsonb) do próprio contrato. Nenhum valor aqui tem
 * default universal: campo ausente = "não informado" na tela, nunca
 * uma regra assumida.
 */
export type BidRules = {
  allowedModalities?: string[];
  minPercentage?: number;
  maxPercentage?: number;
  calculationBase?: string;
  tieBreakRule?: string;
  embeddedLimitPercentage?: number;
  offerDeadlineDays?: number;
  eligibilityRules?: string;
  postContemplationRules?: string;
  nextAssemblyDate?: string;
};

export function getBidRules(contract: ConsortiumContract | undefined | null): BidRules {
  if (!contract?.bidRules) return {};
  return contract.bidRules as BidRules;
}

export function allowedModalitiesFor(contract: ConsortiumContract | undefined | null): string[] {
  const rules = getBidRules(contract);
  if (rules.allowedModalities && rules.allowedModalities.length > 0) return rules.allowedModalities;
  return [...DEFAULT_MODALITY_OPTIONS];
}

/** Protocolo derivado do próprio id do lance — real, estável, auditável,
 * sem precisar de coluna nova. */
export function protocolFor(bid: Pick<ConsortiumBid, "id">): string {
  return `LANCE-${bid.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export type GroupBidStats = {
  count: number;
  avgWonPercentage: number | null;
  minWonPercentage: number | null;
  maxWonPercentage: number | null;
  contemplationsByBid: number;
};

/**
 * Histórico do grupo/contrato — só com base nos lances reais daquele
 * contrato. Menos de 2 lances vencedores com percentual = estatística
 * insuficiente (retorna null pros campos de média/mín/máx, mas ainda
 * conta contemplações reais).
 */
export function computeGroupBidStats(bids: ConsortiumBid[]): GroupBidStats {
  const won = bids.filter((b) => b.result === "won");
  const wonWithPct = won.filter((b) => b.bidPercentage !== null);

  if (wonWithPct.length < 2) {
    return { count: wonWithPct.length, avgWonPercentage: null, minWonPercentage: null, maxWonPercentage: null, contemplationsByBid: won.length };
  }

  const percentages = wonWithPct.map((b) => Number(b.bidPercentage));
  const avg = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;

  return {
    count: wonWithPct.length,
    avgWonPercentage: avg,
    minWonPercentage: Math.min(...percentages),
    maxWonPercentage: Math.max(...percentages),
    contemplationsByBid: won.length,
  };
}

export type BidComparisonToAverage = "above" | "near" | "below";

/**
 * Compara um percentual à média histórica vencedora do grupo — nunca
 * uma previsão, só uma leitura objetiva do passado. "near" = dentro de
 * ±5 pontos percentuais da média.
 */
export function compareBidToAverage(percentage: number, avg: number): BidComparisonToAverage {
  const diff = percentage - avg;
  if (Math.abs(diff) <= 5) return "near";
  return diff > 0 ? "above" : "below";
}

export type SimulationInput = {
  contract: ConsortiumContract;
  modality: string;
  percentage: number | null;
  amount: number | null;
  ownResources: number;
  embeddedAmount: number;
};

export type SimulationResult = {
  bidValue: number;
  bidPercentage: number | null;
  creditBefore: number;
  creditAfterEmbedded: number;
  balanceImpact: number;
  estimatedAnticipatedInstallments: number | null;
  embeddedExceedsLimit: boolean;
};

/**
 * Simulador — só aritmética direta a partir de dado real do contrato
 * (crédito, parcela) e do que o usuário informou. Nunca projeta
 * contemplação; é sempre rotulado como SIMULAÇÃO na UI.
 */
export function runBidSimulation(input: SimulationInput): SimulationResult {
  const creditBefore = Number(input.contract.creditAmount ?? 0);
  const bidValue =
    input.amount !== null ? input.amount : input.percentage !== null ? creditBefore * (input.percentage / 100) : 0;
  const bidPercentage = input.percentage !== null ? input.percentage : creditBefore > 0 ? (bidValue / creditBefore) * 100 : null;

  const embeddedAmount = Math.max(input.embeddedAmount, 0);
  const creditAfterEmbedded = Math.max(creditBefore - embeddedAmount, 0);
  const balanceImpact = -(bidValue - embeddedAmount);

  const installmentAmount = Number(input.contract.installmentAmount ?? 0);
  const estimatedAnticipatedInstallments =
    installmentAmount > 0 ? Math.max(bidValue - embeddedAmount, 0) / installmentAmount : null;

  const rules = getBidRules(input.contract);
  const embeddedPct = creditBefore > 0 ? (embeddedAmount / creditBefore) * 100 : 0;
  const embeddedExceedsLimit =
    rules.embeddedLimitPercentage !== undefined && embeddedAmount > 0 && embeddedPct > rules.embeddedLimitPercentage;

  return {
    bidValue,
    bidPercentage,
    creditBefore,
    creditAfterEmbedded,
    balanceImpact,
    estimatedAnticipatedInstallments,
    embeddedExceedsLimit,
  };
}

/** Elegibilidade mínima pra ofertar lance — deriva só de status real do
 * contrato, nunca de uma regra inventada. */
export function checkEligibility(contract: ConsortiumContract): { eligible: boolean; reason: string | null } {
  const blockedStatuses = ["cancelled", "closed", "settled", "completed"];
  if (blockedStatuses.includes(contract.status)) {
    return { eligible: false, reason: `Contrato com status "${contract.status}" não permite nova oferta de lance.` };
  }
  return { eligible: true, reason: null };
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Isola a leitura do relógio numa função utilitária comum (não um
 * componente) — evita chamar Date.now() direto no corpo de um
 * componente, que o lint de pureza do React sinaliza. */
export function daysFromNow(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / DAY_MS);
}

export function subtractDays(dateStr: string, days: number): Date {
  return new Date(new Date(dateStr).getTime() - days * DAY_MS);
}

export type BidFilters = {
  search: string;
  result: string;
  contractId: string;
  clientId: string;
};

export const DEFAULT_BID_FILTERS: BidFilters = {
  search: "",
  result: "all",
  contractId: "all",
  clientId: "all",
};

export function hasActiveBidFilters(filters: BidFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "search") return value !== "";
    return value !== "all";
  });
}

export function applyBidFilters(bids: ConsortiumBid[], filters: BidFilters): ConsortiumBid[] {
  const term = filters.search.trim().toLowerCase();

  return bids.filter((bid) => {
    if (term) {
      const haystack = [bid.contractLabel, bid.clientName, bid.bidType].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.result !== "all" && bid.result !== filters.result) return false;
    if (filters.contractId !== "all" && bid.contractId !== filters.contractId) return false;
    if (filters.clientId !== "all" && (bid.clientId ?? "none") !== filters.clientId) return false;
    return true;
  });
}

/**
 * Alertas do módulo de lances — só os com base real: prazo de oferta
 * próximo (precisa de nextAssemblyDate + offerDeadlineDays cadastrados
 * nas regras do contrato), lances em análise após a data da
 * assembleia (precisam de acompanhamento), e lances vencedores
 * recentes (próximos passos de pós-contemplação). Nunca alerta de
 * pagamento/documentação pendente sem dado real que sustente isso.
 */
export function computeBidAlerts(bids: ConsortiumBid[], contracts: ConsortiumContract[]): WealthAlert[] {
  const alerts: WealthAlert[] = [];
  const now = Date.now();

  for (const contract of contracts) {
    const rules = getBidRules(contract);
    if (!rules.nextAssemblyDate) continue;

    const assemblyDate = new Date(rules.nextAssemblyDate).getTime();
    const daysToAssembly = Math.round((assemblyDate - now) / DAY_MS);

    if (rules.offerDeadlineDays !== undefined) {
      const daysToDeadline = daysToAssembly - rules.offerDeadlineDays;
      if (daysToDeadline >= 0 && daysToDeadline <= 7) {
        alerts.push({
          id: `deadline-${contract.id}`,
          severity: "warning",
          message: `Prazo de oferta próximo: contrato ${contract.administratorName ?? "—"} · ${contract.contractNumber ?? "—"} — faltam ${daysToDeadline} ${daysToDeadline === 1 ? "dia" : "dias"} pro prazo de lance da próxima assembleia.`,
        });
      }
    } else if (daysToAssembly >= 0 && daysToAssembly <= 7) {
      alerts.push({
        id: `assembly-${contract.id}`,
        severity: "info",
        message: `Assembleia próxima: contrato ${contract.administratorName ?? "—"} · ${contract.contractNumber ?? "—"} em ${daysToAssembly} ${daysToAssembly === 1 ? "dia" : "dias"}.`,
      });
    }
  }

  for (const bid of bids) {
    if (bid.result === "analyzing" && bid.bidDate) {
      const daysSince = Math.round((now - new Date(bid.bidDate).getTime()) / DAY_MS);
      if (daysSince >= 30) {
        alerts.push({
          id: `stuck-analyzing-${bid.id}`,
          severity: "warning",
          message: `Lance em análise há ${daysSince} dias sem resultado: ${bid.contractLabel}. Vale confirmar com a administradora.`,
        });
      }
    }

    if (bid.result === "won") {
      const daysSince = bid.bidDate ? Math.round((now - new Date(bid.bidDate).getTime()) / DAY_MS) : null;
      if (daysSince !== null && daysSince <= 30) {
        alerts.push({
          id: `recent-win-${bid.id}`,
          severity: "info",
          message: `Lance vencedor recente em ${bid.contractLabel} — acompanhar pós-contemplação (documentação, pagamento do lance, liberação do crédito).`,
        });
      }
    }
  }

  return alerts;
}
