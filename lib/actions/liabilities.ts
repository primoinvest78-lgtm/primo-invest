"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function updateLiability(
  liabilityId: string,
  input: {
    name: string;
    liabilityType: string;
    outstandingAmount: number;
    interestRate: number | null;
    monthlyPayment: number | null;
    maturityDate: string | null;
    currency: string;
    status: string;
    clientId: string | null;
  },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("liabilities")
    .update({
      name: input.name,
      liability_type: input.liabilityType || null,
      outstanding_amount: input.outstandingAmount,
      interest_rate: input.interestRate,
      monthly_payment: input.monthlyPayment,
      maturity_date: input.maturityDate || null,
      currency: input.currency,
      status: input.status,
      client_id: input.clientId,
    })
    .eq("id", liabilityId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/patrimonio/passivos");
  revalidatePath(`/patrimonio/passivos/${liabilityId}`);
  revalidatePath("/patrimonio");
}

export async function deleteLiability(liabilityId: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("liabilities")
    .delete()
    .eq("id", liabilityId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/patrimonio/passivos");
  revalidatePath("/patrimonio");
}
