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
import { LiabilityDeleteDialog } from "@/components/wealth/liability-delete-dialog";
import { LiabilityEditDialog } from "@/components/wealth/liability-edit-dialog";
import type { LiabilityDetail } from "@/lib/data/wealth";
import { computeLiabilitiesNeedingAttention, monthsToPayoff } from "@/lib/utils/liability-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

type SortKey = "outstanding" | "name" | "maturity" | "monthly";

export function LiabilitiesTable({
  liabilities,
  clients,
}: {
  liabilities: LiabilityDetail[];
  clients: { id: string; fullName: string }[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("outstanding");

  const attentionIds = useMemo(() => computeLiabilitiesNeedingAttention(liabilities), [liabilities]);

  const sorted = useMemo(() => {
    return [...liabilities].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "maturity") return (a.maturityDate ?? "9999").localeCompare(b.maturityDate ?? "9999");
      if (sortKey === "monthly") return Number(b.monthlyPayment ?? 0) - Number(a.monthlyPayment ?? 0);
      return Number(b.outstandingAmount ?? 0) - Number(a.outstandingAmount ?? 0);
    });
  }, [liabilities, sortKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-h2 font-bold text-foreground">Passivos</h3>
        <Select value={sortKey} onValueChange={(v) => setSortKey((v as SortKey) ?? "outstanding")}>
          <SelectTrigger className="w-full sm:w-[190px]" size="sm">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outstanding">Maior saldo</SelectItem>
            <SelectItem value="monthly">Maior parcela</SelectItem>
            <SelectItem value="maturity">Vencimento mais próximo</SelectItem>
            <SelectItem value="name">Nome (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-premium overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Passivo
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Titular
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Saldo atual
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Parcela
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Taxa
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Vencimento
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
                  Nenhum passivo encontrado.
                </td>
              </tr>
            ) : (
              sorted.map((liability) => {
                const months = monthsToPayoff(liability);
                const needsAttention = attentionIds.has(liability.id);

                return (
                  <tr
                    key={liability.id}
                    className="group border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-destructive hover:bg-black/5"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/patrimonio/passivos/${liability.id}`}
                        className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
                      >
                        {liability.name}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <p className="text-xs text-card-beige-muted-foreground">
                        {liability.liabilityType ?? "—"}
                        {months !== null ? ` · ${months.toFixed(0)} meses pra quitar` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {liability.clientId ? (
                        <Link
                          href={`/clientes/${liability.clientId}`}
                          className="text-foreground hover:text-primary"
                        >
                          {liability.clientName}
                        </Link>
                      ) : (
                        <span className="text-card-beige-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-destructive">
                      {formatCurrencyBRL(liability.outstandingAmount)}
                    </td>
                    <td className="px-4 py-3 text-foreground">{formatCurrencyBRL(liability.monthlyPayment)}</td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {liability.interestRate !== null ? `${liability.interestRate}% a.m.` : "—"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {formatDate(liability.maturityDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={liability.status === "active" ? "default" : "outline"}>
                          {liability.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                        {needsAttention ? <Badge variant="destructive">Atenção</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <LiabilityEditDialog liability={liability} clients={clients} />
                        <LiabilityDeleteDialog liability={liability} />
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
