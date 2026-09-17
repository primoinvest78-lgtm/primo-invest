/**
 * Controle de acesso do Report Center.
 *
 * A fronteira REAL de dados é a organização: toda tabela roda com RLS
 * `is_org_member(organization_id)` e toda query de `lib/data/*` filtra
 * por `organization_id`. As regras deste arquivo são a camada de cima —
 * quem, dentro da organização, pode emitir o quê e apagar o quê.
 *
 * Nenhuma delas substitui a checagem de escopo feita nas actions
 * (`assertClientInOrganization`): um cliente de outra organização é
 * barrado pelo banco antes de qualquer regra daqui ser avaliada.
 */

import { INTERNAL_ONLY_TYPES, type ReportType } from "@/lib/reports/types";

/** Papéis com visão da operação inteira da casa. */
const MANAGEMENT_ROLES = new Set(["admin", "owner", "manager", "gestor"]);

export function isManagementRole(role: string): boolean {
  return MANAGEMENT_ROLES.has(role.toLowerCase());
}

/**
 * Relatórios Operacional e Executivo expõem a operação inteira
 * (produtividade da equipe, pipeline consolidado, ranking de clientes).
 * Só papéis de gestão emitem esses.
 */
export function canGenerateType(role: string, type: ReportType): boolean {
  if (INTERNAL_ONLY_TYPES.includes(type)) return isManagementRole(role);
  return true;
}

export function canDeleteReport(
  role: string,
  userId: string,
  reportCreatedById: string | null,
): boolean {
  return isManagementRole(role) || reportCreatedById === userId;
}

/** Templates são ativo compartilhado da casa — só gestão remove. */
export function canDeleteTemplate(
  role: string,
  userId: string,
  templateCreatedById: string | null,
): boolean {
  return isManagementRole(role) || templateCreatedById === userId;
}

export function assertCanGenerateType(role: string, type: ReportType) {
  if (!canGenerateType(role, type)) {
    throw new Error(
      "Seu perfil não tem permissão para emitir este tipo de relatório. Fale com a administração.",
    );
  }
}
