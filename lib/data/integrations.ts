import { INTEGRATION_CATALOG, catalogEntry } from "@/lib/integrations/catalog";
import { createClient } from "@/lib/supabase/server";

export type IntegrationRow = {
  id: string;
  providerKey: string;
  category: string;
  name: string;
  description: string;
  available: boolean;
  status: string;
  environment: string | null;
  syncFrequency: string;
  hasCredentials: boolean;
  lastSyncedAt: string | null;
  nextSyncAt: string | null;
  activatedAt: string | null;
  activatedByName: string | null;
  responsibleId: string | null;
  responsibleName: string | null;
  /** Somado a partir do histórico real (integration_sync_runs) — nunca um contador solto. */
  recordsSyncedTotal: number;
  errorRunCount: number;
  openAlertCount: number;
  createdAt: string;
  updatedAt: string;
};

type RawIntegration = {
  id: string;
  provider: string;
  status: string;
  environment: string | null;
  sync_frequency: string;
  has_credentials: boolean;
  last_sync_at: string | null;
  next_sync_at: string | null;
  activated_at: string | null;
  activated_by_profile: { full_name: string | null } | null;
  responsible_id: string | null;
  responsible_profile: { full_name: string | null } | null;
  created_at: string;
  updated_at: string;
  integration_alerts: { id: string; status: string }[];
  integration_sync_runs: { status: string; records_created: number; records_updated: number }[];
};

const INTEGRATION_SELECT = `
  id, provider, status, environment, sync_frequency, has_credentials,
  last_sync_at, next_sync_at, activated_at, responsible_id,
  activated_by_profile:profiles!integration_connections_activated_by_fkey(full_name),
  responsible_profile:profiles!integration_connections_responsible_id_fkey(full_name),
  created_at, updated_at,
  integration_alerts(id, status),
  integration_sync_runs(status, records_created, records_updated)
`;

function mapIntegrationRow(row: RawIntegration): IntegrationRow {
  const entry = catalogEntry(row.provider);
  const runs = row.integration_sync_runs ?? [];
  return {
    id: row.id,
    providerKey: row.provider,
    category: entry?.category ?? "api_externa",
    name: entry?.name ?? row.provider,
    description: entry?.description ?? "",
    available: entry?.available ?? false,
    status: row.status,
    environment: row.environment,
    syncFrequency: row.sync_frequency,
    hasCredentials: row.has_credentials,
    lastSyncedAt: row.last_sync_at,
    nextSyncAt: row.next_sync_at,
    activatedAt: row.activated_at,
    activatedByName: row.activated_by_profile?.full_name ?? null,
    responsibleId: row.responsible_id,
    responsibleName: row.responsible_profile?.full_name ?? null,
    recordsSyncedTotal: runs.reduce((sum, r) => sum + r.records_created + r.records_updated, 0),
    errorRunCount: runs.filter((r) => r.status === "failed").length,
    openAlertCount: (row.integration_alerts ?? []).filter((a) => a.status === "open").length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Garante que toda organização tenha uma linha por item do catálogo —
 * idempotente (on conflict do nothing), então rodar isso toda vez que a
 * tela carrega é barato e nunca duplica. É isso que evita ter que
 * lembrar de "semear" o catálogo pra cada organização nova: a primeira
 * visita à tela já provisiona.
 */
async function ensureCatalogRows(organizationId: string): Promise<void> {
  const supabase = await createClient();
  const rows = INTEGRATION_CATALOG.map((entry) => ({
    organization_id: organizationId,
    provider: entry.providerKey,
    connection_name: entry.name,
    status: "not_configured",
  }));

  const { error } = await supabase
    .from("integration_connections")
    .upsert(rows, { onConflict: "organization_id,provider", ignoreDuplicates: true });

  if (error) throw error;
}

export async function listIntegrations(organizationId: string): Promise<IntegrationRow[]> {
  await ensureCatalogRows(organizationId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_connections")
    .select(INTEGRATION_SELECT)
    .eq("organization_id", organizationId);

  if (error) throw error;

  const rows = ((data ?? []) as unknown as RawIntegration[]).map(mapIntegrationRow);

  // Ordena pela ordem canônica do catálogo (não pela ordem de inserção no banco).
  const order = new Map(INTEGRATION_CATALOG.map((c, i) => [c.providerKey, i]));
  return rows.sort((a, b) => (order.get(a.providerKey) ?? 0) - (order.get(b.providerKey) ?? 0));
}

export async function getIntegration(
  organizationId: string,
  integrationId: string,
): Promise<IntegrationRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_connections")
    .select(INTEGRATION_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", integrationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapIntegrationRow(data as unknown as RawIntegration);
}

/* ────────────────────────────────────────────────────────────────
 * Histórico de sincronização
 * ──────────────────────────────────────────────────────────────── */

export type SyncRun = {
  id: string;
  integrationId: string;
  integrationName: string;
  providerKey: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage: string | null;
  triggeredBy: string;
  triggeredByUserName: string | null;
};

type RawSyncRun = {
  id: string;
  connection_id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message: string | null;
  triggered_by: string;
  triggered_by_profile: { full_name: string | null } | null;
  connection: { provider: string } | null;
};

function mapSyncRun(row: RawSyncRun): SyncRun {
  const entry = catalogEntry(row.connection?.provider ?? "");
  return {
    id: row.id,
    integrationId: row.connection_id,
    integrationName: entry?.name ?? row.connection?.provider ?? "—",
    providerKey: row.connection?.provider ?? "",
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status,
    recordsProcessed: row.records_processed,
    recordsCreated: row.records_created,
    recordsUpdated: row.records_updated,
    recordsFailed: row.records_failed,
    errorMessage: row.error_message,
    triggeredBy: row.triggered_by,
    triggeredByUserName: row.triggered_by_profile?.full_name ?? null,
  };
}

const SYNC_RUN_SELECT = `
  id, connection_id, started_at, finished_at, status, records_processed, records_created,
  records_updated, records_failed, error_message, triggered_by,
  triggered_by_profile:profiles!integration_sync_runs_triggered_by_user_fkey(full_name),
  connection:integration_connections(provider)
`;

export async function listSyncRuns(organizationId: string, limit = 200): Promise<SyncRun[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_sync_runs")
    .select(SYNC_RUN_SELECT)
    .eq("organization_id", organizationId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as unknown as RawSyncRun[]).map(mapSyncRun);
}

export async function listSyncRunsForIntegration(
  organizationId: string,
  integrationId: string,
  limit = 50,
): Promise<SyncRun[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_sync_runs")
    .select(SYNC_RUN_SELECT)
    .eq("organization_id", organizationId)
    .eq("connection_id", integrationId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as unknown as RawSyncRun[]).map(mapSyncRun);
}

/* ────────────────────────────────────────────────────────────────
 * Alertas
 * ──────────────────────────────────────────────────────────────── */

export type IntegrationAlert = {
  id: string;
  integrationId: string;
  integrationName: string;
  alertType: string;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByName: string | null;
};

type RawAlert = {
  id: string;
  connection_id: string;
  alert_type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by_profile: { full_name: string | null } | null;
  connection: { provider: string } | null;
};

function mapAlert(row: RawAlert): IntegrationAlert {
  const entry = catalogEntry(row.connection?.provider ?? "");
  return {
    id: row.id,
    integrationId: row.connection_id,
    integrationName: entry?.name ?? row.connection?.provider ?? "—",
    alertType: row.alert_type,
    severity: row.severity,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedByName: row.resolved_by_profile?.full_name ?? null,
  };
}

const ALERT_SELECT = `
  id, connection_id, alert_type, severity, message, status, created_at, resolved_at,
  resolved_by_profile:profiles!integration_alerts_resolved_by_fkey(full_name),
  connection:integration_connections(provider)
`;

export async function listAlerts(organizationId: string): Promise<IntegrationAlert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_alerts")
    .select(ALERT_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as RawAlert[]).map(mapAlert);
}

export async function listAlertsForIntegration(
  organizationId: string,
  integrationId: string,
): Promise<IntegrationAlert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_alerts")
    .select(ALERT_SELECT)
    .eq("organization_id", organizationId)
    .eq("connection_id", integrationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as RawAlert[]).map(mapAlert);
}

/* ────────────────────────────────────────────────────────────────
 * Mapeamento de campos
 * ──────────────────────────────────────────────────────────────── */

export type FieldMapping = {
  id: string;
  integrationId: string;
  sourceEntity: string;
  sourceField: string;
  targetEntity: string;
  targetField: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

export async function listFieldMappings(
  organizationId: string,
  integrationId: string,
): Promise<FieldMapping[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_field_mappings")
    .select("id, connection_id, source_entity, source_field, target_entity, target_field, status, notes, created_at")
    .eq("organization_id", organizationId)
    .eq("connection_id", integrationId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    integrationId: row.connection_id,
    sourceEntity: row.source_entity,
    sourceField: row.source_field,
    targetEntity: row.target_entity,
    targetField: row.target_field,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

/* ────────────────────────────────────────────────────────────────
 * KPIs do dashboard — tudo derivado do histórico e cadastro reais.
 * ──────────────────────────────────────────────────────────────── */

export type IntegrationsKpis = {
  active: number;
  inactive: number;
  notConfigured: number;
  totalSyncRuns: number;
  lastSyncAt: string | null;
  errorRuns: number;
  needsAttention: number;
};

export function computeIntegrationsKpis(
  integrations: IntegrationRow[],
  syncRuns: SyncRun[],
): IntegrationsKpis {
  const lastSyncAt = integrations.reduce<string | null>((latest, i) => {
    if (!i.lastSyncedAt) return latest;
    if (!latest || i.lastSyncedAt > latest) return i.lastSyncedAt;
    return latest;
  }, null);

  return {
    active: integrations.filter((i) => i.status === "active").length,
    inactive: integrations.filter((i) => i.status === "inactive").length,
    notConfigured: integrations.filter((i) => i.status === "not_configured").length,
    totalSyncRuns: syncRuns.length,
    lastSyncAt,
    errorRuns: syncRuns.filter((r) => r.status === "failed").length,
    needsAttention: integrations.filter((i) => i.openAlertCount > 0 || i.status === "error").length,
  };
}

/* ────────────────────────────────────────────────────────────────
 * Opções para o formulário de configuração
 * ──────────────────────────────────────────────────────────────── */

export async function getResponsibleOptions(
  organizationId: string,
): Promise<{ id: string; fullName: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select(`profile:profiles(id, full_name)`)
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (error) throw error;

  return (data ?? [])
    .flatMap((row) => {
      const raw = row as unknown as { profile: { id: string; full_name: string | null } | null };
      return raw.profile ? [{ id: raw.profile.id, fullName: raw.profile.full_name ?? "Sem nome" }] : [];
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));
}
