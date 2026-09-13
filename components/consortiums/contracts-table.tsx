"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContractDeleteDialog } from "@/components/consortiums/contract-delete-dialog";
import { ContractEditDialog } from "@/components/consortiums/contract-edit-dialog";
import type { ConsortiumContract } from "@/lib/data/consortiums";
import {
  CONTRACT_STATUS_VARIANT,
  contractProgressPct,
  contractStatusLabel,
} from "@/lib/utils/consortium-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

type SortKey = "credit" | "name" | "progress" | "start";

export function ContractsTable({
  contracts,
  clients,
}: {
  contracts: ConsortiumContract[];
  clients: { id: string; fullName: string }[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("start");

  const sorted = useMemo(() => {
    return [...contracts].sort((a, b) => {
      if (sortKey === "name") return (a.administratorName ?? "").localeCompare(b.administratorName ?? "");
      if (sortKey === "progress") return contractProgressPct(b) - contractProgressPct(a);
      if (sortKey === "credit") return Number(b.creditAmount ?? 0) - Number(a.creditAmount ?? 0);
      return (b.startDate ?? "").localeCompare(a.startDate ?? "");
    });
  }, [contracts, sortKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-h2 font-bold text-foreground">Contratos</h3>
        <Select value={sortKey} onValueChange={(v) => setSortKey((v as SortKey) ?? "start")}>
          <SelectTrigger className="w-full sm:w-[190px]" size="sm">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start">Mais recentes</SelectItem>
            <SelectItem value="credit">Maior crédito</SelectItem>
            <SelectItem value="progress">Maior progresso</SelectItem>
            <SelectItem value="name">Administradora (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-premium overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Contrato
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Cliente
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Crédito
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Progresso
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Início
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhum contrato encontrado.
                </td>
              </tr>
            ) : (
              sorted.map((contract) => {
                const pct = contractProgressPct(contract);
                return (
                  <tr
                    key={contract.id}
                    className="group border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/consorcios/contratos/${contract.id}`}
                        className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
                      >
                        {contract.administratorName ?? "—"}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <p className="text-xs text-card-beige-muted-foreground">
                        {contract.contractNumber ?? "—"}
                        {contract.groupNumber ? ` · Grupo ${contract.groupNumber}` : ""}
                        {contract.quotaNumber ? ` · Cota ${contract.quotaNumber}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {contract.clientId ? (
                        <Link href={`/clientes/${contract.clientId}`} className="text-foreground hover:text-primary">
                          {contract.clientName}
                        </Link>
                      ) : (
                        <span className="text-card-beige-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {contract.consortiumType ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatCurrencyBRL(contract.creditAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-black/10">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-card-beige-muted-foreground">
                          {contract.paidInstallments}/{contract.totalInstallments}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {formatDate(contract.startDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CONTRACT_STATUS_VARIANT[contract.status] ?? "outline"}>
                        {contractStatusLabel(contract.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <ContractEditDialog contract={contract} clients={clients} />
                        <ContractDeleteDialog contract={contract} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
