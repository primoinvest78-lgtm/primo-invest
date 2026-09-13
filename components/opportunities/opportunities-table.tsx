"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { StageColumn } from "@/lib/data/opportunities";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export function OpportunitiesTable({ stages }: { stages: StageColumn[] }) {
  const rows = stages.flatMap((stage) =>
    stage.opportunities.map((opp) => ({ ...opp, stageName: stage.name })),
  );

  return (
    <div className="card-premium overflow-hidden rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-black/5 text-left">
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Oportunidade
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Cliente/Lead
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Estágio
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Valor estimado
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Previsão
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                Nenhuma oportunidade encontrada.
              </td>
            </tr>
          ) : (
            rows.map((opp) => (
              <tr
                key={opp.id}
                className="border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/oportunidades/${opp.id}`}
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    {opp.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-card-beige-muted-foreground">
                  {opp.clientName ?? opp.leadName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{opp.stageName}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {formatCurrencyBRL(opp.estimatedValue)}
                </td>
                <td className="px-4 py-3 text-card-beige-muted-foreground">
                  {formatDate(opp.expectedCloseDate)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
