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
  createdAt: string;
  updatedAt: string | null;
  clientId: string | null;
  clientName: string | null;
  groupNumber: string | null;
  quotaNumber: string | null;
  assetDescription: string | null;
  adminFeePercentage: number | null;
  reserveFundPercentage: number | null;
  insuranceAmount: number | null;
  contemplatedAt: string | null;
  notes: string | null;
};

const CONTRACT_SELECT = `id, administrator_name, contract_number, consortium_type, credit_amount, installment_amount,
       total_installments, paid_installments, status, start_date, end_date, created_at, updated_at,
       group_number, quota_number, asset_description, admin_fee_percentage, reserve_fund_percentage,
       insurance_amount, contemplated_at, notes,
       client:clients!consortium_contracts_client_id_fkey(id, full_name)`;

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
  created_at: string;
  updated_at: string | null;
  group_number: string | null;
  quota_number: string | null;
  asset_description: string | null;
  admin_fee_percentage: number | null;
  reserve_fund_percentage: number | null;
  insurance_amount: number | null;
  contemplated_at: string | null;
  notes: string | null;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
    groupNumber: row.group_number,
    quotaNumber: row.quota_number,
    assetDescription: row.asset_description,
    adminFeePercentage: row.admin_fee_percentage,
    reserveFundPercentage: row.reserve_fund_percentage,
    insuranceAmount: row.insurance_amount,
    contemplatedAt: row.contemplated_at,
    notes: row.notes,
  };
}

export async function getConsortiumContracts(organizationId: string): Promise<ConsortiumContract[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consortium_contracts")
    .select(CONTRACT_SELECT)
    .eq("organization_id", organizationId)
    .order("start_date", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawContract[];
  return rows.map(mapContract);
}

export async function getConsortiumContractDetail(
  organizationId: string,
  contractId: string,
): Promise<ConsortiumContract | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consortium_contracts")
    .select(CONTRACT_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", contractId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapContract(data as unknown as RawContract);
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

export type ConsortiumEvent = {
  id: string;
  eventType: string;
  eventDate: string;
  description: string | null;
  createdAt: string;
};

/**
 * Linha do tempo narrativa do contrato (contemplação, lance, atraso,
 * negociação, etc.) — tabela dedicada a isso no schema. Populada pelas
 * próprias actions do módulo conforme as operações acontecem; nunca
 * retroativamente inventada pra contratos que já existiam antes dessa
 * tabela ter uso real.
 */
export async function getContractEvents(
  organizationId: string,
  contractId: string,
): Promise<ConsortiumEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consortium_events")
    .select(
      `id, event_type, event_date, description, created_at,
       consortium_contracts!inner(organization_id)`,
    )
    .eq("consortium_contract_id", contractId)
    .eq("consortium_contracts.organization_id", organizationId)
    .order("event_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  type Raw = { id: string; event_type: string; event_date: string; description: string | null; created_at: string };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    eventDate: row.event_date,
    description: row.description,
    createdAt: row.created_at,
  }));
}

export type ContractDocument = {
  id: string;
  name: string;
  documentType: string | null;
  status: string;
  createdAt: string;
  fileSize: number | null;
  versionCount: number;
  storagePaths: string[];
};

export async function getContractDocuments(
  organizationId: string,
  contractId: string,
): Promise<ContractDocument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, name, document_type, status, created_at, document_versions(file_size, storage_path)")
    .eq("organization_id", organizationId)
    .eq("consortium_contract_id", contractId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  type Raw = {
    id: string;
    name: string;
    document_type: string | null;
    status: string;
    created_at: string;
    document_versions: { file_size: number | null; storage_path: string }[];
  };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    documentType: row.document_type,
    status: row.status,
    createdAt: row.created_at,
    fileSize: row.document_versions[0]?.file_size ?? null,
    versionCount: row.document_versions.length,
    storagePaths: row.document_versions.map((v) => v.storage_path),
  }));
}

export type ContractAuditEntry = {
  id: string;
  action: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  userId: string | null;
  createdAt: string;
};

/**
 * Registro técnico automático (trigger `trg_audit_consortium_contracts`
 * já existente no banco) — cada INSERT/UPDATE/DELETE em
 * consortium_contracts já cai aqui sozinho, sem a action precisar
 * escrever nada. Complementa (não substitui) a linha do tempo
 * narrativa de consortium_events.
 */
export async function getContractAuditEntries(
  organizationId: string,
  contractId: string,
): Promise<ContractAuditEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, old_data, new_data, user_id, created_at")
    .eq("organization_id", organizationId)
    .eq("table_name", "consortium_contracts")
    .eq("record_id", contractId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  type Raw = {
    id: string;
    action: string;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    user_id: string | null;
    created_at: string;
  };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    oldData: row.old_data,
    newData: row.new_data,
    userId: row.user_id,
    createdAt: row.created_at,
  }));
}

export type InstallmentAdjustmentEvent = {
  id: string;
  eventType: "adjustment" | "negotiation";
  eventDate: string;
  createdAt: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  contractId: string;
  contractLabel: string;
  clientId: string | null;
  clientName: string | null;
};

/**
 * Reajustes e negociações de parcela — registrados como eventos em
 * consortium_events (event_type "adjustment"/"negotiation"), nunca uma
 * tabela nova. Preserva a condição original: o metadata de cada evento
 * guarda o valor/vencimento anterior, o installments.amount/due_date
 * atual só reflete o estado corrente.
 */
export async function getConsortiumAdjustmentEvents(
  organizationId: string,
): Promise<InstallmentAdjustmentEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consortium_events")
    .select(
      `id, event_type, event_date, description, metadata, created_at,
       consortium_contracts!inner(id, administrator_name, contract_number, organization_id,
         client:clients(id, full_name))`,
    )
    .in("event_type", ["adjustment", "negotiation"])
    .eq("consortium_contracts.organization_id", organizationId)
    .order("event_date", { ascending: false });

  if (error) throw error;

  type Raw = {
    id: string;
    event_type: string;
    event_date: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
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
    eventType: row.event_type as "adjustment" | "negotiation",
    eventDate: row.event_date,
    createdAt: row.created_at,
    description: row.description,
    metadata: row.metadata,
    contractId: row.consortium_contracts.id,
    contractLabel: [row.consortium_contracts.administrator_name, row.consortium_contracts.contract_number]
      .filter(Boolean)
      .join(" · "),
    clientId: row.consortium_contracts.client?.id ?? null,
    clientName: row.consortium_contracts.client?.full_name ?? null,
  }));
}
