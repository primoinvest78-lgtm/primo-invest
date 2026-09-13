import { createClient } from "@/lib/supabase/server";

export { LEAD_STATUSES, type LeadStatus } from "@/lib/data/lead-statuses";

export type LeadListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  assignedAdvisorName: string | null;
  nextTask: { id: string; title: string; dueAt: string | null } | null;
};

type RawLeadListRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  assigned_advisor: { full_name: string | null } | null;
  tasks: { id: string; title: string; due_at: string | null; status: string }[];
};

export async function listLeads(organizationId: string): Promise<LeadListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      `
      id, name, email, phone, source, status,
      assigned_advisor:profiles!leads_assigned_advisor_id_fkey(full_name),
      tasks(id, title, due_at, status)
    `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawLeadListRow[];

  return rows.map((row) => {
    const pendingTasks = (row.tasks ?? [])
      .filter((t) => t.status !== "done" && t.status !== "cancelled")
      .sort((a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"));

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      source: row.source,
      status: row.status,
      assignedAdvisorName: row.assigned_advisor?.full_name ?? null,
      nextTask: pendingTasks[0]
        ? { id: pendingTasks[0].id, title: pendingTasks[0].title, dueAt: pendingTasks[0].due_at }
        : null,
    };
  });
}

export type LeadProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  converted_client_id: string | null;
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
      tasks(id, title, description, due_at, priority, status)
    `,
    )
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as LeadProfile | null;
}
