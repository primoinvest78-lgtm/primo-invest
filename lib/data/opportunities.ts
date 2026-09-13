import { createClient } from "@/lib/supabase/server";

export type OpportunityCard = {
  id: string;
  title: string;
  opportunityType: string | null;
  estimatedValue: number | null;
  expectedCloseDate: string | null;
  status: string;
  clientName: string | null;
  leadName: string | null;
};

export type StageColumn = {
  id: string;
  name: string;
  stageKey: string;
  position: number;
  probability: number | null;
  opportunities: OpportunityCard[];
};

type RawOpportunity = {
  id: string;
  title: string;
  opportunity_type: string | null;
  estimated_value: number | null;
  expected_close_date: string | null;
  status: string;
  stage_id: string;
  client: { full_name: string } | null;
  lead: { name: string } | null;
};

export async function listOpportunitiesByStage(organizationId: string): Promise<StageColumn[]> {
  const supabase = await createClient();

  const [stagesRes, oppsRes] = await Promise.all([
    supabase
      .from("opportunity_stages")
      .select("id, name, stage_key, position, probability")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("position"),
    supabase
      .from("opportunities")
      .select(
        `id, title, opportunity_type, estimated_value, expected_close_date, status, stage_id,
         client:clients(full_name), lead:leads(name)`,
      )
      .eq("organization_id", organizationId),
  ]);

  if (stagesRes.error) throw stagesRes.error;
  if (oppsRes.error) throw oppsRes.error;

  const opportunities = (oppsRes.data ?? []) as unknown as RawOpportunity[];

  return (stagesRes.data ?? []).map((stage) => ({
    id: stage.id,
    name: stage.name,
    stageKey: stage.stage_key,
    position: stage.position,
    probability: stage.probability,
    opportunities: opportunities
      .filter((o) => o.stage_id === stage.id)
      .map((o) => ({
        id: o.id,
        title: o.title,
        opportunityType: o.opportunity_type,
        estimatedValue: o.estimated_value,
        expectedCloseDate: o.expected_close_date,
        status: o.status,
        clientName: o.client?.full_name ?? null,
        leadName: o.lead?.name ?? null,
      })),
  }));
}

export type OpportunityProfile = {
  id: string;
  title: string;
  opportunity_type: string | null;
  estimated_value: number | null;
  expected_close_date: string | null;
  status: string;
  notes: string | null;
  loss_reason: string | null;
  stage_id: string;
  client: { id: string; full_name: string } | null;
  lead: { id: string; name: string } | null;
  assigned_advisor: { full_name: string | null } | null;
  opportunity_stages: { name: string; probability: number | null } | null;
  opportunity_activities: {
    id: string;
    activity_type: string;
    description: string | null;
    activity_at: string;
  }[];
};

export async function getOpportunityProfile(
  organizationId: string,
  id: string,
): Promise<OpportunityProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `*,
       client:clients(id, full_name),
       lead:leads(id, name),
       assigned_advisor:profiles!opportunities_assigned_advisor_id_fkey(full_name),
       opportunity_stages(name, probability),
       opportunity_activities(id, activity_type, description, activity_at)`,
    )
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as OpportunityProfile | null;
}
