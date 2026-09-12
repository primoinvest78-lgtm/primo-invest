"use client";

import { motion } from "motion/react";

import type { GoalItem } from "@/lib/mock/dashboard";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";

export function GoalsSummary({ items }: { items: GoalItem[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="mb-5">
        <p className="text-label font-bold uppercase text-muted-foreground">Patrimônio</p>
        <h3 className="mt-1 text-h2 font-bold text-foreground">Metas patrimoniais</h3>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const progress = Math.min(Math.max(item.progress, 0), 100);
          const progressColor = CHART_SEQUENCE[index % CHART_SEQUENCE.length];

          return (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-muted/60 p-3.5 transition-colors duration-150 hover:border-primary/40 hover:bg-muted"
            >
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                  {item.label}
                </span>

                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {item.value} / {item.target}
                </span>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.55, delay: index * 0.05, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: progressColor }}
                />
              </div>

              <div className="mt-2 flex justify-end">
                <span className="text-label font-bold uppercase text-muted-foreground">
                  {progress}% concluído
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
