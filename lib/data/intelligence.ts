import { createClient } from "@/lib/supabase/server";
import { getClientProfile, listClients } from "@/lib/data/clients";
import { getConsortiumContracts, getConsortiumInstallments } from "@/lib/data/consortiums";
import { getClientsWithoutDocuments, getVaultDocuments } from "@/lib/data/documents";
import { listIntegrations } from "@/lib/data/integrations";
import { listLeads } from "@/lib/data/leads";
import { listOpportunitiesByStage } from "@/lib/data/opportunities";
import { listTasks } from "@/lib/data/tasks";
import type { GoalDetail } from "@/lib/data/wealth";
import { getGoalsDetail, getLiabilitiesDetail, getWealthHistory, getWealthOverview } from "@/lib/data/wealth";
import { buildIntelligenceInsights } from "@/lib/intelligence/rules";
import type { Insight, InsightCounts, InsightStatus } from "@/lib/intelligence/types";

type InsightEventRow = {
  insight_key: string;
  action: "resolved" | "ignored" | "reopened" | "task_created";
  performed_at: string;
};

const STATUS_ACTIONS = new Set(["resolved", "ignored", "reopened"]);

/**
 * Status persistido = a ação mais recente (das que mudam status) por
 * `insight_key`. `task_created` fica no log de governança mas não
 * altera status sozinho — criar uma tarefa não resolve o insight.
 */
async function loadInsightStatuses(organizationId: string): Promise<Map<string, InsightStatus>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intelligence_insight_events")
    .select("insight_key, action, performed_at")
    .eq("organization_id", organizationId)
    .in("action", ["resolved", "ignored", "reopened"])
    .order("performed_at", { ascending: true });

  if (error) throw error;

  const statusByKey = new Map<string, InsightStatus>();
  for (const row of (data ?? []) as InsightEventRow[]) {
    if (!STATUS_ACTIONS.has(row.action)) continue;
    const status: InsightStatus = row.action === "resolved" ? "resolvido" : row.action === "ignored" ? "ignorado" : "aberto";
    statusByKey.set(row.insight_key, status);
  }
  return statusByKey;
}

export type IntelligenceData = {
  insights: Insight[];
  counts: InsightCounts;
  goals: GoalDetail[];
};

function countByType(insights: Insight[]): InsightCounts {
  const counts: InsightCounts = { atencao: 0, oportunidade: 0, pendencia: 0, informacao: 0 };
  for (const insight of insights) {
    if (insight.status !== "aberto") continue;
    counts[insight.type] += 1;
  }
  return counts;
}

/**
 * Monta a Central de Inteligência inteira a partir dos mesmos leitores
 * já usados pelas telas de cada módulo — nenhuma segunda fonte de
 * dado. `buildIntelligenceInsights` só interpreta o que essas listas já
 * carregam.
 */
export async function getIntelligenceData(organizationId: string): Promise<IntelligenceData> {
  const [
    leads,
    stages,
    tasks,
    clients,
    goals,
    liabilities,
    installments,
    contracts,
    documents,
    clientsWithoutDocs,
    wealthOverview,
    wealthHistory,
    integrations,
    statusByKey,
  ] = await Promise.all([
    listLeads(organizationId),
    listOpportunitiesByStage(organizationId),
    listTasks(organizationId),
    listClients(organizationId),
    getGoalsDetail(organizationId),
    getLiabilitiesDetail(organizationId),
    getConsortiumInstallments(organizationId),
    getConsortiumContracts(organizationId),
    getVaultDocuments(organizationId),
    getClientsWithoutDocuments(organizationId),
    getWealthOverview(organizationId),
    getWealthHistory(organizationId),
    listIntegrations(organizationId),
    loadInsightStatuses(organizationId),
  ]);

  const rawInsights = buildIntelligenceInsights({
    leads,
    stages,
    tasks,
    clients,
    goals,
    liabilities,
    installments,
    contracts,
    documents,
    clientsWithoutDocs,
    wealthOverview,
    wealthHistory,
    integrations,
  });

  const insights = rawInsights.map((insight) => ({
    ...insight,
    status: statusByKey.get(insight.key) ?? insight.status,
  }));

  return {
    insights,
    counts: countByType(insights),
    goals,
  };
}

/**
 * Fatia cliente-a-cliente da mesma central — reaproveita
 * `getIntelligenceData` (sem recalcular regra nenhuma, nem refazer a
 * busca de metas) e filtra pelo cliente, mais o perfil completo pra
 * preparação de reunião.
 */
export async function getClientIntelligence(organizationId: string, clientId: string) {
  const [data, client] = await Promise.all([
    getIntelligenceData(organizationId),
    getClientProfile(organizationId, clientId),
  ]);

  if (!client) return null;

  const clientInsights = data.insights.filter((i) => i.clientId === clientId);
  const clientGoals = data.goals.filter((g) => g.clientId === clientId);

  return { client, insights: clientInsights, goals: clientGoals };
}
