"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function updateAccount(
  accountId: string,
  input: {
    accountName: string;
    institutionName: string;
    accountType: string;
    currency: string;
    status: string;
    clientId: string | null;
  },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("financial_accounts")
    .update({
      account_name: input.accountName || null,
      institution_name: input.institutionName || null,
      account_type: input.accountType,
      currency: input.currency,
      status: input.status,
      client_id: input.clientId,
    })
    .eq("id", accountId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/patrimonio/contas");
  revalidatePath(`/patrimonio/contas/${accountId}`);
  revalidatePath("/patrimonio");
}

/**
 * Exclusão de conta é destrutiva: holdings, transactions e vínculos de
 * metas em cascata (FK ON DELETE CASCADE no schema). A UI exige
 * confirmação explícita antes de chamar esta action.
 */
export async function deleteAccount(accountId: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("financial_accounts")
    .delete()
    .eq("id", accountId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/patrimonio/contas");
  revalidatePath("/patrimonio");
}
