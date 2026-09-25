"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { AccessMatrix } from "@/components/admin/access-matrix";
import { AdminAlerts } from "@/components/admin/admin-alerts";
import { AdminCharts } from "@/components/admin/admin-charts";
import { AdminKpis } from "@/components/admin/admin-kpis";
import { AuditCenter } from "@/components/admin/audit-center";
import { CompanySettingsForm, type OrganizationInfo } from "@/components/admin/company-settings-form";
import { NotificationsOverview } from "@/components/admin/notifications-overview";
import { PermissionGrid } from "@/components/admin/permission-grid";
import { RecentActivity } from "@/components/admin/recent-activity";
import { RolesOverview } from "@/components/admin/roles-overview";
import { SecurityOverview } from "@/components/admin/security-overview";
import { UsersTable } from "@/components/admin/users-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminDashboardData, RolePermissionGrant } from "@/lib/admin/types";

export function AdminShell({
  dashboardData,
  activityTrend,
  byModule,
  addedByNames,
  grants,
  organization,
  notificationsCount,
  canManage,
}: {
  dashboardData: AdminDashboardData;
  activityTrend: { day: string; total: number }[];
  byModule: { module: string; total: number }[];
  addedByNames: Map<string, string>;
  grants: RolePermissionGrant[];
  organization: OrganizationInfo;
  notificationsCount: number;
  canManage: boolean;
}) {
  // ?aba=usuarios (etc.) abre direto na aba — permite link para "Adicionar usuário".
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => {
    const aba = searchParams.get("aba");
    return aba && ["dashboard", "usuarios", "perfis", "auditoria", "configuracoes"].includes(aba) ? aba : "dashboard";
  });
  const [auditUserId, setAuditUserId] = useState<string | null>(null);

  function goToUserActivity(userId: string) {
    setAuditUserId(userId);
    setTab("auditoria");
  }

  return (
    <Tabs value={tab} onValueChange={(v) => v && setTab(String(v))}>
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        <TabsTrigger value="perfis">Perfis e permissões</TabsTrigger>
        <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="mt-5 space-y-6">
        <AdminKpis
          data={dashboardData}
          onGoToUsers={() => setTab("usuarios")}
          onGoToAlerts={() => document.getElementById("admin-alerts")?.scrollIntoView({ behavior: "smooth" })}
          onGoToActivity={() => setTab("auditoria")}
        />
        <div id="admin-alerts">
          <AdminAlerts alerts={dashboardData.alerts} />
        </div>
        <AdminCharts countsByRole={dashboardData.countsByRole} activityTrend={activityTrend} byModule={byModule} onGoToTab={setTab} />
        <RecentActivity entries={dashboardData.recentActivity} members={dashboardData.members} />
      </TabsContent>

      <TabsContent value="usuarios" className="mt-5">
        <UsersTable
          members={dashboardData.members}
          addedByNames={addedByNames}
          canManage={canManage}
          onViewActivities={goToUserActivity}
        />
      </TabsContent>

      <TabsContent value="perfis" className="mt-5 space-y-6">
        <RolesOverview members={dashboardData.members} />
        <AccessMatrix />
        <PermissionGrid grants={grants} canManage={canManage} />
      </TabsContent>

      <TabsContent value="auditoria" className="mt-5">
        <AuditCenter key={auditUserId ?? "none"} members={dashboardData.members} initialUserId={auditUserId} />
      </TabsContent>

      <TabsContent value="configuracoes" className="mt-5 space-y-6">
        <CompanySettingsForm organization={organization} canManage={canManage} />
        <NotificationsOverview totalNotifications={notificationsCount} />
        <SecurityOverview />
      </TabsContent>
    </Tabs>
  );
}
