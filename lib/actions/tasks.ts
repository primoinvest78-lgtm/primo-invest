"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

function revalidateTaskPaths(paths: {
  clientId?: string | null;
  opportunityId?: string | null;
  leadId?: string | null;
}) {
  revalidatePath("/tarefas");
  revalidatePath("/clientes", "layout");
  revalidatePath("/oportunidades", "layout");
  if (paths.clientId) revalidatePath(`/clientes/${paths.clientId}`);
  if (paths.opportunityId) revalidatePath(`/oportunidades/${paths.opportunityId}`);
  if (paths.leadId) revalidatePath(`/leads/${paths.leadId}`);
}

export async function completeTask(
  taskId: string,
  paths: { clientId?: string; opportunityId?: string; leadId?: string } = {},
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ status: "completed" })
    .eq("id", taskId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateTaskPaths(paths);
}

export async function createTask(input: {
  title: string;
  description?: string | null;
  dueAt: string | null;
  priority: string;
  category?: string | null;
  clientId?: string;
  opportunityId?: string;
  leadId?: string;
  consortiumContractId?: string | null;
  documentId?: string | null;
  assignedTo?: string | null;
}) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").insert({
    organization_id: organizationId,
    client_id: input.clientId ?? null,
    opportunity_id: input.opportunityId ?? null,
    lead_id: input.leadId ?? null,
    consortium_contract_id: input.consortiumContractId ?? null,
    document_id: input.documentId ?? null,
    assigned_to: input.assignedTo ?? null,
    title: input.title,
    description: input.description ?? null,
    due_at: input.dueAt,
    priority: input.priority,
    category: input.category ?? null,
    status: "pending",
  });

  if (error) throw error;

  revalidateTaskPaths(input);
}

export async function updateTask(
  taskId: string,
  input: {
    title: string;
    description?: string | null;
    dueAt: string | null;
    priority: string;
    category?: string | null;
    assignedTo?: string | null;
    status?: string;
  },
  paths: { clientId?: string; opportunityId?: string; leadId?: string } = {},
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    title: input.title,
    due_at: input.dueAt,
    priority: input.priority,
  };
  if (input.description !== undefined) updates.description = input.description;
  if (input.category !== undefined) updates.category = input.category;
  if (input.assignedTo !== undefined) updates.assigned_to = input.assignedTo;
  if (input.status !== undefined) updates.status = input.status;

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateTaskPaths(paths);
}

export async function deleteTask(
  taskId: string,
  paths: { clientId?: string; opportunityId?: string; leadId?: string } = {},
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateTaskPaths(paths);
}
