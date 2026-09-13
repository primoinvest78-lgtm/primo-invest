import { createClient } from "@/lib/supabase/server";

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  priority: string;
  status: string;
  clientId: string | null;
  clientName: string | null;
  opportunityId: string | null;
  opportunityTitle: string | null;
  leadId: string | null;
  leadName: string | null;
};

export type MyTasks = {
  overdue: TaskItem[];
  today: TaskItem[];
  upcoming: TaskItem[];
};

type RawTask = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: string;
  status: string;
  client: { id: string; full_name: string } | null;
  opportunity: { id: string; title: string } | null;
  lead: { id: string; name: string } | null;
};

export async function getMyTasks(organizationId: string, userId: string): Promise<MyTasks> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `id, title, description, due_at, priority, status,
       client:clients(id, full_name),
       opportunity:opportunities(id, title),
       lead:leads(id, name)`,
    )
    .eq("organization_id", organizationId)
    .neq("status", "done")
    .or(`assigned_to.eq.${userId},assigned_to.is.null`)
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawTask[];
  const items: TaskItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    priority: row.priority,
    status: row.status,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
    opportunityId: row.opportunity?.id ?? null,
    opportunityTitle: row.opportunity?.title ?? null,
    leadId: row.lead?.id ?? null,
    leadName: row.lead?.name ?? null,
  }));

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const overdue: TaskItem[] = [];
  const today: TaskItem[] = [];
  const upcoming: TaskItem[] = [];

  for (const item of items) {
    if (!item.dueAt) {
      upcoming.push(item);
      continue;
    }
    const due = new Date(item.dueAt);
    if (due < startOfToday) overdue.push(item);
    else if (due < startOfTomorrow) today.push(item);
    else upcoming.push(item);
  }

  return { overdue, today, upcoming };
}
