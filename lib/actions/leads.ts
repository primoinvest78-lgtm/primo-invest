"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function updateLeadStatus(leadId: string, status: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/leads");
}

export async function createInteraction(
  leadId: string,
  input: { interactionType: string; subject: string; description: string },
) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("interactions").insert({
    organization_id: organizationId,
    lead_id: leadId,
    user_id: userId,
    interaction_type: input.interactionType,
    subject: input.subject || null,
    description: input.description || null,
    occurred_at: new Date().toISOString(),
  });

  if (error) throw error;

  revalidatePath(`/leads/${leadId}`);
}

export async function createLeadTask(
  leadId: string,
  input: { title: string; dueAt: string | null; priority: string },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").insert({
    organization_id: organizationId,
    lead_id: leadId,
    title: input.title,
    due_at: input.dueAt,
    priority: input.priority,
    status: "pending",
  });

  if (error) throw error;

  revalidatePath(`/leads/${leadId}`);
}

export async function convertLeadToClient(leadId: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, name, email, phone, assigned_advisor_id")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (leadError) throw leadError;
  if (!lead) throw new Error("Lead não encontrado.");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      assigned_advisor_id: lead.assigned_advisor_id,
      full_name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: "active",
    })
    .select("id")
    .single();

  if (clientError) throw clientError;

  const { error: updateError } = await supabase
    .from("leads")
    .update({ converted_client_id: client.id, status: "Convertido" })
    .eq("id", leadId);

  if (updateError) throw updateError;

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);

  return client.id;
}
