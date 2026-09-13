import { createClient } from "@/lib/supabase/server";

export { LEAD_STATUSES, OPEN_LEAD_STATUSES, LOST_REASONS, type LeadStatus } from "@/lib/data/lead-statuses";

export type LeadListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  interest: string | null;
  productInterest: string | null;
  estimatedNetWorth: number | null;
  objective: string | null;
  lostReason: string | null;
  createdAt: string;
  convertedAt: string | null;
  assignedAdvisorId: string | null;
  assignedAdvisorName: string | null;
  interactionsCount: number;
  lastInteractionAt: string | null;
  nextTask: { id: string; title: string; dueAt: string | null } | null;
};

type RawLeadListRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  interest: string | null;
  product_interest: string | null;
  estimated_net_worth: number | null;
  objective: string | null;
  lost_reason: string | null;
  created_at: string;
  converted_at: string | null;
  assigned_advisor_id: string | null;
  assigned_advisor: { full_name: string | null } | null;
  interactions: { id: string; occurred_at: string }[];
  tasks: { id: string; title: string; due_at: string | null; status: string }[];
};

const LEAD_LIST_SELECT = `
  id, name, email, phone, source, status, interest, product_interest,
  estimated_net_worth, objective, lost_reason, created_at, converted_at,
  assigned_advisor_id,
  assigned_advisor:profiles!leads_assigned_advisor_id_fkey(full_name),
  interactions(id, occurred_at),
  tasks(id, title, due_at, status)
`;

function mapLeadListRow(row: RawLeadListRow): LeadListItem {
  const pendingTasks = (row.tasks ?? [])
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .sort((a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"));

  const interactions = row.interactions ?? [];
  const lastInteractionAt = interactions.length
    ? [...interactions].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))[0].occurred_at
    : null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    status: row.status,
    interest: row.interest,
    productInterest: row.product_interest,
    estimatedNetWorth: row.estimated_net_worth,
    objective: row.objective,
    lostReason: row.lost_reason,
    createdAt: row.created_at,
    convertedAt: row.converted_at,
    assignedAdvisorId: row.assigned_advisor_id,
    assignedAdvisorName: row.assigned_advisor?.full_name ?? null,
    interactionsCount: interactions.length,
    lastInteractionAt,
    nextTask: pendingTasks[0]
      ? { id: pendingTasks[0].id, title: pendingTasks[0].title, dueAt: pendingTasks[0].due_at }
      : null,
  };
}

export async function listLeads(organizationId: string): Promise<LeadListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_LIST_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawLeadListRow[];
  return rows.map(mapLeadListRow);
}

export type LeadProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  interest: string | null;
  product_interest: string | null;
  estimated_net_worth: number | null;
  objective: string | null;
  lost_reason: string | null;
  lost_at: string | null;
  converted_client_id: string | null;
  converted_at: string | null;
  created_at: string;
  assigned_advisor: { id: string; full_name: string | null } | null;
  interactions: {
    id: string;
    interaction_type: string;
    subject: string | null;
    description: string | null;
    occurred_at: string;
  }[];
  tasks: {
    id: string;
    title: string;
    description: string | null;
    due_at: string | null;
    priority: string;
    status: string;
  }[];
  lead_notes: {
    id: string;
    title: string | null;
    content: string;
    created_at: string;
  }[];
  lead_status_history: {
    id: string;
    from_status: string | null;
    to_status: string;
    created_at: string;
  }[];
};

export async function getLeadProfile(
  organizationId: string,
  leadId: string,
): Promise<LeadProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      assigned_advisor:profiles!leads_assigned_advisor_id_fkey(id, full_name),
      interactions(id, interaction_type, subject, description, occurred_at),
      tasks(id, title, description, due_at, priority, status),
      lead_notes:notes(id, title, content, created_at),
      lead_status_history(id, from_status, to_status, created_at)
    `,
    )
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as LeadProfile | null;
}
