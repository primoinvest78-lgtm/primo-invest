"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

function generateToken(): string {
  return randomBytes(24).toString("hex");
}

/**
 * Gera (ou renova) o link pessoal de assinatura de calendário. Renovar
 * troca o token — o link antigo para de funcionar imediatamente, então
 * é o caminho certo se o usuário suspeitar que o link vazou.
 */
export async function createOrRotateCalendarFeedToken(): Promise<{ token: string }> {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const token = generateToken();
  const { error } = await supabase
    .from("calendar_feed_tokens")
    .upsert(
      { organization_id: organizationId, user_id: userId, token, revoked_at: null, last_accessed_at: null },
      { onConflict: "organization_id,user_id" },
    );

  if (error) throw error;

  revalidatePath("/integracoes");
  return { token };
}

export async function revokeCalendarFeedToken(): Promise<void> {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("calendar_feed_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath("/integracoes");
}
