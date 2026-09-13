"use client";

import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HoldingDetail } from "@/lib/data/wealth";
import { formatCurrencyBRL } from "@/lib/utils/format";

type SortKey = "value" | "gainLoss";

function computeGainLoss(holding: HoldingDetail) {
  const avg = Number(holding.averagePrice ?? 0);
  const current = Number(holding.currentPrice ?? 0);
  const qty = Number(holding.quantity ?? 0);
  const gainLoss = avg > 0 ? (current - avg) * qty : null;
  const gainLossPct = avg > 0 ? ((current - avg) / avg) * 100 : null;
  return { gainLoss, gainLossPct };
}

export function InvestmentsTable({ holdings }: { holdings: HoldingDetail[] }) {
  const [productType, setProductType] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("value");

  const productTypes = useMemo(() => {
    const set = new Set(holdings.map((h) => h.productType).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [holdings]);

  const rows = useMemo(() => {
    const filtered = holdings.filter(
      (h) => productType === "all" || h.productType === productType,
    );
    return [...filtered].sort((a, b) => {
      if (sortKey === "value") {
        return Number(b.valuation ?? 0) - Number(a.valuation ?? 0);
      }
      return (computeGainLoss(b).gainLoss ?? 0) - (computeGainLoss(a).gainLoss ?? 0);
    });
  }, [holdings, productType, sortKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={productType} onValueChange={(v) => setProductType(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Tipo de produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {productTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={(v) => setSortKey((v as SortKey) ?? "value")}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value">Maior valor</SelectItem>
            <SelectItem value="gainLoss">Maior ganho/perda</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-premium overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Produto
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Conta / Cliente
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
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhuma posição encontrada.
                </td>
              </tr>
            ) : (
              rows.map((h) => {
                const { gainLoss, gainLossPct } = computeGainLoss(h);
                const positive = (gainLoss ?? 0) >= 0;

                return (
                  <tr
                    key={h.id}
                    className="border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {h.productName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {h.productType ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {h.accountName ?? "—"} {h.clientName ? `· ${h.clientName}` : ""}
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
