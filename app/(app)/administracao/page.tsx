import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { AdminShell } from "@/components/admin/admin-shell";
import type { OrganizationInfo } from "@/components/admin/company-settings-form";
import { canManageAdmin, canViewAdmin } from "@/lib/admin/permissions";
import {
  getAdminDashboardData,
  getMemberAddedByMap,
  getNotificationsCount,
  listRolePermissionGrants,
  memberNameById,
} from "@/lib/data/admin";
import { getAuditActivityTrend, getAuditByModule } from "@/lib/data/audit";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Centro de Administração e Governança — todo número aqui vem de
 * leitores reais (membros via `list_organization_members`, auditoria
 * de `audit_logs`, permissões de `role_permissions`/`permissions`,
 * integrações do mesmo leitor do Centro de Integrações). Nada é
 * calculado numa fonte paralela nem inventado.
 */
export default async function AdministracaoPage() {
  const { organizationId, role } = await requireActiveMembership();

  if (!canViewAdmin(role)) {
    return (
      <div className="space-y-6">
        <Header />
        <AdminAccessGate />
      </div>
    );
  }

  const supabase = await createClient();
  const [dashboardData, activityTrend, byModule, addedByMap, grants, notificationsCount, orgResult] =
    await Promise.all([
      getAdminDashboardData(organizationId),
      getAuditActivityTrend(organizationId),
      getAuditByModule(organizationId),
      getMemberAddedByMap(organizationId),
      listRolePermissionGrants(organizationId),
      getNotificationsCount(organizationId),
      supabase
        .from("organizations")
        .select("id, name, legal_name, document_number, status, created_at")
        .eq("id", organizationId)
        .single(),
    ]);

  const org = orgResult.data;
  const organization: OrganizationInfo = {
    id: org?.id ?? organizationId,
    name: org?.name ?? "Não disponível",
    legalName: org?.legal_name ?? "Não disponível",
    documentNumber: org?.document_number ?? null,
    status: org?.status ?? "Não disponível",
    createdAt: org?.created_at ?? new Date().toISOString(),
  };

  const addedByNames = new Map<string, string>();
  for (const [memberId, userId] of addedByMap) {
    addedByNames.set(memberId, memberNameById(dashboardData.members, userId));
  }

  return (
    <div className="space-y-6">
      <Header />
      <AdminShell
        dashboardData={dashboardData}
        activityTrend={activityTrend}
        byModule={byModule}
        addedByNames={addedByNames}
        grants={grants}
        organization={organization}
        notificationsCount={notificationsCount}
        canManage={canManageAdmin(role)}
      />
    </div>
  );
}

function Header() {
  return (
    <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
      <div className="min-w-0">
        <p className="text-label font-bold uppercase text-primary">Administração</p>
        <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
          Centro de Administração e Governança
        </h1>
        <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
          Usuários, perfis, permissões e auditoria da organização — controle real, sem simulação.
        </p>
      </div>
    </section>
  );
}
