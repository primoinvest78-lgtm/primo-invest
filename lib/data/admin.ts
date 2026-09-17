import { createClient } from "@/lib/supabase/server";
import { listIntegrations } from "@/lib/data/integrations";
import { countAuditLogsSince } from "@/lib/data/audit";
import type { AppRole, MemberStatus } from "@/lib/admin/roles";
import type { AdminAlert, AdminDashboardData, OrgMember, RolePermissionGrant } from "@/lib/admin/types";

export type { AdminAlert, AdminDashboardData, OrgMember, RolePermissionGrant } from "@/lib/admin/types";
export { memberNameById } from "@/lib/admin/types";

type RawMemberRow = {
  member_id: string;
  user_id: string;
  role: AppRole;
  status: MemberStatus;
  member_created_at: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  last_sign_in_at: string | null;
  invited_at: string | null;
};

/**
 * Lista os membros da organização via `list_organization_members` —
 * `profiles` só permite SELECT da própria linha (RLS), então listar
 * todo mundo precisa passar pela função SECURITY DEFINER (que já
 * checa admin/manager por dentro; se o perfil não tiver acesso, o
 * banco recusa a chamada).
 */
export async function listOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_organization_members", { p_org_id: organizationId });
  if (error) throw error;

  const rows = (data ?? []) as unknown as RawMemberRow[];
  return rows.map((row) => ({
    memberId: row.member_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    memberCreatedAt: row.member_created_at,
    fullName: row.full_name,
    email: row.email,
    isActive: row.is_active,
    lastSignInAt: row.last_sign_in_at,
    invitedAt: row.invited_at,
  }));
}

/** Concessões reais em `role_permissions` — hoje pode vir vazia (nada configurado ainda). */
export async function listRolePermissionGrants(organizationId: string): Promise<RolePermissionGrant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("role_permissions")
    .select("role, permissions(code)")
    .eq("organization_id", organizationId);
  if (error) throw error;

  type Raw = { role: AppRole; permissions: { code: string } | null };
  return ((data ?? []) as unknown as Raw[])
    .filter((r) => r.permissions !== null)
    .map((r) => ({ role: r.role, permissionCode: r.permissions!.code }));
}

/**
 * Monta o painel administrativo a partir das mesmas fontes reais:
 * membros (via RPC), integrações (mesmo leitor do Centro de
 * Integrações) e auditoria (mesma tabela usada na Central de
 * Auditoria) — nenhuma métrica é calculada numa fonte paralela.
 */
export async function getAdminDashboardData(organizationId: string): Promise<AdminDashboardData> {
  const supabase = await createClient();

  const [members, integrations, activityLast7Days, recentRaw] = await Promise.all([
    listOrgMembers(organizationId),
    listIntegrations(organizationId),
    countAuditLogsSince(organizationId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("audit_logs")
      .select("id, user_id, action, table_name, record_id, old_data, new_data, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const counts = { active: 0, inactive: 0, invited: 0 };
  for (const m of members) counts[m.status] += 1;

  const roleCountMap = new Map<AppRole, number>();
  for (const m of members) roleCountMap.set(m.role, (roleCountMap.get(m.role) ?? 0) + 1);
  const countsByRole = Array.from(roleCountMap.entries()).map(([role, total]) => ({ role, total }));

  const alerts: AdminAlert[] = [];

  const problemIntegrations = integrations.filter(
    (i) => i.status === "error" || i.errorRunCount > 0 || i.openAlertCount > 0,
  );
  if (problemIntegrations.length > 0) {
    alerts.push({
      id: "integrations-problem",
      severity: "danger",
      message: `${problemIntegrations.length} ${problemIntegrations.length === 1 ? "integração precisa" : "integrações precisam"} de atenção.`,
    });
  }

  const now = Date.now();
  const staleInvites = members.filter(
    (m) => m.status === "invited" && now - new Date(m.memberCreatedAt).getTime() > 7 * 24 * 60 * 60 * 1000,
  );
  if (staleInvites.length > 0) {
    alerts.push({
      id: "stale-invites",
      severity: "warning",
      message: `${staleInvites.length} ${staleInvites.length === 1 ? "convite está" : "convites estão"} pendente(s) há mais de 7 dias.`,
    });
  }

  const inactiveWithNoSignIn = members.filter((m) => m.status === "active" && !m.lastSignInAt);
  if (inactiveWithNoSignIn.length > 0) {
    alerts.push({
      id: "no-sign-in",
      severity: "info",
      message: `${inactiveWithNoSignIn.length} ${inactiveWithNoSignIn.length === 1 ? "usuário ativo nunca" : "usuários ativos nunca"} acessou a plataforma.`,
    });
  }

  const recentActivity = (recentRaw.data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    action: row.action,
    tableName: row.table_name,
    recordId: row.record_id,
    oldData: row.old_data,
    newData: row.new_data,
    createdAt: row.created_at,
  }));

  return { members, counts, countsByRole, alerts, recentActivity, activityLast7Days };
}

/**
 * "Responsável" por cada vínculo — não existe coluna pra isso em
 * `organization_members` (nunca guardou quem adicionou quem). Em vez
 * de inventar, derivamos do próprio rastro de auditoria: a linha de
 * INSERT em `organization_members` para aquele membro tem o
 * `user_id` de quem executou a ação. Membros criados antes do
 * trigger de auditoria existir (ou fora deste fluxo) ficam sem essa
 * informação — "Não disponível" é a resposta honesta.
 */
export async function getMemberAddedByMap(organizationId: string): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("record_id, user_id, created_at")
    .eq("organization_id", organizationId)
    .eq("table_name", "organization_members")
    .eq("action", "INSERT")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.record_id && row.user_id && !map.has(row.record_id)) {
      map.set(row.record_id, row.user_id);
    }
  }
  return map;
}

export async function getNotificationsCount(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (error) throw error;
  return count ?? 0;
}
