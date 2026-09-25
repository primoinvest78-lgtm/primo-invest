/**
 * Papéis e status reais do sistema — direto do enum `app_role` e
 * `member_status` do banco (não inventamos nenhum perfil novo, tipo
 * "Cliente" ou "Super Admin", que não existem como valor real).
 */

export const APP_ROLES = [
  "admin",
  "manager",
  "advisor",
  "operations",
  "finance",
  "compliance",
  "viewer",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  manager: "Gestor",
  advisor: "Assessor",
  operations: "Operacional",
  finance: "Financeiro",
  compliance: "Compliance",
  viewer: "Visualizador",
};

export const ROLE_DESCRIPTION: Record<AppRole, string> = {
  admin: "Acesso total à organização, incluindo usuários, permissões e configurações.",
  manager: "Visão de gestão sobre clientes, pipeline, relatórios e usuários.",
  advisor: "Atendimento e carteira de clientes no dia a dia.",
  operations: "Integrações, sincronizações e rotinas operacionais.",
  finance: "Acompanhamento financeiro e patrimonial.",
  compliance: "Auditoria, risco e conformidade.",
  viewer: "Consulta, sem ação sobre os dados.",
};

export const MEMBER_STATUSES = ["active", "inactive", "invited"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  invited: "Convite pendente",
};

export const MEMBER_STATUS_BADGE_CLASS: Record<MemberStatus, string> = {
  active: "border-primary/30 bg-primary/10 text-primary",
  inactive: "border-border bg-muted text-muted-foreground",
  invited: "border-warning/40 bg-warning/15 text-warning",
};

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

/**
 * As 17 permissões granulares reais (tabela `permissions`, já semeada
 * no banco) — código é sempre "<módulo>.read" ou "<módulo>.write".
 * `role_permissions` (quem tem cada uma) está vazia hoje: nenhuma
 * concessão foi configurada ainda. Não preenchemos isso sozinhos.
 */
export const PERMISSION_MODULE_LABEL: Record<string, string> = {
  ai: "Inteligência",
  audit: "Auditoria",
  clients: "Clientes",
  documents: "Documentos",
  integrations: "Integrações",
  notifications: "Notificações",
  organization: "Organização",
  reports: "Relatórios",
  users: "Usuários",
  wealth: "Patrimônio",
};

export const PERMISSION_MODULE_ORDER = [
  "organization",
  "users",
  "clients",
  "wealth",
  "documents",
  "reports",
  "integrations",
  "ai",
  "audit",
  "notifications",
];

/**
 * Acesso REAL de cada módulo hoje, como o código de fato aplica —
 * levantado lendo cada `lib/*\/permissions.ts` e as páginas de cada
 * módulo. A maioria não tem checagem de perfil nenhuma: qualquer
 * membro ativo da organização acessa (a única fronteira é
 * `is_org_member`, aplicada pelo RLS). Isto documenta o estado real,
 * não uma intenção — se o código mudar, esta tabela precisa mudar
 * junto.
 */
export type ModuleAccessRow = {
  module: string;
  allowedRoles: "all" | AppRole[];
  note?: string;
};

export const MODULE_ACCESS: ModuleAccessRow[] = [
  { module: "Clientes", allowedRoles: "all" },
  { module: "Leads", allowedRoles: "all" },
  { module: "Oportunidades", allowedRoles: "all" },
  { module: "Tarefas", allowedRoles: "all" },
  { module: "Painel de Relacionamento", allowedRoles: "all" },
  { module: "Patrimônio", allowedRoles: "all" },
  { module: "Consórcios", allowedRoles: "all" },
  { module: "Documentos", allowedRoles: "all" },
  {
    module: "Relatórios",
    allowedRoles: "all",
    note: "Emitir relatório Operacional/Executivo e excluir relatório ou modelo de outra pessoa: só Administrador e Gestor.",
  },
  {
    module: "Integrações",
    allowedRoles: ["admin", "manager", "operations"],
    note: "Módulo inteiro bloqueado para os demais perfis.",
  },
  { module: "Inteligência", allowedRoles: "all" },
  {
    module: "Administração",
    allowedRoles: ["admin", "manager"],
    note: "Visualizar usuários e auditoria: Administrador e Gestor. Alterar perfis, permissões e usuários: só Administrador.",
  },
];
