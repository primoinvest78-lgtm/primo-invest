"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function completeTask(taskId: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ status: "done" })
    .eq("id", taskId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/tarefas");
  revalidatePath("/clientes", "layout");
  revalidatePath("/oportunidades", "layout");
}

export async function createTask(input: {
  title: string;
  dueAt: string | null;
  priority: string;
  clientId?: string;
  opportunityId?: string;
  leadId?: string;
}) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").insert({
    organization_id: organizationId,
    client_id: input.clientId ?? null,
    opportunity_id: input.opportunityId ?? null,
    lead_id: input.leadId ?? null,
    title: input.title,
    due_at: input.dueAt,
    priority: input.priority,
    status: "pending",
  });

  if (error) throw error;

  revalidatePath("/tarefas");
  if (input.clientId) revalidatePath(`/clientes/${input.clientId}`);
  if (input.opportunityId) revalidatePath(`/oportunidades/${input.opportunityId}`);
  if (input.leadId) revalidatePath(`/leads/${input.leadId}`);
}

export async function updateTask(
  taskId: string,
  input: { title: string; dueAt: string | null; priority: string },
  paths: { clientId?: string; opportunityId?: string; leadId?: string } = {},
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ title: input.title, due_at: input.dueAt, priority: input.priority })
    .eq("id", taskId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/tarefas");
  if (paths.clientId) revalidatePath(`/clientes/${paths.clientId}`);
  if (paths.opportunityId) revalidatePath(`/oportunidades/${paths.opportunityId}`);
  if (paths.leadId) revalidatePath(`/leads/${paths.leadId}`);
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

  revalidatePath("/tarefas");
  if (paths.clientId) revalidatePath(`/clientes/${paths.clientId}`);
  if (paths.opportunityId) revalidatePath(`/oportunidades/${paths.opportunityId}`);
  if (paths.leadId) revalidatePath(`/leads/${paths.leadId}`);
}
