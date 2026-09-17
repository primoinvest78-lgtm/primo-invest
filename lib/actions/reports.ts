"use server";

import { revalidatePath } from "next/cache";

import { buildReportPayload, resolveSections, type BuildReportInput } from "@/lib/reports/builders";
import { assertCanGenerateType, canDeleteReport, canDeleteTemplate } from "@/lib/reports/permissions";
import { clampDayOfMonth, computeNextRun } from "@/lib/reports/schedule";
import {
  REPORT_TYPES,
  SCHEDULE_FREQUENCIES,
  SHARE_AUDIENCES,
  type ReportAudience,
  type ReportSchedule,
  type ReportType,
  type ScheduleFrequency,
  type ShareAudience,
} from "@/lib/reports/types";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

function revalidateReportPaths(reportId?: string) {
  revalidatePath("/relatorios");
  revalidatePath("/relatorios/historico");
  revalidatePath("/relatorios/novo");
  if (reportId) revalidatePath(`/relatorios/${reportId}`);
}

function assertReportType(type: string): asserts type is ReportType {
  if (!(REPORT_TYPES as readonly string[]).includes(type)) {
    throw new Error(`Tipo de relatório inválido: ${type}`);
  }
}

/**
 * Um relatório só pode ser emitido para um cliente da MESMA organização
 * do usuário. A RLS já impediria a leitura dos dados, mas checar aqui
 * devolve um erro legível em vez de um documento vazio.
 */
async function assertClientInOrganization(organizationId: string, clientId: string | null) {
  if (!clientId) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Cliente não encontrado nesta organização ou sem acesso autorizado.");
  }
}

export type GenerateReportInput = {
  type: string;
  title: string;
  audience: ReportAudience;
  clientId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  institution: string | null;
  sections: string[];
};

function normalize(input: GenerateReportInput): BuildReportInput {
  assertReportType(input.type);
  return {
    type: input.type,
    title: input.title.trim() || "Relatório",
    audience: input.audience === "cliente" ? "cliente" : "interno",
    clientId: input.clientId || null,
    periodStart: input.periodStart || null,
    periodEnd: input.periodEnd || null,
    institution: input.institution || null,
    sections: input.sections,
  };
}

/**
 * Gera o documento e grava o SNAPSHOT completo em `payload`. Reabrir o
 * relatório depois mostra exatamente os números desta emissão, mesmo
 * que os dados da plataforma mudem — é isso que torna o histórico
 * auditável.
 */
export async function generateReport(input: GenerateReportInput) {
  const { organizationId, userId, role } = await requireActiveMembership();
  const normalized = normalize(input);

  assertCanGenerateType(role, normalized.type);
  await assertClientInOrganization(organizationId, normalized.clientId);

  const sections = resolveSections(normalized.type, normalized.audience, normalized.sections);
  if (sections.length === 0) {
    throw new Error("Selecione pelo menos uma seção para o relatório.");
  }

  const payload = await buildReportPayload(organizationId, { ...normalized, sections });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .insert({
      organization_id: organizationId,
      type: normalized.type,
      title: payload.title,
      client_id: normalized.clientId,
      period_start: normalized.periodStart,
      period_end: normalized.periodEnd,
      sections,
      parameters: {
        audience: normalized.audience,
        institution: normalized.institution,
        sections,
        clientId: normalized.clientId,
        periodStart: normalized.periodStart,
        periodEnd: normalized.periodEnd,
        // Origem dos números: as funções de lib/data lidas pelo builder.
        // Registrado no próprio relatório para auditoria posterior.
        dataSource: "lib/reports/builders",
      },
      payload,
      status: "gerado",
      version: 1,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidateReportPaths(data.id as string);
  return { id: data.id as string };
}

/** Prévia: monta o documento sem gravar nada. */
export async function previewReport(input: GenerateReportInput) {
  const { organizationId, role } = await requireActiveMembership();
  const normalized = normalize(input);

  assertCanGenerateType(role, normalized.type);
  await assertClientInOrganization(organizationId, normalized.clientId);

  const sections = resolveSections(normalized.type, normalized.audience, normalized.sections);
  if (sections.length === 0) {
    throw new Error("Selecione pelo menos uma seção para visualizar a prévia.");
  }

  return buildReportPayload(organizationId, { ...normalized, sections });
}

/**
 * Reemite com os MESMOS parâmetros, sobre os dados de hoje, e incrementa
 * a versão — o documento passa a mostrar a posição atual, e o número da
 * versão registra que houve reemissão.
 */
export async function regenerateReport(reportId: string) {
  const { organizationId, role } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("reports")
    .select("id, type, title, client_id, period_start, period_end, sections, parameters, version")
    .eq("organization_id", organizationId)
    .eq("id", reportId)
    .maybeSingle();

  if (readError) throw readError;
  if (!existing) throw new Error("Relatório não encontrado.");

  const type = existing.type as ReportType;
  assertReportType(type);
  assertCanGenerateType(role, type);

  const parameters = (existing.parameters ?? {}) as Record<string, unknown>;
  const payload = await buildReportPayload(organizationId, {
    type,
    title: existing.title as string,
    audience: (parameters.audience as ReportAudience) ?? "interno",
    clientId: (existing.client_id as string | null) ?? null,
    periodStart: (existing.period_start as string | null) ?? null,
    periodEnd: (existing.period_end as string | null) ?? null,
    institution: (parameters.institution as string | null) ?? null,
    sections: (existing.sections as string[] | null) ?? [],
  });

  const { error } = await supabase
    .from("reports")
    .update({
      payload,
      status: "gerado",
      version: Number(existing.version ?? 1) + 1,
    })
    .eq("id", reportId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateReportPaths(reportId);
}

export async function deleteReport(reportId: string) {
  const { organizationId, userId, role } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("reports")
    .select("created_by")
    .eq("organization_id", organizationId)
    .eq("id", reportId)
    .maybeSingle();

  if (readError) throw readError;
  if (!existing) throw new Error("Relatório não encontrado.");

  if (!canDeleteReport(role, userId, (existing.created_by as string | null) ?? null)) {
    throw new Error("Só a administração ou quem emitiu o relatório pode removê-lo.");
  }

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateReportPaths();
}

/** Contador de leituras do documento — alimenta "mais utilizados" na home. */
export async function registerReportView(reportId: string, currentCount: number) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  await supabase
    .from("reports")
    .update({ view_count: currentCount + 1 })
    .eq("id", reportId)
    .eq("organization_id", organizationId);
}

/* ────────────────────────────────────────────────────────────────
 * Compartilhamento
 * ──────────────────────────────────────────────────────────────── */

/**
 * Relatório financeiro nunca vira link público: compartilhar registra
 * COM QUEM, POR QUEM e QUANDO, e o acesso continua exigindo ser membro
 * ativo da organização (RLS). Não existe token anônimo.
 */
export async function shareReport(input: {
  reportId: string;
  audience: ShareAudience;
  sharedWithName: string | null;
  canDownload: boolean;
}) {
  const { organizationId, userId } = await requireActiveMembership();

  if (!(SHARE_AUDIENCES as readonly string[]).includes(input.audience)) {
    throw new Error(`Destinatário inválido: ${input.audience}`);
  }

  const supabase = await createClient();

  const { data: report, error: readError } = await supabase
    .from("reports")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", input.reportId)
    .maybeSingle();

  if (readError) throw readError;
  if (!report) throw new Error("Relatório não encontrado.");

  const { error } = await supabase.from("report_shares").insert({
    report_id: input.reportId,
    organization_id: organizationId,
    shared_with_type: input.audience,
    shared_with_name: input.sharedWithName?.trim() || null,
    can_download: input.canDownload,
    created_by: userId,
  });

  if (error) throw error;

  revalidateReportPaths(input.reportId);
}

export async function revokeShare(shareId: string, reportId: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("report_shares")
    .delete()
    .eq("id", shareId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateReportPaths(reportId);
}

/* ────────────────────────────────────────────────────────────────
 * Templates
 * ──────────────────────────────────────────────────────────────── */

export async function saveReportTemplate(input: {
  type: string;
  title: string;
  audience: ReportAudience;
  sections: string[];
  clientId: string | null;
  institution: string | null;
  description: string | null;
}) {
  const { organizationId, userId, role } = await requireActiveMembership();
  assertReportType(input.type);
  assertCanGenerateType(role, input.type);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_templates")
    .insert({
      organization_id: organizationId,
      type: input.type,
      title: input.title.trim() || "Modelo sem nome",
      config: {
        audience: input.audience,
        sections: input.sections,
        clientId: input.clientId,
        institution: input.institution,
        description: input.description?.trim() || null,
      },
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidateReportPaths();
  return { id: data.id as string };
}

/** Marca o uso do modelo — alimenta a ordenação de "mais utilizados". */
export async function registerTemplateUsage(templateId: string, currentCount: number) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  await supabase
    .from("report_templates")
    .update({ usage_count: currentCount + 1 })
    .eq("id", templateId)
    .eq("organization_id", organizationId);

  revalidateReportPaths();
}

export async function deleteReportTemplate(templateId: string) {
  const { organizationId, userId, role } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("report_templates")
    .select("created_by")
    .eq("organization_id", organizationId)
    .eq("id", templateId)
    .maybeSingle();

  if (readError) throw readError;
  if (!existing) throw new Error("Modelo não encontrado.");

  if (!canDeleteTemplate(role, userId, (existing.created_by as string | null) ?? null)) {
    throw new Error("Só a administração ou quem criou o modelo pode removê-lo.");
  }

  const { error } = await supabase
    .from("report_templates")
    .delete()
    .eq("id", templateId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateReportPaths();
}

/* ────────────────────────────────────────────────────────────────
 * Agendamento
 * ──────────────────────────────────────────────────────────────── */

/**
 * Registra o agendamento. A plataforma NÃO possui hoje um executor
 * (cron/worker) — a linha fica com status "agendado" e aparece em
 * "Pendentes" quando a data chega, para alguém emitir com um clique.
 * A estrutura já é a definitiva: quando houver worker, basta ele ler
 * `status = 'agendado' and schedule->>'nextRunOn' <= hoje` e chamar
 * `generateReport` com os mesmos parâmetros — nada muda no schema.
 */
export async function scheduleReport(input: {
  type: string;
  title: string;
  audience: ReportAudience;
  clientId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  institution: string | null;
  sections: string[];
  frequency: ScheduleFrequency;
  dayOfMonth: number;
  note: string | null;
}) {
  const { organizationId, userId, role } = await requireActiveMembership();
  assertReportType(input.type);
  assertCanGenerateType(role, input.type);

  if (!(SCHEDULE_FREQUENCIES as readonly string[]).includes(input.frequency)) {
    throw new Error(`Periodicidade inválida: ${input.frequency}`);
  }

  await assertClientInOrganization(organizationId, input.clientId);

  const sections = resolveSections(input.type, input.audience, input.sections);
  if (sections.length === 0) {
    throw new Error("Selecione pelo menos uma seção para agendar o relatório.");
  }

  const schedule: ReportSchedule = {
    frequency: input.frequency,
    dayOfMonth: clampDayOfMonth(input.dayOfMonth),
    nextRunOn: computeNextRun(input.frequency, input.dayOfMonth),
    note: input.note?.trim() || null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      organization_id: organizationId,
      type: input.type,
      title: input.title.trim() || "Relatório agendado",
      client_id: input.clientId,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      sections,
      parameters: {
        audience: input.audience,
        institution: input.institution,
        sections,
        clientId: input.clientId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        dataSource: "lib/reports/builders",
      },
      payload: {},
      status: "agendado",
      schedule,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidateReportPaths();
  return { id: data.id as string };
}

/** Emite agora um relatório que estava agendado e reprograma a próxima data. */
export async function runScheduledReport(reportId: string) {
  const { organizationId, role } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("reports")
    .select("id, type, title, client_id, period_start, period_end, sections, parameters, schedule, version")
    .eq("organization_id", organizationId)
    .eq("id", reportId)
    .maybeSingle();

  if (readError) throw readError;
  if (!existing) throw new Error("Relatório agendado não encontrado.");

  const type = existing.type as ReportType;
  assertReportType(type);
  assertCanGenerateType(role, type);

  const parameters = (existing.parameters ?? {}) as Record<string, unknown>;
  const schedule = existing.schedule as ReportSchedule | null;

  const payload = await buildReportPayload(organizationId, {
    type,
    title: existing.title as string,
    audience: (parameters.audience as ReportAudience) ?? "interno",
    clientId: (existing.client_id as string | null) ?? null,
    periodStart: (existing.period_start as string | null) ?? null,
    periodEnd: (existing.period_end as string | null) ?? null,
    institution: (parameters.institution as string | null) ?? null,
    sections: (existing.sections as string[] | null) ?? [],
  });

  const { error } = await supabase
    .from("reports")
    .update({
      payload,
      status: "gerado",
      version: Number(existing.version ?? 1) + 1,
      // A recorrência continua viva: a linha vira "gerado" e o próximo
      // vencimento já fica registrado no mesmo campo.
      schedule: schedule
        ? { ...schedule, nextRunOn: computeNextRun(schedule.frequency, schedule.dayOfMonth) }
        : null,
    })
    .eq("id", reportId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateReportPaths(reportId);
}

export async function cancelSchedule(reportId: string) {
  const { organizationId, userId, role } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("reports")
    .select("created_by")
    .eq("organization_id", organizationId)
    .eq("id", reportId)
    .maybeSingle();

  if (readError) throw readError;
  if (!existing) throw new Error("Agendamento não encontrado.");

  if (!canDeleteReport(role, userId, (existing.created_by as string | null) ?? null)) {
    throw new Error("Só a administração ou quem agendou pode cancelar.");
  }

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId)
    .eq("organization_id", organizationId)
    .eq("status", "agendado");

  if (error) throw error;

  revalidateReportPaths();
}
