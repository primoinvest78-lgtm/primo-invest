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
