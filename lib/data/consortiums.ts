import { createClient } from "@/lib/supabase/server";

export type ConsortiumContract = {
  id: string;
  administratorName: string | null;
  contractNumber: string | null;
  consortiumType: string | null;
  creditAmount: number | null;
  installmentAmount: number | null;
  totalInstallments: number;
  paidInstallments: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  clientId: string | null;
  clientName: string | null;
};

type RawContract = {
  id: string;
  administrator_name: string | null;
  contract_number: string | null;
  consortium_type: string | null;
  credit_amount: number | null;
  installment_amount: number | null;
  total_installments: number;
  paid_installments: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  client: { id: string; full_name: string } | null;
};

function mapContract(row: RawContract): ConsortiumContract {
  return {
    id: row.id,
    administratorName: row.administrator_name,
    contractNumber: row.contract_number,
    consortiumType: row.consortium_type,
    creditAmount: row.credit_amount,
    installmentAmount: row.installment_amount,
    totalInstallments: row.total_installments,
    paidInstallments: row.paid_installments,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
  };
}

export async function getConsortiumContracts(organizationId: string): Promise<ConsortiumContract[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consortium_contracts")
    .select(
      `id, administrator_name, contract_number, consortium_type, credit_amount, installment_amount,
       total_installments, paid_installments, status, start_date, end_date,
       client:clients(id, full_name)`,
    )
    .eq("organization_id", organizationId)
    .order("start_date", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawContract[];
  return rows.map(mapContract);
}

export type ConsortiumsOverview = {
  contracts: ConsortiumContract[];
  activeCount: number;
  totalCreditAmount: number;
  avgTermMonths: number | null;
  openInstallmentsCount: number;
  openInstallmentsValue: number;
};

export async function getConsortiumsOverview(organizationId: string): Promise<ConsortiumsOverview> {
  const contracts = await getConsortiumContracts(organizationId);
  const active = contracts.filter((c) => c.status === "active");

  const totalCreditAmount = active.reduce((sum, c) => sum + Number(c.creditAmount ?? 0), 0);
  const avgTermMonths =
    active.length > 0
      ? Math.round(active.reduce((sum, c) => sum + c.totalInstallments, 0) / active.length)
      : null;

  const openInstallmentsCount = active.reduce(
    (sum, c) => sum + Math.max(c.totalInstallments - c.paidInstallments, 0),
    0,
  );
  const openInstallmentsValue = active.reduce(
    (sum, c) => sum + Math.max(c.totalInstallments - c.paidInstallments, 0) * Number(c.installmentAmount ?? 0),
    0,
  );

  return {
    contracts,
    activeCount: active.length,
    totalCreditAmount,
    avgTermMonths,
    openInstallmentsCount,
    openInstallmentsValue,
  };
}

export type ConsortiumInstallment = {
  id: string;
  installmentNumber: number;
  dueDate: string | null;
  amount: number | null;
  paidAmount: number | null;
  paidAt: string | null;
  status: string;
  contractId: string;
  contractLabel: string;
  clientId: string | null;
  clientName: string | null;
};

export async function getConsortiumInstallments(organizationId: string): Promise<ConsortiumInstallment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consortium_installments")
    .select(
      `id, installment_number, due_date, amount, paid_amount, paid_at, status,
       consortium_contracts!inner(id, administrator_name, contract_number, organization_id,
         client:clients(id, full_name))`,
    )
    .eq("consortium_contracts.organization_id", organizationId)
    .order("due_date", { ascending: true });

  if (error) throw error;

  type Raw = {
    id: string;
    installment_number: number;
    due_date: string | null;
    amount: number | null;
    paid_amount: number | null;
    paid_at: string | null;
    status: string;
    consortium_contracts: {
      id: string;
      administrator_name: string | null;
      contract_number: string | null;
      client: { id: string; full_name: string } | null;
    };
  };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    installmentNumber: row.installment_number,
    dueDate: row.due_date,
    amount: row.amount,
    paidAmount: row.paid_amount,
    paidAt: row.paid_at,
    status: row.status,
    contractId: row.consortium_contracts.id,
    contractLabel: [row.consortium_contracts.administrator_name, row.consortium_contracts.contract_number]
      .filter(Boolean)
      .join(" · "),
    clientId: row.consortium_contracts.client?.id ?? null,
    clientName: row.consortium_contracts.client?.full_name ?? null,
  }));
}

export type ConsortiumBid = {
  id: string;
  bidType: string | null;
  bidAmount: number | null;
  bidPercentage: number | null;
  bidDate: string | null;
  result: string;
  notes: string | null;
  contractId: string;
  contractLabel: string;
  clientId: string | null;
  clientName: string | null;
};

export async function getConsortiumBids(organizationId: string): Promise<ConsortiumBid[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consortium_bids")
    .select(
      `id, bid_type, bid_amount, bid_percentage, bid_date, result, notes,
       consortium_contracts!inner(id, administrator_name, contract_number, organization_id,
         client:clients(id, full_name))`,
    )
    .eq("consortium_contracts.organization_id", organizationId)
    .order("bid_date", { ascending: false });

  if (error) throw error;

  type Raw = {
    id: string;
    bid_type: string | null;
    bid_amount: number | null;
    bid_percentage: number | null;
    bid_date: string | null;
    result: string;
    notes: string | null;
    consortium_contracts: {
      id: string;
      administrator_name: string | null;
      contract_number: string | null;
      client: { id: string; full_name: string } | null;
    };
  };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    bidType: row.bid_type,
    bidAmount: row.bid_amount,
    bidPercentage: row.bid_percentage,
    bidDate: row.bid_date,
    result: row.result,
    notes: row.notes,
    contractId: row.consortium_contracts.id,
    contractLabel: [row.consortium_contracts.administrator_name, row.consortium_contracts.contract_number]
      .filter(Boolean)
      .join(" · "),
    clientId: row.consortium_contracts.client?.id ?? null,
    clientName: row.consortium_contracts.client?.full_name ?? null,
  }));
}
