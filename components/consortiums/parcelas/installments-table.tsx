"use client";

import { ChevronDown, FileText, User } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { InstallmentAdjustDialog } from "@/components/consortiums/parcelas/installment-adjust-dialog";
import { InstallmentMarkPaidDialog } from "@/components/consortiums/parcelas/installment-mark-paid-dialog";
import { InstallmentNegotiateDialog } from "@/components/consortiums/parcelas/installment-negotiate-dialog";
import type { ConsortiumContract, ConsortiumInstallment } from "@/lib/data/consortiums";
import {
  computeInstallmentComposition,
  INSTALLMENT_STATUS_VARIANT,
  installmentStatusLabel,
  isEffectivelyOverdue,
} from "@/lib/utils/installment-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

type SortKey = "due" | "amount" | "status";

function CompositionField({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">
        {value !== null ? formatCurrencyBRL(value) : "Não informado"}
      </p>
    </div>
  );
}

function InstallmentRowDetail({
  installment,
  contract,
}: {
  installment: ConsortiumInstallment;
  contract: ConsortiumContract | undefined;
}) {
  const composition = computeInstallmentComposition(installment, contract);

  return (
    <tr className="bg-black/[0.03]">
      <td colSpan={8} className="px-4 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase text-card-beige-muted-foreground">
              Composição da parcela
            </p>
            {composition.hasComposition ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <CompositionField label="Fundo comum" value={composition.fundoComum} />
                <CompositionField label="Fundo de reserva" value={composition.fundoReserva} />
                <CompositionField label="Taxa de administração" value={composition.taxaAdministracao} />
                <CompositionField label="Seguro" value={composition.seguro} />
                <CompositionField label="Total" value={composition.total} />
              </div>
            ) : (
              <p className="text-xs text-card-beige-muted-foreground">
                O contrato não tem taxas cadastradas pra decompor essa parcela — mostrando só o valor
                total.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-start gap-2">
            {installment.status !== "paid" ? <InstallmentMarkPaidDialog installment={installment} /> : null}
            <InstallmentNegotiateDialog installment={installment} />
            <InstallmentAdjustDialog installment={installment} />
            <NewTaskDialog consortiumContractId={installment.contractId} clientId={installment.clientId ?? undefined} />
            <Link
              href={`/consorcios/contratos/${installment.contractId}`}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <FileText className="h-3.5 w-3.5" />
              Abrir contrato
            </Link>
            {installment.clientId ? (
              <Link
                href={`/clientes/${installment.clientId}`}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <User className="h-3.5 w-3.5" />
                Abrir cliente
              </Link>
            ) : null}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function InstallmentsTable({
  installments,
  contracts,
}: {
  installments: ConsortiumInstallment[];
  contracts: ConsortiumContract[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const contractsById = useMemo(() => new Map(contracts.map((c) => [c.id, c])), [contracts]);

  const sorted = useMemo(() => {
    return [...installments].sort((a, b) => {
      if (sortKey === "amount") return Number(b.amount ?? 0) - Number(a.amount ?? 0);
      if (sortKey === "status") return a.status.localeCompare(b.status);
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    });
  }, [installments, sortKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-h2 font-bold text-foreground">Cronograma</h3>
        <Select value={sortKey} onValueChange={(v) => setSortKey((v as SortKey) ?? "due")}>
          <SelectTrigger className="w-full sm:w-[180px]" size="sm">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due">Vencimento</SelectItem>
            <SelectItem value="amount">Maior valor</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-premium overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="w-8 px-2 py-3" />
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Contrato</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Cliente</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Parcela</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Vencimento</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Valor total</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Pago em</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhuma parcela encontrada.
                </td>
              </tr>
            ) : (
              sorted.map((installment) => {
                const late = isEffectivelyOverdue(installment);
                const isExpanded = expandedId === installment.id;

                return (
                  <Fragment key={installment.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : installment.id)}
                      className={[
                        "group cursor-pointer border-b border-black/10 border-l-2 last:border-b-0 transition-all duration-200 hover:bg-black/5",
                        late ? "border-l-destructive bg-destructive/5" : "border-l-transparent hover:border-l-primary",
                      ].join(" ")}
                    >
                      <td className="px-2 py-3">
                        <ChevronDown
                          className={["h-3.5 w-3.5 text-card-beige-muted-foreground transition-transform", isExpanded ? "rotate-180" : ""].join(" ")}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{installment.contractLabel}</td>
                      <td className="px-4 py-3 text-card-beige-muted-foreground">
                        {installment.clientName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-card-beige-muted-foreground">#{installment.installmentNumber}</td>
                      <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDate(installment.dueDate)}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatCurrencyBRL(installment.amount)}</td>
                      <td className="px-4 py-3 text-card-beige-muted-foreground">
                        {installment.paidAt ? formatDate(installment.paidAt) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={INSTALLMENT_STATUS_VARIANT[late ? "overdue" : installment.status] ?? "outline"}>
                          {installmentStatusLabel(late ? "overdue" : installment.status)}
                        </Badge>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <InstallmentRowDetail installment={installment} contract={contractsById.get(installment.contractId)} />
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
