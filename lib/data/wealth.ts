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

export type AccountHolding = {
  id: string;
  productName: string | null;
  productType: string | null;
  quantity: number;
  currentPrice: number | null;
  valuation: number | null;
};

export type AccountDetail = {
  id: string;
  accountName: string | null;
  institutionName: string | null;
  accountType: string;
  currency: string;
  status: string;
  updatedAt: string | null;
  clientId: string | null;
  clientName: string | null;
  holdings: AccountHolding[];
};

const ACCOUNT_DETAIL_SELECT = `id, account_name, institution_name, account_type, currency, status, updated_at,
       client:clients(id, full_name),
       holdings(id, quantity, current_price, valuation, investment_products(name, product_type))`;

type RawAccountDetail = {
  id: string;
  account_name: string | null;
  institution_name: string | null;
  account_type: string;
  currency: string;
  status: string;
  updated_at: string | null;
  client: { id: string; full_name: string } | null;
  holdings: {
    id: string;
    quantity: number;
    current_price: number | null;
    valuation: number | null;
    investment_products: { name: string; product_type: string } | null;
  }[];
};

function mapAccountDetail(row: RawAccountDetail): AccountDetail {
  return {
    id: row.id,
    accountName: row.account_name,
    institutionName: row.institution_name,
    accountType: row.account_type,
    currency: row.currency,
    status: row.status,
    updatedAt: row.updated_at,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
    holdings: (row.holdings ?? []).map((h) => ({
      id: h.id,
      productName: h.investment_products?.name ?? null,
      productType: h.investment_products?.product_type ?? null,
      quantity: h.quantity,
      currentPrice: h.current_price,
      valuation: h.valuation,
    })),
  };
}

export async function getAccountsDetail(organizationId: string): Promise<AccountDetail[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_accounts")
    .select(ACCOUNT_DETAIL_SELECT)
    .eq("organization_id", organizationId)
    .order("account_name");

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawAccountDetail[];
  return rows.map(mapAccountDetail);
}

export async function getAccountDetail(
  organizationId: string,
  accountId: string,
): Promise<AccountDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_accounts")
    .select(ACCOUNT_DETAIL_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", accountId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapAccountDetail(data as unknown as RawAccountDetail);
}

export type AccountMovement = {
  id: string;
  transactionType: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
  transactionDate: string;
  description: string | null;
  productName: string | null;
};

export async function getAccountMovements(
  organizationId: string,
  accountId: string,
): Promise<AccountMovement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `id, transaction_type, quantity, unit_price, amount, transaction_date, description,
       investment_products(name)`,
    )
    .eq("organization_id", organizationId)
    .eq("financial_account_id", accountId)
    .order("transaction_date", { ascending: false });

  if (error) throw error;

  type Raw = {
    id: string;
    transaction_type: string;
    quantity: number | null;
    unit_price: number | null;
    amount: number | null;
    transaction_date: string;
    description: string | null;
    investment_products: { name: string } | null;
  };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    transactionType: row.transaction_type,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    amount: row.amount,
    transactionDate: row.transaction_date,
    description: row.description,
    productName: row.investment_products?.name ?? null,
  }));
}

/**
 * Evolução do saldo de uma conta específica, derivada das transactions
 * reais daquela conta. Sem transactions suficientes, retorna array
 * vazio — nunca preenche histórico artificial.
 */
export async function getAccountHistory(
  organizationId: string,
  accountId: string,
): Promise<WealthHistoryPoint[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, transaction_date")
    .eq("organization_id", organizationId)
    .eq("financial_account_id", accountId)
    .order("transaction_date", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const monthly = new Map<string, number>();
  for (const t of data) {
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

export type HoldingDetail = {
  id: string;
  productName: string | null;
  productType: string | null;
  accountId: string | null;
  accountName: string | null;
  accountType: string | null;
  institutionName: string | null;
  accountStatus: string | null;
  clientId: string | null;
  clientName: string | null;
  quantity: number;
  averagePrice: number | null;
  currentPrice: number | null;
  valuation: number | null;
  asOfDate: string;
  investmentProductId: string | null;
  movements: HoldingMovement[];
};

export type HoldingMovement = {
  id: string;
  transactionType: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
  transactionDate: string;
  description: string | null;
};

export async function getInvestmentsDetail(organizationId: string): Promise<HoldingDetail[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("holdings")
    .select(
      `id, quantity, average_price, current_price, valuation, as_of_date, investment_product_id,
       investment_products(name, product_type),
       financial_accounts(id, account_name, account_type, institution_name, status, client:clients(id, full_name))`,
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
    as_of_date: string;
    investment_product_id: string | null;
    investment_products: { name: string; product_type: string } | null;
    financial_accounts: {
      id: string;
      account_name: string | null;
      account_type: string;
      institution_name: string | null;
      status: string;
      client: { id: string; full_name: string } | null;
    } | null;
  };
  const rows = (data ?? []) as unknown as Raw[];

  // Não há vínculo direto transaction -> holding no schema; busca todas
  // as transações da organização de uma vez e agrupa por conta + produto
  // (a chave real de correlação), em vez de uma query por posição.
  const { data: transactionRows, error: transactionsError } = await supabase
    .from("transactions")
    .select("id, financial_account_id, investment_product_id, transaction_type, quantity, unit_price, amount, transaction_date, description")
    .eq("organization_id", organizationId)
    .order("transaction_date", { ascending: false });

  if (transactionsError) throw transactionsError;

  const movementsByKey = new Map<string, HoldingMovement[]>();
  for (const t of transactionRows ?? []) {
    const key = `${t.financial_account_id}::${t.investment_product_id ?? "none"}`;
    const list = movementsByKey.get(key) ?? [];
    list.push({
      id: t.id,
      transactionType: t.transaction_type,
      quantity: t.quantity,
      unitPrice: t.unit_price,
      amount: t.amount,
      transactionDate: t.transaction_date,
      description: t.description,
    });
    movementsByKey.set(key, list);
  }

  return rows.map((row) => ({
    id: row.id,
    productName: row.investment_products?.name ?? null,
    productType: row.investment_products?.product_type ?? null,
    accountId: row.financial_accounts?.id ?? null,
    accountName: row.financial_accounts?.account_name ?? null,
    accountType: row.financial_accounts?.account_type ?? null,
    institutionName: row.financial_accounts?.institution_name ?? null,
    accountStatus: row.financial_accounts?.status ?? null,
    clientId: row.financial_accounts?.client?.id ?? null,
    clientName: row.financial_accounts?.client?.full_name ?? null,
    quantity: row.quantity,
    averagePrice: row.average_price,
    currentPrice: row.current_price,
    valuation: row.valuation,
    asOfDate: row.as_of_date,
    investmentProductId: row.investment_product_id,
    movements: movementsByKey.get(`${row.financial_accounts?.id}::${row.investment_product_id ?? "none"}`) ?? [],
  }));
}

export type GoalAccountLink = {
  accountId: string;
  accountName: string | null;
  accountType: string | null;
  institutionName: string | null;
  allocationPercentage: number | null;
  balance: number;
};

export type GoalDetail = {
  id: string;
  name: string;
  goalType: string | null;
  targetAmount: number | null;
  currentAmount: number;
  targetDate: string | null;
  priority: string;
  status: string;
  createdAt: string;
  clientId: string | null;
  clientName: string | null;
  accounts: GoalAccountLink[];
  /** Soma das transações do tipo "buy" (aporte de capital real) nas
   * contas vinculadas à meta — nunca inclui dividendo/juros (retorno,
   * não aporte novo) nem saída (venda/taxa/resgate). */
  contributedTotal: number;
};

export async function getGoalsDetail(organizationId: string): Promise<GoalDetail[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wealth_goals")
    .select(
      `id, name, goal_type, target_amount, current_amount, target_date, priority, status, created_at,
       client:clients(id, full_name),
       wealth_goal_accounts(
         allocation_percentage,
         financial_accounts(id, account_name, account_type, institution_name, holdings(valuation))
       )`,
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
    created_at: string;
    client: { id: string; full_name: string } | null;
    wealth_goal_accounts: {
      allocation_percentage: number | null;
      financial_accounts: {
        id: string;
        account_name: string | null;
        account_type: string | null;
        institution_name: string | null;
        holdings: { valuation: number | null }[];
      } | null;
    }[];
  };
  const rows = (data ?? []) as unknown as Raw[];

  const allAccountIds = Array.from(
    new Set(
      rows.flatMap((row) =>
        (row.wealth_goal_accounts ?? [])
          .map((wga) => wga.financial_accounts?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    ),
  );

  const contributionByAccount = new Map<string, number>();
  if (allAccountIds.length > 0) {
    const { data: buyTransactions, error: txError } = await supabase
      .from("transactions")
      .select("financial_account_id, amount")
      .eq("organization_id", organizationId)
      .eq("transaction_type", "buy")
      .in("financial_account_id", allAccountIds);

    if (txError) throw txError;

    for (const t of buyTransactions ?? []) {
      const key = t.financial_account_id as string;
      contributionByAccount.set(key, (contributionByAccount.get(key) ?? 0) + Number(t.amount ?? 0));
    }
  }

  return rows.map((row) => {
    const accounts: GoalAccountLink[] = (row.wealth_goal_accounts ?? [])
      .filter((wga) => wga.financial_accounts)
      .map((wga) => {
        const account = wga.financial_accounts!;
        return {
          accountId: account.id,
          accountName: account.account_name,
          accountType: account.account_type,
          institutionName: account.institution_name,
          allocationPercentage: wga.allocation_percentage,
          balance: (account.holdings ?? []).reduce((sum, h) => sum + Number(h.valuation ?? 0), 0),
        };
      });

    const contributedTotal = accounts.reduce(
      (sum, a) => sum + (contributionByAccount.get(a.accountId) ?? 0),
      0,
    );

    return {
      id: row.id,
      name: row.name,
      goalType: row.goal_type,
      targetAmount: row.target_amount,
      currentAmount: row.current_amount,
      targetDate: row.target_date,
      priority: row.priority,
      status: row.status,
      createdAt: row.created_at,
      clientId: row.client?.id ?? null,
      clientName: row.client?.full_name ?? null,
      accounts,
      contributedTotal,
    };
  });
}

export type GoalDetailSingle = GoalDetail;

export async function getGoalDetail(
  organizationId: string,
  goalId: string,
): Promise<GoalDetail | null> {
  const goals = await getGoalsDetail(organizationId);
  return goals.find((g) => g.id === goalId) ?? null;
}

/**
 * Evolução dos aportes (transações "buy") nas contas vinculadas à
 * meta, acumulado por mês. É uma aproximação honesta de "quanto foi
 * aportado ao longo do tempo" — não é a valorização de mercado da
 * posição (essa exigiria snapshots históricos de valuation, que o
 * schema atual não guarda). Sem transações suficientes, retorna vazio.
 */
export async function getGoalContributionHistory(
  organizationId: string,
  goal: Pick<GoalDetail, "accounts">,
): Promise<WealthHistoryPoint[]> {
  const accountIds = goal.accounts.map((a) => a.accountId);
  if (accountIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, transaction_date")
    .eq("organization_id", organizationId)
    .eq("transaction_type", "buy")
    .in("financial_account_id", accountIds)
    .order("transaction_date", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const monthly = new Map<string, number>();
  for (const t of data) {
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

export type LiabilityDetail = {
  id: string;
  name: string;
  liabilityType: string | null;
  outstandingAmount: number | null;
  interestRate: number | null;
  monthlyPayment: number | null;
  maturityDate: string | null;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  clientId: string | null;
  clientName: string | null;
};

const LIABILITY_DETAIL_SELECT = `id, name, liability_type, outstanding_amount, interest_rate, monthly_payment,
       maturity_date, currency, status, created_at, updated_at,
       client:clients(id, full_name)`;

type RawLiabilityDetail = {
  id: string;
  name: string;
  liability_type: string | null;
  outstanding_amount: number | null;
  interest_rate: number | null;
  monthly_payment: number | null;
  maturity_date: string | null;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  client: { id: string; full_name: string } | null;
};

function mapLiabilityDetail(row: RawLiabilityDetail): LiabilityDetail {
  return {
    id: row.id,
    name: row.name,
    liabilityType: row.liability_type,
    outstandingAmount: row.outstanding_amount,
    interestRate: row.interest_rate,
    monthlyPayment: row.monthly_payment,
    maturityDate: row.maturity_date,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
  };
}

export async function getLiabilitiesDetail(organizationId: string): Promise<LiabilityDetail[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("liabilities")
    .select(LIABILITY_DETAIL_SELECT)
    .eq("organization_id", organizationId)
    .order("maturity_date");

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawLiabilityDetail[];
  return rows.map(mapLiabilityDetail);
}

export async function getLiabilityDetail(
  organizationId: string,
  liabilityId: string,
): Promise<LiabilityDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("liabilities")
    .select(LIABILITY_DETAIL_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", liabilityId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapLiabilityDetail(data as unknown as RawLiabilityDetail);
}

export type ClientDocumentSummary = {
  id: string;
  name: string;
  documentType: string | null;
  status: string;
  createdAt: string;
};

/**
 * Documentos não têm vínculo direto com passivo no schema atual — só
 * com cliente. Usado na tela de detalhe do passivo pra mostrar os
 * documentos do titular, sem inventar um vínculo que não existe.
 */
export async function getClientDocuments(
  organizationId: string,
  clientId: string,
): Promise<ClientDocumentSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, name, document_type, status, created_at")
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  type Raw = { id: string; name: string; document_type: string | null; status: string; created_at: string };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    documentType: row.document_type,
    status: row.status,
    createdAt: row.created_at,
  }));
}
