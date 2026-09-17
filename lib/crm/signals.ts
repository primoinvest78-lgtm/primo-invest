/**
 * Motor de sinais do Hub CRM.
 *
 * Não introduz nenhum critério novo de "o que importa" — reaproveita o
 * que já existe e está provado em Leads (`computeTodayPriorities`) e
 * Oportunidades (`computeOpportunityPriorities`), e soma o que faltava:
 * tarefas atrasadas e clientes com perfil de risco pendente. A única
 * coisa nova aqui é MISTURAR os quatro num único feed priorizado — o
 * ponto inteiro do hub é acabar com "checar 4 telas separadas pra saber
 * o que fazer hoje".
 *
 * Todo sinal aponta pro registro de origem (`href`) e carrega só dado
 * já calculado em outro lugar — nada é inventado aqui.
 */

import type { ClientListItem } from "@/lib/data/clients";
import type { LeadListItem } from "@/lib/data/leads";
import type { StageColumn } from "@/lib/data/opportunities";
import type { TaskItem } from "@/lib/data/tasks";
import { computeTodayPriorities, isTaskDueTodayOrOverdue } from "@/lib/utils/lead-score";
import { computeOpportunityPriorities } from "@/lib/utils/opportunity-helpers";

export type CrmSignalKind = "lead" | "opportunity" | "task" | "client";
export type CrmSignalSeverity = "critical" | "warning" | "info";

export type CrmSignal = {
  id: string;
  kind: CrmSignalKind;
  severity: CrmSignalSeverity;
  title: string;
  reason: string;
  href: string;
  ownerName: string | null;
  /** Data usada só pra ordenação (prazo, última atividade etc.) — nunca exibida sozinha sem contexto. */
  sortKey: string;
};

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export type CrmSignalBundle = {
  signals: CrmSignal[];
  countsByKind: Record<CrmSignalKind, number>;
  countsBySeverity: Record<CrmSignalSeverity, number>;
};

export function buildCrmSignals(input: {
  leads: LeadListItem[];
  stages: StageColumn[];
  tasks: TaskItem[];
  clients: ClientListItem[];
}): CrmSignalBundle {
  const signals: CrmSignal[] = [];
  const opportunities = input.stages.flatMap((s) => s.opportunities.map((o) => ({ ...o, stageName: s.name })));

  // ── Leads ──────────────────────────────────────────────────────
  const leadPriorities = computeTodayPriorities(input.leads);

  for (const lead of leadPriorities.withNextAction) {
    signals.push({
      id: `lead-action-${lead.id}`,
      kind: "lead",
      severity: "critical",
      title: lead.name,
      reason: lead.nextTask ? `Tarefa "${lead.nextTask.title}" vence hoje ou já venceu.` : "Ação pendente.",
      href: `/leads/${lead.id}`,
      ownerName: lead.assignedAdvisorName,
      sortKey: lead.nextTask?.dueAt ?? lead.createdAt,
    });
  }

  for (const lead of leadPriorities.hot) {
    if (leadPriorities.withNextAction.some((l) => l.id === lead.id)) continue;
    signals.push({
      id: `lead-hot-${lead.id}`,
      kind: "lead",
      severity: "warning",
      title: lead.name,
      reason: "Lead quente sem tarefa de próximo passo agendada.",
      href: `/leads/${lead.id}`,
      ownerName: lead.assignedAdvisorName,
      sortKey: lead.lastInteractionAt ?? lead.createdAt,
    });
  }

  for (const lead of leadPriorities.stalled.slice(0, 10)) {
    signals.push({
      id: `lead-stalled-${lead.id}`,
      kind: "lead",
      severity: "warning",
      title: lead.name,
      reason: `${daysSince(lead.lastInteractionAt ?? lead.createdAt)} dias sem contato registrado.`,
      href: `/leads/${lead.id}`,
      ownerName: lead.assignedAdvisorName,
      sortKey: lead.lastInteractionAt ?? lead.createdAt,
    });
  }

  // ── Oportunidades ──────────────────────────────────────────────
  const oppPriorities = computeOpportunityPriorities(opportunities);

  for (const opp of oppPriorities.closingSoon) {
    signals.push({
      id: `opp-closing-${opp.id}`,
      kind: "opportunity",
      severity: "critical",
      title: opp.title,
      reason: opp.expectedCloseDate ? `Previsão de fechamento em breve (${opp.expectedCloseDate}).` : "Fechamento próximo.",
      href: `/oportunidades/${opp.id}`,
      ownerName: opp.assignedAdvisorName,
      sortKey: opp.expectedCloseDate ?? opp.createdAt,
    });
  }

  for (const opp of oppPriorities.stalled.slice(0, 10)) {
    signals.push({
      id: `opp-stalled-${opp.id}`,
      kind: "opportunity",
      severity: "warning",
      title: opp.title,
      reason: `${daysSince(opp.lastActivityAt ?? opp.createdAt)} dias sem atividade registrada.`,
      href: `/oportunidades/${opp.id}`,
      ownerName: opp.assignedAdvisorName,
      sortKey: opp.lastActivityAt ?? opp.createdAt,
    });
  }

  // ── Tarefas atrasadas ──────────────────────────────────────────
  const overdueTasks = input.tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled" && isTaskDueTodayOrOverdue(t.dueAt) && t.dueAt,
  );
  for (const task of overdueTasks) {
    const overdue = task.dueAt ? new Date(task.dueAt).getTime() < Date.now() : false;
    signals.push({
      id: `task-${task.id}`,
      kind: "task",
      severity: overdue ? "critical" : "warning",
      title: task.title,
      reason: overdue
        ? `Atrasada — vencia em ${task.dueAt ? new Date(task.dueAt).toLocaleDateString("pt-BR") : "—"}.`
        : "Vence hoje.",
      href: task.clientId ? `/clientes/${task.clientId}` : "/tarefas",
      ownerName: task.assignedToName,
      sortKey: task.dueAt ?? task.createdAt,
    });
  }

  // ── Clientes com pendência de compliance ──────────────────────
  for (const client of input.clients) {
    if (client.status !== "active") continue;
    if (client.riskProfile === "vigente") continue;

    signals.push({
      id: `client-risk-${client.id}`,
      kind: "client",
      severity: client.riskProfile === "vencido" ? "critical" : "warning",
      title: client.fullName,
      reason: client.riskProfile === "vencido" ? "Perfil de risco vencido." : "Sem perfil de risco cadastrado.",
      href: `/clientes/${client.id}`,
      ownerName: client.assignedAdvisorName,
      sortKey: new Date().toISOString(),
    });
  }

  signals.sort((a, b) => {
    const severityOrder: Record<CrmSignalSeverity, number> = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.sortKey < b.sortKey ? -1 : 1;
  });

  const countsByKind: Record<CrmSignalKind, number> = { lead: 0, opportunity: 0, task: 0, client: 0 };
  const countsBySeverity: Record<CrmSignalSeverity, number> = { critical: 0, warning: 0, info: 0 };
  for (const s of signals) {
    countsByKind[s.kind] += 1;
    countsBySeverity[s.severity] += 1;
  }

  return { signals, countsByKind, countsBySeverity };
}

export type CrmKpis = {
  hotLeads: number;
  openOpportunities: number;
  pipelineValue: number;
  overdueTasks: number;
  signalsNeedingAction: number;
};

export function computeCrmKpis(input: {
  leads: LeadListItem[];
  stages: StageColumn[];
  tasks: TaskItem[];
  bundle: CrmSignalBundle;
}): CrmKpis {
  const opportunities = input.stages.flatMap((s) => s.opportunities);
  const open = opportunities.filter((o) => o.status === "open");
  const priorities = computeTodayPriorities(input.leads);
  const overdueTasks = input.tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled" && t.dueAt && new Date(t.dueAt).getTime() < Date.now(),
  );

  return {
    hotLeads: priorities.hot.length,
    openOpportunities: open.length,
    pipelineValue: open.reduce((sum, o) => sum + Number(o.estimatedValue ?? 0), 0),
    overdueTasks: overdueTasks.length,
    signalsNeedingAction: input.bundle.countsBySeverity.critical,
  };
}
