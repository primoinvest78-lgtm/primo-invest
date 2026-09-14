"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function recordClientDocument(input: {
  clientId: string;
  name: string;
  documentType: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
}) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      organization_id: organizationId,
      client_id: input.clientId,
      uploaded_by: userId,
      name: input.name,
      document_type: input.documentType,
      storage_path: input.storagePath,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw error;

  const { error: versionError } = await supabase.from("document_versions").insert({
    document_id: document.id,
    version_number: 1,
    storage_path: input.storagePath,
    file_size: input.fileSize,
    mime_type: input.mimeType,
    uploaded_by: userId,
  });

  if (versionError) throw versionError;

  revalidatePath(`/clientes/${input.clientId}`);
}

export async function deleteClientDocument(
  documentId: string,
  clientId: string,
  storagePaths: string[],
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage.from("documents").remove(storagePaths);
    if (storageError) throw storageError;
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/documentos/cofre");
}

// ---------------------------------------------------------------------------
// Cofre Digital — upload, versionamento, metadados, relacionamentos,
// compartilhamento e log de acesso. Reaproveita a mesma tabela
// `documents` do restante do app (nenhum armazenamento paralelo).
// ---------------------------------------------------------------------------

export async function recordVaultDocument(input: {
  name: string;
  documentType: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  clientId: string | null;
  consortiumContractId: string | null;
  category: string | null;
  expiresAt: string | null;
  tags: string[];
}) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      organization_id: organizationId,
      client_id: input.clientId,
      consortium_contract_id: input.consortiumContractId,
      uploaded_by: userId,
      name: input.name,
      document_type: input.documentType,
      storage_path: input.storagePath,
      category: input.category,
      expires_at: input.expiresAt,
      tags: input.tags.length > 0 ? input.tags : null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw error;

  const { error: versionError } = await supabase.from("document_versions").insert({
    document_id: document.id,
    version_number: 1,
    storage_path: input.storagePath,
    file_size: input.fileSize,
    mime_type: input.mimeType,
    uploaded_by: userId,
  });

  if (versionError) throw versionError;

  revalidatePath("/documentos/cofre");
  revalidatePath("/documentos/documentos");
  if (input.clientId) revalidatePath(`/clientes/${input.clientId}`);
  if (input.consortiumContractId) revalidatePath(`/consorcios/contratos/${input.consortiumContractId}`);

  return { id: document.id as string };
}

/**
 * Nova versão do documento — NUNCA substitui a anterior silenciosamente:
 * a versão antiga continua em document_versions, só o número avança.
 */
export async function addDocumentVersion(
  documentId: string,
  input: { storagePath: string; fileSize: number; mimeType: string },
) {
  const { userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: last, error: lastError } = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw lastError;

  const nextVersion = (last?.version_number ?? 0) + 1;

  const { error } = await supabase.from("document_versions").insert({
    document_id: documentId,
    version_number: nextVersion,
    storage_path: input.storagePath,
    file_size: input.fileSize,
    mime_type: input.mimeType,
    uploaded_by: userId,
  });
  if (error) throw error;

  // storage_path "oficial" do documento passa a ser a versão mais
  // recente, pra downloads/preview padrão sempre pegarem a atual.
  await supabase.from("documents").update({ storage_path: input.storagePath }).eq("id", documentId);

  revalidatePath("/documentos/cofre");
  return { versionNumber: nextVersion };
}

export async function updateDocumentMetadata(
  documentId: string,
  input: { category: string | null; expiresAt: string | null; tags: string[]; status: string; clientId: string | null },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("documents")
    .update({
      category: input.category,
      expires_at: input.expiresAt,
      tags: input.tags.length > 0 ? input.tags : null,
      status: input.status,
    })
    .eq("id", documentId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/documentos/cofre");
  if (input.clientId) revalidatePath(`/clientes/${input.clientId}`);
}

export async function deleteVaultDocument(documentId: string, clientId: string | null, storagePaths: string[]) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage.from("documents").remove(storagePaths);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from("documents").delete().eq("id", documentId).eq("organization_id", organizationId);
  if (error) throw error;

  revalidatePath("/documentos/cofre");
  if (clientId) revalidatePath(`/clientes/${clientId}`);
}

/**
 * Registro de visualização/download — ação de leitura, não passa por
 * INSERT/UPDATE/DELETE em documents, então precisa ser gravada aqui
 * explicitamente (o trigger de auditoria só cobre escrita).
 */
export async function logDocumentAccess(documentId: string, action: "view" | "download" | "share") {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("document_access_log").insert({
    document_id: documentId,
    organization_id: organizationId,
    user_id: userId,
    action,
  });
  if (error) throw error;
}

/**
 * Estrutura de compartilhamento preparada — grava a intenção (quem,
 * quais permissões, prazo). IMPORTANTE: isso NÃO implementa controle
 * de acesso granular de verdade; qualquer membro da organização já
 * enxerga o documento via RLS por organização. Enforcement real por
 * pessoa/registro exigiria uma política de RLS própria por
 * compartilhamento — ainda não construída, deixada preparada aqui.
 */
export async function shareDocument(
  documentId: string,
  input: {
    sharedWithType: string;
    sharedWithName: string;
    canView: boolean;
    canDownload: boolean;
    canEdit: boolean;
    expiresAt: string | null;
  },
) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("document_shares").insert({
    document_id: documentId,
    organization_id: organizationId,
    shared_with_type: input.sharedWithType,
    shared_with_name: input.sharedWithName || null,
    can_view: input.canView,
    can_download: input.canDownload,
    can_edit: input.canEdit,
    expires_at: input.expiresAt,
    created_by: userId,
  });
  if (error) throw error;

  await logDocumentAccess(documentId, "share");
  revalidatePath("/documentos/cofre");
}

export async function addDocumentRelationship(documentId: string, entityType: string, entityId: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("document_relationships").insert({
    document_id: documentId,
    organization_id: organizationId,
    entity_type: entityType,
    entity_id: entityId,
  });
  if (error) throw error;

  revalidatePath("/documentos/cofre");
}

/**
 * URL assinada de curta duração (60s) — o bucket "documents" é
 * privado; nunca expomos um link público ou permanente pra um
 * documento financeiro/pessoal. Cada clique em visualizar/baixar gera
 * uma URL nova.
 */
export async function getDocumentSignedUrl(storagePath: string, download: boolean) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 60, download ? { download: true } : undefined);

  if (error) throw error;
  return { url: data.signedUrl };
}

export async function fetchVaultDocumentDetail(documentId: string) {
  const { organizationId } = await requireActiveMembership();
  const { getVaultDocumentDetail } = await import("@/lib/data/documents");
  return getVaultDocumentDetail(organizationId, documentId);
}

export async function removeDocumentRelationship(relationshipId: string) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("document_relationships").delete().eq("id", relationshipId);
  if (error) throw error;

  revalidatePath("/documentos/cofre");
}
