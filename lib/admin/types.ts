/**
 * Tipos e funções puras do Centro de Administração — sem dependência
 * de servidor, pra poder ser importado de Client Components sem
 * arrastar `createClient`/`next/headers` pro bundle do navegador.
 */

import type { AppRole, MemberStatus } from "@/lib/admin/roles";
import type { AuditLogEntry } from "@/lib/admin/audit-labels";

export type OrgMember = {
  memberId: string;
  userId: string;
  role: AppRole;
  status: MemberStatus;
  memberCreatedAt: string;
  fullName: string | null;
  email: string;
  isActive: boolean;
  lastSignInAt: string | null;
  invitedAt: string | null;
};

export type RolePermissionGrant = { role: AppRole; permissionCode: string };

export type AdminAlert = {
  id: string;
  severity: "danger" | "warning" | "info";
  message: string;
};

export type AdminDashboardData = {
  members: OrgMember[];
  counts: { active: number; inactive: number; invited: number };
  countsByRole: { role: AppRole; total: number }[];
  alerts: AdminAlert[];
  recentActivity: AuditLogEntry[];
  activityLast7Days: number;
};

export function memberNameById(members: OrgMember[], userId: string | null): string {
  if (!userId) return "Sistema";
  const member = members.find((m) => m.userId === userId);
  return member?.fullName ?? member?.email ?? "Usuário removido";
}
