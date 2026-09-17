import type { LiabilityDetail } from "@/lib/data/wealth";
import type { WealthAlert } from "@/lib/utils/wealth-helpers";

export type LiabilityFilters = {
  search: string;
  liabilityType: string;
  clientId: string;
  status: string;
  attentionOnly: boolean;
  nearMaturityOnly: boolean;
};

export const DEFAULT_LIABILITY_FILTERS: LiabilityFilters = {
  search: "",
  liabilityType: "all",
  clientId: "all",
  status: "all",
  attentionOnly: false,
  nearMaturityOnly: false,
};

export function hasActiveLiabilityFilters(filters: LiabilityFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "search") return value !== "";
    if (key === "attentionOnly" || key === "nearMaturityOnly") return value === true;
    return value !== "all";
  });
}

export function applyLiabilityFilters(
  liabilities: LiabilityDetail[],
  filters: LiabilityFilters,
): LiabilityDetail[] {
  const term = filters.search.trim().toLowerCase();

  return liabilities.filter((liability) => {
    if (term) {
      const haystack = [liability.name, liability.liabilityType, liability.clientName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.liabilityType !== "all" && liability.liabilityType !== filters.liabilityType) return false;
    if (filters.clientId !== "all" && (liability.clientId ?? "none") !== filters.clientId) return false;
    if (filters.status !== "all" && liability.status !== filters.status) return false;
    if (filters.attentionOnly && !liabilityNeedsAttention(liability)) return false;
    if (filters.nearMaturityOnly && !isLiabilityNearMaturity(liability)) return false;
    return true;
  });
}

export type LiabilityCategorySummary = { category: string; total: number; count: number };

export function groupLiabilitiesByCategory(liabilities: LiabilityDetail[]): LiabilityCategorySummary[] {
  const map = new Map<string, LiabilityCategorySummary>();

  for (const liability of liabilities) {
    const category = liability.liabilityType ?? "Outros";
    const existing = map.get(category);
    const amount = Number(liability.outstandingAmount ?? 0);

    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      map.set(category, { category, total: amount, count: 1 });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

/** Meses restantes pra quitar no ritmo atual — só quando há saldo e
 * parcela reais; nunca extrapola sem os dois valores. */
export function monthsToPayoff(liability: LiabilityDetail): number | null {
  const outstanding = Number(liability.outstandingAmount ?? 0);
  const payment = Number(liability.monthlyPayment ?? 0);
  if (outstanding <= 0 || payment <= 0) return null;
  return outstanding / payment;
}

const NINETY_DAYS_MS = 1000 * 60 * 60 * 24 * 90;
const MATURITY_ATTENTION_MS = 1000 * 60 * 60 * 24 * 180;

/** Um passivo merece atenção se: vencimento próximo, status fora de
 * "active", ou muito perto da quitação no ritmo atual. */
export function liabilityNeedsAttention(liability: LiabilityDetail, now: number = Date.now()): boolean {
  const maturitySoon =
    Boolean(liability.maturityDate) && new Date(liability.maturityDate as string).getTime() - now <= NINETY_DAYS_MS;
  const notActive = liability.status !== "active";
  const months = monthsToPayoff(liability);
  const nearPayoff = months !== null && months <= 3;
  return maturitySoon || notActive || nearPayoff;
}

/** Passivos que merecem atenção — usado pelo KPI e pela tabela. */
export function computeLiabilitiesNeedingAttention(liabilities: LiabilityDetail[]): Set<string> {
  const now = Date.now();
  const ids = new Set<string>();
  for (const liability of liabilities) {
    if (liabilityNeedsAttention(liability, now)) ids.add(liability.id);
  }
  return ids;
}

export function isLiabilityNearMaturity(liability: LiabilityDetail, now: number = Date.now()): boolean {
  return Boolean(liability.maturityDate) && new Date(liability.maturityDate as string).getTime() - now <= MATURITY_ATTENTION_MS;
}

export function countLiabilitiesNearMaturity(liabilities: LiabilityDetail[]): number {
  const now = Date.now();
  return liabilities.filter((l) => isLiabilityNearMaturity(l, now)).length;
}

/**
 * Alertas do módulo de passivos — todos derivados de dado real já
 * carregado (vencimento, status, saldo/parcela, concentração por
 * credor/categoria). Nenhuma recomendação financeira inventada.
 */
export function computeLiabilityAlerts(liabilities: LiabilityDetail[]): WealthAlert[] {
  const alerts: WealthAlert[] = [];
  const now = Date.now();

  const totalOutstanding = liabilities.reduce((sum, l) => sum + Number(l.outstandingAmount ?? 0), 0);
  const totalMonthly = liabilities.reduce((sum, l) => sum + Number(l.monthlyPayment ?? 0), 0);

  for (const liability of liabilities) {
    const label = liability.name;

    if (liability.maturityDate) {
      const daysToMaturity = Math.round((new Date(liability.maturityDate).getTime() - now) / (1000 * 60 * 60 * 24));
      if (daysToMaturity >= 0 && daysToMaturity <= 90) {
        alerts.push({
          id: `maturity-${liability.id}`,
          severity: "warning",
          message: `Vencimento próximo: "${label}" vence em ${daysToMaturity} ${daysToMaturity === 1 ? "dia" : "dias"}.`,
        });
      } else if (daysToMaturity < 0 && liability.status === "active") {
        alerts.push({
          id: `overdue-${liability.id}`,
          severity: "danger",
          message: `"${label}" está com o vencimento cadastrado no passado e ainda ativo — verificar status.`,
        });
      }
    }

    if (liability.status !== "active") {
      alerts.push({
        id: `status-${liability.id}`,
        severity: "info",
        message: `"${label}" está com status "${liability.status}".`,
      });
    }

    const months = monthsToPayoff(liability);
    if (months !== null && months <= 3) {
      alerts.push({
        id: `near-payoff-${liability.id}`,
        severity: "info",
        message: `"${label}" está próximo da quitação: ${months.toFixed(1)} meses restantes no ritmo atual.`,
      });
    }

    if (totalOutstanding > 0) {
      const pctOfTotal = (Number(liability.outstandingAmount ?? 0) / totalOutstanding) * 100;
      if (liabilities.length >= 2 && pctOfTotal >= 60) {
        alerts.push({
          id: `concentration-${liability.id}`,
          severity: "warning",
          message: `Concentração de dívida: "${label}" representa ${pctOfTotal.toFixed(0)}% do total em passivos.`,
        });
      }
    }

    if (totalMonthly > 0) {
      const pctOfMonthly = (Number(liability.monthlyPayment ?? 0) / totalMonthly) * 100;
      if (liabilities.length >= 2 && pctOfMonthly >= 40) {
        alerts.push({
          id: `heavy-installment-${liability.id}`,
          severity: "warning",
          message: `Parcela elevada: "${label}" representa ${pctOfMonthly.toFixed(0)}% do comprometimento mensal total.`,
        });
      }
    }
  }

  return alerts;
}
