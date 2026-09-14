import type { ConsortiumContract } from "@/lib/data/consortiums";

/**
 * Estados compatíveis com a regra atual do projeto — status é texto
 * livre no banco, então isso é só vocabulário/rótulo, nunca uma
 * migração de dado. Contratos existentes continuam em "active" até
 * o assessor atualizar.
 */
export const CONTRACT_STATUS_LABEL: Record<string, string> = {
  proposal: "Proposta",
  active: "Ativo",
  delinquent: "Inadimplente",
  contemplated: "Contemplado",
  in_use: "Em utilização",
  settled: "Quitado",
  completed: "Quitado",
  cancelled: "Cancelado",
  closed: "Encerrado",
};

export const CONTRACT_STATUS_OPTIONS = [
  "proposal",
  "active",
  "delinquent",
  "contemplated",
  "in_use",
  "settled",
  "cancelled",
  "closed",
] as const;

export const CONTRACT_STATUS_VARIANT: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  proposal: "outline",
  active: "default",
  delinquent: "destructive",
  contemplated: "default",
  in_use: "default",
  settled: "secondary",
  completed: "secondary",
  cancelled: "destructive",
  closed: "outline",
};

export function contractStatusLabel(status: string): string {
  return CONTRACT_STATUS_LABEL[status] ?? status;
}

export function contractProgressPct(contract: ConsortiumContract): number {
  if (contract.totalInstallments <= 0) return 0;
  return Math.min((contract.paidInstallments / contract.totalInstallments) * 100, 100);
}

export function contractOutstandingBalance(contract: ConsortiumContract): number | null {
  if (contract.installmentAmount === null) return null;
  const remaining = Math.max(contract.totalInstallments - contract.paidInstallments, 0);
  return remaining * Number(contract.installmentAmount);
}

export function contractRemainingInstallments(contract: ConsortiumContract): number {
  return Math.max(contract.totalInstallments - contract.paidInstallments, 0);
}

export const EVENT_TYPE_LABEL: Record<string, string> = {
  update: "Atualização",
  status_change: "Alteração de status",
  installment_added: "Parcela registrada",
  payment: "Pagamento",
  bid_offered: "Lance ofertado",
  bid_analyzing: "Lance em análise",
  bid_won: "Lance vencedor",
  bid_lost: "Lance não vencedor",
  bid_cancelled: "Lance cancelado",
  bid_expired: "Lance expirado",
  contemplation: "Contemplação",
  document_uploaded: "Documento enviado",
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
};

export type ContractFilters = {
  search: string;
  status: string;
  consortiumType: string;
  clientId: string;
};

export const DEFAULT_CONTRACT_FILTERS: ContractFilters = {
  search: "",
  status: "all",
  consortiumType: "all",
  clientId: "all",
};

export function hasActiveContractFilters(filters: ContractFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "search") return value !== "";
    return value !== "all";
  });
}

export function applyContractFilters(
  contracts: ConsortiumContract[],
  filters: ContractFilters,
): ConsortiumContract[] {
  const term = filters.search.trim().toLowerCase();

  return contracts.filter((contract) => {
    if (term) {
      const haystack = [
        contract.administratorName,
        contract.contractNumber,
        contract.groupNumber,
        contract.quotaNumber,
        contract.clientName,
        contract.assetDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.status !== "all" && contract.status !== filters.status) return false;
    if (filters.consortiumType !== "all" && contract.consortiumType !== filters.consortiumType) return false;
    if (filters.clientId !== "all" && (contract.clientId ?? "none") !== filters.clientId) return false;
    return true;
  });
}
