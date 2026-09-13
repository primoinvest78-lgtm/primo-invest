"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

function revalidateContract(contractId: string, clientId?: string | null) {
  revalidatePath("/consorcios");
  revalidatePath("/consorcios/contratos");
  revalidatePath(`/consorcios/contratos/${contractId}`);
  revalidatePath("/consorcios/parcelas");
  if (clientId) revalidatePath(`/clientes/${clientId}`);
}

async function logEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contractId: string,
  eventType: string,
  description: string,
) {
  const { error } = await supabase.from("consortium_events").insert({
    consortium_contract_id: contractId,
    event_type: eventType,
    event_date: new Date().toISOString().slice(0, 10),
    description,
  });
  if (error) throw error;
}

export async function updateContract(
  contractId: string,
  input: {
    administratorName: string;
    contractNumber: string;
    consortiumType: string;
    groupNumber: string;
    quotaNumber: string;
    assetDescription: string;
    creditAmount: number;
    installmentAmount: number | null;
    totalInstallments: number;
    paidInstallments: number;
    adminFeePercentage: number | null;
    reserveFundPercentage: number | null;
    insuranceAmount: number | null;
    startDate: string | null;
    endDate: string | null;
    contemplatedAt: string | null;
    status: string;
    clientId: string | null;
    notes: string;
  },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: before, error: beforeError } = await supabase
    .from("consortium_contracts")
    .select("status")
    .eq("id", contractId)
    .eq("organization_id", organizationId)
    .single();
  if (beforeError) throw beforeError;

  const { error } = await supabase
    .from("consortium_contracts")
    .update({
      administrator_name: input.administratorName || null,
      contract_number: input.contractNumber || null,
      consortium_type: input.consortiumType || null,
      group_number: input.groupNumber || null,
      quota_number: input.quotaNumber || null,
      asset_description: input.assetDescription || null,
      credit_amount: input.creditAmount,
      installment_amount: input.installmentAmount,
      total_installments: input.totalInstallments,
      paid_installments: input.paidInstallments,
      admin_fee_percentage: input.adminFeePercentage,
      reserve_fund_percentage: input.reserveFundPercentage,
      insurance_amount: input.insuranceAmount,
      start_date: input.startDate,
      end_date: input.endDate,
      contemplated_at: input.contemplatedAt,
      status: input.status,
      client_id: input.clientId,
      notes: input.notes || null,
    })
    .eq("id", contractId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  if (before.status !== input.status) {
    await logEvent(
      supabase,
      contractId,
      "status_change",
      `Status alterado de "${before.status}" para "${input.status}".`,
    );
  } else {
    await logEvent(supabase, contractId, "update", "Dados do contrato atualizados.");
  }

  revalidateContract(contractId, input.clientId);
}

/**
 * Exclusão é bloqueada pelo próprio banco (FK RESTRICT) se houver
 * tarefas vinculadas ao contrato — o erro do Postgres é repassado pra
 * a UI tratar, em vez de checar isso aqui e duplicar a regra.
 */
export async function updateContractNotes(contractId: string, clientId: string | null, notes: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("consortium_contracts")
    .update({ notes: notes || null })
    .eq("id", contractId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateContract(contractId, clientId);
}

export async function deleteContract(contractId: string, clientId: string | null) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("consortium_contracts")
    .delete()
    .eq("id", contractId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidateContract(contractId, clientId);
}

export async function addInstallment(
  contractId: string,
  clientId: string | null,
  input: {
    installmentNumber: number;
    dueDate: string | null;
    amount: number;
    paidAmount: number | null;
    paidAt: string | null;
    status: string;
  },
) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("consortium_installments").insert({
    consortium_contract_id: contractId,
    installment_number: input.installmentNumber,
    due_date: input.dueDate,
    amount: input.amount,
    paid_amount: input.paidAmount,
    paid_at: input.paidAt,
    status: input.status,
  });

  if (error) throw error;

  await logEvent(
    supabase,
    contractId,
    "installment_added",
    `Parcela ${input.installmentNumber} registrada${input.status === "paid" ? " como paga" : ""}.`,
  );

  revalidateContract(contractId, clientId);
}

export async function markInstallmentPaid(
  installmentId: string,
  contractId: string,
  clientId: string | null,
  input: { paidAmount: number; paidAt: string },
) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { data: installment, error: fetchError } = await supabase
    .from("consortium_installments")
    .select("installment_number")
    .eq("id", installmentId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("consortium_installments")
    .update({ paid_amount: input.paidAmount, paid_at: input.paidAt, status: "paid" })
    .eq("id", installmentId);

  if (error) throw error;

  await logEvent(
    supabase,
    contractId,
    "payment",
    `Pagamento da parcela ${installment.installment_number} registrado.`,
  );

  revalidateContract(contractId, clientId);
}

export async function deleteInstallment(installmentId: string, contractId: string, clientId: string | null) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("consortium_installments").delete().eq("id", installmentId);
  if (error) throw error;

  revalidateContract(contractId, clientId);
  revalidatePath("/consorcios/parcelas");
}

/**
 * Reajuste de valor — guarda o valor anterior no próprio evento
 * (metadata), nunca recalcula com regra própria: o novo valor vem de
 * quem está registrando a alteração (referência contratual/motivo real).
 */
export async function recordInstallmentAdjustment(
  installmentId: string,
  contractId: string,
  clientId: string | null,
  input: { newAmount: number; reason: string; contractualReference: string },
) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { data: installment, error: fetchError } = await supabase
    .from("consortium_installments")
    .select("installment_number, amount")
    .eq("id", installmentId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("consortium_installments")
    .update({ amount: input.newAmount })
    .eq("id", installmentId);
  if (error) throw error;

  await supabase.from("consortium_events").insert({
    consortium_contract_id: contractId,
    event_type: "adjustment",
    event_date: new Date().toISOString().slice(0, 10),
    description: `Parcela ${installment.installment_number}: valor alterado de ${installment.amount} para ${input.newAmount}. Motivo: ${input.reason}.`,
    metadata: {
      installmentNumber: installment.installment_number,
      previousAmount: installment.amount,
      newAmount: input.newAmount,
      reason: input.reason,
      contractualReference: input.contractualReference || null,
    },
  });

  revalidateContract(contractId, clientId);
  revalidatePath("/consorcios/parcelas");
}

/**
 * Negociação — muda vencimento/status pra "negotiated" e preserva a
 * condição original (vencimento anterior) no evento, com o
 * responsável identificado pela sessão autenticada.
 */
export async function negotiateInstallment(
  installmentId: string,
  contractId: string,
  clientId: string | null,
  input: { newDueDate: string; condition: string; notes: string },
) {
  const { fullName } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: installment, error: fetchError } = await supabase
    .from("consortium_installments")
    .select("installment_number, due_date")
    .eq("id", installmentId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("consortium_installments")
    .update({ due_date: input.newDueDate, status: "negotiated" })
    .eq("id", installmentId);
  if (error) throw error;

  await supabase.from("consortium_events").insert({
    consortium_contract_id: contractId,
    event_type: "negotiation",
    event_date: new Date().toISOString().slice(0, 10),
    description: `Parcela ${installment.installment_number} negociada: ${input.condition}.`,
    metadata: {
      installmentNumber: installment.installment_number,
      previousDueDate: installment.due_date,
      newDueDate: input.newDueDate,
      condition: input.condition,
      notes: input.notes || null,
      responsibleName: fullName,
    },
  });

  revalidateContract(contractId, clientId);
  revalidatePath("/consorcios/parcelas");
}

export async function updateInstallmentStatus(
  installmentId: string,
  contractId: string,
  clientId: string | null,
  status: string,
) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("consortium_installments").update({ status }).eq("id", installmentId);
  if (error) throw error;

  revalidateContract(contractId, clientId);
  revalidatePath("/consorcios/parcelas");
}

const BID_RESULT_EVENT: Record<string, { type: string; label: string }> = {
  pending: { type: "bid_offered", label: "Lance ofertado" },
  won: { type: "bid_won", label: "Lance vencedor" },
  lost: { type: "bid_lost", label: "Lance não vencedor" },
  cancelled: { type: "bid_cancelled", label: "Lance cancelado" },
};

export async function addBid(
  contractId: string,
  clientId: string | null,
  input: {
    bidType: string;
    bidAmount: number | null;
    bidPercentage: number | null;
    bidDate: string | null;
    result: string;
    notes: string;
  },
) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("consortium_bids").insert({
    consortium_contract_id: contractId,
    bid_type: input.bidType || null,
    bid_amount: input.bidAmount,
    bid_percentage: input.bidPercentage,
    bid_date: input.bidDate,
    result: input.result,
    notes: input.notes || null,
  });

  if (error) throw error;

  const event = BID_RESULT_EVENT[input.result] ?? BID_RESULT_EVENT.pending;
  await logEvent(supabase, contractId, event.type, event.label);

  revalidateContract(contractId, clientId);
}

export async function updateBid(
  bidId: string,
  contractId: string,
  clientId: string | null,
  input: {
    bidType: string;
    bidAmount: number | null;
    bidPercentage: number | null;
    bidDate: string | null;
    result: string;
    notes: string;
  },
) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { data: before, error: beforeError } = await supabase
    .from("consortium_bids")
    .select("result")
    .eq("id", bidId)
    .single();
  if (beforeError) throw beforeError;

  const { error } = await supabase
    .from("consortium_bids")
    .update({
      bid_type: input.bidType || null,
      bid_amount: input.bidAmount,
      bid_percentage: input.bidPercentage,
      bid_date: input.bidDate,
      result: input.result,
      notes: input.notes || null,
    })
    .eq("id", bidId);

  if (error) throw error;

  if (before.result !== input.result) {
    const event = BID_RESULT_EVENT[input.result] ?? BID_RESULT_EVENT.pending;
    await logEvent(supabase, contractId, event.type, event.label);

    if (input.result === "won") {
      await logEvent(supabase, contractId, "contemplation", "Contemplação registrada via lance vencedor.");
    }
  }

  revalidateContract(contractId, clientId);
}

export async function deleteBid(bidId: string, contractId: string, clientId: string | null) {
  await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("consortium_bids").delete().eq("id", bidId);
  if (error) throw error;

  revalidateContract(contractId, clientId);
}

export async function recordContractDocument(input: {
  contractId: string;
  clientId: string | null;
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
      consortium_contract_id: input.contractId,
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

  await logEvent(supabase, input.contractId, "document_uploaded", `Documento "${input.name}" enviado.`);

  revalidateContract(input.contractId, input.clientId);
}

export async function deleteContractDocument(
  documentId: string,
  contractId: string,
  clientId: string | null,
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

  revalidateContract(contractId, clientId);
}
