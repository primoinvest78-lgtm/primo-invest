/**
 * Preparação de reunião — só reorganiza campos que `getClientProfile`
 * já carrega (interações, notas, tarefas, oportunidades, metas). Nunca
 * resume em texto corrido nem inventa "assunto da próxima reunião" —
 * isso é papel de uma futura IA (ver `generateMeetingSummary`), aqui só
 * a estrutura factual.
 */

import type { ClientProfile } from "@/lib/data/clients";
import type { GoalDetail } from "@/lib/data/wealth";
import type { Insight } from "@/lib/intelligence/types";
import { computeGoalStatus, progressPct } from "@/lib/utils/goal-helpers";
import { isTaskOpen } from "@/lib/utils/task-helpers";

export type MeetingPreparation = {
  lastInteraction: { occurredAt: string; type: string; subject: string | null } | null;
  daysSinceLastInteraction: number | null;
  openTasks: { id: string; title: string; dueAt: string | null; priority: string }[];
  openOpportunities: { id: string; title: string; stageName: string | null; estimatedValue: number | null }[];
  pendingDocuments: { id: string; title: string; reason: string; href: string }[];
  goals: { id: string; name: string; progressPct: number; atRisk: boolean; targetDate: string | null }[];
  recentNotes: { id: string; title: string | null; content: string; createdAt: string }[];
  recentInteractions: { id: string; type: string; subject: string | null; occurredAt: string }[];
};

export function buildMeetingPreparation(
  client: ClientProfile,
  clientInsights: Insight[],
  goals: GoalDetail[],
): MeetingPreparation {
  const interactionsSorted = [...client.interactions].sort((a, b) =>
    b.occurred_at.localeCompare(a.occurred_at),
  );
  const last = interactionsSorted[0] ?? null;

  return {
    lastInteraction: last
      ? { occurredAt: last.occurred_at, type: last.interaction_type, subject: last.subject }
      : null,
    daysSinceLastInteraction: last
      ? Math.floor((Date.now() - new Date(last.occurred_at).getTime()) / (1000 * 60 * 60 * 24))
      : null,
    openTasks: client.tasks
      .filter((t) => isTaskOpen(t.status))
      .map((t) => ({ id: t.id, title: t.title, dueAt: t.due_at, priority: t.priority })),
    openOpportunities: client.opportunities
      .filter((o) => o.status !== "won" && o.status !== "lost" && o.status !== "cancelled")
      .map((o) => ({
        id: o.id,
        title: o.title,
        stageName: o.opportunity_stages?.name ?? null,
        estimatedValue: o.estimated_value,
      })),
    pendingDocuments: clientInsights
      .filter((i) => i.sourceModule === "documentos")
      .map((i) => ({ id: i.key, title: i.title, reason: i.reason, href: i.sourceHref })),
    goals: goals
      .filter((g) => g.status === "active")
      .map((g) => ({
        id: g.id,
        name: g.name,
        progressPct: progressPct(g),
        atRisk: computeGoalStatus(g) === "em_risco",
        targetDate: g.targetDate,
      })),
    recentNotes: [...client.client_notes]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map((n) => ({ id: n.id, title: n.title, content: n.content, createdAt: n.created_at })),
    recentInteractions: interactionsSorted.slice(0, 5).map((i) => ({
      id: i.id,
      type: i.interaction_type,
      subject: i.subject,
      occurredAt: i.occurred_at,
    })),
  };
}
