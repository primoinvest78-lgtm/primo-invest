import type { HoldingDetail } from "@/lib/data/wealth";
import { isLiquidAccountType } from "@/lib/utils/wealth-helpers";

export function computeGainLoss(holding: HoldingDetail): { gainLoss: number | null; gainLossPct: number | null } {
  const avg = Number(holding.averagePrice ?? 0);
  const qty = Number(holding.quantity ?? 0);
  const valuation = Number(holding.valuation ?? 0);
  const cost = avg * qty;
  if (avg <= 0 || cost === 0) return { gainLoss: null, gainLossPct: null };
  const gainLoss = valuation - cost;
  return { gainLoss, gainLossPct: (gainLoss / cost) * 100 };
}

export function holdingCost(holding: HoldingDetail): number | null {
  const avg = Number(holding.averagePrice ?? 0);
  if (avg <= 0) return null;
  return avg * Number(holding.quantity ?? 0);
}

export type ConcentrationEntry = { label: string; value: number; pct: number };

export type ConcentrationSummary = {
  topPosition: ConcentrationEntry | null;
  byClass: ConcentrationEntry[];
  byInstitution: ConcentrationEntry[];
  byClient: ConcentrationEntry[];
};

function groupPct(
  holdings: HoldingDetail[],
  total: number,
  keyFn: (h: HoldingDetail) => string | null,
): ConcentrationEntry[] {
  const map = new Map<string, number>();
  for (const h of holdings) {
    const key = keyFn(h);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + Number(h.valuation ?? 0));
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Concentração — 100% derivada das posições reais já carregadas.
 * Nenhuma métrica de risco inventada, só participação % real.
 */
export function computeConcentration(holdings: HoldingDetail[]): ConcentrationSummary {
  const total = holdings.reduce((sum, h) => sum + Number(h.valuation ?? 0), 0);

  const topHolding = [...holdings].sort(
    (a, b) => Number(b.valuation ?? 0) - Number(a.valuation ?? 0),
  )[0];
  const topPosition = topHolding
    ? {
        label: topHolding.productName ?? "Ativo",
        value: Number(topHolding.valuation ?? 0),
        pct: total > 0 ? (Number(topHolding.valuation ?? 0) / total) * 100 : 0,
      }
    : null;

  return {
    topPosition,
    byClass: groupPct(holdings, total, (h) => h.productType ?? "Outros"),
    byInstitution: groupPct(holdings, total, (h) => h.institutionName),
    byClient: groupPct(holdings, total, (h) => h.clientName),
  };
}

export type InvestmentFilters = {
  clientId: string;
  accountId: string;
  institution: string;
  assetClass: string;
  product: string;
  status: string;
  asOfFrom: string;
  asOfTo: string;
};

export const DEFAULT_INVESTMENT_FILTERS: InvestmentFilters = {
  clientId: "all",
  accountId: "all",
  institution: "all",
  assetClass: "all",
  product: "all",
  status: "active",
  asOfFrom: "",
  asOfTo: "",
};

export function hasActiveInvestmentFilters(filters: InvestmentFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "asOfFrom" || key === "asOfTo") return value !== "";
    if (key === "status") return value !== "active";
    return value !== "all";
  });
}

export function applyInvestmentFilters(holdings: HoldingDetail[], filters: InvestmentFilters): HoldingDetail[] {
  return holdings.filter((h) => {
    if (filters.clientId !== "all" && h.clientId !== filters.clientId) return false;
    if (filters.accountId !== "all" && h.accountId !== filters.accountId) return false;
    if (filters.institution !== "all" && h.institutionName !== filters.institution) return false;
    if (filters.assetClass !== "all" && h.productType !== filters.assetClass) return false;
    if (filters.product !== "all" && h.productName !== filters.product) return false;
    if (filters.status !== "all" && h.accountStatus !== filters.status) return false;
    if (filters.asOfFrom !== "" && h.asOfDate.slice(0, 10) < filters.asOfFrom) return false;
    if (filters.asOfTo !== "" && h.asOfDate.slice(0, 10) > filters.asOfTo) return false;
    return true;
  });
}

export function isLiquidHolding(holding: HoldingDetail): boolean {
  return isLiquidAccountType(holding.accountType);
}

/**
 * Rótulo do tipo de movimentação (transactions.transaction_type).
 * Centralizado aqui — vivia duplicado em `investment-detail-dialog.tsx` e
 * `account-movements-table.tsx`, com o mesmo nome de constante e conjuntos
 * de chaves levemente diferentes.
 */
export const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  buy: "Compra",
  sell: "Venda",
  dividend: "Dividendo",
  interest: "Juros",
  fee: "Taxa",
  deposit: "Depósito",
  withdrawal: "Saque",
};

export function movementTypeLabel(type: string): string {
  return MOVEMENT_TYPE_LABEL[type] ?? type;
}
