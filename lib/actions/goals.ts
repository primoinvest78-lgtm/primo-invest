"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function updateGoal(
  goalId: string,
  input: {
    name: string;
    goalType: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string | null;
    priority: string;
    status: string;
    clientId: string | null;
  },
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("wealth_goals")
    .update({
      name: input.name,
      goal_type: input.goalType || null,
      target_amount: input.targetAmount,
      current_amount: input.currentAmount,
      target_date: input.targetDate || null,
      priority: input.priority,
      status: input.status,
      client_id: input.clientId,
    })
    .eq("id", goalId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/patrimonio/metas");
  revalidatePath(`/patrimonio/metas/${goalId}`);
  revalidatePath("/patrimonio");
}

export async function deleteGoal(goalId: string) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("wealth_goals")
    .delete()
    .eq("id", goalId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath("/patrimonio/metas");
  revalidatePath("/patrimonio");
}
