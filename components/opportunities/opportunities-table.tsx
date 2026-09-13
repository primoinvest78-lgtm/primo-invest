"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { StageColumn } from "@/lib/data/opportunities";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";
import { effectiveProbability, PRIORITY_BADGE_CLASS, PRIORITY_LABEL } from "@/lib/utils/opportunity-helpers";

export function OpportunitiesTable({ stages }: { stages: StageColumn[] }) {
  const rows = stages.flatMap((stage) =>
    stage.opportunities.map((opp) => ({
      ...opp,
      stageName: stage.name,
      probability: effectiveProbability(opp, stage.probability),
    })),
  );

  return (
    <div className="overflow-x-auto card-premium rounded-2xl">
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
              Etapa
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Prioridade
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Valor estimado
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Probabilidade
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Responsável
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Previsão
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
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
                  {opp.product ? (
                    <p className="text-xs text-card-beige-muted-foreground">{opp.product}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-card-beige-muted-foreground">
                  {opp.clientName ?? opp.leadName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{opp.stageName}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold",
                      PRIORITY_BADGE_CLASS[opp.priority] ?? PRIORITY_BADGE_CLASS.normal,
                    ].join(" ")}
                  >
                    {PRIORITY_LABEL[opp.priority] ?? opp.priority}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {formatCurrencyBRL(opp.estimatedValue)}
                </td>
                <td className="px-4 py-3 text-card-beige-muted-foreground">
                  {opp.probability !== null ? `${opp.probability}%` : "—"}
                </td>
                <td className="px-4 py-3 text-card-beige-muted-foreground">
                  {opp.assignedAdvisorName ?? "—"}
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
