import { createClient } from "@/lib/supabase/server";

export type ClientListItem = {
  id: string;
  fullName: string;
  status: string;
  assignedAdvisorName: string | null;
  tags: { id: string; name: string; color: string | null }[];
  netWorth: number;
  riskProfile: "vigente" | "vencido" | "inexistente";
};

type RawClientListRow = {
  id: string;
  full_name: string;
  status: string;
  assigned_advisor: { full_name: string | null } | null;
  client_tags: { tags: { id: string; name: string; color: string | null } | null }[];
  financial_accounts: { holdings: { valuation: number | null }[] }[];
  consortium_contracts: { credit_amount: number | null; status: string }[];
  client_risk_profiles: { valid_from: string; valid_until: string | null }[];
};

function resolveRiskStatus(
  profiles: { valid_from: string; valid_until: string | null }[],
): "vigente" | "vencido" | "inexistente" {
  if (profiles.length === 0) return "inexistente";
  const latest = [...profiles].sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1))[0];
  if (latest.valid_until && latest.valid_until < new Date().toISOString().slice(0, 10)) {
    return "vencido";
  }
  return "vigente";
}

export async function listClients(organizationId: string): Promise<ClientListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      id, full_name, status,
      assigned_advisor:profiles!clients_assigned_advisor_id_fkey(full_name),
      client_tags(tags(id, name, color)),
      financial_accounts(holdings(valuation)),
      consortium_contracts(credit_amount, status),
      client_risk_profiles(valid_from, valid_until)
    `,
    )
    .eq("organization_id", organizationId)
    .order("full_name");

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawClientListRow[];

  return rows.map((row) => {
    const holdingsTotal = (row.financial_accounts ?? []).reduce(
      (sum, account) =>
        sum + (account.holdings ?? []).reduce((s, h) => s + Number(h.valuation ?? 0), 0),
      0,
    );
    const consortiumTotal = (row.consortium_contracts ?? [])
      .filter((c) => c.status === "active")
      .reduce((sum, c) => sum + Number(c.credit_amount ?? 0), 0);

    return {
      id: row.id,
      fullName: row.full_name,
      status: row.status,
      assignedAdvisorName: row.assigned_advisor?.full_name ?? null,
      tags: (row.client_tags ?? []).flatMap((ct) => (ct.tags ? [ct.tags] : [])),
      netWorth: holdingsTotal + consortiumTotal,
      riskProfile: resolveRiskStatus(row.client_risk_profiles ?? []),
    };
  });
}

export async function getClientProfile(organizationId: string, clientId: string) {
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      assigned_advisor:profiles!clients_assigned_advisor_id_fkey(id, full_name),
      household:households(id, name, description,
        household_members(id, relationship, client:clients(id, full_name))
      ),
      client_contacts(*),
      client_addresses(*),
      client_tags(tags(id, name, color)),
      financial_accounts(*, holdings(*, investment_products(name, product_type))),
      consortium_contracts(*),
      liabilities(*),
      wealth_goals(*, wealth_goal_accounts(*, financial_accounts(account_name))),
      client_risk_profiles(*),
      interactions(*),
      notes(*),
      tasks(*),
      documents(*, document_versions(*)),
      opportunities(*, opportunity_stages(name, position))
    `,
    )
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .maybeSingle();

  if (error) throw error;
  return client;
}
