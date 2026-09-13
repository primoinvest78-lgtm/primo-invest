import { listLeads } from "@/lib/data/leads";
import { listOpportunitiesByStage } from "@/lib/data/opportunities";
import { listTasks } from "@/lib/data/tasks";
import { getWealthHistory, getWealthOverview } from "@/lib/data/wealth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrencyBRL, formatRelativeTime } from "@/lib/utils/format";
import { computeTodayPriorities } from "@/lib/utils/lead-score";
import { computeOpportunityPriorities, isOpenOpportunity } from "@/lib/utils/opportunity-helpers";
import { classifyTaskBucket, isTaskOpen } from "@/lib/utils/task-helpers";
import type { WealthHistoryPoint } from "@/lib/data/wealth";

/**
 * Componentes de ícone (Lucide) não são serializáveis pela fronteira
 * Server -> Client Component do React — passá-los direto num objeto
 * de dado buscado no servidor derruba a página em produção (React
 * error #441). Por isso o dado do servidor carrega só a chave; quem
 * resolve a chave pro componente real é o Client Component que
 * consome esse dado (ver DASHBOARD_ICONS em dashboard-overview.tsx).
 */
export type DashboardIconKey =
  | "landmark"
  | "briefcase"
  | "users"
  | "trending-up"
  | "folder-kanban"
  | "user-x"
  | "alarm-clock";

export type DashboardKpi = {
  title: string;
  value: string;
  change: string | null;
  delta: number | null;
  icon: DashboardIconKey;
};

export type DashboardAttentionItem = {
  description: string;
  priority: "Alta" | "Média" | "Baixa";
  quantity: number;
  icon: DashboardIconKey;
};

export type DashboardData = {
  greetingName: string | null;
  kpis: DashboardKpi[];
  wealthTrend: WealthHistoryPoint[];
  allocationData: { name: string; value: number }[];
  attentionItems: DashboardAttentionItem[];
  relationshipSummary: { label: string; value: string }[];
  pipelineStages: { name: string; value: string }[];
  goals: { label: string; value: string; target: string; progress: number }[];
  recentActivities: { title: string; time: string }[];
};

export async function getDashboardData(
  organizationId: string,
  userFullName: string | null,
): Promise<DashboardData> {
  const supabase = await createClient();

  const [overview, wealthTrend, stages, tasks, leads, clientsCountRes, activitiesRes] = await Promise.all([
    getWealthOverview(organizationId),
    getWealthHistory(organizationId),
    listOpportunitiesByStage(organizationId),
    listTasks(organizationId),
    listLeads(organizationId),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("interactions")
      .select(
        `interaction_type, subject, occurred_at,
         client:clients(full_name), lead:leads(name), opportunity:opportunities(title)`,
      )
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false })
      .limit(8),
  ]);

  const clientsCount = clientsCountRes.count ?? 0;

  const openOpportunities = stages.flatMap((s) => s.opportunities).filter((o) => isOpenOpportunity(o.status));
  const pipelineValue = openOpportunities.reduce((sum, o) => sum + Number(o.estimatedValue ?? 0), 0);

  let wealthDelta: { change: string; delta: number } | null = null;
  if (wealthTrend.length >= 2) {
    const last = wealthTrend[wealthTrend.length - 1];
    const prev = wealthTrend[wealthTrend.length - 2];
    if (prev.value !== 0) {
      const pct = ((last.value - prev.value) / Math.abs(prev.value)) * 100;
      wealthDelta = { change: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% no mês`, delta: pct };
    }
  }

  const kpis: DashboardKpi[] = [
    {
      title: "Patrimônio líquido",
      value: formatCurrencyBRL(overview.netWorth),
      change: wealthDelta?.change ?? null,
      delta: wealthDelta?.delta ?? null,
      icon: "landmark",
    },
    {
      title: "Investimentos sob gestão",
      value: formatCurrencyBRL(overview.investmentsTotal),
      change: null,
      delta: null,
      icon: "briefcase",
    },
    {
      title: "Clientes",
      value: String(clientsCount),
      change: null,
      delta: null,
      icon: "users",
    },
    {
      title: "Pipeline de oportunidades",
      value: formatCurrencyBRL(pipelineValue),
      change: null,
      delta: null,
      icon: "trending-up",
    },
  ];

  const allocationTotal = overview.allocation.reduce((sum, a) => sum + a.value, 0);
  const allocationData = overview.allocation
    .map((a) => ({ name: a.productType, value: allocationTotal > 0 ? Math.round((a.value / allocationTotal) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);

  const overdueTasks = tasks.filter((t) => classifyTaskBucket(t) === "overdue").length;
  const openTasks = tasks.filter((t) => isTaskOpen(t.status));
  const meetingsToday = openTasks.filter(
    (t) => t.category === "reuniao" && t.dueAt && classifyTaskBucket(t) === "today",
  ).length;

  const opportunityPriorities = computeOpportunityPriorities(openOpportunities);
  const leadPriorities = computeTodayPriorities(leads);
  const qualificationLeads = leads.filter((l) => l.status === "Qualificação").length;

  const attentionItems: DashboardAttentionItem[] = [
    overdueTasks > 0
      ? {
          description: `${overdueTasks} ${overdueTasks === 1 ? "tarefa atrasada" : "tarefas atrasadas"}`,
          priority: "Alta" as const,
          quantity: overdueTasks,
          icon: "folder-kanban",
        }
      : null,
    leadPriorities.noContact.length > 0
      ? {
          description: `${leadPriorities.noContact.length} ${leadPriorities.noContact.length === 1 ? "lead sem contato" : "leads sem contato"}`,
          priority: "Alta" as const,
          quantity: leadPriorities.noContact.length,
          icon: "user-x",
        }
      : null,
    opportunityPriorities.stalled.length > 0
      ? {
          description: `${opportunityPriorities.stalled.length} ${opportunityPriorities.stalled.length === 1 ? "oportunidade parada" : "oportunidades paradas"}`,
          priority: "Média" as const,
          quantity: opportunityPriorities.stalled.length,
          icon: "trending-up",
        }
      : null,
    leadPriorities.stalled.length > 0
      ? {
          description: `${leadPriorities.stalled.length} ${leadPriorities.stalled.length === 1 ? "lead parado" : "leads parados"}`,
          priority: "Baixa" as const,
          quantity: leadPriorities.stalled.length,
          icon: "alarm-clock",
        }
      : null,
  ].filter((item): item is DashboardAttentionItem => item !== null);

  const relationshipSummary = [
    { label: "Clientes ativos", value: String(clientsCount) },
    { label: "Leads em qualificação", value: String(qualificationLeads) },
    { label: "Oportunidades abertas", value: String(openOpportunities.length) },
    { label: "Reuniões hoje", value: String(meetingsToday) },
  ];

  const pipelineStages = stages.map((stage) => ({
    name: stage.name,
    value: formatCurrencyBRL(stage.opportunities.reduce((sum, o) => sum + Number(o.estimatedValue ?? 0), 0)),
  }));

  const goals = overview.goals.slice(0, 4).map((goal) => ({
    label: goal.name,
    value: formatCurrencyBRL(goal.currentAmount),
    target: formatCurrencyBRL(goal.targetAmount),
    progress: goal.targetAmount ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100) : 0,
  }));

  const ACTIVITY_LABEL: Record<string, string> = { call: "Ligação", email: "E-mail", meeting: "Reunião", message: "Mensagem", note: "Anotação", proposal: "Proposta enviada" };
  type ActivityRow = {
    interaction_type: string;
    subject: string | null;
    occurred_at: string;
    client: { full_name: string } | null;
    lead: { name: string } | null;
    opportunity: { title: string } | null;
  };
  const activityRows = (activitiesRes.data ?? []) as unknown as ActivityRow[];
  const recentActivities = activityRows.map((row) => {
    const target = row.client?.full_name ?? row.lead?.name ?? row.opportunity?.title;
    const label = ACTIVITY_LABEL[row.interaction_type] ?? row.interaction_type;
    return {
      title: target ? `${label}${row.subject ? ` — ${row.subject}` : ""} · ${target}` : `${label}${row.subject ? ` — ${row.subject}` : ""}`,
      time: formatRelativeTime(row.occurred_at),
    };
  });

  return {
    greetingName: userFullName ? userFullName.split(" ")[0] : null,
    kpis,
    wealthTrend,
    allocationData,
    attentionItems,
    relationshipSummary,
    pipelineStages,
    goals,
    recentActivities,
  };
}
