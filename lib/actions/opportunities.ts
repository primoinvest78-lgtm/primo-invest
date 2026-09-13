"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function updateOpportunityStage(opportunityId: string, stageId: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("opportunities")
    .update({ stage_id: stageId })
    .eq("id", opportunityId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/oportunidades");
}

export async function createOpportunityActivity(
  opportunityId: string,
  input: { activityType: string; description: string },
) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("opportunity_activities").insert({
    organization_id: organizationId,
    opportunity_id: opportunityId,
    user_id: userId,
    activity_type: input.activityType,
    description: input.description || null,
    activity_at: new Date().toISOString(),
  });

  if (error) throw error;

  revalidatePath(`/oportunidades/${opportunityId}`);
}

export async function markOpportunityWonLost(
  opportunityId: string,
  input: { outcome: "won" | "lost"; lossReason?: string; stageId: string },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("opportunities")
    .update({
      status: input.outcome,
      stage_id: input.stageId,
      loss_reason: input.outcome === "lost" ? (input.lossReason ?? null) : null,
    })
    .eq("id", opportunityId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/oportunidades");
  revalidatePath(`/oportunidades/${opportunityId}`);
}
