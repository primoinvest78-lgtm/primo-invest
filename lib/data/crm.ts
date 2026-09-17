import { createClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { listOpportunitiesByStage } from "@/lib/data/opportunities";
import { listTasks } from "@/lib/data/tasks";
import { buildCrmSignals, computeCrmKpis, type CrmKpis, type CrmSignalBundle } from "@/lib/crm/signals";

export type CrmHubData = {
  bundle: CrmSignalBundle;
  kpis: CrmKpis;
};

/**
 * Monta o Hub CRM inteiro a partir dos mesmos leitores já usados pelas
 * telas de Leads/Oportunidades/Tarefas/Clientes — não existe uma
 * segunda fonte de verdade pro pipeline ou pro book de clientes, só uma
 * camada que cruza o que essas quatro listagens já calculam.
 */
export async function getCrmHubData(organizationId: string): Promise<CrmHubData> {
  const [leads, stages, tasks, clients] = await Promise.all([
    listLeads(organizationId),
    listOpportunitiesByStage(organizationId),
    listTasks(organizationId),
    listClients(organizationId),
  ]);

  const bundle = buildCrmSignals({ leads, stages, tasks, clients });
  const kpis = computeCrmKpis({ leads, stages, tasks, bundle });

  return { bundle, kpis };
}

export type CrmActivityPoint = { day: string; interactions: number; notes: number };

/**
 * Volume de interações + notas dos últimos 30 dias, direto das tabelas
 * reais (`interactions`, `client_notes`) — mesma fonte que já alimenta
 * a timeline de relacionamento por cliente, só agregada pro book todo.
 */
export async function getCrmActivityTrend(organizationId: string): Promise<CrmActivityPoint[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [{ data: interactions }, { data: notes }] = await Promise.all([
    supabase
      .from("interactions")
      .select("occurred_at")
      .eq("organization_id", organizationId)
      .gte("occurred_at", sinceIso),
    supabase
      .from("notes")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", sinceIso),
  ]);

  const byDay = new Map<string, { interactions: number; notes: number }>();
  for (const row of interactions ?? []) {
    const day = String(row.occurred_at).slice(0, 10);
    const entry = byDay.get(day) ?? { interactions: 0, notes: 0 };
    entry.interactions += 1;
    byDay.set(day, entry);
  }
  for (const row of notes ?? []) {
    const day = String(row.created_at).slice(0, 10);
    const entry = byDay.get(day) ?? { interactions: 0, notes: 0 };
    entry.notes += 1;
    byDay.set(day, entry);
  }

  return Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, v]) => ({ day, interactions: v.interactions, notes: v.notes }));
}
