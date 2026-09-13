import type { ClientProfile } from "@/lib/data/clients";

export type ClientAlert = {
  id: string;
  severity: "danger" | "warning" | "info";
  message: string;
};

const DAY_MS = 1000 * 60 * 60 * 24;

export function isTaskOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < Date.now();
}

/**
 * Todos os alertas aqui são derivados de dado real já carregado no
 * ClientProfile — nenhum número ou condição inventada.
 */
export function computeClientAlerts(client: ClientProfile): ClientAlert[] {
  const alerts: ClientAlert[] = [];
  const now = Date.now();

  if (client.documents.length === 0) {
    alerts.push({
      id: "no-documents",
      severity: "warning",
      message: "Nenhum documento cadastrado para este cliente.",
    });
  }

  const overdueTasks = client.tasks.filter(
    (t) => t.status !== "done" && t.due_at && new Date(t.due_at).getTime() < now,
  );
  if (overdueTasks.length > 0) {
    alerts.push({
      id: "overdue-tasks",
      severity: "danger",
      message: `${overdueTasks.length} ${overdueTasks.length === 1 ? "tarefa atrasada" : "tarefas atrasadas"}.`,
    });
  }

  const lastInteraction = [...client.interactions].sort((a, b) =>
    b.occurred_at.localeCompare(a.occurred_at),
  )[0];
  if (!lastInteraction) {
    alerts.push({
      id: "no-contact",
      severity: "warning",
      message: "Nenhum contato registrado com este cliente ainda.",
    });
  } else if (now - new Date(lastInteraction.occurred_at).getTime() > 90 * DAY_MS) {
    alerts.push({
      id: "stale-contact",
      severity: "warning",
      message: "Mais de 90 dias sem contato registrado.",
    });
  }

  const stalledOpportunities = client.opportunities.filter(
    (o) =>
      o.status !== "won" &&
      o.status !== "lost" &&
      o.expected_close_date &&
      new Date(o.expected_close_date).getTime() < now,
  );
  if (stalledOpportunities.length > 0) {
    alerts.push({
      id: "stalled-opportunities",
      severity: "warning",
      message: `${stalledOpportunities.length} ${stalledOpportunities.length === 1 ? "oportunidade parada" : "oportunidades paradas"} (previsão de fechamento já passou).`,
    });
  }

  const upcomingGoals = client.wealth_goals.filter((g) => {
    if (g.status !== "active" || !g.target_date) return false;
    if (g.target_amount && g.current_amount >= g.target_amount) return false;
    const daysUntil = (new Date(g.target_date).getTime() - now) / DAY_MS;
    return daysUntil >= 0 && daysUntil <= 60;
  });
  if (upcomingGoals.length > 0) {
    alerts.push({
      id: "upcoming-goals",
      severity: "info",
      message: `${upcomingGoals.length} ${upcomingGoals.length === 1 ? "meta com prazo" : "metas com prazo"} nos próximos 60 dias.`,
    });
  }

  const missingFields = [
    !client.email && "e-mail",
    !client.phone && "telefone",
    !client.document_number && "documento",
  ].filter(Boolean);
  if (missingFields.length > 0) {
    alerts.push({
      id: "missing-fields",
      severity: "info",
      message: `Cadastro incompleto: falta ${missingFields.join(", ")}.`,
    });
  }
  if (now - new Date(client.updated_at).getTime() > 180 * DAY_MS) {
    alerts.push({
      id: "stale-profile",
      severity: "info",
      message: "Dados cadastrais não atualizados há mais de 180 dias.",
    });
  }

  return alerts;
}
