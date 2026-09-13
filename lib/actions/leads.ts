"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function updateLeadStatus(leadId: string, status: string, lostReason?: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const updates: Record<string, unknown> = { status };
  if (status === "Perdido") {
    updates.lost_reason = lostReason || null;
    updates.lost_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", leadId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

export async function updateLeadProfile(
  leadId: string,
  input: {
    source: string | null;
    interest: string | null;
    productInterest: string | null;
    estimatedNetWorth: number | null;
    objective: string | null;
  },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({
      source: input.source || null,
      interest: input.interest || null,
      product_interest: input.productInterest || null,
      estimated_net_worth: input.estimatedNetWorth,
      objective: input.objective || null,
    })
    .eq("id", leadId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath(`/leads/${leadId}`);
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
  revalidatePath("/leads");
}

export async function createLeadNote(leadId: string, input: { title: string; content: string }) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("notes").insert({
    organization_id: organizationId,
    lead_id: leadId,
    user_id: userId,
    title: input.title || null,
    content: input.content,
    is_private: false,
  });

  if (error) throw error;

  revalidatePath(`/leads/${leadId}`);
}

export async function convertLeadToClient(leadId: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, name, email, phone, assigned_advisor_id, converted_client_id")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (leadError) throw leadError;
  if (!lead) throw new Error("Lead não encontrado.");

  // Evita duplicação: se já foi convertido antes, retorna o cliente existente.
  if (lead.converted_client_id) {
    return lead.converted_client_id;
  }

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
    .update({
      converted_client_id: client.id,
      status: "Convertido",
      converted_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updateError) throw updateError;

  // Preserva as oportunidades já associadas ao lead, migrando-as pro
  // cliente recém-criado — nunca perdidas na conversão.
  const { error: opportunitiesError } = await supabase
    .from("opportunities")
    .update({ client_id: client.id })
    .eq("lead_id", leadId)
    .is("client_id", null);

  if (opportunitiesError) throw opportunitiesError;

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/clientes");

  return client.id as string;
}
