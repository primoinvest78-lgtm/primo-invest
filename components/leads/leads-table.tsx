"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { LeadListItem } from "@/lib/data/leads";
import { formatDate } from "@/lib/utils/format";

export function LeadsTable({ leads }: { leads: LeadListItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary text-left">
            <th className="px-4 py-3 text-label font-bold uppercase text-primary">Lead</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-primary">Origem</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-primary">Status</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-primary">Assessor</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-primary">
              Próxima tarefa
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-body-sm text-muted-foreground">
                Nenhum lead encontrado.
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
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
                <td className="px-4 py-3 text-muted-foreground">{lead.source ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{lead.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {lead.assignedAdvisorName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {lead.nextTask ? (
                    <span className="text-foreground">
                      {lead.nextTask.title}
                      {lead.nextTask.dueAt ? ` · ${formatDate(lead.nextTask.dueAt)}` : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
