"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

import { updateOpportunityStage } from "@/lib/actions/opportunities";
import type { StageColumn } from "@/lib/data/opportunities";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export function OpportunitiesBoard({ stages }: { stages: StageColumn[] }) {
  const [columns, setColumns] = useState(stages);
  const [dragging, setDragging] = useState<{ id: string; fromStageId: string } | null>(null);

  function handleDrop(toStageId: string) {
    if (!dragging || dragging.fromStageId === toStageId) {
      setDragging(null);
      return;
    }
    const { id, fromStageId } = dragging;
    setDragging(null);

    setColumns((current) => {
      const from = current.find((c) => c.id === fromStageId);
      const opp = from?.opportunities.find((o) => o.id === id);
      if (!opp) return current;

      return current.map((col) => {
        if (col.id === fromStageId) {
          return { ...col, opportunities: col.opportunities.filter((o) => o.id !== id) };
        }
        if (col.id === toStageId) {
          return { ...col, opportunities: [...col.opportunities, opp] };
        }
        return col;
      });
    });

    updateOpportunityStage(id, toStageId).catch(() => setColumns(stages));
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((stage, columnIndex) => {
        const total = stage.opportunities.reduce((s, o) => s + Number(o.estimatedValue ?? 0), 0);

        return (
          <div
            key={stage.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage.id)}
            className="card-premium flex w-[300px] shrink-0 flex-col rounded-2xl p-3"
          >
            <div className="mb-1 flex items-center justify-between px-1">
              <h3 className="text-label font-bold uppercase text-foreground">{stage.name}</h3>
              <span className="rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-foreground">
                {stage.opportunities.length}
              </span>
            </div>
            <p className="mb-3 px-1 text-xs font-semibold text-card-beige-muted-foreground">
              {formatCurrencyBRL(total)}
              {stage.probability !== null ? ` · ${stage.probability}% prob.` : ""}
            </p>

            <div className="flex min-h-[80px] flex-col gap-2">
              {stage.opportunities.map((opp, cardIndex) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(columnIndex * 0.03 + cardIndex * 0.03, 0.3),
                    ease: "easeOut",
                  }}
                  draggable
                  onDragStart={() => setDragging({ id: opp.id, fromStageId: stage.id })}
                  className="cursor-grab rounded-xl border border-black/10 bg-black/5 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:bg-black/10 active:cursor-grabbing"
                >
                  <Link href={`/oportunidades/${opp.id}`} className="block">
                    <p className="text-sm font-semibold text-foreground hover:text-accent">
                      {opp.title}
                    </p>
                  </Link>
                  <p className="mt-1 text-xs font-medium uppercase text-card-beige-muted-foreground">
                    {opp.clientName ?? opp.leadName ?? "—"}
                    {opp.opportunityType ? ` · ${opp.opportunityType}` : ""}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrencyBRL(opp.estimatedValue)}
                    </span>
                    {opp.expectedCloseDate ? (
                      <span className="text-[11px] font-medium text-card-beige-muted-foreground">
                        {formatDate(opp.expectedCloseDate)}
                      </span>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
