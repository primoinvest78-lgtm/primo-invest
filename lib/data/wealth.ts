import { createClient } from "@/lib/supabase/server";
import { isLiquidAccountType } from "@/lib/utils/wealth-helpers";

export type WealthOverview = {
  investmentsTotal: number;
  consortiumTotal: number;
  liquidTotal: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  lastUpdatedAt: string | null;
  allocation: { productType: string; value: number }[];
  accounts: {
    id: string;
    accountName: string | null;
    institutionName: string | null;
    accountType: string;
    balance: number;
    clientId: string | null;
    clientName: string | null;
  }[];
  liabilities: {
    id: string;
    name: string;
    liabilityType: string | null;
    outstandingAmount: number | null;
    maturityDate: string | null;
    clientId: string | null;
    clientName: string | null;
  }[];
  topClients: { id: string | null; name: string; total: number }[];
  topHoldings: { id: string; name: string; total: number }[];
  goals: {
    id: string;
    name: string;
    targetAmount: number | null;
    currentAmount: number;
    targetDate: string | null;
    clientId: string | null;
    clientName: string | null;
  }[];
};

export async function getWealthOverview(organizationId: string): Promise<WealthOverview> {
  const supabase = await createClient();

  const [accountsRes, liabilitiesRes, goalsRes, consortiumRes] = await Promise.all([
    supabase
      .from("financial_accounts")
      .select(
        `id, account_name, institution_name, account_type,
         client:clients(id, full_name),
         holdings(id, valuation, as_of_date, investment_products(name, product_type))`,
      )
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("liabilities")
      .select(`id, name, liability_type, outstanding_amount, maturity_date, client:clients(id, full_name)`)
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("wealth_goals")
      .select(`id, name, target_amount, current_amount, target_date, client:clients(id, full_name)`)
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("consortium_contracts")
      .select(`id, credit_amount, client:clients(id, full_name)`)
      .eq("organization_id", organizationId)
      .eq("status", "active"),
  ]);

  if (accountsRes.error) throw accountsRes.error;
  if (liabilitiesRes.error) throw liabilitiesRes.error;
  if (goalsRes.error) throw goalsRes.error;
  if (consortiumRes.error) throw consortiumRes.error;

  type RawAccount = {
    id: string;
    account_name: string | null;
    institution_name: string | null;
    account_type: string;
    client: { id: string; full_name: string } | null;
    holdings: {
      id: string;
      valuation: number | null;
      as_of_date: string;
      investment_products: { name: string; product_type: string } | null;
    }[];
  };
  const accountRows = (accountsRes.data ?? []) as unknown as RawAccount[];

  const allocationMap = new Map<string, number>();
  const holdingsFlat: { id: string; name: string; total: number }[] = [];
  let lastUpdatedAt: string | null = null;
  let liquidTotal = 0;

  const accounts = accountRows.map((row) => {
    const isLiquid = isLiquidAccountType(row.account_type);

    const balance = (row.holdings ?? []).reduce((sum, h) => {
      const value = Number(h.valuation ?? 0);

      if (isLiquid) {
        liquidTotal += value;
        allocationMap.set("Liquidez", (allocationMap.get("Liquidez") ?? 0) + value);
      } else {
        const type = h.investment_products?.product_type ?? "Outros";
        allocationMap.set(type, (allocationMap.get(type) ?? 0) + value);
      }

      if (value > 0) {
        holdingsFlat.push({
          id: h.id,
          name: h.investment_products?.name ?? row.account_name ?? "Ativo",
          total: value,
        });
      }

      if (!lastUpdatedAt || h.as_of_date > lastUpdatedAt) lastUpdatedAt = h.as_of_date;

      return sum + value;
    }, 0);

    return {
      id: row.id,
      accountName: row.account_name,
      institutionName: row.institution_name,
      accountType: row.account_type,
      balance,
      clientId: row.client?.id ?? null,
      clientName: row.client?.full_name ?? null,
    };
  });

  const investmentsTotal = accounts.reduce((sum, a) => sum + a.balance, 0);

  type RawConsortium = {
    id: string;
    credit_amount: number | null;
    client: { id: string; full_name: string } | null;
  };
  const consortiumRows = (consortiumRes.data ?? []) as unknown as RawConsortium[];
  const consortiumTotal = consortiumRows.reduce((sum, c) => sum + Number(c.credit_amount ?? 0), 0);
  if (consortiumTotal > 0) allocationMap.set("Consórcio", consortiumTotal);

  const totalAssets = investmentsTotal + consortiumTotal;

  type RawLiability = {
    id: string;
    name: string;
    liability_type: string | null;
    outstanding_amount: number | null;
    maturity_date: string | null;
    client: { id: string; full_name: string } | null;
  };
  const liabilityRows = (liabilitiesRes.data ?? []) as unknown as RawLiability[];
  const liabilities = liabilityRows.map((row) => ({
    id: row.id,
    name: row.name,
    liabilityType: row.liability_type,
    outstandingAmount: row.outstanding_amount,
    maturityDate: row.maturity_date,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
  }));
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + Number(l.outstandingAmount ?? 0),
    0,
  );

  type RawGoal = {
    id: string;
    name: string;
    target_amount: number | null;
    current_amount: number;
    target_date: string | null;
    client: { id: string; full_name: string } | null;
  };
  const goalRows = (goalsRes.data ?? []) as unknown as RawGoal[];
  const goals = goalRows.map((row) => ({
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    targetDate: row.target_date,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
  }));

  const topClientsMap = new Map<string, { id: string | null; total: number }>();
  for (const account of accounts) {
    const name = account.clientName ?? "Sem cliente vinculado";
    const existing = topClientsMap.get(name);
    topClientsMap.set(name, {
      id: account.clientId,
      total: (existing?.total ?? 0) + account.balance,
    });
  }
  const topClients = Array.from(topClientsMap.entries())
    .map(([name, { id, total }]) => ({ id, name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const topHoldings = [...holdingsFlat]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return {
    investmentsTotal,
    consortiumTotal,
    liquidTotal,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    lastUpdatedAt,
    allocation: Array.from(allocationMap.entries()).map(([productType, value]) => ({
      productType,
      value,
    })),
    topClients,
    topHoldings,
    accounts,
    liabilities,
    goals,
  };
}

export type WealthHistoryPoint = { month: string; value: number };

/**
 * Evolução patrimonial da organização inteira, derivada de
 * transactions reais (soma acumulada por mês, todas as contas). Sem
 * transactions suficientes, retorna array vazio — a UI mostra estado
 * vazio, nunca preenche com número inventado.
 */
export async function getWealthHistory(organizationId: string): Promise<WealthHistoryPoint[]> {
  const supabase = await createClient();

  const { data: accounts, error: accountsError } = await supabase
    .from("financial_accounts")
    .select("id")
    .eq("organization_id", organizationId);

  if (accountsError) throw accountsError;
  const accountIds = (accounts ?? []).map((a) => a.id);
  if (accountIds.length === 0) return [];

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, transaction_date")
    .eq("organization_id", organizationId)
    .in("financial_account_id", accountIds)
    .order("transaction_date", { ascending: true });

  if (error) throw error;
  if (!transactions || transactions.length === 0) return [];

  const monthly = new Map<string, number>();
  for (const t of transactions) {
    const month = String(t.transaction_date).slice(0, 7);
    monthly.set(month, (monthly.get(month) ?? 0) + Number(t.amount ?? 0));
  }

  let cumulative = 0;
  return Array.from(monthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => {
      cumulative += value;
      return { month, value: cumulative };
    });
}

export type AccountDetail = {
  id: string;
  accountName: string | null;
  institutionName: string | null;
  accountType: string;
  currency: string;
  clientName: string | null;
  holdings: {
    id: string;
    productName: string | null;
    productType: string | null;
    quantity: number;
    currentPrice: number | null;
    valuation: number | null;
  }[];
};

export async function getAccountsDetail(organizationId: string): Promise<AccountDetail[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_accounts")
    .select(
      `id, account_name, institution_name, account_type, currency,
       client:clients(full_name),
       holdings(id, quantity, current_price, valuation, investment_products(name, product_type))`,
    )
    .eq("organization_id", organizationId)
    .order("account_name");

  if (error) throw error;

  type Raw = {
    id: string;
    account_name: string | null;
    institution_name: string | null;
    account_type: string;
    currency: string;
    client: { full_name: string } | null;
    holdings: {
      id: string;
      quantity: number;
      current_price: number | null;
      valuation: number | null;
      investment_products: { name: string; product_type: string } | null;
    }[];
  };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    accountName: row.account_name,
    institutionName: row.institution_name,
    accountType: row.account_type,
    currency: row.currency,
    clientName: row.client?.full_name ?? null,
    holdings: (row.holdings ?? []).map((h) => ({
      id: h.id,
      productName: h.investment_products?.name ?? null,
      productType: h.investment_products?.product_type ?? null,
      quantity: h.quantity,
      currentPrice: h.current_price,
      valuation: h.valuation,
    })),
  }));
}

export type HoldingDetail = {
  id: string;
  productName: string | null;
  productType: string | null;
  accountName: string | null;
  clientName: string | null;
  quantity: number;
  averagePrice: number | null;
  currentPrice: number | null;
  valuation: number | null;
};

export async function getInvestmentsDetail(organizationId: string): Promise<HoldingDetail[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("holdings")
    .select(
      `id, quantity, average_price, current_price, valuation,
       investment_products(name, product_type),
       financial_accounts(account_name, client:clients(full_name))`,
    )
    .eq("organization_id", organizationId)
    .order("valuation", { ascending: false });

  if (error) throw error;

  type Raw = {
    id: string;
    quantity: number;
    average_price: number | null;
    current_price: number | null;
    valuation: number | null;
    investment_products: { name: string; product_type: string } | null;
    financial_accounts: { account_name: string | null; client: { full_name: string } | null } | null;
  };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    productName: row.investment_products?.name ?? null,
    productType: row.investment_products?.product_type ?? null,
    accountName: row.financial_accounts?.account_name ?? null,
    clientName: row.financial_accounts?.client?.full_name ?? null,
    quantity: row.quantity,
    averagePrice: row.average_price,
    currentPrice: row.current_price,
    valuation: row.valuation,
  }));
}

export type GoalDetail = {
  id: string;
  name: string;
  goalType: string | null;
  targetAmount: number | null;
  currentAmount: number;
  targetDate: string | null;
  priority: string;
  status: string;
  clientName: string | null;
  accounts: { accountName: string | null; allocationPercentage: number | null }[];
};

export async function getGoalsDetail(organizationId: string): Promise<GoalDetail[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wealth_goals")
    .select(
      `id, name, goal_type, target_amount, current_amount, target_date, priority, status,
       client:clients(full_name),
       wealth_goal_accounts(allocation_percentage, financial_accounts(account_name))`,
    )
    .eq("organization_id", organizationId)
    .order("target_date");

  if (error) throw error;

  type Raw = {
    id: string;
    name: string;
    goal_type: string | null;
    target_amount: number | null;
    current_amount: number;
    target_date: string | null;
    priority: string;
    status: string;
    client: { full_name: string } | null;
    wealth_goal_accounts: {
      allocation_percentage: number | null;
      financial_accounts: { account_name: string | null } | null;
    }[];
  };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    goalType: row.goal_type,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    targetDate: row.target_date,
    priority: row.priority,
    status: row.status,
    clientName: row.client?.full_name ?? null,
    accounts: (row.wealth_goal_accounts ?? []).map((wga) => ({
      accountName: wga.financial_accounts?.account_name ?? null,
      allocationPercentage: wga.allocation_percentage,
    })),
  }));
}

export type LiabilityDetail = {
  id: string;
  name: string;
  liabilityType: string | null;
  outstandingAmount: number | null;
  interestRate: number | null;
  monthlyPayment: number | null;
  maturityDate: string | null;
  status: string;
  clientName: string | null;
};

export async function getLiabilitiesDetail(organizationId: string): Promise<LiabilityDetail[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("liabilities")
    .select(
      `id, name, liability_type, outstanding_amount, interest_rate, monthly_payment,
       maturity_date, status, client:clients(full_name)`,
    )
    .eq("organization_id", organizationId)
    .order("maturity_date");

  if (error) throw error;

  type Raw = {
    id: string;
    name: string;
    liability_type: string | null;
    outstanding_amount: number | null;
    interest_rate: number | null;
    monthly_payment: number | null;
    maturity_date: string | null;
    status: string;
    client: { full_name: string } | null;
  };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    liabilityType: row.liability_type,
    outstandingAmount: row.outstanding_amount,
    interestRate: row.interest_rate,
    monthlyPayment: row.monthly_payment,
    maturityDate: row.maturity_date,
    status: row.status,
    clientName: row.client?.full_name ?? null,
  }));
}
