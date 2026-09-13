"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvestmentDetailDialog } from "@/components/wealth/investment-detail-dialog";
import type { HoldingDetail } from "@/lib/data/wealth";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { computeGainLoss } from "@/lib/utils/investment-helpers";

type SortKey = "value" | "gainLoss" | "name";

export function InvestmentsTable({ holdings }: { holdings: HoldingDetail[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [selected, setSelected] = useState<HoldingDetail | null>(null);

  const rows = useMemo(() => {
    return [...holdings].sort((a, b) => {
      if (sortKey === "value") return Number(b.valuation ?? 0) - Number(a.valuation ?? 0);
      if (sortKey === "name") return (a.productName ?? "").localeCompare(b.productName ?? "");
      return (computeGainLoss(b).gainLoss ?? 0) - (computeGainLoss(a).gainLoss ?? 0);
    });
  }, [holdings, sortKey]);

  const total = holdings.reduce((sum, h) => sum + Number(h.valuation ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-h2 font-bold text-foreground">Posições</h3>
        <Select value={sortKey} onValueChange={(v) => setSortKey((v as SortKey) ?? "value")}>
          <SelectTrigger className="w-full sm:w-[200px]" size="sm">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value">Maior valor</SelectItem>
            <SelectItem value="gainLoss">Maior ganho/perda</SelectItem>
            <SelectItem value="name">Nome (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-premium overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Ativo
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Categoria
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Instituição / Conta
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Cliente
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Quantidade
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Valor atual
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Ganho/Perda
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                % carteira
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhuma posição encontrada.
                </td>
              </tr>
            ) : (
              rows.map((h) => {
                const { gainLoss, gainLossPct } = computeGainLoss(h);
                const positive = (gainLoss ?? 0) >= 0;
                const pctOfPortfolio = total > 0 ? (Number(h.valuation ?? 0) / total) * 100 : 0;

                return (
                  <tr
                    key={h.id}
                    onClick={() => setSelected(h)}
                    className="cursor-pointer border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {h.productName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {h.productType ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {h.institutionName ?? "—"}
                      {h.accountName ? (
                        <>
                          {" · "}
                          {h.accountId ? (
                            <Link
                              href={`/patrimonio/contas/${h.accountId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-foreground hover:text-primary hover:underline"
                            >
                              {h.accountName}
                            </Link>
                          ) : (
                            h.accountName
                          )}
                        </>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {h.clientName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">{h.quantity}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatCurrencyBRL(h.valuation)}
                    </td>
                    <td className="px-4 py-3">
                      {gainLoss === null ? (
                        <span className="text-card-beige-muted-foreground">—</span>
                      ) : (
                        <span className={positive ? "font-semibold text-success" : "font-semibold text-destructive"}>
                          {formatCurrencyBRL(gainLoss)} ({gainLossPct?.toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {pctOfPortfolio.toFixed(1)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <InvestmentDetailDialog holding={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
