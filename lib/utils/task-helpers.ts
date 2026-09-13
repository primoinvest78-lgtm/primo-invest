import type { TaskItem } from "@/lib/data/tasks";

export const PRIORITY_LABEL: Record<string, string> = {
  low: "Baixa",
  normal: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export const PRIORITY_BADGE_CLASS: Record<string, string> = {
  low: "border-border bg-muted text-muted-foreground",
  normal: "border-accent/30 bg-accent/10 text-accent",
  high: "border-warning/40 bg-warning/15 text-warning",
  urgent: "border-destructive/40 bg-destructive/10 text-destructive",
};

/** Prioridades oferecidas na criação — Alta/Média/Baixa, conforme pedido.
 * "Urgente" continua existindo (dado legado) mas não é mais oferecido
 * como opção nova, pra não conflitar com o padrão de 3 níveis pedido. */
export const CREATABLE_PRIORITIES = ["low", "normal", "high"] as const;

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const TASK_CATEGORIES = [
  { value: "ligacao", label: "Ligação" },
  { value: "reuniao", label: "Reunião" },
  { value: "documentacao", label: "Documentação" },
  { value: "proposta", label: "Proposta" },
  { value: "cobranca", label: "Cobrança" },
  { value: "revisao", label: "Revisão" },
  { value: "follow_up", label: "Follow-up" },
  { value: "outro", label: "Outro" },
] as const;

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  TASK_CATEGORIES.map((c) => [c.value, c.label]),
);

export function isTaskOpen(status: string): boolean {
  return status !== "completed" && status !== "cancelled";
}

export type TaskBucket = "overdue" | "today" | "upcoming" | "completed";

export function classifyTaskBucket(task: TaskItem, now: Date = new Date()): TaskBucket {
  if (!isTaskOpen(task.status)) return "completed";

  if (!task.dueAt) return "upcoming";

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const due = new Date(task.dueAt);
  if (due < startOfToday) return "overdue";
  if (due < startOfTomorrow) return "today";
  return "upcoming";
}

export function taskOrigin(task: TaskItem): string {
  if (task.opportunityId) return "Oportunidade";
  if (task.leadId) return "Lead";
  if (task.consortiumContractId) return "Consórcio";
  if (task.documentId) return "Documento";
  if (task.clientId) return "Cliente";
  return "Direta";
}

export function taskLinkedLabel(task: TaskItem): string | null {
  return (
    task.clientName ??
    task.opportunityTitle ??
    task.leadName ??
    task.consortiumContractLabel ??
    task.documentName ??
    null
  );
}

export function taskLinkedHref(task: TaskItem): string | null {
  if (task.clientId) return `/clientes/${task.clientId}`;
  if (task.opportunityId) return `/oportunidades/${task.opportunityId}`;
  if (task.leadId) return `/leads/${task.leadId}`;
  return null;
}

/**
 * Score de priorização pra "Prioridade de hoje" — combina atraso,
 * prioridade alta, vínculo com cliente, proximidade do prazo e
 * vínculo com oportunidade. Tudo derivado de dado real da tarefa.
 */
export function computeTaskPriorityScore(task: TaskItem, now: Date = new Date()): number {
  let score = 0;

  const bucket = classifyTaskBucket(task, now);
  if (bucket === "overdue") {
    const daysOverdue = task.dueAt ? (now.getTime() - new Date(task.dueAt).getTime()) / 86_400_000 : 0;
    score += 100 + Math.min(daysOverdue, 30);
  } else if (bucket === "today") {
    score += 60;
  } else if (task.dueAt) {
    const daysUntil = (new Date(task.dueAt).getTime() - now.getTime()) / 86_400_000;
    if (daysUntil <= 3) score += 30;
    else if (daysUntil <= 7) score += 15;
  }

  if (task.priority === "urgent") score += 40;
  else if (task.priority === "high") score += 25;

  if (task.clientId) score += 10;
  if (task.opportunityId) score += 8;

  return score;
}
