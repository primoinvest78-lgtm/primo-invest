import type { ConsortiumContract, ConsortiumInstallment } from "@/lib/data/consortiums";
import type { WealthHistoryPoint } from "@/lib/data/wealth";
import type { WealthAlert } from "@/lib/utils/wealth-helpers";

/**
 * Evolução real do valor pago ao longo do tempo — agrupa paid_amount
 * por mês de paid_at, acumulado. Só entram parcelas com pagamento de
 * fato registrado; sem isso, retorna vazio (sem histórico artificial).
 */
export function computePaidHistory(installments: ConsortiumInstallment[]): WealthHistoryPoint[] {
  const paidWithDate = installments.filter((i) => i.status === "paid" && i.paidAt);
  if (paidWithDate.length === 0) return [];

  const monthly = new Map<string, number>();
  for (const installment of paidWithDate) {
    const month = String(installment.paidAt).slice(0, 7);
    monthly.set(month, (monthly.get(month) ?? 0) + Number(installment.paidAmount ?? installment.amount ?? 0));
  }

  let cumulative = 0;
  return Array.from(monthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => {
      cumulative += value;
      return { month, value: cumulative };
    });
}

export const INSTALLMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Em atraso",
  negotiated: "Negociado",
  exempt: "Isento",
  cancelled: "Cancelado",
};

export const INSTALLMENT_STATUS_OPTIONS = [
  "pending",
  "paid",
  "overdue",
  "negotiated",
  "exempt",
  "cancelled",
] as const;

export const INSTALLMENT_STATUS_VARIANT: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  pending: "outline",
  paid: "default",
  overdue: "destructive",
  negotiated: "secondary",
  exempt: "secondary",
  cancelled: "destructive",
};

export function installmentStatusLabel(status: string): string {
  return INSTALLMENT_STATUS_LABEL[status] ?? status;
}

const DAY_MS = 1000 * 60 * 60 * 24;

export function isEffectivelyOverdue(installment: ConsortiumInstallment): boolean {
  if (installment.status === "paid" || installment.status === "exempt" || installment.status === "cancelled") {
    return false;
  }
  if (!installment.dueDate) return false;
  return new Date(installment.dueDate).getTime() < Date.now();
}

export function daysFromToday(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / DAY_MS);
}

export type InstallmentComposition = {
  fundoComum: number | null;
  fundoReserva: number | null;
  taxaAdministracao: number | null;
  seguro: number | null;
  outros: number | null;
  total: number;
  hasComposition: boolean;
};

/**
 * Decompõe o valor da parcela usando só as taxas reais cadastradas no
 * contrato (admin_fee_percentage, reserve_fund_percentage,
 * insurance_amount). Nenhum componente sem taxa informada é estimado —
 * fica null, e a UI mostra "não informado" pra ele. hasComposition só
 * fica true quando pelo menos um componente real existe.
 */
export function computeInstallmentComposition(
  installment: ConsortiumInstallment,
  contract: ConsortiumContract | undefined,
): InstallmentComposition {
  const total = Number(installment.amount ?? 0);

  if (!contract) {
    return { fundoComum: null, fundoReserva: null, taxaAdministracao: null, seguro: null, outros: null, total, hasComposition: false };
  }

  const taxaAdministracao =
    contract.adminFeePercentage !== null ? total * (Number(contract.adminFeePercentage) / 100) : null;
  const fundoReserva =
    contract.reserveFundPercentage !== null ? total * (Number(contract.reserveFundPercentage) / 100) : null;
  const seguro = contract.insuranceAmount !== null ? Number(contract.insuranceAmount) : null;

  const hasComposition = taxaAdministracao !== null || fundoReserva !== null || seguro !== null;

  const knownSum = (taxaAdministracao ?? 0) + (fundoReserva ?? 0) + (seguro ?? 0);
  const fundoComum = hasComposition ? Math.max(total - knownSum, 0) : null;

  return {
    fundoComum,
    fundoReserva,
    taxaAdministracao,
    seguro,
    outros: null,
    total,
    hasComposition,
  };
}

export type InstallmentFilters = {
  search: string;
  status: string;
  contractId: string;
  clientId: string;
};

export const DEFAULT_INSTALLMENT_FILTERS: InstallmentFilters = {
  search: "",
  status: "all",
  contractId: "all",
  clientId: "all",
};

export function hasActiveInstallmentFilters(filters: InstallmentFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "search") return value !== "";
    return value !== "all";
  });
}

export function applyInstallmentFilters(
  installments: ConsortiumInstallment[],
  filters: InstallmentFilters,
): ConsortiumInstallment[] {
  const term = filters.search.trim().toLowerCase();

  return installments.filter((installment) => {
    if (term) {
      const haystack = [installment.contractLabel, installment.clientName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.status !== "all") {
      const effectiveStatus = isEffectivelyOverdue(installment) ? "overdue" : installment.status;
      if (effectiveStatus !== filters.status) return false;
    }
    if (filters.contractId !== "all" && installment.contractId !== filters.contractId) return false;
    if (filters.clientId !== "all" && (installment.clientId ?? "none") !== filters.clientId) return false;
    return true;
  });
}

/**
 * Alertas do módulo de parcelas — vencimento próximo, atraso, múltiplas
 * parcelas atrasadas no mesmo contrato, e contrato perto do
 * encerramento (poucas parcelas restantes). Tudo derivado de dado real
 * já carregado; nenhuma multa/juro/estimativa é inventada aqui.
 */
export function computeInstallmentAlerts(
  installments: ConsortiumInstallment[],
  contracts: ConsortiumContract[],
): WealthAlert[] {
  const alerts: WealthAlert[] = [];
  const overdueByContract = new Map<string, number>();

  for (const installment of installments) {
    const label = `${installment.contractLabel} · parcela ${installment.installmentNumber}`;

    if (isEffectivelyOverdue(installment)) {
      const days = Math.abs(daysFromToday(installment.dueDate as string));
      alerts.push({
        id: `overdue-${installment.id}`,
        severity: "danger",
        message: `Em atraso: ${label} venceu há ${days} ${days === 1 ? "dia" : "dias"}.`,
      });
      overdueByContract.set(installment.contractId, (overdueByContract.get(installment.contractId) ?? 0) + 1);
    } else if (installment.status === "pending" && installment.dueDate) {
      const days = daysFromToday(installment.dueDate);
      if (days >= 0 && days <= 15) {
        alerts.push({
          id: `due-soon-${installment.id}`,
          severity: "warning",
          message: `Vencimento próximo: ${label} vence em ${days} ${days === 1 ? "dia" : "dias"}.`,
        });
      }
    }
  }

  for (const [contractId, count] of overdueByContract) {
    if (count >= 2) {
      const contract = contracts.find((c) => c.id === contractId);
      const label = contract ? `${contract.administratorName ?? "—"} · ${contract.contractNumber ?? "—"}` : contractId;
      alerts.push({
        id: `multiple-overdue-${contractId}`,
        severity: "danger",
        message: `${count} parcelas em atraso no contrato ${label}.`,
      });
    }
  }

  for (const contract of contracts) {
    const remaining = Math.max(contract.totalInstallments - contract.paidInstallments, 0);
    if (remaining > 0 && remaining <= 3 && contract.status === "active") {
      alerts.push({
        id: `closing-soon-${contract.id}`,
        severity: "info",
        message: `Contrato ${contract.administratorName ?? "—"} · ${contract.contractNumber ?? "—"} perto do encerramento: faltam ${remaining} ${remaining === 1 ? "parcela" : "parcelas"}.`,
      });
    }
  }

  return alerts;
}
