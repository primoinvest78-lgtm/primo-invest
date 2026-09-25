/**
 * Catálogo de integrações — a fonte de verdade de nome, categoria e
 * descrição de cada conector vive AQUI, no código, não no banco.
 *
 * REGRA ABSOLUTA DO MÓDULO: nenhum destes 14 itens tem um conector real
 * hoje. `public.integration_connections` guarda só o CADASTRO
 * administrativo por organização (o que foi configurado, quem é
 * responsável, se está ativo) — nunca um estado de sincronização
 * inventado. Enquanto não houver serviço externo implementado,
 * `available: false` e a UI mostra "Disponível para configuração
 * futura" em vez de qualquer ação que finja uma conexão real.
 */

export const INTEGRATION_CATEGORIES = [
  "open_finance",
  "b3",
  "custodia",
  "banco",
  "corretora",
  "crm",
  "email",
  "calendario",
  "whatsapp",
  "assinatura_digital",
  "armazenamento",
  "api_externa",
  "servico_mercado",
  "webhook",
] as const;

export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

export const INTEGRATION_CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  open_finance: "Open Finance",
  b3: "B3",
  custodia: "Custódia",
  banco: "Banco",
  corretora: "Corretora",
  crm: "CRM",
  email: "E-mail",
  calendario: "Calendário",
  whatsapp: "WhatsApp",
  assinatura_digital: "Assinatura digital",
  armazenamento: "Armazenamento",
  api_externa: "API externa",
  servico_mercado: "Serviço de mercado",
  webhook: "Webhook",
};

export type IntegrationCatalogEntry = {
  /** Bate com `integration_connections.provider`. */
  providerKey: string;
  category: IntegrationCategory;
  name: string;
  description: string;
  /** Sempre false hoje — nenhum conector real está implementado. */
  available: boolean;
};

export const INTEGRATION_CATALOG: IntegrationCatalogEntry[] = [
  {
    providerKey: "open_finance",
    category: "open_finance",
    name: "Open Finance",
    description: "Compartilhamento de dados bancários e de investimentos autorizado pelo cliente.",
    available: false,
  },
  {
    providerKey: "b3",
    category: "b3",
    name: "B3 — Bolsa de Valores",
    description: "Posições, custódia e eventos de mercado direto da bolsa brasileira.",
    available: false,
  },
  {
    providerKey: "custodia",
    category: "custodia",
    name: "Custódias",
    description: "Extratos de custódia de instituições parceiras.",
    available: false,
  },
  {
    providerKey: "banco",
    category: "banco",
    name: "Bancos",
    description: "Saldos e extratos de contas correntes e poupança.",
    available: false,
  },
  {
    providerKey: "corretora",
    category: "corretora",
    name: "Corretoras",
    description: "Posições e movimentações de contas em corretoras de valores.",
    available: false,
  },
  {
    providerKey: "crm",
    category: "crm",
    name: "CRM",
    description: "Sincronização de contatos, leads e histórico de relacionamento.",
    available: false,
  },
  {
    providerKey: "email",
    category: "email",
    name: "E-mail",
    description: "Envio de relatórios, notificações e comunicação com clientes.",
    available: false,
  },
  {
    providerKey: "calendario",
    category: "calendario",
    name: "Calendário",
    description: "Assinatura de agenda (.ics) com as tarefas do usuário — compatível com Google Calendar, Outlook e Apple Calendar.",
    available: true,
  },
  {
    providerKey: "whatsapp",
    category: "whatsapp",
    name: "WhatsApp",
    description: "Canal de atendimento e envio de documentos aos clientes.",
    available: false,
  },
  {
    providerKey: "assinatura_digital",
    category: "assinatura_digital",
    name: "Assinatura digital",
    description: "Coleta de assinatura eletrônica em contratos e termos.",
    available: false,
  },
  {
    providerKey: "armazenamento",
    category: "armazenamento",
    name: "Armazenamento",
    description: "Backup e sincronização de arquivos com armazenamento externo.",
    available: false,
  },
  {
    providerKey: "api_externa",
    category: "api_externa",
    name: "APIs externas",
    description: "Integrações personalizadas com sistemas de terceiros.",
    available: false,
  },
  {
    providerKey: "servico_mercado",
    category: "servico_mercado",
    name: "Serviços de mercado",
    description: "Cotações, indicadores e dados de mercado em tempo real.",
    available: false,
  },
  {
    providerKey: "webhook",
    category: "webhook",
    name: "Webhooks",
    description: "Envio e recebimento de eventos em tempo real via HTTP.",
    available: false,
  },
];

export function catalogEntry(providerKey: string): IntegrationCatalogEntry | undefined {
  return INTEGRATION_CATALOG.find((c) => c.providerKey === providerKey);
}

/* ────────────────────────────────────────────────────────────────
 * Estado administrativo (não é estado de sincronização real)
 * — bate com o CHECK de integration_connections.status.
 * ──────────────────────────────────────────────────────────────── */

export const INTEGRATION_STATUSES = ["not_configured", "active", "inactive", "error", "revoked"] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  not_configured: "Não configurada",
  active: "Ativa",
  inactive: "Inativa",
  error: "Com erro",
  revoked: "Revogada",
};

export const INTEGRATION_STATUS_VARIANT: Record<
  IntegrationStatus,
  "default" | "destructive" | "outline" | "secondary"
> = {
  not_configured: "outline",
  active: "default",
  inactive: "secondary",
  error: "destructive",
  revoked: "destructive",
};

export function integrationStatusLabel(status: string): string {
  return INTEGRATION_STATUS_LABEL[status as IntegrationStatus] ?? status;
}

export const ENVIRONMENTS = ["sandbox", "production"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const ENVIRONMENT_LABEL: Record<Environment, string> = {
  sandbox: "Testes",
  production: "Produção",
};

export const SYNC_FREQUENCIES = ["manual", "hourly", "daily", "weekly"] as const;
export type SyncFrequency = (typeof SYNC_FREQUENCIES)[number];

export const SYNC_FREQUENCY_LABEL: Record<SyncFrequency, string> = {
  manual: "Manual",
  hourly: "A cada hora",
  daily: "Diária",
  weekly: "Semanal",
};

/* ────────────────────────────────────────────────────────────────
 * Histórico de sincronização — bate com o CHECK de
 * integration_sync_runs.status (esquema pré-existente + 'not_available'
 * acrescentado pra cobrir "não há conector real ainda").
 * ──────────────────────────────────────────────────────────────── */

export const SYNC_RUN_STATUSES = ["started", "running", "completed", "failed", "cancelled", "not_available"] as const;
export type SyncRunStatus = (typeof SYNC_RUN_STATUSES)[number];

export const SYNC_RUN_STATUS_LABEL: Record<SyncRunStatus, string> = {
  started: "Iniciada",
  running: "Em execução",
  completed: "Concluída",
  failed: "Falhou",
  cancelled: "Cancelada",
  not_available: "Conector indisponível",
};

export const SYNC_RUN_STATUS_VARIANT: Record<
  SyncRunStatus,
  "default" | "destructive" | "outline" | "secondary"
> = {
  started: "outline",
  running: "outline",
  completed: "default",
  failed: "destructive",
  cancelled: "secondary",
  not_available: "secondary",
};

export function syncRunStatusLabel(status: string): string {
  return SYNC_RUN_STATUS_LABEL[status as SyncRunStatus] ?? status;
}

export const SYNC_TRIGGER_LABEL: Record<string, string> = {
  manual: "Manual",
  scheduled: "Agendado",
  system: "Sistema",
};

/* ────────────────────────────────────────────────────────────────
 * Alertas
 * ──────────────────────────────────────────────────────────────── */

export const ALERT_TYPES = [
  "disconnected",
  "sync_failed",
  "credential_expired",
  "stale_data",
  "recurring_error",
  "inactive",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  disconnected: "Integração desconectada",
  sync_failed: "Sincronização falhou",
  credential_expired: "Credencial expirada",
  stale_data: "Dados desatualizados",
  recurring_error: "Erro recorrente",
  inactive: "Integração inativa",
};

export const ALERT_SEVERITIES = ["info", "warning", "critical"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: "Informativo",
  warning: "Atenção",
  critical: "Crítico",
};

export const ALERT_STATUS_LABEL: Record<string, string> = {
  open: "Em aberto",
  acknowledged: "Reconhecido",
  resolved: "Resolvido",
};

/* ────────────────────────────────────────────────────────────────
 * Mapeamento de campos
 * ──────────────────────────────────────────────────────────────── */

export const FIELD_MAPPING_STATUSES = ["mapped", "pending", "conflict"] as const;
export type FieldMappingStatus = (typeof FIELD_MAPPING_STATUSES)[number];

export const FIELD_MAPPING_STATUS_LABEL: Record<FieldMappingStatus, string> = {
  mapped: "Mapeado",
  pending: "Pendente",
  conflict: "Conflito",
};
