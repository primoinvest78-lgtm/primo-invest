import { createClient } from "@/lib/supabase/server";
import type {
  ReportAudience,
  ReportPayload,
  ReportSchedule,
  ReportType,
  ShareAudience,
} from "@/lib/reports/types";

/* ────────────────────────────────────────────────────────────────
 * Relatórios gerados
 * ──────────────────────────────────────────────────────────────── */

export type ReportShare = {
  id: string;
  audience: ShareAudience;
  sharedWithName: string | null;
  canDownload: boolean;
  createdAt: string;
  createdByName: string | null;
};

export type ReportListItem = {
  id: string;
  type: ReportType;
  title: string;
  status: string;
  clientId: string | null;
  clientName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  sections: string[];
  audience: ReportAudience;
  version: number;
  viewCount: number;
  schedule: ReportSchedule | null;
  createdAt: string;
  updatedAt: string | null;
  createdById: string | null;
  createdByName: string | null;
  shares: ReportShare[];
};

export type ReportDetail = ReportListItem & {
  payload: ReportPayload | null;
  parameters: Record<string, unknown>;
};

const REPORT_SELECT = `id, type, title, client_id, period_start, period_end, sections, parameters,
       status, schedule, version, view_count, created_by, created_at, updated_at,
       client:clients(id, full_name),
       author:profiles(id, full_name),
       report_shares(id, shared_with_type, shared_with_name, can_download, created_at,
                     sharer:profiles(full_name))`;

type RawShare = {
  id: string;
  shared_with_type: string;
  shared_with_name: string | null;
  can_download: boolean;
  created_at: string;
  sharer: { full_name: string | null } | null;
};

type RawReport = {
  id: string;
  type: string;
  title: string;
  client_id: string | null;
  period_start: string | null;
  period_end: string | null;
  sections: string[] | null;
  parameters: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
  status: string;
  schedule: ReportSchedule | null;
  version: number;
  view_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  client: { id: string; full_name: string } | null;
  author: { id: string; full_name: string | null } | null;
  report_shares: RawShare[] | null;
};

function mapShare(row: RawShare): ReportShare {
  return {
    id: row.id,
    audience: row.shared_with_type as ShareAudience,
    sharedWithName: row.shared_with_name,
    canDownload: row.can_download,
    createdAt: row.created_at,
    createdByName: row.sharer?.full_name ?? null,
  };
}

function mapReport(row: RawReport): ReportListItem {
  const parameters = row.parameters ?? {};
  return {
    id: row.id,
    type: row.type as ReportType,
    title: row.title,
    status: row.status,
    clientId: row.client?.id ?? row.client_id,
    clientName: row.client?.full_name ?? null,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    sections: row.sections ?? [],
    audience: (parameters.audience as ReportAudience) ?? "interno",
    version: row.version,
    viewCount: row.view_count,
    schedule: row.schedule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdById: row.author?.id ?? row.created_by,
    createdByName: row.author?.full_name ?? null,
    shares: (row.report_shares ?? []).map(mapShare),
  };
}

/**
 * Histórico de relatórios. O `payload` (snapshot completo, pode ter
 * centenas de KB por documento) fica de fora de propósito — a listagem
 * carregaria megabytes sem usar nada disso.
 */
export async function listReports(organizationId: string): Promise<ReportListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as RawReport[]).map(mapReport);
}

export async function getReport(
  organizationId: string,
  reportId: string,
): Promise<ReportDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(`${REPORT_SELECT}, payload`)
    .eq("organization_id", organizationId)
    .eq("id", reportId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as RawReport;
  return {
    ...mapReport(row),
    payload: (row.payload as unknown as ReportPayload | null) ?? null,
    parameters: row.parameters ?? {},
  };
}

/* ────────────────────────────────────────────────────────────────
 * Templates
 * ──────────────────────────────────────────────────────────────── */

export type ReportTemplateConfig = {
  audience: ReportAudience;
  sections: string[];
  clientId: string | null;
  institution: string | null;
  description: string | null;
};

export type ReportTemplate = {
  id: string;
  type: ReportType;
  title: string;
  config: ReportTemplateConfig;
  usageCount: number;
  createdAt: string;
  createdByName: string | null;
};

export async function listReportTemplates(organizationId: string): Promise<ReportTemplate[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select(`id, type, title, config, usage_count, created_at, author:profiles(full_name)`)
    .eq("organization_id", organizationId)
    .order("usage_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  type Raw = {
    id: string;
    type: string;
    title: string;
    config: Partial<ReportTemplateConfig> | null;
    usage_count: number;
    created_at: string;
    author: { full_name: string | null } | null;
  };

  return ((data ?? []) as unknown as Raw[]).map((row) => ({
    id: row.id,
    type: row.type as ReportType,
    title: row.title,
    config: {
      audience: row.config?.audience ?? "interno",
      sections: row.config?.sections ?? [],
      clientId: row.config?.clientId ?? null,
      institution: row.config?.institution ?? null,
      description: row.config?.description ?? null,
    },
    usageCount: row.usage_count,
    createdAt: row.created_at,
    createdByName: row.author?.full_name ?? null,
  }));
}

/* ────────────────────────────────────────────────────────────────
 * Opções de filtro do gerador
 * ──────────────────────────────────────────────────────────────── */

export type ReportFilterOptions = {
  clients: { id: string; fullName: string; advisorName: string | null; householdName: string | null }[];
  advisors: { id: string; fullName: string }[];
  institutions: string[];
};

/**
 * Listas usadas apenas para POPULAR os seletores do gerador — são
 * metadados (nomes e identificadores), não indicadores. Nenhum número
 * do relatório sai daqui; os valores vêm sempre de `lib/reports/builders`.
 */
export async function getReportFilterOptions(organizationId: string): Promise<ReportFilterOptions> {
  const supabase = await createClient();

  const [clientsRes, advisorsRes, accountsRes] = await Promise.all([
    supabase
      .from("clients")
      .select(
        `id, full_name,
         assigned_advisor:profiles!clients_assigned_advisor_id_fkey(id, full_name),
         household:households(name)`,
      )
      .eq("organization_id", organizationId)
      .order("full_name"),
    supabase
      .from("organization_members")
      .select(`profile:profiles(id, full_name)`)
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("financial_accounts")
      .select("institution_name")
      .eq("organization_id", organizationId)
      .eq("status", "active"),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (advisorsRes.error) throw advisorsRes.error;
  if (accountsRes.error) throw accountsRes.error;

  type RawClient = {
    id: string;
    full_name: string;
    assigned_advisor: { id: string; full_name: string | null } | null;
    household: { name: string } | null;
  };
  type RawMember = { profile: { id: string; full_name: string | null } | null };

  const clients = ((clientsRes.data ?? []) as unknown as RawClient[]).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    advisorName: row.assigned_advisor?.full_name ?? null,
    householdName: row.household?.name ?? null,
  }));

  const advisors = ((advisorsRes.data ?? []) as unknown as RawMember[])
    .flatMap((row) => (row.profile ? [{ id: row.profile.id, fullName: row.profile.full_name ?? "Sem nome" }] : []))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));

  const institutions = Array.from(
    new Set(
      ((accountsRes.data ?? []) as { institution_name: string | null }[])
        .map((a) => a.institution_name)
        .filter((name): name is string => Boolean(name)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return { clients, advisors, institutions };
}

/* ────────────────────────────────────────────────────────────────
 * Indicadores da home
 * ──────────────────────────────────────────────────────────────── */

export type ReportCenterKpis = {
  total: number;
  last30Days: number;
  scheduled: number;
  shared: number;
  pending: number;
  templates: number;
};

/** Todos os indicadores derivam do próprio histórico — nenhum é fixo. */
export function computeReportCenterKpis(
  reports: ReportListItem[],
  templateCount: number,
  now = new Date(),
): ReportCenterKpis {
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const today = now.toISOString().slice(0, 10);

  return {
    total: reports.filter((r) => r.status === "gerado").length,
    last30Days: reports.filter((r) => r.status === "gerado" && r.createdAt >= cutoff).length,
    scheduled: reports.filter((r) => r.status === "agendado").length,
    shared: reports.filter((r) => r.shares.length > 0).length,
    // "Pendente" = agendamento cuja data de emissão já chegou, ou geração
    // que falhou — os dois exigem ação de alguém.
    pending: reports.filter(
      (r) =>
        r.status === "falhou" ||
        (r.status === "agendado" && r.schedule !== null && r.schedule.nextRunOn <= today),
    ).length,
    templates: templateCount,
  };
}
