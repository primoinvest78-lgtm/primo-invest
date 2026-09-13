"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { updateLeadStatus } from "@/lib/actions/leads";
import { LEAD_STATUSES } from "@/lib/data/lead-statuses";
import type { LeadListItem } from "@/lib/data/leads";
import { formatDate } from "@/lib/utils/format";

const COLUMN_ACCENT: Record<string, string> = {
  Novo: "border-t-border",
  Contatado: "border-t-border",
  Qualificado: "border-t-border",
  Convertido: "border-t-primary",
  Perdido: "border-t-destructive/50",
};

export function LeadsBoard({ leads }: { leads: LeadListItem[] }) {
  const [items, setItems] = useState(leads);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDrop(status: string) {
    if (!draggingId) return;
    const leadId = draggingId;
    setDraggingId(null);

    setItems((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)),
    );

    updateLeadStatus(leadId, status).catch(() => {
      setItems(leads);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {LEAD_STATUSES.map((status, columnIndex) => {
        const columnLeads = items.filter((lead) => lead.status === status);

        return (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status)}
            className={[
              "flex w-[280px] shrink-0 flex-col rounded-2xl border border-t-2 bg-muted/40 p-3",
              COLUMN_ACCENT[status] ?? "border-t-border",
            ].join(" ")}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-label font-bold uppercase text-muted-foreground">{status}</h3>
              <Badge variant="outline">{columnLeads.length}</Badge>
            </div>

            <div className="flex min-h-[80px] flex-col gap-2">
              {columnLeads.map((lead, cardIndex) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(columnIndex * 0.03 + cardIndex * 0.03, 0.3),
                    ease: "easeOut",
                  }}
                  draggable
                  onDragStart={() => setDraggingId(lead.id)}
                  className="cursor-grab rounded-xl border border-border bg-card p-3 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover active:cursor-grabbing"
                >
                  <Link href={`/leads/${lead.id}`} className="block">
                    <p className="text-sm font-semibold text-foreground hover:text-primary">
                      {lead.name}
                    </p>
                  </Link>

                  <p className="mt-1 text-xs font-medium uppercase text-muted-foreground">
                    {lead.source ?? "Origem não informada"}
                  </p>

                  {lead.assignedAdvisorName ? (
                    <p className="mt-2 text-xs font-medium text-foreground">
                      {lead.assignedAdvisorName}
                    </p>
                  ) : null}

                  {lead.nextTask ? (
                    <div className="mt-2 rounded-lg border border-border bg-muted/60 px-2 py-1.5">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {lead.nextTask.title}
                      </p>
                      {lead.nextTask.dueAt ? (
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {formatDate(lead.nextTask.dueAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
