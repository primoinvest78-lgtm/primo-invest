import { createClient } from "@/lib/supabase/server";

export type CalendarFeedTokenInfo = {
  token: string;
  createdAt: string;
  lastAccessedAt: string | null;
};

/** O próprio usuário logado enxerga só o seu token — RLS já garante isso. */
export async function getCalendarFeedToken(
  organizationId: string,
  userId: string,
): Promise<CalendarFeedTokenInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_feed_tokens")
    .select("token, created_at, last_accessed_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { token: data.token, createdAt: data.created_at, lastAccessedAt: data.last_accessed_at };
}
