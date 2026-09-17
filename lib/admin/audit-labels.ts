/**
 * Rótulos e tipos de auditoria — sem nenhuma dependência de servidor
 * (sem `createClient`/`next/headers`), pra poder ser importado tanto
 * de Server Components/actions quanto de Client Components sem
 * arrastar código server-only pro bundle do navegador.
 */

export const TABLE_MODULE_LABEL: Record<string, string> = {
  clients: "Clientes",
  client_risk_profiles: "Clientes",
  client_contacts: "Clientes",
  client_addresses: "Clientes",
  client_tags: "Clientes",
  households: "Clientes",
  interactions: "Clientes",
  notes: "Clientes",
  leads: "Leads",
  opportunities: "Oportunidades",
  opportunity_stages: "Oportunidades",
  tasks: "Tarefas",
  financial_accounts: "Patrimônio",
  holdings: "Patrimônio",
  transactions: "Patrimônio",
  wealth_goals: "Patrimônio",
  wealth_goal_accounts: "Patrimônio",
  liabilities: "Patrimônio",
  consortium_contracts: "Consórcios",
  consortium_installments: "Consórcios",
  consortium_bids: "Consórcios",
  documents: "Documentos",
  document_versions: "Documentos",
  document_requests: "Documentos",
  document_shares: "Documentos",
  reports: "Relatórios",
  report_templates: "Relatórios",
  integration_connections: "Integrações",
  integration_sync_runs: "Integrações",
  integration_alerts: "Integrações",
  integration_field_mappings: "Integrações",
  calendar_feed_tokens: "Integrações",
  intelligence_insight_events: "Inteligência",
  organization_members: "Administração",
  role_permissions: "Administração",
  organizations: "Administração",
};

export function moduleLabelForTable(tableName: string): string {
  return TABLE_MODULE_LABEL[tableName] ?? tableName;
}

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action;
}

export type AuditLogEntry = {
  id: string;
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogFilters = {
  userId?: string;
  module?: string;
  action?: string;
  from?: string;
  to?: string;
  search?: string;
};
