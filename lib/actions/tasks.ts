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
