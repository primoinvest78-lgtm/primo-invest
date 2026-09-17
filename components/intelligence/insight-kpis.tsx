"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { InsightCounts } from "@/lib/intelligence/types";

function Kpi({
  label,
  value,
  valueClassName,
  index,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="card-premium rounded-2xl p-4 transition-all duration-200"
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={value} />
      </p>
    </motion.div>
  );
}

export function InsightKpis({ counts }: { counts: InsightCounts }) {
  const total = counts.atencao + counts.oportunidade + counts.pendencia + counts.informacao;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <Kpi label="Em aberto" value={String(total)} valueClassName={total > 0 ? "text-destructive" : "text-foreground"} index={0} />
      <Kpi label="Atenção" value={String(counts.atencao)} valueClassName="text-warning" index={1} />
      <Kpi label="Oportunidade" value={String(counts.oportunidade)} valueClassName="text-primary" index={2} />
      <Kpi label="Pendência" value={String(counts.pendencia)} valueClassName="text-destructive" index={3} />
      <Kpi label="Informação" value={String(counts.informacao)} index={4} />
    </div>
  );
}
