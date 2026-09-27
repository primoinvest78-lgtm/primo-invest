"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { listOrgMembers } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";
import { getRequestOrigin } from "@/lib/utils/request-origin";
import type { AppRole } from "@/lib/admin/roles";

function revalidateAdmin() {
  revalidatePath("/administracao");
}

const FRIENDLY_ERROR: Record<string, string> = {
  not_found: "Registro não encontrado.",
  already_member: "Essa pessoa já faz parte da organização.",
  last_admin: "Não é possível remover o último Administrador ativo da organização.",
  admin_not_temporary: "Administrador não pode ter acesso provisório. Escolha outro perfil ou acesso permanente.",
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

const INVITE_ERROR: Record<string, string> = {
  over_email_send_rate_limit:
    "O limite de e-mails por hora foi atingido. Aguarde alguns minutos e tente de novo.",
  signup_disabled: "O cadastro de novas contas está desligado no Supabase.",
  email_address_invalid: "Esse e-mail não é válido.",
};

/**
 * Convite de verdade, sem chave de serviço: pede ao Supabase um link de
 * acesso por e-mail (cria a conta se ainda não existir), vincula a pessoa
 * à organização e já deixa o acesso ATIVO — o admin convidou de propósito.
 *
 * O link usa fluxo "implicit" (sessão no fragmento da URL) porque quem
 * abre o e-mail é outro navegador: no PKCE o verificador ficaria preso
 * neste servidor. A página /definir-senha lê o fragmento e grava a sessão.
 */
export async function inviteOrgMember(input: { email: string; role: AppRole; durationDays: number | null }) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();
  const email = input.email.trim().toLowerCase();

  const mailer = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { error: otpError } = await mailer.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${await getRequestOrigin()}/definir-senha` },
  });
  if (otpError) {
    console.error("[inviteOrgMember] signInWithOtp falhou:", otpError.code, otpError.message);
    return { ok: false, message: INVITE_ERROR[otpError.code ?? ""] ?? "Não foi possível enviar o convite." };
  }

  const { data: addStatus, error: addError } = await supabase.rpc("add_organization_member", {
    p_org_id: organizationId,
    p_email: email,
    p_role: input.role,
  });
  if (addError) throw addError;
  if (addStatus === "not_found") {
    return { ok: false, message: "O e-mail foi enviado, mas a conta ainda não apareceu. Tente de novo em instantes." };
  }

  const member = (await listOrgMembers(organizationId)).find((m) => m.email.toLowerCase() === email);
  if (member && member.status !== "active") {
    const { error: statusError } = await supabase.rpc("set_member_status", {
      p_org_id: organizationId,
      p_member_id: member.memberId,
      p_new_status: "active",
    });
    if (statusError) throw statusError;
  }

  let expiryNote = "";
  if (member) {
    const expiresAt = input.durationDays ? new Date(Date.now() + input.durationDays * 86_400_000) : null;
    const { data: expiryStatus, error: expiryError } = await supabase.rpc("set_member_access_expiry", {
      p_org_id: organizationId,
      p_member_id: member.memberId,
      p_expires_at: expiresAt?.toISOString() ?? null,
    });
    if (expiryError) throw expiryError;
    if (expiryStatus === "admin_not_temporary") {
      expiryNote = " Atenção: Administrador não pode ser provisório, então o acesso ficou permanente.";
    } else if (expiresAt) {
      expiryNote = ` Acesso provisório até ${expiresAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}.`;
    }
  }

  revalidateAdmin();
  return {
    ok: true,
    message:
      (addStatus === "already_member"
        ? "Essa pessoa já fazia parte da organização. Um novo link de acesso foi enviado."
        : "Convite enviado! A pessoa recebe um link por e-mail para entrar e criar a senha.") + expiryNote,
  };
}

/** Define, estende ou encerra (data no passado/agora) o acesso provisório; null = permanente. */
export async function setMemberAccessExpiry(memberId: string, expiresAt: string | null) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("set_member_access_expiry", {
    p_org_id: organizationId,
    p_member_id: memberId,
    p_expires_at: expiresAt,
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
