import { createClient } from "@/lib/supabase/server";

export type OpportunityCard = {
  id: string;
  stageId: string;
  title: string;
  opportunityType: string | null;
  product: string | null;
  source: string | null;
  priority: string;
  probability: number | null;
  estimatedValue: number | null;
  expectedCloseDate: string | null;
  status: string;
  lossReason: string | null;
  createdAt: string;
  closedAt: string | null;
  clientId: string | null;
  clientName: string | null;
  leadId: string | null;
  leadName: string | null;
  assignedAdvisorId: string | null;
  assignedAdvisorName: string | null;
  nextTask: { id: string; title: string; dueAt: string | null } | null;
  lastActivityAt: string | null;
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
  product: string | null;
  source: string | null;
  priority: string;
  probability: number | null;
  estimated_value: number | null;
  expected_close_date: string | null;
  status: string;
  loss_reason: string | null;
  stage_id: string;
  created_at: string;
  closed_at: string | null;
  client: { id: string; full_name: string } | null;
  lead: { id: string; name: string } | null;
  assigned_advisor: { id: string; full_name: string | null } | null;
  tasks: { id: string; title: string; due_at: string | null; status: string }[];
  opportunity_activities: { id: string; activity_at: string }[];
};

const OPPORTUNITY_SELECT = `
  id, title, opportunity_type, product, source, priority, probability,
  estimated_value, expected_close_date, status, loss_reason, stage_id, created_at, closed_at,
  client:clients(id, full_name),
  lead:leads(id, name),
  assigned_advisor:profiles!opportunities_assigned_advisor_id_fkey(id, full_name),
  tasks(id, title, due_at, status),
  opportunity_activities(id, activity_at)
`;

function mapOpportunity(o: RawOpportunity): OpportunityCard {
  const pendingTasks = (o.tasks ?? [])
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .sort((a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"));

  const activities = o.opportunity_activities ?? [];
  const lastActivityAt = activities.length
    ? [...activities].sort((a, b) => b.activity_at.localeCompare(a.activity_at))[0].activity_at
    : null;

  return {
    id: o.id,
    stageId: o.stage_id,
    title: o.title,
    opportunityType: o.opportunity_type,
    product: o.product,
    source: o.source,
    priority: o.priority,
    probability: o.probability,
    estimatedValue: o.estimated_value,
    expectedCloseDate: o.expected_close_date,
    status: o.status,
    lossReason: o.loss_reason,
    createdAt: o.created_at,
    closedAt: o.closed_at,
    clientId: o.client?.id ?? null,
    clientName: o.client?.full_name ?? null,
    leadId: o.lead?.id ?? null,
    leadName: o.lead?.name ?? null,
    assignedAdvisorId: o.assigned_advisor?.id ?? null,
    assignedAdvisorName: o.assigned_advisor?.full_name ?? null,
    nextTask: pendingTasks[0]
      ? { id: pendingTasks[0].id, title: pendingTasks[0].title, dueAt: pendingTasks[0].due_at }
      : null,
    lastActivityAt,
  };
}

export async function listOpportunitiesByStage(organizationId: string): Promise<StageColumn[]> {
  const supabase = await createClient();

  const [stagesRes, oppsRes] = await Promise.all([
    supabase
      .from("opportunity_stages")
      .select("id, name, stage_key, position, probability")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("position"),
    supabase.from("opportunities").select(OPPORTUNITY_SELECT).eq("organization_id", organizationId),
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
    opportunities: opportunities.filter((o) => o.stage_id === stage.id).map(mapOpportunity),
  }));
}

export type OpportunityProfile = {
  id: string;
  title: string;
  opportunity_type: string | null;
  product: string | null;
  source: string | null;
  priority: string;
  probability: number | null;
  estimated_value: number | null;
  expected_close_date: string | null;
  status: string;
  notes: string | null;
  loss_reason: string | null;
  stage_id: string;
  created_at: string;
  closed_at: string | null;
  client: { id: string; full_name: string } | null;
  lead: { id: string; name: string } | null;
  assigned_advisor: { id: string; full_name: string | null } | null;
  opportunity_stages: { name: string; probability: number | null } | null;
  opportunity_activities: {
    id: string;
    activity_type: string;
    description: string | null;
    activity_at: string;
  }[];
  opportunity_history: {
    id: string;
    event_type: string;
    from_value: string | null;
    to_value: string | null;
    created_at: string;
  }[];
  tasks: {
    id: string;
    title: string;
    description: string | null;
    due_at: string | null;
    priority: string;
    status: string;
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
       assigned_advisor:profiles!opportunities_assigned_advisor_id_fkey(id, full_name),
       opportunity_stages(name, probability),
       opportunity_activities(id, activity_type, description, activity_at),
       opportunity_history(id, event_type, from_value, to_value, created_at),
       tasks(id, title, description, due_at, priority, status)`,
    )
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as OpportunityProfile | null;
}

export type ClientSummary = {
  id: string;
  fullName: string;
  netWorth: number;
  investmentsTotal: number;
  consortiumTotal: number;
  activeGoals: number;
  otherOpportunities: { id: string; title: string; status: string; estimatedValue: number | null }[];
  lastInteractionAt: string | null;
};

export async function getClientSummaryForOpportunity(
  organizationId: string,
  clientId: string,
  currentOpportunityId: string,
): Promise<ClientSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      id, full_name,
      financial_accounts(holdings(valuation)),
      consortium_contracts(credit_amount, status),
      wealth_goals(id, status),
      opportunities(id, title, status, estimated_value),
      interactions(occurred_at)
    `,
    )
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data as unknown as {
    id: string;
    full_name: string;
    financial_accounts: { holdings: { valuation: number | null }[] }[];
    consortium_contracts: { credit_amount: number | null; status: string }[];
    wealth_goals: { id: string; status: string }[];
    opportunities: { id: string; title: string; status: string; estimated_value: number | null }[];
    interactions: { occurred_at: string }[];
  };

  const investmentsTotal = raw.financial_accounts.reduce(
    (sum, account) => sum + account.holdings.reduce((s, h) => s + Number(h.valuation ?? 0), 0),
    0,
  );
  const consortiumTotal = raw.consortium_contracts
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + Number(c.credit_amount ?? 0), 0);
  const activeGoals = raw.wealth_goals.filter((g) => g.status === "active").length;
  const otherOpportunities = raw.opportunities
    .filter((o) => o.id !== currentOpportunityId)
    .map((o) => ({ id: o.id, title: o.title, status: o.status, estimatedValue: o.estimated_value }));
  const lastInteractionAt = raw.interactions.length
    ? [...raw.interactions].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))[0].occurred_at
    : null;

  return {
    id: raw.id,
    fullName: raw.full_name,
    netWorth: investmentsTotal + consortiumTotal,
    investmentsTotal,
    consortiumTotal,
    activeGoals,
    otherOpportunities,
    lastInteractionAt,
  };
}
