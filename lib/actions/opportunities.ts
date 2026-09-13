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

export async function createOpportunityForClient(
  clientId: string,
  input: {
    title: string;
    opportunityType: string;
    estimatedValue: number | null;
    product?: string;
    source?: string;
    priority?: string;
  },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: firstStage, error: stageError } = await supabase
    .from("opportunity_stages")
    .select("id")
    .eq("organization_id", organizationId)
    .order("position")
    .limit(1)
    .maybeSingle();

  if (stageError) throw stageError;
  if (!firstStage) throw new Error("Nenhum estágio de oportunidade configurado.");

  const { error } = await supabase.from("opportunities").insert({
    organization_id: organizationId,
    client_id: clientId,
    stage_id: firstStage.id,
    title: input.title,
    opportunity_type: input.opportunityType,
    estimated_value: input.estimatedValue,
    product: input.product || null,
    source: input.source || null,
    priority: input.priority || "normal",
    status: "open",
  });

  if (error) throw error;

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/oportunidades");
}

export async function updateOpportunityProfile(
  opportunityId: string,
  input: {
    product: string | null;
    source: string | null;
    priority: string;
    probability: number | null;
    estimatedValue: number | null;
    expectedCloseDate: string | null;
  },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("opportunities")
    .update({
      product: input.product || null,
      source: input.source || null,
      priority: input.priority,
      probability: input.probability,
      estimated_value: input.estimatedValue,
      expected_close_date: input.expectedCloseDate,
    })
    .eq("id", opportunityId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath(`/oportunidades/${opportunityId}`);
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
