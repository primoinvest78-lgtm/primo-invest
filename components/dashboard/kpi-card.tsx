"use client";

import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

export type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  delta: number;
  icon: LucideIcon;
};

export function KpiCard({ title, value, change, delta, icon: Icon }: KpiCardProps) {
  const formattedDelta = `${delta >= 0 ? "+" : ""}${delta
    .toFixed(delta % 1 === 0 ? 0 : 2)
    .replace(".", ",")}%`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover"
    >
      {/* TOP ACCENT */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* MAIN CONTENT */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-label font-bold uppercase text-muted-foreground">
            {title}
          </p>

          <p className="mt-3 truncate text-kpi font-bold text-foreground">{value}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-accent transition-all duration-200 group-hover:border-primary/45 group-hover:bg-secondary group-hover:text-primary-foreground">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/15 px-2.5 py-1.5 text-[11px] font-bold text-foreground">
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
          <span className="truncate">{change}</span>
        </span>

        <span className="shrink-0 text-label font-bold uppercase text-muted-foreground">
          {formattedDelta}
        </span>
      </div>
    </motion.article>
  );
}
