import { createClient } from "@/lib/supabase/server";

/**
 * Notificações internas. Cada pessoa só enxerga as próprias (RLS).
 * As notificações para outras pessoas nascem de gatilhos no banco
 * (migration 20260925000000_internal_notifications.sql); aqui ficam a
 * leitura e o resumo pessoal do dia.
 */

export type AppNotification = {
  id: string;
  title: string;
  message: string | null;
  type: string;
  href: string | null;
  severity: "info" | "aviso" | "critico";
  sourceModule: string | null;
  readAt: string | null;
  createdAt: string;
};

type Raw = {
  id: string;
  title: string;
  message: string | null;
  notification_type: string;
  href: string | null;
  severity: AppNotification["severity"];
  source_module: string | null;
  read_at: string | null;
  created_at: string;
};

const SELECT = "id, title, message, notification_type, href, severity, source_module, read_at, created_at";

function map(r: Raw): AppNotification {
  return {
    id: r.id,
    title: r.title,
    message: r.message,
    type: r.notification_type,
    href: r.href,
    severity: r.severity ?? "info",
    sourceModule: r.source_module,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

export async function getNotificationSummary(userId: string, limit = 12): Promise<{ items: AppNotification[]; unread: number }> {
  const supabase = await createClient();
  const [list, count] = await Promise.all([
    supabase.from("notifications").select(SELECT).eq("user_id", userId).order("created_at", { ascending: false }).limit(limit),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
  ]);
  if (list.error) throw list.error;
  return { items: ((list.data ?? []) as Raw[]).map(map), unread: count.count ?? 0 };
}

export async function listNotifications(userId: string, filter: "todas" | "nao-lidas", limit = 200): Promise<AppNotification[]> {
  const supabase = await createClient();
  let q = supabase.from("notifications").select(SELECT).eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (filter === "nao-lidas") q = q.is("read_at", null);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as Raw[]).map(map);
}

/** Data de hoje no fuso de Brasília (AAAA-MM-DD). */
export function todayInBrasilia(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/**
 * Resumo pessoal do dia: tarefas atrasadas e tarefas de hoje atribuídas
 * a você. Criado no máximo uma vez por dia (chave de deduplicação com a
 * data), só quando há algo a avisar.
 */
export async function syncPersonalDigest(organizationId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Limpeza automática: avisos já lidos há mais de 30 dias não acumulam.
  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .lt("read_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
  const today = todayInBrasilia();
  const startOfToday = `${today}T00:00:00-03:00`;
  const startOfTomorrow = new Date(Date.parse(startOfToday) + 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .select("id, due_at, status")
    .eq("organization_id", organizationId)
    .eq("assigned_to", userId)
    .not("status", "in", "(completed,cancelled)")
    .lt("due_at", startOfTomorrow);
  if (error) return;
  const rows = (data ?? []) as { id: string; due_at: string; status: string }[];
  const startMs = Date.parse(startOfToday);
  const overdue = rows.filter((t) => Date.parse(t.due_at) < startMs).length;
  const dueToday = rows.length - overdue;

  const inserts: Record<string, unknown>[] = [];
  if (overdue > 0) {
    inserts.push({
      organization_id: organizationId,
      user_id: userId,
      title: overdue === 1 ? "Você tem 1 tarefa atrasada" : `Você tem ${overdue} tarefas atrasadas`,
      message: "Tarefas com prazo vencido atribuídas a você.",
      notification_type: "resumo_tarefas_atrasadas",
      href: "/tarefas?dueBucket=overdue",
      severity: "aviso",
      source_module: "Tarefas",
      dedupe_key: `resumo:atrasadas:${today}`,
    });
  }
  if (dueToday > 0) {
    inserts.push({
      organization_id: organizationId,
      user_id: userId,
      title: dueToday === 1 ? "1 tarefa vence hoje" : `${dueToday} tarefas vencem hoje`,
      message: "Tarefas atribuídas a você com prazo para hoje.",
      notification_type: "resumo_tarefas_hoje",
      href: "/tarefas?dueBucket=today",
      severity: "info",
      source_module: "Tarefas",
      dedupe_key: `resumo:hoje:${today}`,
    });
  }
  if (inserts.length) {
    await supabase.from("notifications").upsert(inserts, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
  }
}
