"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

function revalidateCenterPaths(clientId?: string | null) {
  revalidatePath("/documentos/documentos");
  revalidatePath("/documentos/cofre");
  revalidatePath("/tarefas");
  if (clientId) revalidatePath(`/clientes/${clientId}`);
}

export async function createDocumentRequest(input: {
  clientId: string | null;
  title: string;
  category: string | null;
  description: string | null;
  dueDate: string | null;
  responsibleRole: string | null;
  responsibleId: string | null;
  entityType: string | null;
  entityId: string | null;
}) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from("document_requests")
    .insert({
      organization_id: organizationId,
      client_id: input.clientId,
      title: input.title,
      category: input.category,
      description: input.description,
      due_date: input.dueDate,
      responsible_role: input.responsibleRole,
      responsible_id: input.responsibleId,
      requested_by: userId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      status: "solicitado",
    })
    .select("id")
    .single();

  if (error) throw error;

  if (input.dueDate) {
    await supabase.from("tasks").insert({
      organization_id: organizationId,
      client_id: input.clientId,
      assigned_to: input.responsibleId,
      title: `Solicitar documento: ${input.title}`,
      description: input.description,
      due_at: new Date(input.dueDate).toISOString(),
      priority: "normal",
      category: "documento",
      status: "pending",
    });
  }

  revalidateCenterPaths(input.clientId);

  return { id: request.id as string };
}

/** Vincula um documento já enviado ao Cofre à solicitação, avançando o fluxo pra "recebido". */
export async function linkDocumentToRequest(requestId: string, documentId: string, clientId?: string | null) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("document_requests")
    .update({ document_id: documentId, status: "recebido" })
    .eq("id", requestId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateCenterPaths(clientId);
}

const ADVANCEABLE_STATUSES = ["recebido", "em_analise", "aprovado", "reprovado", "arquivado"] as const;
export type AdvanceableStatus = (typeof ADVANCEABLE_STATUSES)[number];

export async function advanceRequestStatus(
  requestId: string,
  status: AdvanceableStatus,
  notes: string | null,
  clientId?: string | null,
) {
  if (!ADVANCEABLE_STATUSES.includes(status)) {
    throw new Error(`Status de solicitação inválido: ${status}`);
  }

  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("document_requests")
    .update({ status, decision_notes: notes })
    .eq("id", requestId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateCenterPaths(clientId);
}
