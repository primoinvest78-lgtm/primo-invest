/**
 * Controle de acesso do Payment Intelligence Engine — espelha
 * exatamente a RLS de `payment_evidences`/`payment_matches`/
 * `payment_transactions`/`payment_exceptions` e a checagem dentro de
 * `confirm_payment()` (admin, gestor, financeiro, operacional).
 */
const PAYMENTS_ROLES = new Set(["admin", "manager", "finance", "operations"]);

export function canAccessPayments(role: string): boolean {
  return PAYMENTS_ROLES.has(role.toLowerCase());
}
