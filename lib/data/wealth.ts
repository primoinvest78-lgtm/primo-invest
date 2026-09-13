import { createClient } from "@/lib/supabase/server";

export type WealthOverview = {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  allocation: { productType: string; value: number }[];
  accounts: {
    id: string;
    accountName: string | null;
    institutionName: string | null;
    accountType: string;
    balance: number;
    clientName: string | null;
  }[];
  liabilities: {
    id: string;
    name: string;
    liabilityType: string | null;
    outstandingAmount: number | null;
    maturityDate: string | null;
    clientName: string | null;
  }[];
  goals: {
    id: string;
    name: string;
    targetAmount: number | null;
    currentAmount: number;
    targetDate: string | null;
    clientName: string | null;
  }[];
};

export async function getWealthOverview(organizationId: string): Promise<WealthOverview> {
  const supabase = await createClient();

  const [accountsRes, liabilitiesRes, goalsRes] = await Promise.all([
    supabase
      .from("financial_accounts")
      .select(
        `id, account_name, institution_name, account_type,
         client:clients(full_name),
         holdings(valuation, investment_products(product_type))`,
      )
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("liabilities")
      .select(`id, name, liability_type, outstanding_amount, maturity_date, client:clients(full_name)`)
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("wealth_goals")
      .select(`id, name, target_amount, current_amount, target_date, client:clients(full_name)`)
      .eq("organization_id", organizationId)
      .eq("status", "active"),
  ]);

  if (accountsRes.error) throw accountsRes.error;
  if (liabilitiesRes.error) throw liabilitiesRes.error;
  if (goalsRes.error) throw goalsRes.error;

  type RawAccount = {
    id: string;
    account_name: string | null;
    institution_name: string | null;
    account_type: string;
    client: { full_name: string } | null;
    holdings: { valuation: number | null; investment_products: { product_type: string } | null }[];
  };
  const accountRows = (accountsRes.data ?? []) as unknown as RawAccount[];

  const allocationMap = new Map<string, number>();
  const accounts = accountRows.map((row) => {
    const balance = (row.holdings ?? []).reduce((sum, h) => {
      const value = Number(h.valuation ?? 0);
      const type = h.investment_products?.product_type ?? "Outros";
      allocationMap.set(type, (allocationMap.get(type) ?? 0) + value);
      return sum + value;
    }, 0);

    return {
      id: row.id,
      accountName: row.account_name,
      institutionName: row.institution_name,
      accountType: row.account_type,
      balance,
      clientName: row.client?.full_name ?? null,
    };
  });

  const totalAssets = accounts.reduce((sum, a) => sum + a.balance, 0);

  type RawLiability = {
    id: string;
    name: string;
    liability_type: string | null;
    outstanding_amount: number | null;
    maturity_date: string | null;
    client: { full_name: string } | null;
  };
  const liabilityRows = (liabilitiesRes.data ?? []) as unknown as RawLiability[];
  const liabilities = liabilityRows.map((row) => ({
    id: row.id,
    name: row.name,
    liabilityType: row.liability_type,
    outstandingAmount: row.outstanding_amount,
    maturityDate: row.maturity_date,
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
    client: { full_name: string } | null;
  };
  const goalRows = (goalsRes.data ?? []) as unknown as RawGoal[];
  const goals = goalRows.map((row) => ({
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    targetDate: row.target_date,
    clientName: row.client?.full_name ?? null,
  }));

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    allocation: Array.from(allocationMap.entries()).map(([productType, value]) => ({
      productType,
      value,
    })),
    accounts,
    liabilities,
    goals,
  };
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
