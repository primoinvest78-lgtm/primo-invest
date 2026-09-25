/**
 * Controle de acesso do Centro de Integrações.
 *
 * Espelha exatamente a RLS que já protege `integration_connections` /
 * `integration_sync_runs` / `integration_alerts` /
 * `integration_field_mappings` no banco (`has_org_role(organization_id,
 * ARRAY['admin','manager','operations'])`) — não é uma barreira
 * adicional, é a MESMA regra, checada aqui só pra devolver uma
 * mensagem clara em vez de um erro de RLS ou (pior) uma tela vazia
 * enganosa pra quem não tem acesso.
 *
 * `app_role` é um enum do banco: admin, manager, advisor, operations,
 * finance, compliance, viewer. Nenhum outro valor existe — um set com
 * "owner"/"gestor" (como o módulo de Relatórios tinha) nunca bate com
 * papel real nenhum.
 */

const INTEGRATIONS_ROLES = new Set(["admin", "manager", "operations"]);

export function canAccessIntegrations(role: string): boolean {
  return INTEGRATIONS_ROLES.has(role.toLowerCase());
}

export function assertCanAccessIntegrations(role: string) {
  if (!canAccessIntegrations(role)) {
    throw new Error(
      "Seu perfil não tem acesso às Integrações. Fale com a administração.",
    );
  }
}
