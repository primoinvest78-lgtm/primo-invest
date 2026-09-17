"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";
import type { AppRole } from "@/lib/admin/roles";

function revalidateAdmin() {
  revalidatePath("/administracao");
}

const FRIENDLY_ERROR: Record<string, string> = {
  not_found: "Registro não encontrado.",
  already_member: "Essa pessoa já faz parte da organização.",
  last_admin: "Não é possível remover o último Administrador ativo da organização.",
};

/**
 * Adiciona um usuário JÁ CADASTRADO na plataforma à organização, pelo
 * e-mail. Não cria conta nova — não temos chave de serviço nem vamos
 * simular um fluxo de convite por e-mail que não existe de verdade.
 */
export async function addOrgMember(input: { email: string; role: AppRole }) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("add_organization_member", {
    p_org_id: organizationId,
    p_email: input.email.trim(),
    p_role: input.role,
  });
  if (error) throw error;

  revalidateAdmin();
  return { status: data as string, message: FRIENDLY_ERROR[data as string] ?? null };
}

export async function updateMemberRole(memberId: string, role: AppRole) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_member_role", {
    p_org_id: organizationId,
    p_member_id: memberId,
    p_new_role: role,
  });
  if (error) throw error;

  revalidateAdmin();
  return { status: data as string, message: FRIENDLY_ERROR[data as string] ?? null };
}

export async function setMemberStatus(memberId: string, status: "active" | "inactive") {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("set_member_status", {
    p_org_id: organizationId,
    p_member_id: memberId,
    p_new_status: status,
  });
  if (error) throw error;

  revalidateAdmin();
  return { status: data as string, message: FRIENDLY_ERROR[data as string] ?? null };
}

export async function setRolePermission(role: AppRole, permissionCode: string, granted: boolean) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("set_role_permission", {
    p_org_id: organizationId,
    p_role: role,
    p_permission_code: permissionCode,
    p_granted: granted,
  });
  if (error) throw error;

  revalidateAdmin();
  return { status: data as string, message: FRIENDLY_ERROR[data as string] ?? null };
}

export async function updateOrganization(input: {
  name: string;
  legalName: string;
  documentNumber: string | null;
}) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("organizations")
    .update({
      name: input.name,
      legal_name: input.legalName,
      document_number: input.documentNumber,
    })
    .eq("id", organizationId);
  if (error) throw error;

  revalidateAdmin();
}
