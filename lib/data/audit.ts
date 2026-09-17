import { createClient } from "@/lib/supabase/server";
import { TABLE_MODULE_LABEL, type AuditLogEntry, type AuditLogFilters } from "@/lib/admin/audit-labels";

export {
  TABLE_MODULE_LABEL,
  moduleLabelForTable,
  AUDIT_ACTION_LABEL,
  auditActionLabel,
  type AuditLogEntry,
  type AuditLogFilters,
} from "@/lib/admin/audit-labels";

type RawAuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

function mapAuditLog(row: RawAuditLog): AuditLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    tableName: row.table_name,
    recordId: row.record_id,
    oldData: row.old_data,
    newData: row.new_data,
    createdAt: row.created_at,
  };
}

const PAGE_SIZE = 50;

/**
 * Lista paginada de auditoria — filtra direto no banco. `module` é o
 * rótulo em português; convertido de volta pro conjunto real de
 * tabelas antes de filtrar.
 */
export async function listAuditLogs(
  organizationId: string,
  filters: AuditLogFilters = {},
  page = 0,
): Promise<{ entries: AuditLogEntry[]; hasMore: boolean }> {
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("id, user_id, action, table_name, record_id, old_data, new_data, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);
  if (filters.module) {
    const tables = Object.entries(TABLE_MODULE_LABEL)
      .filter(([, label]) => label === filters.module)
      .map(([table]) => table);
    if (tables.length > 0) query = query.in("table_name", tables);
  }

  const isUuid = filters.search ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.search) : false;
  if (filters.search && isUuid) {
    query = query.eq("record_id", filters.search);
  } else if (filters.search) {
    query = query.ilike("table_name", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as RawAuditLog[];
  const hasMore = rows.length > PAGE_SIZE;
  return { entries: rows.slice(0, PAGE_SIZE).map(mapAuditLog), hasMore };
}

export async function countAuditLogsSince(organizationId: string, sinceIso: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", sinceIso);
  if (error) throw error;
  return count ?? 0;
}

/** Volume de eventos por dia — últimos 14 dias com atividade real. */
export async function getAuditActivityTrend(organizationId: string): Promise<{ day: string; total: number }[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const { data, error } = await supabase
    .from("audit_logs")
    .select("created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", since.toISOString());
  if (error) throw error;

  const byDay = new Map<string, number>();
  for (const row of data ?? []) {
    const day = String(row.created_at).slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  return Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, total]) => ({ day, total }));
}

/** Eventos por módulo (tabela real, agrupada em rótulo). */
export async function getAuditByModule(organizationId: string): Promise<{ module: string; total: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("table_name")
    .eq("organization_id", organizationId);
  if (error) throw error;

  const byModule = new Map<string, number>();
  for (const row of data ?? []) {
    const label = TABLE_MODULE_LABEL[row.table_name] ?? row.table_name;
    byModule.set(label, (byModule.get(label) ?? 0) + 1);
  }

  return Array.from(byModule.entries())
    .map(([module, total]) => ({ module, total }))
    .sort((a, b) => b.total - a.total);
}
