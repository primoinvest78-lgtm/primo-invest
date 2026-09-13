"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function createClientInteraction(
  clientId: string,
  input: { interactionType: string; subject: string; description: string },
) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("interactions").insert({
    organization_id: organizationId,
    client_id: clientId,
    user_id: userId,
    interaction_type: input.interactionType,
    subject: input.subject || null,
    description: input.description || null,
    occurred_at: new Date().toISOString(),
  });

  if (error) throw error;

  revalidatePath(`/clientes/${clientId}`);
}

export async function createClientNote(
  clientId: string,
  input: { title: string; content: string },
) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("notes").insert({
    organization_id: organizationId,
    client_id: clientId,
    user_id: userId,
    title: input.title || null,
    content: input.content,
    is_private: false,
  });

  if (error) throw error;

  revalidatePath(`/clientes/${clientId}`);
}
