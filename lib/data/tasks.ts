import { createClient } from "@/lib/supabase/server";

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  priority: string;
  status: string;
  category: string | null;
  createdAt: string;
  completedAt: string | null;
  clientId: string | null;
  clientName: string | null;
  opportunityId: string | null;
  opportunityTitle: string | null;
  leadId: string | null;
  leadName: string | null;
  consortiumContractId: string | null;
  consortiumContractLabel: string | null;
  documentId: string | null;
  documentName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
};

type RawTask = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: string;
  status: string;
  category: string | null;
  created_at: string;
  completed_at: string | null;
  client: { id: string; full_name: string } | null;
  opportunity: { id: string; title: string } | null;
  lead: { id: string; name: string } | null;
  consortium_contract: { id: string; administrator_name: string | null; contract_number: string | null } | null;
  document: { id: string; name: string } | null;
  assigned_to_profile: { id: string; full_name: string | null } | null;
};

const TASK_SELECT = `
  id, title, description, due_at, priority, status, category, created_at, completed_at,
  client:clients(id, full_name),
  opportunity:opportunities(id, title),
  lead:leads(id, name),
  consortium_contract:consortium_contracts(id, administrator_name, contract_number),
  document:documents(id, name),
  assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name)
`;

function mapTask(row: RawTask): TaskItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    priority: row.priority,
    status: row.status,
    category: row.category,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
    opportunityId: row.opportunity?.id ?? null,
    opportunityTitle: row.opportunity?.title ?? null,
    leadId: row.lead?.id ?? null,
    leadName: row.lead?.name ?? null,
    consortiumContractId: row.consortium_contract?.id ?? null,
    consortiumContractLabel: row.consortium_contract
      ? [row.consortium_contract.administrator_name, row.consortium_contract.contract_number]
          .filter(Boolean)
          .join(" · ")
      : null,
    documentId: row.document?.id ?? null,
    documentName: row.document?.name ?? null,
    assignedToId: row.assigned_to_profile?.id ?? null,
    assignedToName: row.assigned_to_profile?.full_name ?? null,
  };
}

/**
 * Todas as tarefas da organização (não só as do usuário atual) — o
 * módulo é o centro operacional da equipe, com filtro por responsável
 * pra quem quiser ver só as próprias.
 */
export async function listTasks(organizationId: string): Promise<TaskItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("organization_id", organizationId)
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawTask[];
  return rows.map(mapTask);
}

export type TaskFormOptions = {
  clients: { id: string; fullName: string }[];
  advisors: { id: string; fullName: string }[];
  opportunities: { id: string; title: string }[];
  leads: { id: string; name: string }[];
  consortiumContracts: { id: string; label: string }[];
};

export async function getTaskFormOptions(organizationId: string): Promise<TaskFormOptions> {
  const supabase = await createClient();

  const [clientsRes, advisorsRes, opportunitiesRes, leadsRes, consortiumRes] = await Promise.all([
    supabase.from("clients").select("id, full_name").eq("organization_id", organizationId).order("full_name"),
    supabase
      .from("organization_members")
      .select("profiles!organization_members_user_id_fkey(id, full_name)")
      .eq("organization_id", organizationId),
    supabase
      .from("opportunities")
      .select("id, title")
      .eq("organization_id", organizationId)
      .eq("status", "open")
      .order("title"),
    supabase.from("leads").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase
      .from("consortium_contracts")
      .select("id, administrator_name, contract_number")
      .eq("organization_id", organizationId),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (advisorsRes.error) throw advisorsRes.error;
  if (opportunitiesRes.error) throw opportunitiesRes.error;
  if (leadsRes.error) throw leadsRes.error;
  if (consortiumRes.error) throw consortiumRes.error;

  const advisorRows = (advisorsRes.data ?? []) as unknown as {
    profiles: { id: string; full_name: string | null } | null;
  }[];
  const advisorMap = new Map<string, string>();
  for (const row of advisorRows) {
    if (row.profiles) advisorMap.set(row.profiles.id, row.profiles.full_name ?? "—");
  }

  return {
    clients: (clientsRes.data ?? []).map((c) => ({ id: c.id, fullName: c.full_name })),
    advisors: Array.from(advisorMap.entries()).map(([id, fullName]) => ({ id, fullName })),
    opportunities: (opportunitiesRes.data ?? []).map((o) => ({ id: o.id, title: o.title })),
    leads: (leadsRes.data ?? []).map((l) => ({ id: l.id, name: l.name })),
    consortiumContracts: (consortiumRes.data ?? []).map((c) => ({
      id: c.id,
      label: [c.administrator_name, c.contract_number].filter(Boolean).join(" · ") || "Consórcio",
    })),
  };
}
