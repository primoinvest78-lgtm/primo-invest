"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Quantidade/preço/valuation de uma posição vêm das movimentações
 * sincronizadas (extrato/corretora) — não expomos edição manual desses
 * valores aqui pra não divergir do histórico de movimentações. O que o
 * operador pode corrigir é remover uma posição incorreta ou duplicada.
 */
export async function deleteHolding(holdingId: string, accountId: string | null, clientId: string | null) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("holdings")
    .delete()
    .eq("id", holdingId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/patrimonio/investimentos");
  if (accountId) revalidatePath(`/patrimonio/contas/${accountId}`);
  if (clientId) revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/patrimonio");
}
