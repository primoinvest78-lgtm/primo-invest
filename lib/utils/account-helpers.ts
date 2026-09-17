import type { AccountDetail } from "@/lib/data/wealth";
import type { WealthAlert } from "@/lib/utils/wealth-helpers";
import { isLiquidAccountType } from "@/lib/utils/wealth-helpers";

/** Identificação mascarada — não há número de conta real no schema, então
 * mascara o id interno (últimos 4 caracteres) só pra exibição consistente. */
export function maskAccountId(id: string): string {
  const tail = id.replace(/-/g, "").slice(-4).toUpperCase();
  return `•••• ${tail}`;
}

export type AccountBalances = {
  balance: number;
  liquidBalance: number;
  investedBalance: number;
  holdingsCount: number;
};

export function computeAccountBalances(account: AccountDetail): AccountBalances {
  const isLiquid = isLiquidAccountType(account.accountType);
  const balance = account.holdings.reduce((sum, h) => sum + Number(h.valuation ?? 0), 0);

  return {
    balance,
    liquidBalance: isLiquid ? balance : 0,
    investedBalance: isLiquid ? 0 : balance,
    holdingsCount: account.holdings.length,
  };
}

export type InstitutionSummary = {
  institutionName: string;
  accountCount: number;
  balance: number;
  investedBalance: number;
  liquidBalance: number;
};

export function groupAccountsByInstitution(accounts: AccountDetail[]): InstitutionSummary[] {
  const map = new Map<string, InstitutionSummary>();

  for (const account of accounts) {
    const name = account.institutionName ?? "Sem instituição";
    const { balance, liquidBalance, investedBalance } = computeAccountBalances(account);
    const existing = map.get(name);

    if (existing) {
      existing.accountCount += 1;
      existing.balance += balance;
      existing.liquidBalance += liquidBalance;
      existing.investedBalance += investedBalance;
    } else {
      map.set(name, {
        institutionName: name,
        accountCount: 1,
        balance,
        liquidBalance,
        investedBalance,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.balance - a.balance);
}

export type ClientAccountsSummary = {
  clientId: string | null;
  clientName: string;
  accountCount: number;
  balance: number;
};

export function groupAccountsByClient(accounts: AccountDetail[]): ClientAccountsSummary[] {
  const map = new Map<string, ClientAccountsSummary>();

  for (const account of accounts) {
    const key = account.clientId ?? "none";
    const { balance } = computeAccountBalances(account);
    const existing = map.get(key);

    if (existing) {
      existing.accountCount += 1;
      existing.balance += balance;
    } else {
      map.set(key, {
        clientId: account.clientId,
        clientName: account.clientName ?? "Sem cliente vinculado",
        accountCount: 1,
        balance,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.balance - a.balance);
}

export type AccountFilters = {
  search: string;
  institution: string;
  clientId: string;
  accountType: string;
  status: string;
  attentionOnly: boolean;
};

export const DEFAULT_ACCOUNT_FILTERS: AccountFilters = {
  search: "",
  institution: "all",
  clientId: "all",
  accountType: "all",
  status: "all",
  attentionOnly: false,
};

export function hasActiveAccountFilters(filters: AccountFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "search") return value !== "";
    if (key === "attentionOnly") return value === true;
    return value !== "all";
  });
}

export function applyAccountFilters(accounts: AccountDetail[], filters: AccountFilters): AccountDetail[] {
  const term = filters.search.trim().toLowerCase();

  return accounts.filter((account) => {
    if (term) {
      const haystack = [account.accountName, account.institutionName, account.clientName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.institution !== "all" && account.institutionName !== filters.institution) return false;
    if (filters.clientId !== "all" && (account.clientId ?? "none") !== filters.clientId) return false;
    if (filters.accountType !== "all" && account.accountType !== filters.accountType) return false;
    if (filters.status !== "all" && account.status !== filters.status) return false;
    if (filters.attentionOnly && !accountNeedsAttention(account)) return false;
    return true;
  });
}

const NINETY_DAYS_MS = 1000 * 60 * 60 * 24 * 90;

/** Uma conta precisa de atenção se: inativa, sem atualização há mais de
 * 90 dias, ou com cadastro incompleto. */
export function accountNeedsAttention(account: AccountDetail, now: number = Date.now()): boolean {
  const inactive = account.status !== "active";
  const stale = Boolean(account.updatedAt) && now - new Date(account.updatedAt as string).getTime() > NINETY_DAYS_MS;
  const incomplete = !account.clientId || !account.institutionName || !account.accountName;
  return inactive || stale || incomplete;
}

/** Contas que precisam de atenção — usado pelo KPI e pela tabela. */
export function computeAccountsNeedingAttention(accounts: AccountDetail[]): Set<string> {
  const now = Date.now();
  const ids = new Set<string>();
  for (const account of accounts) {
    if (accountNeedsAttention(account, now)) ids.add(account.id);
  }
  return ids;
}

/**
 * Alertas do módulo de contas — todos derivados de dado real já
 * carregado (status, updated_at, vínculos cadastrais, concentração
 * por instituição). Nenhuma condição fictícia.
 */
export function computeAccountAlerts(accounts: AccountDetail[]): WealthAlert[] {
  const alerts: WealthAlert[] = [];
  const now = Date.now();

  for (const account of accounts) {
    const label = account.accountName ?? account.institutionName ?? "Conta";

    if (account.status !== "active") {
      alerts.push({
        id: `inactive-${account.id}`,
        severity: "warning",
        message: `Conta inativa: "${label}" está com status "${account.status}".`,
      });
    }

    if (account.updatedAt && now - new Date(account.updatedAt).getTime() > NINETY_DAYS_MS) {
      alerts.push({
        id: `stale-${account.id}`,
        severity: "info",
        message: `Conta sem atualização há mais de 90 dias: "${label}".`,
      });
    }

    if (!account.clientId || !account.institutionName || !account.accountName) {
      alerts.push({
        id: `incomplete-${account.id}`,
        severity: "warning",
        message: `Inconsistência cadastral em "${label}": cadastro incompleto (cliente, instituição ou nome ausente).`,
      });
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + computeAccountBalances(a).balance, 0);
  const liquidTotal = accounts.reduce((sum, a) => sum + computeAccountBalances(a).liquidBalance, 0);

  if (totalBalance > 0) {
    const liquidPct = (liquidTotal / totalBalance) * 100;
    if (liquidPct < 5) {
      alerts.push({
        id: "accounts-low-liquidity",
        severity: "warning",
        message: `Liquidez baixa: apenas ${liquidPct.toFixed(1)}% do saldo em contas está disponível.`,
      });
    }
  }

  const institutions = groupAccountsByInstitution(accounts);
  if (institutions.length >= 2 && totalBalance > 0) {
    for (const inst of institutions) {
      const pct = (inst.balance / totalBalance) * 100;
      if (pct >= 60) {
        alerts.push({
          id: `concentration-${inst.institutionName}`,
          severity: "warning",
          message: `Concentração elevada: ${pct.toFixed(0)}% do saldo em contas está em "${inst.institutionName}".`,
        });
      }
    }
  }

  return alerts;
}
