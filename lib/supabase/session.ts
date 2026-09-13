import { isAuthBypassEnabled } from "@/lib/dev/auth-bypass";
import { createClient } from "@/lib/supabase/server";

export type ActiveMembership = {
  userId: string;
  organizationId: string;
  role: string;
  fullName: string | null;
  email: string | null;
};

/**
 * Resolve o usuário logado e sua organização ativa (primeiro membership
 * "active"). Lança se não houver sessão ou membership — as rotas do grupo
 * (app) já são protegidas pelo middleware, então isso só dispara em uso
 * indevido (ex.: chamado fora de uma rota autenticada).
 */
export async function requireActiveMembership(): Promise<ActiveMembership> {
  // Ver lib/dev/auth-bypass.ts — só ativa fora de produção e com a env var
  // explícita. Retorna uma membership falsa sem chamar o Supabase.
  if (isAuthBypassEnabled()) {
    return {
      userId: "00000000-0000-0000-0000-000000000000",
      organizationId: "00000000-0000-0000-0000-000000000000",
      role: "admin",
      fullName: "Dev Bypass",
      email: "dev-bypass@local.test",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nenhuma sessão ativa.");
  }

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error || !membership) {
    throw new Error("Usuário sem organização ativa vinculada.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    organizationId: membership.organization_id,
    role: membership.role,
    fullName: profile?.full_name ?? null,
    email: profile?.email ?? user.email ?? null,
  };
}
