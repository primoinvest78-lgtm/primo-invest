"use server";

import { revalidatePath } from "next/cache";

import { createTask } from "@/lib/actions/tasks";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";
import type { Insight, InsightPriority } from "@/lib/intelligence/types";

function revalidateIntelligencePaths(clientId: string | null) {
  revalidatePath("/inteligencia");
  if (clientId) revalidatePath(`/inteligencia/${clientId}`);
}

async function logInsightEvent(input: {
  organizationId: string;
  userId: string;
  insightKey: string;
  insightTitle: string;
  sourceModule: string;
  action: "resolved" | "ignored" | "reopened" | "task_created";
  note?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("intelligence_insight_events").insert({
    organization_id: input.organizationId,
    insight_key: input.insightKey,
    insight_title: input.insightTitle,
    source_module: input.sourceModule,
    action: input.action,
    performed_by: input.userId,
    note: input.note ?? null,
  });
  if (error) throw error;
}

export async function resolveInsight(insight: Pick<Insight, "key" | "title" | "sourceModule" | "clientId">) {
  const { organizationId, userId } = await requireActiveMembership();
  await logInsightEvent({
    organizationId,
    userId,
    insightKey: insight.key,
    insightTitle: insight.title,
    sourceModule: insight.sourceModule,
    action: "resolved",
  });
  revalidateIntelligencePaths(insight.clientId);
}

export async function ignoreInsight(insight: Pick<Insight, "key" | "title" | "sourceModule" | "clientId">) {
  const { organizationId, userId } = await requireActiveMembership();
  await logInsightEvent({
    organizationId,
    userId,
    insightKey: insight.key,
    insightTitle: insight.title,
    sourceModule: insight.sourceModule,
    action: "ignored",
  });
  revalidateIntelligencePaths(insight.clientId);
}

export async function reopenInsight(insight: Pick<Insight, "key" | "title" | "sourceModule" | "clientId">) {
  const { organizationId, userId } = await requireActiveMembership();
  await logInsightEvent({
    organizationId,
    userId,
    insightKey: insight.key,
    insightTitle: insight.title,
    sourceModule: insight.sourceModule,
    action: "reopened",
  });
  revalidateIntelligencePaths(insight.clientId);
}

const PRIORITY_TO_TASK: Record<InsightPriority, string> = {
  alta: "high",
  media: "normal",
  baixa: "low",
};

/**
 * Cria uma tarefa real a partir de um insight — reaproveita
 * `createTask` (mesma action usada em Tarefas/Clientes), nunca duplica
 * a lógica de gravação. A criação em si é a ação humana confirmada;
 * fica registrada no log de governança como `task_created`.
 *
 * `insight` carrega os dados ORIGINAIS do insight (pra descrição e pro
 * log de governança) — o que a pessoa edita no diálogo (título/
 * descrição da tarefa em si) vai em `taskTitle`/`taskDescription`,
 * separado, pra nunca sobrescrever o título do insight que gerou a
 * tarefa.
 */
export async function createTaskFromInsight(input: {
  insight: Pick<Insight, "key" | "title" | "sourceModule" | "clientId" | "priority" | "reason">;
  taskTitle: string;
  taskDescription: string;
  dueAt: string | null;
}) {
  const { organizationId, userId } = await requireActiveMembership();

  await createTask({
    title: input.taskTitle,
    description: input.taskDescription,
    dueAt: input.dueAt,
    priority: PRIORITY_TO_TASK[input.insight.priority],
    clientId: input.insight.clientId ?? undefined,
  });

  await logInsightEvent({
    organizationId,
    userId,
    insightKey: input.insight.key,
    insightTitle: input.insight.title,
    sourceModule: input.insight.sourceModule,
    action: "task_created",
  });

  revalidateIntelligencePaths(input.insight.clientId);
  revalidatePath("/tarefas");
}
