import type { VaultDocument } from "@/lib/data/documents";
import type { WealthAlert } from "@/lib/utils/wealth-helpers";

export const DOCUMENT_CATEGORIES = [
  "pessoal",
  "financeiro",
  "patrimonial",
  "investimento",
  "consorcio",
  "contrato",
  "juridico",
  "fiscal",
  "seguro",
  "outro",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<string, string> = {
  pessoal: "Pessoais",
  financeiro: "Financeiros",
  patrimonial: "Patrimoniais",
  investimento: "Investimentos",
  consorcio: "Consórcios",
  contrato: "Contratos",
  juridico: "Jurídicos",
  fiscal: "Fiscais",
  seguro: "Seguros",
  outro: "Outros",
};

export function categoryLabel(category: string | null): string {
  if (!category) return "Sem categoria";
  return CATEGORY_LABEL[category] ?? category;
}

export const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  archived: "Arquivado",
  deleted: "Excluído",
};

export function documentStatusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export const RELATIONSHIP_TYPE_LABEL: Record<string, string> = {
  financial_account: "Conta",
  wealth_goal: "Meta",
  liability: "Passivo",
  opportunity: "Oportunidade",
};

export function relationshipTypeLabel(type: string): string {
  return RELATIONSHIP_TYPE_LABEL[type] ?? type;
}

export const ACCESS_ACTION_LABEL: Record<string, string> = {
  view: "Visualizou",
  download: "Baixou",
  share: "Compartilhou",
};

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DAY_MS = 1000 * 60 * 60 * 24;

export function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / DAY_MS);
}

export function isExpired(doc: { expiresAt: string | null }): boolean {
  if (!doc.expiresAt) return false;
  return daysUntil(doc.expiresAt) < 0;
}

export function isExpiringSoon(doc: { expiresAt: string | null }, withinDays = 30): boolean {
  if (!doc.expiresAt) return false;
  const days = daysUntil(doc.expiresAt);
  return days >= 0 && days <= withinDays;
}

/** Isola a leitura do relógio aqui (função comum, não componente) —
 * evita chamar Date.now() direto no corpo de um componente. */
export function isRecent(doc: Pick<VaultDocument, "createdAt">, withinDays = 7): boolean {
  return Date.now() - new Date(doc.createdAt).getTime() <= withinDays * DAY_MS;
}

export type VaultFilters = {
  search: string;
  category: string;
  clientId: string;
  status: string;
};

export const DEFAULT_VAULT_FILTERS: VaultFilters = {
  search: "",
  category: "all",
  clientId: "all",
  status: "all",
};

export function hasActiveVaultFilters(filters: VaultFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "search") return value !== "";
    return value !== "all";
  });
}

export function applyVaultFilters(documents: VaultDocument[], filters: VaultFilters): VaultDocument[] {
  const term = filters.search.trim().toLowerCase();

  return documents.filter((doc) => {
    if (term) {
      const haystack = [doc.name, doc.clientName, doc.contractLabel, categoryLabel(doc.category), ...doc.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.category !== "all" && doc.category !== filters.category) return false;
    if (filters.clientId !== "all" && (doc.clientId ?? "none") !== filters.clientId) return false;
    if (filters.status !== "all" && doc.status !== filters.status) return false;
    return true;
  });
}

/**
 * Alertas do Cofre — só o que é derivável de dado real (vencido,
 * vencendo em breve, cliente sem documento algum). Nunca um alerta de
 * "aprovação pendente" ou "compartilhamento pendente" sem um campo
 * real de status pra sustentar isso.
 */
export function computeVaultAlerts(
  documents: VaultDocument[],
  clientsWithoutDocs: { id: string; fullName: string }[],
): WealthAlert[] {
  const alerts: WealthAlert[] = [];

  for (const doc of documents) {
    if (doc.status !== "active") continue;
    if (isExpired(doc)) {
      alerts.push({
        id: `expired-${doc.id}`,
        severity: "danger",
        message: `Documento vencido: "${doc.name}"${doc.clientName ? ` (${doc.clientName})` : ""}.`,
      });
    } else if (isExpiringSoon(doc)) {
      const days = daysUntil(doc.expiresAt as string);
      alerts.push({
        id: `expiring-${doc.id}`,
        severity: "warning",
        message: `Vence em ${days} ${days === 1 ? "dia" : "dias"}: "${doc.name}"${doc.clientName ? ` (${doc.clientName})` : ""}.`,
      });
    }
  }

  if (clientsWithoutDocs.length > 0) {
    alerts.push({
      id: "clients-without-docs",
      severity: "info",
      message: `${clientsWithoutDocs.length} ${clientsWithoutDocs.length === 1 ? "cliente ativo está" : "clientes ativos estão"} sem nenhum documento cadastrado.`,
    });
  }

  return alerts;
}
