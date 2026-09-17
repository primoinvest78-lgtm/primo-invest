"use server";

import { requireActiveMembership } from "@/lib/supabase/session";
import { listAuditLogs, type AuditLogFilters } from "@/lib/data/audit";

/**
 * Wrapper de servidor pra filtro interativo de auditoria — a leitura
 * em si (`listAuditLogs`) já respeita a RLS de `audit_logs`
 * (admin/gestor/compliance, ou quem tiver a permissão granular
 * `audit.read`); aqui só reexpõe pra um Client Component poder chamar.
 */
export async function fetchAuditLogs(filters: AuditLogFilters, page: number) {
  const { organizationId } = await requireActiveMembership();
  return listAuditLogs(organizationId, filters, page);
}
