"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

/** Ações do próprio usuário sobre as próprias notificações (RLS garante). */

export async function markNotificationRead(id: string) {
  const { userId } = await requireActiveMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId).is("read_at", null);
  if (error) throw error;
  revalidatePath("/notificacoes");
}

export async function markNotificationUnread(id: string) {
  const { userId } = await requireActiveMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read_at: null }).eq("id", id).eq("user_id", userId);
  if (error) throw error;
  revalidatePath("/notificacoes");
}

export async function markAllNotificationsRead() {
  const { userId } = await requireActiveMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  if (error) throw error;
  revalidatePath("/notificacoes");
}

export async function deleteReadNotifications() {
  const { userId } = await requireActiveMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").delete().eq("user_id", userId).not("read_at", "is", null);
  if (error) throw error;
  revalidatePath("/notificacoes");
}

/** Usado pelo sino ao abrir e ao receber aviso em tempo real. */
export async function fetchNotificationSummary() {
  const { userId } = await requireActiveMembership();
  const { getNotificationSummary } = await import("@/lib/data/notifications");
  return getNotificationSummary(userId);
}

/** Zerar: apaga TODAS as notificações do próprio usuário (lidas e não lidas). */
export async function clearAllNotifications() {
  const { userId } = await requireActiveMembership();
  const supabase = await createClient();
  // Resumos do dia ficam como lidos (senão seriam recriados e o contador voltaria);
  // todo o resto é apagado.
  const now = new Date().toISOString();
  const { error: readError } = await supabase.from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
  if (readError) throw readError;
  const withoutKey = await supabase.from("notifications").delete().eq("user_id", userId).is("dedupe_key", null);
  if (withoutKey.error) throw withoutKey.error;
  const withKey = await supabase.from("notifications").delete().eq("user_id", userId).not("dedupe_key", "like", "resumo:%");
  if (withKey.error) throw withKey.error;
  revalidatePath("/notificacoes");
}
