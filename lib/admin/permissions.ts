/**
 * Controle de acesso do Centro de Administração — espelha exatamente
 * as funções SECURITY DEFINER que o banco já aplica
 * (`list_organization_members` e as demais RPCs de
 * `20260917030000_admin_governance_center.sql`), checadas aqui só pra
 * devolver uma mensagem clara em vez de um erro de RPC.
 */

const VIEW_ROLES = new Set(["admin", "manager"]);
const MANAGE_ROLES = new Set(["admin"]);

export function canViewAdmin(role: string): boolean {
  return VIEW_ROLES.has(role.toLowerCase());
}

export function canManageAdmin(role: string): boolean {
  return MANAGE_ROLES.has(role.toLowerCase());
}

export function assertCanViewAdmin(role: string) {
  if (!canViewAdmin(role)) {
    throw new Error("Seu perfil não tem acesso à Administração. Fale com um administrador.");
  }
}
