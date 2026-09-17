"use server";

import { revalidatePath } from "next/cache";

import { catalogEntry } from "@/lib/integrations/catalog";
import { assertCanAccessIntegrations } from "@/lib/integrations/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

function revalidateIntegrationPaths(integrationId?: string) {
  revalidatePath("/integracoes");
  revalidatePath("/integracoes/historico");
  if (integrationId) revalidatePath(`/integracoes/${integrationId}`);
}

/**
 * Configura o cadastro administrativo de uma integração — ambiente,
 * frequência pretendida, responsável e o sinalizador de credenciais.
 * NUNCA recebe nem grava o valor de uma credencial: `hasCredentials` é
 * só um sinalizador de "configurado por fora", a UI nunca tem campo de
 * texto pra token/senha.
 */
export async function configureIntegration(input: {
  integrationId: string;
  environment: string | null;
  syncFrequency: string;
  responsibleId: string | null;
  hasCredentials: boolean;
}) {
  const { organizationId, role } = await requireActiveMembership();
  assertCanAccessIntegrations(role);

  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_connections")
    .update({
      environment: input.environment,
      sync_frequency: input.syncFrequency,
      responsible_id: input.responsibleId,
      has_credentials: input.hasCredentials,
    })
    .eq("id", input.integrationId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateIntegrationPaths(input.integrationId);
}

export async function activateIntegration(integrationId: string) {
  const { organizationId, userId, role } = await requireActiveMembership();
  assertCanAccessIntegrations(role);

  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_connections")
    .update({ status: "active", activated_at: new Date().toISOString(), activated_by: userId })
    .eq("id", integrationId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateIntegrationPaths(integrationId);
}

export async function deactivateIntegration(integrationId: string) {
  const { organizationId, role } = await requireActiveMembership();
  assertCanAccessIntegrations(role);

  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_connections")
    .update({ status: "inactive" })
    .eq("id", integrationId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateIntegrationPaths(integrationId);
}

/**
 * "Testar conexão" e "Sincronizar agora" gravam uma execução REAL no
 * histórico — nunca um sucesso fabricado. Como não existe conector
 * implementado pra nenhum item do catálogo, toda execução resolve como
 * `not_available`, com a mensagem dizendo exatamente isso. É essa
 * honestidade que sustenta a regra do módulo: a arquitetura (histórico,
 * auditoria, alertas) é real; a sincronização em si, não.
 */
async function recordUnavailableRun(input: {
  organizationId: string;
  integrationId: string;
  userId: string;
  integrationName: string;
}) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("integration_sync_runs").insert({
    organization_id: input.organizationId,
    connection_id: input.integrationId,
    started_at: now,
    finished_at: now,
    status: "not_available",
    records_processed: 0,
    records_created: 0,
    records_updated: 0,
    records_failed: 0,
    error_message: `Conector real ainda não implementado para ${input.integrationName}. Nenhum dado foi sincronizado.`,
    triggered_by: "manual",
    triggered_by_user: input.userId,
  });

  if (error) throw error;
}

export async function testIntegrationConnection(integrationId: string) {
  const { organizationId, userId, role } = await requireActiveMembership();
  assertCanAccessIntegrations(role);

  const supabase = await createClient();
  const { data: integration, error: readError } = await supabase
    .from("integration_connections")
    .select("provider")
    .eq("id", integrationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (readError) throw readError;
  if (!integration) throw new Error("Integração não encontrada.");

  const name = catalogEntry(integration.provider)?.name ?? integration.provider;
  await recordUnavailableRun({ organizationId, integrationId, userId, integrationName: name });

  revalidateIntegrationPaths(integrationId);
  return {
    ok: false,
    message: `Conector real ainda não implementado para ${name}. Nenhuma conexão foi testada de verdade.`,
  };
}

export async function syncIntegrationNow(integrationId: string) {
  // Mesmo comportamento honesto de testIntegrationConnection — grava
  // execução real marcada como indisponível, nunca inventa registros
  // processados.
  return testIntegrationConnection(integrationId);
}

/* ────────────────────────────────────────────────────────────────
 * Alertas
 * ──────────────────────────────────────────────────────────────── */

export async function acknowledgeAlert(alertId: string, integrationId?: string) {
  const { organizationId, role } = await requireActiveMembership();
  assertCanAccessIntegrations(role);

  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_alerts")
    .update({ status: "acknowledged" })
    .eq("id", alertId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateIntegrationPaths(integrationId);
}

export async function resolveAlert(alertId: string, integrationId?: string) {
  const { organizationId, userId, role } = await requireActiveMembership();
  assertCanAccessIntegrations(role);

  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_alerts")
    .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: userId })
    .eq("id", alertId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateIntegrationPaths(integrationId);
}

/* ────────────────────────────────────────────────────────────────
 * Mapeamento de campos
 * ──────────────────────────────────────────────────────────────── */

export async function createFieldMapping(input: {
  integrationId: string;
  sourceEntity: string;
  sourceField: string;
  targetEntity: string;
  targetField: string;
  status: string;
  notes: string | null;
}) {
  const { organizationId, userId, role } = await requireActiveMembership();
  assertCanAccessIntegrations(role);

  const supabase = await createClient();
  const { error } = await supabase.from("integration_field_mappings").insert({
    organization_id: organizationId,
    connection_id: input.integrationId,
    source_entity: input.sourceEntity.trim(),
    source_field: input.sourceField.trim(),
    target_entity: input.targetEntity.trim(),
    target_field: input.targetField.trim(),
    status: input.status,
    notes: input.notes?.trim() || null,
    created_by: userId,
  });

  if (error) throw error;

  revalidateIntegrationPaths(input.integrationId);
}

export async function deleteFieldMapping(mappingId: string, integrationId: string) {
  const { organizationId, role } = await requireActiveMembership();
  assertCanAccessIntegrations(role);

  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_field_mappings")
    .delete()
    .eq("id", mappingId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateIntegrationPaths(integrationId);
}
