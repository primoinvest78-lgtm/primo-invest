import type { DocumentCenterRow } from "@/lib/data/document-center";
import { categoryLabel, daysUntil, isExpired, isExpiringSoon } from "@/lib/utils/document-helpers";

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  recebido: "Recebido",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  arquivado: "Arquivado",
};

export function requestStatusLabel(status: string): string {
  return REQUEST_STATUS_LABEL[status] ?? status;
}

export const RESPONSIBLE_ROLE_LABEL: Record<string, string> = {
  cliente: "Cliente",
  assessor: "Assessor",
  backoffice: "Operações internas",
  compliance: "Compliance",
  administracao: "Administração",
};

export function responsibleRoleLabel(role: string | null): string {
  if (!role) return "—";
  return RESPONSIBLE_ROLE_LABEL[role] ?? role;
}

export type CenterStatus = "atualizado" | "pendente" | "em_analise" | "aprovado" | "reprovado" | "vencendo" | "vencido" | "arquivado";

export const CENTER_STATUS_LABEL: Record<CenterStatus, string> = {
  atualizado: "Atualizado",
  pendente: "Pendente",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  vencendo: "Vencendo",
  vencido: "Vencido",
  arquivado: "Arquivado",
};

export const CENTER_STATUS_VARIANT: Record<CenterStatus, "default" | "outline" | "destructive"> = {
  atualizado: "default",
  pendente: "outline",
  em_analise: "outline",
  aprovado: "default",
  reprovado: "destructive",
  vencendo: "outline",
  vencido: "destructive",
  arquivado: "outline",
};

/** Cor extra pra estados de atenção que não têm uma variant própria no Badge (outline neutro por padrão). */
export const CENTER_STATUS_CLASS: Partial<Record<CenterStatus, string>> = {
  vencendo: "border-warning/40 text-warning",
  pendente: "border-primary/40 text-primary",
  em_analise: "border-accent/40 text-accent",
};

/**
 * Status único exibido na Central de Documentos — combina o
 * workflow real da solicitação (quando existe) com a validade do
 * documento (quando não há solicitação em aberto). Nunca inventa um
 * estado que o dado não sustenta.
 */
export function computeCenterStatus(row: DocumentCenterRow): CenterStatus {
  if (row.kind === "request") {
    switch (row.requestStatus) {
      case "em_analise":
      case "recebido":
        return "em_analise";
      case "aprovado":
        return "aprovado";
      case "reprovado":
        return "reprovado";
      case "arquivado":
        return "arquivado";
      default:
        return "pendente";
    }
  }

  if (row.documentStatus === "archived" || row.documentStatus === "deleted") return "arquivado";
  if (row.requestStatus === "reprovado") return "reprovado";
  if (row.requestStatus === "em_analise" || row.requestStatus === "recebido") return "em_analise";
  if (isExpired(row)) return "vencido";
  if (isExpiringSoon(row)) return "vencendo";
  return "atualizado";
}

/** Isola a leitura do relógio numa função comum (não no corpo de um componente). */
export function isRecentlyUpdated(row: { updatedAt: string }, withinDays = 7): boolean {
  return Date.now() - new Date(row.updatedAt).getTime() <= withinDays * 24 * 60 * 60 * 1000;
}

export type DocumentCenterFilters = {
  search: string;
  clientId: string;
  category: string;
  status: string;
  responsible: string;
  origin: string;
  period: string;
};

export const DEFAULT_CENTER_FILTERS: DocumentCenterFilters = {
  search: "",
  clientId: "all",
  category: "all",
  status: "all",
  responsible: "all",
  origin: "all",
  period: "all",
};

export function hasActiveCenterFilters(filters: DocumentCenterFilters): boolean {
  return Object.entries(filters).some(([key, value]) => (key === "search" ? value !== "" : value !== "all"));
}

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function applyCenterFilters(rows: DocumentCenterRow[], filters: DocumentCenterFilters): DocumentCenterRow[] {
  const term = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    if (term) {
      const haystack = [row.title, row.clientName, row.contractLabel, categoryLabel(row.category), row.origin]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.clientId !== "all" && (row.clientId ?? "none") !== filters.clientId) return false;
    if (filters.category !== "all" && row.category !== filters.category) return false;
    if (filters.status !== "all" && computeCenterStatus(row) !== filters.status) return false;
    if (filters.responsible !== "all" && (row.responsibleName ?? "none") !== filters.responsible) return false;
    if (filters.origin !== "all" && row.origin !== filters.origin) return false;
    if (filters.period !== "all") {
      const days = PERIOD_DAYS[filters.period];
      if (days !== undefined) {
        const updatedDays = Math.round((Date.now() - new Date(row.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        if (updatedDays > days) return false;
      }
    }
    return true;
  });
}

export type DocumentCenterKpis = {
  total: number;
  pendentes: number;
  vencendo: number;
  vencidos: number;
  aguardandoAprovacao: number;
  atualizadosRecentemente: number;
};

export function computeCenterKpis(rows: DocumentCenterRow[]): DocumentCenterKpis {
  let pendentes = 0;
  let vencendo = 0;
  let vencidos = 0;
  let aguardandoAprovacao = 0;
  let atualizadosRecentemente = 0;
  let total = 0;

  for (const row of rows) {
    const status = computeCenterStatus(row);
    if (row.kind === "document") {
      total += 1;
      if (isRecentlyUpdated(row)) atualizadosRecentemente += 1;
    }
    if (status === "pendente") pendentes += 1;
    if (status === "vencendo") vencendo += 1;
    if (status === "vencido") vencidos += 1;
    if (status === "em_analise") aguardandoAprovacao += 1;
  }

  return { total, pendentes, vencendo, vencidos, aguardandoAprovacao, atualizadosRecentemente };
}

export function typeLabel(row: Pick<DocumentCenterRow, "kind" | "mimeType">): string {
  if (row.kind === "request") return "Solicitação";
  const mime = row.mimeType ?? "";
  if (mime.includes("pdf")) return "PDF";
  if (mime.startsWith("image/")) return "Imagem";
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "Planilha";
  if (mime.includes("word") || mime.includes("document")) return "Documento";
  return "Arquivo";
}

export { daysUntil };
