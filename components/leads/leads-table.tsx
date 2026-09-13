"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { LeadListItem } from "@/lib/data/leads";
import { computeLeadScore, LEAD_TIER_BADGE_CLASS } from "@/lib/utils/lead-score";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export function LeadsTable({ leads }: { leads: LeadListItem[] }) {
  return (
    <div className="overflow-x-auto card-premium rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-black/5 text-left">
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Lead</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Etapa</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Score</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Origem</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Patrimônio est.
            </th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Responsável</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
              Próxima ação
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                Nenhum lead encontrado.
              </td>
            </tr>
          ) : (
            leads.map((lead) => {
              const { score, tier } = computeLeadScore(lead);

              return (
                <tr
                  key={lead.id}
                  className="group border-b border-border border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-muted/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{lead.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold",
                        LEAD_TIER_BADGE_CLASS[tier],
                      ].join(" ")}
                    >
                      {score} · {tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{lead.source ?? "—"}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {lead.estimatedNetWorth ? formatCurrencyBRL(lead.estimatedNetWorth) : "—"}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {lead.assignedAdvisorName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.nextTask ? (
                      <span className="text-foreground">
                        {lead.nextTask.title}
                        {lead.nextTask.dueAt ? ` · ${formatDate(lead.nextTask.dueAt)}` : ""}
                      </span>
                    ) : (
                      <span className="text-card-beige-muted-foreground">—</span>
                    )}
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
