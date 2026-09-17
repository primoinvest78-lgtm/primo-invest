"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { deleteHolding } from "@/lib/actions/investments";
import type { AccountHolding } from "@/lib/data/wealth";
import { formatCurrencyBRL } from "@/lib/utils/format";

export function AccountHoldingsTable({
  holdings,
  accountId,
  clientId,
}: {
  holdings: AccountHolding[];
  accountId: string;
  clientId: string | null;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const total = holdings.reduce((sum, h) => sum + Number(h.valuation ?? 0), 0);

  async function handleDelete(holdingId: string) {
    if (!window.confirm("Remover essa posição da conta? Essa ação não pode ser desfeita.")) return;
    setDeletingId(holdingId);
    try {
      await deleteHolding(holdingId, accountId, clientId);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
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
              Quantidade
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Valor
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              % da conta
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {holdings.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                Nenhum investimento vinculado a essa conta.
              </td>
            </tr>
          ) : (
            holdings.map((h) => {
              const pct = total > 0 ? (Number(h.valuation ?? 0) / total) * 100 : 0;
              return (
                <tr
                  key={h.id}
                  className="border-b border-black/10 last:border-b-0 transition-colors duration-200 hover:bg-black/5"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{h.productName ?? "—"}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{h.productType ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{h.quantity}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatCurrencyBRL(h.valuation)}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{pct.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remover posição"
                      onClick={() => handleDelete(h.id)}
                      disabled={deletingId === h.id}
                    >
                      {deletingId === h.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
