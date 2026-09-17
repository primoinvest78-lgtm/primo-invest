"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function addHouseholdMember(
  clientId: string,
  input: { name: string; relationship: string },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, household_id, full_name")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .single();

  if (clientError) throw clientError;

  let householdId = client.household_id as string | null;

  if (!householdId) {
    const { data: household, error: householdError } = await supabase
      .from("households")
      .insert({ organization_id: organizationId, name: `Família ${client.full_name}` })
      .select("id")
      .single();

    if (householdError) throw householdError;
    householdId = household.id;

    const { error: updateError } = await supabase
      .from("clients")
      .update({ household_id: householdId })
      .eq("id", clientId);

    if (updateError) throw updateError;
  }

  const { data: newMember, error: memberClientError } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      household_id: householdId,
      full_name: input.name,
      status: "active",
    })
    .select("id")
    .single();

  if (memberClientError) throw memberClientError;

  const { error: linkError } = await supabase.from("household_members").insert({
    household_id: householdId,
    client_id: newMember.id,
    relationship: input.relationship,
  });

  if (linkError) throw linkError;

  revalidatePath(`/clientes/${clientId}`);
}

export async function updateHouseholdMemberRelationship(
  householdMemberId: string,
  viewingClientId: string,
  relationship: string,
) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("household_members")
    .update({ relationship })
    .eq("id", householdMemberId);

  if (error) throw error;

  revalidatePath(`/clientes/${viewingClientId}`);
}

/**
 * Remove o vínculo do membro com o núcleo familiar (household_members).
 * Não apaga o registro de cliente do membro — só desfaz o vínculo
 * familiar, já que o membro pode existir como cliente independente.
 */
export async function removeHouseholdMember(householdMemberId: string, viewingClientId: string) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("id", householdMemberId);

  if (error) throw error;

  revalidatePath(`/clientes/${viewingClientId}`);
}
